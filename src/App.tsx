import React, { useEffect, useMemo, useState } from 'react';
import { CircuitPage } from './components/CircuitPage';
import { GardenViewport } from './components/GardenViewport';
import { PhoneMonitorHud } from './components/PhoneMonitorHud';
import { PhysicalNodePage } from './components/PhysicalNodePage';
import { LEAF_CONDITION_META, PARTS_INFO } from './data/parts';
import {
  advanceOneDay,
  computeMicroclimate,
  formatSimTime,
  getDayPhaseLabel,
  getNightFactor,
  stepSimulation,
} from './simulation/riskEngine';
import {
  CameraPreset,
  NudgeBanner,
  PartId,
  SelectedLeafInfo,
  SerialLogEntry,
  SimulationMetrics,
  WeatherMode,
} from './types/simulation';

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

export type AppPage = 'diorama' | 'circuit' | 'unit';

const getInitialPage = (): AppPage => {
  if (typeof window !== 'undefined') {
    if (window.location.hash === '#rangkaian') return 'circuit';
    if (window.location.hash === '#alat') return 'unit';
  }
  return 'diorama';
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);
  const [isCircuitAnimating, setIsCircuitAnimating] = useState(false);
  const [metrics, setMetrics] = useState<SimulationMetrics>(INITIAL_METRICS);
  const [weather, setWeather] = useState<WeatherMode>('sunny');
  const [exploded, setExploded] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showPhoneHud, setShowPhoneHud] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [selectedPart, setSelectedPart] = useState<PartId | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<SelectedLeafInfo | null>(null);
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

  const handleSelectPart = (part: PartId) => {
    setSelectedPart(part);
  };

  const handleSelectLeaf = (leaf: SelectedLeafInfo | null) => {
    setSelectedLeaf(leaf);
    if (!leaf && selectedPart === 'chili_plant') {
      setSelectedPart(null);
    }
  };

  const handleResetView = () => {
    setCameraPreset('iso');
    setResetTrigger((n) => n + 1);
  };

  const handleSwitchPage = (page: AppPage) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      const nextHash = page === 'circuit' ? '#rangkaian' : page === 'unit' ? '#alat' : '#diorama';
      window.history.replaceState(null, '', nextHash);
    }
  };

  const leafMeta = selectedLeaf ? LEAF_CONDITION_META[selectedLeaf.condition] : null;
  const partMeta = !selectedLeaf && selectedPart ? PARTS_INFO[selectedPart] : null;
  const dayPhase = getDayPhaseLabel(metrics.timeHours);
  const weatherLabel = weather === 'sunny' ? 'Cerah' : weather === 'foggy' ? 'Kabut' : 'Hujan';

  const hideTopChrome = activePage === 'circuit' && isCircuitAnimating;

  return (
    <div style={themeVars} className="theme-root" data-night={isNight ? 'true' : 'false'}>
      <div className="paper-grain" />

      <main className="full-stage">
        {!hideTopChrome && (
          <>
            {/* Minimal Top-Left Header */}
            <header className="top-brand">
              <h1 className="brand-title">Lembang Cabai · AIoT Node</h1>
              <div className="brand-sub">
                <span className="day-pill">Hari {metrics.dayCount}</span>
                <span>{formatSimTime(metrics.timeHours)}</span>
                <span className="phase-dot">{dayPhase}</span>
                <span>{weatherLabel}</span>
                <span className="sd-pill" title="MicroSD Offline-First Buffer">
                  SD {metrics.offlineBufferedCount} log
                </span>
              </div>
              <div className="brand-decision">
                <span className={`decision-tag is-${metrics.lastDecision.toLowerCase()}`}>
                  {metrics.aiotMode ? `AIoT: ${metrics.lastDecision}` : 'MODE MANUAL'}
                </span>
                <span className="decision-brief">
                  {metrics.aiotMode
                    ? metrics.lastDecision === 'TUNDA'
                      ? 'Katup ditahan · Nudge Siram'
                      : metrics.lastDecision === 'KURANGI'
                      ? 'Volume 50% · VPD rendah'
                      : metrics.lastDecision === 'SIRAM'
                      ? 'Siap siram otomatis'
                      : 'Pantau kanopi aktif'
                    : 'Mode Manual (Gembor)'}
                </span>
              </div>
            </header>

            {/* Top-Center Page Switcher */}
            <nav className="page-switch" aria-label="Navigasi Halaman">
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'diorama' ? 'is-active' : ''}`}
                onClick={() => {
                  setIsCircuitAnimating(false);
                  handleSwitchPage('diorama');
                }}
              >
                Diorama 3D
              </button>
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'circuit' ? 'is-active' : ''}`}
                onClick={() => handleSwitchPage('circuit')}
              >
                Rangkaian Prototype
              </button>
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'unit' ? 'is-active' : ''}`}
                onClick={() => {
                  setIsCircuitAnimating(false);
                  handleSwitchPage('unit');
                }}
              >
                Purwarupa Alat
              </button>
            </nav>

            {/* Minimal Top-Right Telemetry */}
            <div className="top-stats">
              <div className="stat-item">
                <div className="stat-label">VPD</div>
                <div className="stat-value">{metrics.vpdKpa}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">ΔTd Embun</div>
                <div className={`stat-value ${metrics.dewPointDepressionC <= 2.0 ? 'is-danger' : ''}`}>
                  {metrics.dewPointDepressionC}°C
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Tanah</div>
                <div className="stat-value">{Math.round(metrics.soilMoisturePct)}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Daun Basah</div>
                <div className="stat-value">{metrics.leafWetnessPct}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Risiko Patek</div>
                <div
                  className={`stat-value ${
                    metrics.patekRiskPct >= 65 ? 'is-danger' : metrics.patekRiskPct <= 30 ? 'is-ok' : ''
                  }`}
                >
                  {metrics.patekRiskPct}%
                </div>
              </div>
            </div>
          </>
        )}

        {activePage === 'circuit' ? (
          <CircuitPage metrics={metrics} onAnimationChange={setIsCircuitAnimating} />
        ) : activePage === 'unit' ? (
          <PhysicalNodePage metrics={metrics} />
        ) : (
          <>
            {/* Fullscreen 3D Scene */}
            <GardenViewport
              metrics={metrics}
              weather={weather}
              accent="mint"
              exploded={exploded}
              showFov={selectedPart === 'esp32cam'}
              showLabels={showLabels}
              showHighlights={showHighlights}
              cameraPreset={cameraPreset}
              resetTrigger={resetTrigger}
              selectedPart={selectedPart}
              selectedLeaf={selectedLeaf}
              onSelectPart={handleSelectPart}
              onSelectLeaf={handleSelectLeaf}
              wobbleAmount={1}
            />

        {/* Smartphone Companion App HUD (pantauan tanah & tombol Siram Otomatis lewat HP) */}
        {showPhoneHud && !selectedLeaf && !partMeta && (
          <PhoneMonitorHud
            metrics={metrics}
            weather={weather}
            logs={logs}
            onTriggerAutoWater={handleAutoWater}
            onToggleAutoGuard={handleToggleAutoGuard}
            onMinimize={() => setShowPhoneHud(false)}
          />
        )}

        {/* Right-Side Modal: Leaf Diagnosis OR Clicked Sensor/Part Info */}
        {selectedLeaf && leafMeta && (
          <aside className="info-modal" role="dialog" aria-label="Informasi Daun Cabai">
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">
                  Pohon #{selectedLeaf.plantIndex + 1} · {selectedLeaf.terrace} ·{' '}
                  {selectedLeaf.plantIndex < 2
                    ? 'Simulasi CAM + Kanopi'
                    : selectedLeaf.plantIndex < 5
                    ? 'Teras Atas (Simulasi Live)'
                    : 'Sampel Kondisi Teras Bawah'}
                </div>
                <h2 className="modal-title">Kondisi Daun #{selectedLeaf.leafIndex + 1}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Tutup modal"
                onClick={() => {
                  setSelectedLeaf(null);
                  setSelectedPart(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="condition-pill" style={{ backgroundColor: leafMeta.badgeColor }}>
              <span className="swatch-circle" style={{ backgroundColor: selectedLeaf.colorHex }} />
              <span>{leafMeta.label}</span>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Kenapa daunnya begini?</span>
              {selectedLeaf.plantIndex < 5 &&
              selectedLeaf.condition === 'yellowing' &&
              metrics.soilMoisturePct <= 26 &&
              metrics.patekRiskPct < 52
                ? `Kelembaban tanah turun hingga ${Math.round(metrics.soilMoisturePct)}% (stres kekeringan karena berhari-hari tanpa siram), membuat daun mulai menguning dan layu.`
                : leafMeta.cause}
            </div>

            <div className="modal-mini-grid">
              <div className="mini-cell">
                <span>VPD / ΔTd</span>
                <strong>
                  {metrics.vpdKpa} kPa · {metrics.dewPointDepressionC}°C
                </strong>
              </div>
              <div className="mini-cell">
                <span>ESP32-CAM</span>
                <strong>
                  {selectedLeaf.plantIndex >= 2
                    ? 'Di Luar FOV CAM'
                    : selectedLeaf.condition === 'patek_infected'
                    ? 'Patek Aktif'
                    : selectedLeaf.condition === 'patek_early' || selectedLeaf.condition === 'yellowing'
                    ? 'Anomali Visual'
                    : selectedLeaf.condition === 'wet_risk'
                    ? 'Daun Berembun'
                    : 'Normal'}
                </strong>
              </div>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Tindakan AIoT</span>
              {selectedLeaf.plantIndex < 5 &&
              selectedLeaf.condition === 'yellowing' &&
              metrics.soilMoisturePct <= 26 &&
              metrics.patekRiskPct < 52
                ? 'Sensor tanah mengirim peringatan Kering ke HP. Tekan tombol Siram Otomatis di HP saat jam VPD aman agar tanaman segera pulih tanpa memicu patek.'
                : leafMeta.aiotAction}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="dock-btn is-active"
                onClick={() => {
                  setSelectedLeaf(null);
                  setSelectedPart(null);
                }}
              >
                Tutup
              </button>
            </div>
          </aside>
        )}

        {partMeta && (
          <aside className="info-modal" role="dialog" aria-label="Informasi Komponen">
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">Komponen {partMeta.code}</div>
                <h2 className="modal-title">{partMeta.name}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Tutup modal"
                onClick={() => setSelectedPart(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Fungsi Alat</span>
              {partMeta.role}
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Lokasi Penempatan</span>
              {partMeta.placement}
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Alasan Penempatan</span>
              {partMeta.whyHere}
            </div>

            <div className="modal-footer">
              <button type="button" className="dock-btn is-active" onClick={() => setSelectedPart(null)}>
                Tutup
              </button>
            </div>
          </aside>
        )}

        {/* Simple Bottom Control Dock */}
        <nav className="bottom-dock" aria-label="Kontrol Simulasi">
          <button
            type="button"
            className={`dock-btn is-primary ${metrics.isWatering && metrics.aiotMode ? 'is-active' : ''}`}
            onClick={handleAutoWater}
            title="Jalankan irigasi otomatis lewat pipa AIoT (dikontrol via HP)"
          >
            {metrics.isWatering && metrics.aiotMode ? 'Matikan Otomatis' : 'Siram Otomatis'}
          </button>
          <button
            type="button"
            className={`dock-btn ${metrics.isWatering && !metrics.aiotMode ? 'is-active' : ''}`}
            onClick={handleManualWater}
            title="Siram manual pakai gembor ke atas kanopi Teras Atas"
          >
            {metrics.isWatering && !metrics.aiotMode ? 'Gembor Aktif...' : 'Siram Manual'}
          </button>

          <div className="dock-divider" />

          <div className="time-control">
            <span className="time-text">
              H{metrics.dayCount} · {formatSimTime(metrics.timeHours)}
            </span>
            <input
              type="range"
              className="time-slider"
              aria-label="Waktu Siang dan Malam"
              min={0}
              max={24}
              step={0.2}
              value={metrics.timeHours}
              onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
            />
            <button
              type="button"
              className="dock-btn"
              onClick={handleSkipDay}
              title="Percepat simulasi maju 24 jam penuh"
            >
              +1 Hari
            </button>
            <button
              type="button"
              className="dock-btn"
              onClick={handleResetDay}
              title="Reset simulasi kembali ke Hari ke-1"
            >
              Reset Hari
            </button>
          </div>

          <div className="dock-divider" />

          <button type="button" className="dock-btn" onClick={handleCycleWeather}>
            {weatherLabel}
          </button>
          <button
            type="button"
            className={`dock-btn ${exploded ? 'is-active' : ''}`}
            onClick={() => setExploded((v) => !v)}
          >
            Buka Node
          </button>
          <button
            type="button"
            className={`dock-btn ${showHighlights ? 'is-active' : ''}`}
            onClick={() => setShowHighlights((v) => !v)}
          >
            Highlight
          </button>
          <button
            type="button"
            className={`dock-btn ${showLabels ? 'is-active' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
          >
            Label
          </button>
          <button
            type="button"
            className={`dock-btn ${showPhoneHud && !selectedLeaf && !partMeta ? 'is-active' : ''}`}
            onClick={() => {
              if (selectedLeaf || partMeta) {
                setSelectedLeaf(null);
                setSelectedPart(null);
                setShowPhoneHud(true);
              } else {
                setShowPhoneHud((v) => !v);
              }
            }}
            title="Tampilkan / sembunyikan layar aplikasi HP AIoT di pojok kanan"
          >
            Pantau HP
          </button>
          <button type="button" className="dock-btn" onClick={handleResetView}>
            Reset Kamera
          </button>
        </nav>
          </>
        )}

        {/* Watering / Behavior Nudge Toast */}
        {nudge && (
          <div className={`nudge-toast tone-${nudge.tone}`}>
            <div>
              <div className="nudge-title">{nudge.title}</div>
              <div className="nudge-detail">{nudge.detail}</div>
            </div>
            <button type="button" className="close-btn" onClick={() => setNudge(null)}>
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
