import React, { useEffect, useMemo, useState } from 'react';
import {
  advanceOneDay,
  computeMicroclimate,
  formatSimTime,
  getDayPhaseLabel,
  getNightFactor,
  stepSimulation,
} from '../simulation/riskEngine';
import {
  NudgeBanner,
  SerialLogEntry,
  SimulationMetrics,
  WeatherMode,
} from '../types/simulation';

const INITIAL_CLIMATE = computeMicroclimate(10.5, 'sunny');

const INITIAL_METRICS: SimulationMetrics = {
  timeHours: 10.5,
  dayCount: 1,
  ambientTempC: INITIAL_CLIMATE.tempC,
  relativeHumidity: INITIAL_CLIMATE.rh,
  vpdKpa: INITIAL_CLIMATE.vpdKpa,
  dewPointC: INITIAL_CLIMATE.dewPointC,
  dewPointDepressionC: INITIAL_CLIMATE.dewPointDepressionC,
  soilMoisturePct: 48,
  leafWetnessPct: 10,
  leafWetnessHours: 0.4,
  estimatedDryMinutes: 15,
  patekRiskPct: 18,
  symptomSeverity: 0,
  batteryPct: 86,
  isWatering: false,
  wateringRemainingSec: 0,
  aiotMode: true,
  autoTargetSoilPct: 42,
  autoGuardNight: true,
  lastDecision: 'IDLE',
  decisionReason: 'Kelembaban tanah masih cukup. Pemantauan mikroiklim kanopi aktif.',
  offlineBufferedCount: 12,
};

/**
 * Simulation + clock state for the app: metrics tick, day/night theme,
 * serial log, nudge toast, and all watering / time / weather handlers.
 * Pure orchestration state (page, selection, view toggles) stays in App.
 */
