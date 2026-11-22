import { AiotDecision, SimulationMetrics, WeatherMode } from '../types/simulation';

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
): { tempC: number; rh: number; vpdKpa: number; solarFactor: number } {
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

  // Tetens equation for saturation vapor pressure (kPa)
  const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const vpdKpa = Number(Math.max(0.04, es * (1 - rh / 100)).toFixed(2));

  return { tempC, rh, vpdKpa, solarFactor };
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
    'timeHours' | 'soilMoisturePct' | 'leafWetnessPct' | 'vpdKpa' | 'patekRiskPct'
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

  // Late afternoon or night -> avoid wetting leaves overnight!
  if (h >= 16.0 || h < 5.5) {
    return {
      decision: 'TUNDA',
      reason: `Pukul ${formatSimTime(h)} terlalu dekat malam (VPD ${metrics.vpdKpa} kPa): siram sekarang bikin daun basah semalaman.`,
    };
  }

  // High humidity / foggy morning -> reduce volume
  if (weather === 'foggy' || metrics.vpdKpa < 0.45 || metrics.patekRiskPct > 58) {
    return {
      decision: 'KURANGI',
      reason: `VPD rendah (${metrics.vpdKpa} kPa) memperlambat pengeringan daun. Volume irigasi dikurangi 50%.`,
    };
  }

  return {
    decision: 'SIRAM',
    reason: `Tanah kering (${Math.round(metrics.soilMoisturePct)}%) & VPD ${metrics.vpdKpa} kPa cukup tinggi: daun cepat kering sebelum malam.`,
  };
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

  const { tempC, rh, vpdKpa, solarFactor } = computeMicroclimate(timeHours, weather);

  // Soil moisture evaporation & rain/watering recharge
  let soilMoisture = prev.soilMoisturePct;
  const evapSoil = (0.9 + vpdKpa * 2.1 + solarFactor * 1.4) * deltaSimHours;
  soilMoisture -= evapSoil;

  if (weather === 'rainy') {
    soilMoisture += 14 * deltaSimHours;
  }
  if (prev.isWatering) {
    soilMoisture += 42 * deltaSimHours;
  }
  soilMoisture = Math.max(14, Math.min(95, soilMoisture));

  // Leaf wetness dynamics
  let leafWetness = prev.leafWetnessPct;
  if (prev.isWatering) {
    leafWetness += 120 * deltaSimHours;
  }
  if (weather === 'rainy') {
    leafWetness += 80 * deltaSimHours;
  } else if (rh >= 88 && solarFactor < 0.15) {
    // Night/dawn dew condensation on Lembang highland canopy
    leafWetness += (rh - 85) * 2.2 * deltaSimHours;
  } else {
    // Evaporation driven by VPD & solar
    const dryRate = Math.max(3, vpdKpa * 38 + solarFactor * 26 - (weather === 'foggy' ? 8 : 0));
    leafWetness -= dryRate * deltaSimHours;
  }
  leafWetness = Math.max(0, Math.min(100, leafWetness));

  // Track continuous leaf wetness hours
  let leafWetnessHours = prev.leafWetnessHours;
  if (leafWetness >= 32) {
    leafWetnessHours = Math.min(24, leafWetnessHours + deltaSimHours);
  } else {
    leafWetnessHours = Math.max(0, leafWetnessHours - deltaSimHours * 1.8);
  }

  // Anthracnose (patek) 12-36h risk calculation
  // Peaks when LWD > 5h, RH > 82%, and temp is 17-26°C
  const tempSuitability = tempC >= 16 && tempC <= 26 ? 1 : 0.45;
  const nightWetBonus = getNightFactor(timeHours) > 0.5 && leafWetness > 40 ? 1.35 : 0.85;
  const targetRisk = Math.min(
    99,
    Math.max(
      6,
      (leafWetnessHours * 7.8 + Math.max(0, rh - 70) * 1.15 + (leafWetness > 50 ? 12 : 0)) *
        tempSuitability *
        nightWetBonus
    )
  );
  // Smooth risk approach
  const riskBlend = Math.min(1, deltaSimHours * 0.75);
  const patekRiskPct = Math.round(prev.patekRiskPct + (targetRisk - prev.patekRiskPct) * riskBlend);

  // Visual symptom manifestation when prolonged high risk (>70%) persists
  let symptomSeverity = prev.symptomSeverity;
  if (patekRiskPct >= 72 && leafWetnessHours >= 5) {
    symptomSeverity = Math.min(1, symptomSeverity + 0.08 * deltaSimHours);
  } else if (patekRiskPct < 35) {
    symptomSeverity = Math.max(0, symptomSeverity - 0.015 * deltaSimHours);
  }

  // Solar + battery
  let batteryPct = prev.batteryPct + (solarFactor * 8.5 - 0.65 - (prev.isWatering ? 1.8 : 0)) * deltaSimHours;
  batteryPct = Math.max(12, Math.min(100, batteryPct));

  const estimatedDry = estimateDryMinutes(leafWetness, vpdKpa, solarFactor, weather);

  const evalRes = evaluateAiotDecision(
    {
      timeHours,
      soilMoisturePct: soilMoisture,
      leafWetnessPct: leafWetness,
      vpdKpa,
      patekRiskPct,
    },
    weather
  );

  return {
    ...prev,
    timeHours,
    dayCount,
    ambientTempC: tempC,
    relativeHumidity: rh,
    vpdKpa,
    soilMoisturePct: Number(soilMoisture.toFixed(1)),
    leafWetnessPct: Number(leafWetness.toFixed(0)),
    leafWetnessHours: Number(leafWetnessHours.toFixed(1)),
    estimatedDryMinutes: estimatedDry,
    patekRiskPct,
    symptomSeverity: Number(symptomSeverity.toFixed(2)),
    batteryPct: Number(batteryPct.toFixed(0)),
    lastDecision: evalRes.decision,
    decisionReason: evalRes.reason,
  };
}
