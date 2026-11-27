// AIoT decisions: the irrigation decision from live metrics, and the
// shared canopy leaf-condition evaluator (3D diorama + phone UI agree).
import { AiotDecision, LeafCondition, SimulationMetrics, WeatherMode } from '../types/simulation';
import { formatSimTime, getNightFactor } from './time';

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

