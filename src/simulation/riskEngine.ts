import { AiotDecision, LeafCondition, SimulationMetrics, WeatherMode } from '../types/simulation';

export function formatSimTime(hours: number): string {
  const hNorm = ((hours % 24) + 24) % 24;
  const hh = Math.floor(hNorm);
  const mm = Math.floor((hNorm - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function getDayPhaseLabel(hours: number): 'MALAM' | 'SUBUH' | 'PAGI' | 'SIANG' | 'SORE' {
  const h = ((hours % 24) + 24) % 24;
  if (h >= 19 || h < 4.5) return 'MALAM';
  if (h >= 4.5 && h < 6.5) return 'SUBUH';
  if (h >= 6.5 && h < 11) return 'PAGI';
  if (h >= 11 && h < 15.5) return 'SIANG';
  return 'SORE';
}

/**
 * Returns 0 = full day, 1 = full night, with smooth dawn/dusk transitions.
 */
export function getNightFactor(hours: number): number {
  const h = ((hours % 24) + 24) % 24;
  if (h >= 7.2 && h <= 16.8) return 0;
  if (h >= 19.2 || h <= 4.8) return 1;
  if (h > 16.8 && h < 19.2) {
    return (h - 16.8) / 2.4;
  }
  // 4.8 .. 7.2 dawn
  return 1 - (h - 4.8) / 2.4;
}

export function computeMicroclimate(
  timeHours: number,
  weather: WeatherMode
): {
  tempC: number;
  rh: number;
  vpdKpa: number;
  dewPointC: number;
  dewPointDepressionC: number;
  solarFactor: number;
} {
  const h = ((timeHours % 24) + 24) % 24;
  // Peak temperature around 13:30, lowest around 04:30 (Lembang ~1200 mdpl)
  const diurnal = Math.sin(((h - 7.5) / 24) * Math.PI * 2); // -1..1
  const sunElevation = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
  const isDay = h >= 6 && h <= 18;

  let baseTemp = 19.8 + diurnal * 4.8;
  let baseRh = 80 - diurnal * 16;
  let solarFactor = isDay ? sunElevation : 0;

  if (weather === 'foggy') {
    baseTemp -= 2.1;
    baseRh += 11;
    solarFactor *= 0.45;
  } else if (weather === 'rainy') {
    baseTemp -= 3.2;
    baseRh += 15;
    solarFactor *= 0.2;
  }

  const tempC = Number(Math.max(13.5, Math.min(28.5, baseTemp)).toFixed(1));
  const rh = Number(Math.max(48, Math.min(98, baseRh)).toFixed(0));

  // Tetens equation for saturation vapor pressure (kPa) & Dew-Point Depression (T - Td)
  const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const vpdKpa = Number(Math.max(0.04, es * (1 - rh / 100)).toFixed(2));
  const gamma = (17.27 * tempC) / (237.3 + tempC) + Math.log(rh / 100);
  const dewPointC = Number(((237.3 * gamma) / (17.27 - gamma)).toFixed(1));
  const dewPointDepressionC = Number(Math.max(0.1, tempC - dewPointC).toFixed(1));

  return { tempC, rh, vpdKpa, dewPointC, dewPointDepressionC, solarFactor };
}

export function estimateDryMinutes(
  leafWetnessPct: number,
  vpdKpa: number,
  solarFactor: number,
  weather: WeatherMode
): number {
  if (leafWetnessPct <= 5) return 0;
  if (weather === 'rainy') return 480;
  const dryRatePerHour = Math.max(4, vpdKpa * 42 + solarFactor * 28 - (weather === 'foggy' ? 10 : 0));
  const hoursNeeded = leafWetnessPct / dryRatePerHour;
  return Math.min(720, Math.round(hoursNeeded * 60));
}

export function evaluateAiotDecision(
  metrics: Pick<
    SimulationMetrics,
    | 'timeHours'
    | 'soilMoisturePct'
    | 'leafWetnessPct'
    | 'vpdKpa'
    | 'dewPointDepressionC'
    | 'patekRiskPct'
  >,
  weather: WeatherMode
): { decision: AiotDecision; reason: string } {
  const h = ((metrics.timeHours % 24) + 24) % 24;

  if (weather === 'rainy') {
    return {
      decision: 'TUNDA',
      reason: 'Hujan aktif terdeteksi: irigasi ditahan agar zona akar dan kanopi tidak jenuh air.',
    };
  }

  if (metrics.soilMoisturePct >= 62) {
    return {
      decision: 'IDLE',
      reason: `Kelembaban tanah cukup (${Math.round(metrics.soilMoisturePct)}%). Hemat air & jaga VPD kanopi.`,
    };
  }

  // Late afternoon/night OR near dew-point saturation -> avoid overnight wet canopy!
  if (h >= 16.0 || h < 5.5 || (metrics.dewPointDepressionC <= 1.8 && metrics.leafWetnessPct >= 30)) {
    return {
      decision: 'TUNDA',
      reason: `Pukul ${formatSimTime(h)} rawan embun (VPD ${metrics.vpdKpa} kPa, ΔTd ${metrics.dewPointDepressionC}°C): penyiraman ditunda agar daun tidak basah semalaman.`,
    };
  }

  // Low VPD, foggy canopy, or elevated patek forecast -> reduce volume 50%
  if (
    weather === 'foggy' ||
    metrics.vpdKpa < 0.45 ||
    metrics.dewPointDepressionC <= 2.5 ||
    metrics.patekRiskPct > 58
  ) {
    return {
      decision: 'KURANGI',
      reason: `VPD rendah (${metrics.vpdKpa} kPa) / ΔTd ${metrics.dewPointDepressionC}°C memperlambat pengeringan daun. Volume irigasi dikurangi 50%.`,
    };
  }

  return {
    decision: 'SIRAM',
    reason: `Tanah ${Math.round(metrics.soilMoisturePct)}% & VPD ${metrics.vpdKpa} kPa cukup tinggi: daun cepat kering sebelum malam.`,
  };
}

/**
 * Shared leaf state evaluator for the 2 CAM + BME280 monitored upper-terrace plants (index 0 & 1)
 * so 3D diorama rendering and Phone UI camera view always match 100%.
 */
export function evaluateCanopyLeafCondition(
  plantIndex: 0 | 1,
  metrics: Pick<
    SimulationMetrics,
    | 'timeHours'
    | 'soilMoisturePct'
    | 'leafWetnessPct'
    | 'relativeHumidity'
    | 'patekRiskPct'
    | 'symptomSeverity'
    | 'aiotMode'
    | 'isWatering'
  >
): LeafCondition {
  const night = getNightFactor(metrics.timeHours);
  const manualPouring = !metrics.aiotMode && metrics.isWatering;

  if (
    metrics.symptomSeverity >= 0.72 ||
    (metrics.patekRiskPct >= 86 && metrics.symptomSeverity >= 0.48)
  ) {
    if (plantIndex === 1) return 'patek_infected';
    return metrics.symptomSeverity >= 0.85 ||
      (metrics.patekRiskPct >= 92 && metrics.symptomSeverity >= 0.64)
      ? 'patek_infected'
      : 'patek_early';
  }
  if (metrics.symptomSeverity >= 0.32 || metrics.patekRiskPct >= 72) {
    if (plantIndex === 1) return 'patek_early';
    return metrics.symptomSeverity >= 0.54 || metrics.patekRiskPct >= 82 ? 'patek_early' : 'yellowing';
  }
  if (metrics.symptomSeverity >= 0.12 || metrics.patekRiskPct >= 52) {
    return plantIndex === 1 ? 'yellowing' : 'wet_risk';
  }
  // Prolonged dry soil without watering causes real drought stress yellowing on upper canopy
  if (metrics.soilMoisturePct <= 26) {
    return 'yellowing';
  }
  if (manualPouring || metrics.leafWetnessPct >= 28 || (night > 0.45 && metrics.relativeHumidity >= 84)) {
    return 'wet_risk';
  }
  return 'healthy';
}

export function stepSimulation(
  prev: SimulationMetrics,
  deltaSimHours: number,
  weather: WeatherMode
): SimulationMetrics {
  const nextTimeRaw = prev.timeHours + deltaSimHours;
  const dayOverflow = Math.floor(nextTimeRaw / 24);
  const timeHours = ((nextTimeRaw % 24) + 24) % 24;
  const dayCount = prev.dayCount + Math.max(0, dayOverflow);

  const { tempC, rh, vpdKpa, dewPointC, dewPointDepressionC, solarFactor } = computeMicroclimate(
    timeHours,
    weather
  );

  // Soil moisture evaporation & rain/watering recharge (honoring KURANGI 50% volume!)
  let soilMoisture = prev.soilMoisturePct;
  const evapSoil = (0.45 + vpdKpa * 0.9 + solarFactor * 0.6) * deltaSimHours;
  soilMoisture -= evapSoil;

  if (weather === 'rainy') {
    soilMoisture += 12 * deltaSimHours;
  }
  if (prev.isWatering) {
    const waterRate = prev.aiotMode && prev.lastDecision === 'KURANGI' ? 21 : 42;
    soilMoisture += waterRate * deltaSimHours;
  }
  soilMoisture = Math.max(12, Math.min(95, soilMoisture));

  // Leaf wetness dynamics (Manual open-bed watering wets leaves heavily; KURANGI reduces misting 50%)
  let leafWetness = prev.leafWetnessPct;
  if (prev.isWatering) {
    const wetRate = !prev.aiotMode ? 165 : prev.lastDecision === 'KURANGI' ? 7 : 14;
    leafWetness += wetRate * deltaSimHours;
  }
  if (weather === 'rainy') {
    leafWetness += 85 * deltaSimHours;
  } else if (rh >= 90 && solarFactor < 0.15) {
    // Natural night/dawn dew condensation driven by low Dew-Point Depression
    const dewCap = weather === 'foggy' ? 88 : 42;
    if (leafWetness < dewCap) {
      const dewRate = (rh - 88) * (weather === 'foggy' ? 2.2 : 1.0);
      leafWetness = Math.min(dewCap, leafWetness + dewRate * deltaSimHours);
    }
  } else {
    // Evaporation driven by VPD & solar
    const dryRate = Math.max(4, vpdKpa * 45 + solarFactor * 36 - (weather === 'foggy' ? 10 : 0));
    leafWetness -= dryRate * deltaSimHours;
  }
  leafWetness = Math.max(0, Math.min(100, leafWetness));

  // Track continuous leaf wetness hours
  const isRiskyWindow =
    getNightFactor(timeHours) > 0.35 ||
    timeHours >= 16 ||
    weather !== 'sunny' ||
    vpdKpa < 0.55 ||
    dewPointDepressionC <= 2.2;
  let leafWetnessHours = prev.leafWetnessHours;
  if (prev.isWatering && !prev.aiotMode && isRiskyWindow) {
    leafWetnessHours = Math.min(24, leafWetnessHours + deltaSimHours * 2.5);
  } else if (leafWetness >= 44 || (weather !== 'sunny' && leafWetness >= 32)) {
    leafWetnessHours = Math.min(24, leafWetnessHours + deltaSimHours);
  } else {
    leafWetnessHours = Math.max(0, leafWetnessHours - deltaSimHours * 2.6);
  }

  const estimatedDry = estimateDryMinutes(leafWetness, vpdKpa, solarFactor, weather);
  const projectedDryHours = estimatedDry / 60;

  // Anthracnose (patek) 12-36h pre-symptom risk calculation from microclimate:
  // Combines LWD history + projected dry time + Dew-Point Depression + Temp suitability (16-26°C)
  const tempSuitability = tempC >= 16 && tempC <= 26 ? 1 : 0.45;
  const dewRiskBoost = dewPointDepressionC <= 1.8 ? 16 : dewPointDepressionC <= 2.8 ? 8 : 0;
  const nightWetBonus = getNightFactor(timeHours) > 0.45 && leafWetness > 45 ? 1.25 : 0.85;
  const manualPenalty = !prev.aiotMode && leafWetness > 40 ? 1.25 : 1.0;
  const targetRisk = Math.min(
    99,
    Math.max(
      6,
      ((leafWetnessHours + projectedDryHours * 0.6) * 7.6 +
        Math.max(0, rh - 76) * 0.9 +
        dewRiskBoost +
        (leafWetness > 50 ? 12 : 0)) *
        tempSuitability *
        nightWetBonus *
        manualPenalty
    )
  );
  // Responsive risk blend
  const riskBlend = Math.min(1, deltaSimHours * (prev.isWatering ? 1.45 : 0.85));
  const patekRiskPct = Math.round(prev.patekRiskPct + (targetRisk - prev.patekRiskPct) * riskBlend);

  // Visual symptom manifestation when prolonged high risk persists, with recovery in safe dry care
  let symptomSeverity = prev.symptomSeverity;
  if (patekRiskPct >= 62 && leafWetnessHours >= 1.8) {
    symptomSeverity = Math.min(1, symptomSeverity + 0.26 * deltaSimHours);
  } else if (patekRiskPct < 50 && leafWetness < 22) {
    symptomSeverity = Math.max(0, symptomSeverity - 0.18 * deltaSimHours);
  }

  // Solar + battery
  let batteryPct = prev.batteryPct + (solarFactor * 8.5 - 0.65 - (prev.isWatering ? 1.8 : 0)) * deltaSimHours;
  batteryPct = Math.max(12, Math.min(100, batteryPct));

  const nextOfflineCount =
    prev.offlineBufferedCount + (Math.floor(nextTimeRaw * 8) !== Math.floor(prev.timeHours * 8) ? 1 : 0);

  const evalRes = evaluateAiotDecision(
    {
      timeHours,
      soilMoisturePct: soilMoisture,
      leafWetnessPct: leafWetness,
      vpdKpa,
      dewPointDepressionC,
      patekRiskPct,
    },
    weather
  );

  // Keep night/rain valve protection active, while starting automatic pipe irrigation only via button press
  let nextIsWatering = prev.isWatering;
  let nextWateringRem = prev.wateringRemainingSec;
  if (prev.aiotMode && prev.autoGuardNight && evalRes.decision === 'TUNDA') {
    nextIsWatering = false;
    nextWateringRem = 0;
  }

  return {
    ...prev,
    timeHours,
    dayCount,
    ambientTempC: tempC,
    relativeHumidity: rh,
    vpdKpa,
    dewPointC,
    dewPointDepressionC,
    soilMoisturePct: Number(soilMoisture.toFixed(1)),
    leafWetnessPct: Number(leafWetness.toFixed(0)),
    leafWetnessHours: Number(leafWetnessHours.toFixed(1)),
    estimatedDryMinutes: estimatedDry,
    patekRiskPct,
    symptomSeverity: Number(symptomSeverity.toFixed(2)),
    batteryPct: Number(batteryPct.toFixed(0)),
    isWatering: nextIsWatering,
    wateringRemainingSec: nextWateringRem,
    lastDecision: evalRes.decision,
    decisionReason: evalRes.reason,
    offlineBufferedCount: nextOfflineCount,
  };
}

/**
 * Advances simulation by a full 24-hour cycle (48 half-hour steps) for '+1 Hari' fast-forward
 * WITHOUT hidden auto-watering, so dry days actually dry the soil until user presses Siram on HP.
 */
export function advanceOneDay(prev: SimulationMetrics, weather: WeatherMode): SimulationMetrics {
  let cur: SimulationMetrics = { ...prev, isWatering: false, wateringRemainingSec: 0 };
  for (let step = 0; step < 48; step++) {
    cur = stepSimulation(
      {
        ...cur,
        isWatering: false,
        wateringRemainingSec: 0,
      },
      0.5,
      weather
    );
  }
  return { ...cur, isWatering: false, wateringRemainingSec: 0 };
}
