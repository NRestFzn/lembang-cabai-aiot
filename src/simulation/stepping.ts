// Simulation stepping: one time step, and the 24-hour fast-forward
// used by the '+1 Hari' button.
import { SimulationMetrics, WeatherMode } from '../types/simulation';
import { evaluateAiotDecision } from './decisions';
import { computeMicroclimate, estimateDryMinutes } from './microclimate';
import { getNightFactor } from './time';

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