export function useSimulation() {
  const [metrics, setMetrics] = useState<SimulationMetrics>(INITIAL_METRICS);
  const [weather, setWeather] = useState<WeatherMode>('sunny');
  const [nudge, setNudge] = useState<NudgeBanner | null>(null);
  const [logs, setLogs] = useState<SerialLogEntry[]>(() => [
    {
      id: 1,
      day: 1,
      simTime: '10:30',
      tag: 'SYNC',
      title: 'Pemantauan Kebun Dimulai',
      message: `Suhu udara ${INITIAL_CLIMATE.tempC}°C, kelembaban ${INITIAL_CLIMATE.rh}%, dan air tanah masih cukup (48%).`,
    },
  ]);

  const appendLog = (
    tag: SerialLogEntry['tag'],
    title: string,
    message: string,
    day = metrics.dayCount,
    simTime = formatSimTime(metrics.timeHours)
  ) => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        day,
        simTime,
        tag,
        title,
        message,
      },
      ...prev.slice(0, 119),
    ]);
  };

  const prevSnapshotRef = React.useRef({
    soilDry: false,
    highRisk: false,
    decision: INITIAL_METRICS.lastDecision,
    wasWatering: false,
  });

  // Physics & watering tick
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMetrics((prev) => {
        const dtRealSec = 0.25;
        const deltaSimHours = prev.isWatering ? 0.04 : 0.004;

        let nextWatering = prev.isWatering;
        let nextRem = prev.wateringRemainingSec;
        if (prev.isWatering) {
          nextRem = Math.max(0, prev.wateringRemainingSec - dtRealSec);
          if (nextRem <= 0) nextWatering = false;
        }

        const next = stepSimulation(
          { ...prev, isWatering: nextWatering, wateringRemainingSec: nextRem },
          deltaSimHours,
          weather
        );

        const snap = prevSnapshotRef.current;
        const nowDry = next.soilMoisturePct < 38;
        const nowHighRisk = next.patekRiskPct >= 65;
        const simTime = formatSimTime(next.timeHours);

        if (nowDry && !snap.soilDry) {
          setLogs((old) => [
            {
              id: Date.now() + Math.random(),
              day: next.dayCount,
              simTime,
              tag: 'SENS',
              title: 'Tanah Mulai Kering',
              message: `Kadar air tanah turun ke ${Math.round(next.soilMoisturePct)}%. Sebaiknya segera disiram.`,
            },
            ...old.slice(0, 119),
          ]);
        }
        if (nowHighRisk && !snap.highRisk) {
          setLogs((old) => [
            {
              id: Date.now() + Math.random(),
              day: next.dayCount,
              simTime,
              tag: 'CAM',
              title: 'Peringatan: Risiko Patek Tinggi',
              message: `Risiko patek mencapai ${next.patekRiskPct}% karena daun basah selama ${next.leafWetnessHours} jam. Kamera mengecek kondisi daun.`,
            },
            ...old.slice(0, 119),
          ]);
        }
        if (next.lastDecision !== snap.decision) {
          const decisionHeading =
            next.lastDecision === 'TUNDA'
              ? 'Saran: Tunda Penyiraman'
              : next.lastDecision === 'KURANGI'
              ? 'Saran: Siram Setengah Takaran'
              : next.lastDecision === 'SIRAM'
              ? 'Saran: Aman untuk Menyiram'
              : 'Saran: Tanah Masih Cukup Air';
          const decisionText =
            weather === 'rainy'
              ? 'Sedang hujan, tidak perlu menyiram.'
              : next.lastDecision === 'TUNDA'
              ? `Pukul ${simTime} udara terlalu lembab, sebaiknya tunda siram sampai besok pagi.`
              : next.lastDecision === 'KURANGI'
              ? 'Cuaca agak lembab, cukup siram setengah volume agar daun cepat kering.'
              : next.lastDecision === 'SIRAM'
              ? `Tanah ${Math.round(next.soilMoisturePct)}% dan cuaca mendukung untuk disiram.`
              : `Air tanah masih cukup (${Math.round(next.soilMoisturePct)}%).`;
          setLogs((old) => [
            {
              id: Date.now() + Math.random(),
              day: next.dayCount,
              simTime,
              tag: 'RISK',
              title: decisionHeading,
              message: decisionText,
            },
            ...old.slice(0, 119),
          ]);
        }
        if (snap.wasWatering && !next.isWatering) {
          setLogs((old) => [
            {
              id: Date.now() + Math.random(),
              day: next.dayCount,
              simTime,
              tag: 'VALVE',
              title: prev.aiotMode ? 'Penyiraman Selesai' : 'Siram Gembor Selesai',
              message: `Air tanah kini ${Math.round(next.soilMoisturePct)}%, daun basah ${next.leafWetnessPct}%, dan risiko patek ${next.patekRiskPct}%.`,
            },
            ...old.slice(0, 119),
          ]);
        }

        prevSnapshotRef.current = {
          soilDry: nowDry,
          highRisk: nowHighRisk,
          decision: next.lastDecision,
          wasWatering: next.isWatering,
        };

        return next;
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [weather]);

  // Day/Night Risograph theme variables
  const nightFactor = getNightFactor(metrics.timeHours);
  const isNight = nightFactor > 0.52;

  const themeVars = useMemo(() => {
    return {
      '--paper': isNight ? '#1b2234' : nightFactor > 0.15 ? '#ece2cf' : '#f2efe7',
      '--panel': isNight ? '#222b40' : '#fbf8f0',
      '--soft': isNight ? '#2c3650' : '#ebe6da',
      '--ink': isNight ? '#ece6da' : '#231e16',
      '--muted': isNight ? '#aeb8d2' : '#665f53',
      '--rule': isNight ? '#384463' : '#dcd4c4',
      '--stage-bg': isNight ? '#161c2c' : nightFactor > 0.15 ? '#e9dcc6' : '#f4f0e6',
      '--accent': '#6cc29f',
      '--accent-soft': '#d9efe5',
    } as React.CSSProperties;
  }, [isNight, nightFactor]);


  const dayPhase = getDayPhaseLabel(metrics.timeHours);
  const weatherLabel = weather === 'sunny' ? 'Cerah' : weather === 'foggy' ? 'Kabut' : 'Hujan';

  const handleAutoWater = () => {
    const simTime = formatSimTime(metrics.timeHours);
    const h = metrics.timeHours;
    const isRiskyEvening = h >= 16.0 || h < 5.5 || weather === 'rainy' || metrics.vpdKpa < 0.45;

    if (metrics.aiotMode && metrics.isWatering) {
      setMetrics((prev) => ({
        ...prev,
        aiotMode: true,
        isWatering: false,
        wateringRemainingSec: 0,
      }));
      appendLog(
        'VALVE',
        'Penyiraman Dihentikan',
        `Penyiraman dihentikan saat air tanah ${Math.round(metrics.soilMoisturePct)}%.`
      );
      return;
    }

    if (metrics.autoGuardNight && isRiskyEvening) {
      setMetrics((prev) => ({
        ...prev,
        aiotMode: true,
        isWatering: false,
        wateringRemainingSec: 0,
      }));
      setNudge({
        id: Date.now(),
        tone: 'warn',
        title: 'Katup Otomatis Dikunci (TUNDA) · Nudge WA Petani',
        detail: `[Pesan WA · ${simTime}]: "Risiko embun tinggi (ΔTd ${metrics.dewPointDepressionC}°C, VPD ${metrics.vpdKpa} kPa). Irigasi otomatis ditahan agar daun tidak basah semalaman!"`,
      });
      appendLog(
        'NUDGE',
        'Penyiraman Ditahan',
        `Pukul ${simTime} cuaca terlalu lembab/malam — siram ditunda agar daun tidak basah semalaman dan memicu patek.`
      );
    } else {
      const volText = metrics.lastDecision === 'KURANGI' ? 'setengah takaran' : 'takaran normal';
      const volLogText = metrics.lastDecision === 'KURANGI' ? '50% volume (KURANGI)' : '100% normal (SIRAM)';
      setMetrics((prev) => ({
        ...prev,
        aiotMode: true,
        isWatering: true,
        wateringRemainingSec: 5.5,
      }));
      setNudge({
        id: Date.now(),
        tone: 'good',
        title: 'Siram Otomatis: Membuka Katup Solenoid',
        detail: `VPD ${metrics.vpdKpa} kPa & ΔTd ${metrics.dewPointDepressionC}°C aman. Solenoid menyiram ${volLogText}.`,
      });
      appendLog(
        'VALVE',
        'Mulai Menyiram Kebun',
        `Menyiram dengan ${volText} saat air tanah ${Math.round(metrics.soilMoisturePct)}%.`
      );
    }
  };

  const handleManualWater = () => {
    const simTime = formatSimTime(metrics.timeHours);
    const h = metrics.timeHours;
    const isRiskyEvening = h >= 16.0 || h < 5.5 || weather === 'rainy' || metrics.vpdKpa < 0.45;

    setMetrics((prev) => ({
      ...prev,
      aiotMode: false,
      isWatering: true,
      wateringRemainingSec: 5.5,
    }));

    if (isRiskyEvening) {
      setNudge({
        id: Date.now(),
        tone: 'warn',
        title: 'Siram Manual di Jam Berisiko',
        detail: `Menyiram pakai gembor pukul ${simTime} (ΔTd ${metrics.dewPointDepressionC}°C) membuat kanopi basah semalaman dan memicu spora patek!`,
      });
      appendLog(
        'NUDGE',
        'Siram Pakai Gembor (Berisiko Patek)',
        `Menyiram dari atas daun pukul ${simTime} saat cuaca ${weatherLabel.toLowerCase()}/malam. Daun bisa basah berkepanjangan!`
      );
    } else {
      setNudge({
        id: Date.now(),
        tone: 'info',
        title: 'Siram Manual (Gembor Teras Atas)',
        detail: `Gembor mengguyur langsung ke atas tajuk cabai. Gunakan Siram Otomatis (HP) untuk pengairan pipa presisi.`,
      });
      appendLog(
        'SENS',
        'Siram Pakai Gembor',
        `Menyiram dari atas daun pukul ${simTime} saat air tanah ${Math.round(metrics.soilMoisturePct)}%.`
      );
    }
  };

  const handleToggleAutoGuard = () => {
    const nextGuard = !metrics.autoGuardNight;
    setMetrics((prev) => ({
      ...prev,
      aiotMode: true,
      autoGuardNight: nextGuard,
      isWatering: nextGuard && prev.lastDecision === 'TUNDA' ? false : prev.isWatering,
    }));
    appendLog(
      'VALVE',
      `Proteksi Embun Malam ${nextGuard ? 'Diaktifkan' : 'Dimatikan'}`,
      nextGuard
        ? 'Penyiraman otomatis akan ditahan saat malam (16.00–05.30), hujan, atau berembun.'
        : 'Proteksi dimatikan — penyiraman tetap bisa jalan meski malam atau hujan.'
    );
  };

  const handleTimeChange = (targetHour: number) => {
    if (Math.abs(targetHour - metrics.timeHours) > 1.0) {
      setNudge(null);
    }
    const crossedDay = targetHour >= 24;
    const nextHour = crossedDay ? 0 : targetHour;
    const climate = computeMicroclimate(nextHour, weather);
    const nextDay = crossedDay ? metrics.dayCount + 1 : metrics.dayCount;
    setMetrics((prev) => ({
      ...prev,
      timeHours: nextHour,
      dayCount: nextDay,
      ambientTempC: climate.tempC,
      relativeHumidity: climate.rh,
      vpdKpa: climate.vpdKpa,
      dewPointC: climate.dewPointC,
      dewPointDepressionC: climate.dewPointDepressionC,
    }));
    if (crossedDay) {
      appendLog(
        'SYNC',
        `Masuk Hari ke-${nextDay}`,
        `Ganti hari tengah malam: suhu ${climate.tempC}°C, kelembaban ${climate.rh}%, air tanah ${Math.round(metrics.soilMoisturePct)}%.`,
        nextDay,
        '00:00'
      );
    }
  };

  const handleSkipDay = () => {
    setNudge(null);
    const next = advanceOneDay(metrics, weather);
    setMetrics(next);
    appendLog(
      'SYNC',
      `Lanjut ke Hari ke-${next.dayCount}`,
      `Cuaca ${weatherLabel.toLowerCase()} seharian: air tanah ${Math.round(next.soilMoisturePct)}%, daun basah ${next.leafWetnessPct}%, risiko patek ${next.patekRiskPct}%.`,
      next.dayCount,
      formatSimTime(next.timeHours)
    );
  };

  const handleResetDay = () => {
    setNudge(null);
    const climate = computeMicroclimate(INITIAL_METRICS.timeHours, weather);
    setMetrics((prev) => ({
      ...INITIAL_METRICS,
      aiotMode: prev.aiotMode,
      ambientTempC: climate.tempC,
      relativeHumidity: climate.rh,
      vpdKpa: climate.vpdKpa,
      dewPointC: climate.dewPointC,
      dewPointDepressionC: climate.dewPointDepressionC,
    }));
    appendLog(
      'SYNC',
      'Kembali ke Hari ke-1',
      `Kebun diulang ke pagi Hari ke-1 (10:30): air tanah 48%, risiko patek 18%.`,
      1,
      '10:30'
    );
  };

  const handleCycleWeather = () => {
    const order: WeatherMode[] = ['sunny', 'foggy', 'rainy'];
    const nextW = order[(order.indexOf(weather) + 1) % order.length];
    const nextWLabel = nextW === 'sunny' ? 'Cerah' : nextW === 'foggy' ? 'Berkabut' : 'Hujan';
    setWeather(nextW);
    appendLog(
      'SENS',
      `Cuaca Jadi ${nextWLabel}`,
      `Kondisi kebun menyesuaikan cuaca ${nextWLabel.toLowerCase()} dengan air tanah ${Math.round(metrics.soilMoisturePct)}%.`
    );
  };


  return {
    metrics,
    weather,
    logs,
    nudge,
    setNudge,
    themeVars,
    isNight,
    dayPhase,
    weatherLabel,
    handleAutoWater,
    handleManualWater,
    handleToggleAutoGuard,
    handleTimeChange,
    handleSkipDay,
    handleResetDay,
    handleCycleWeather,
  };
}
