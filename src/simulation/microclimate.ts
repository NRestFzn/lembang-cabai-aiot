// Microclimate model: temperature / humidity / VPD / dew-point from
// time of day + weather, and the leaf drying-time estimate.
import { WeatherMode } from '../types/simulation';

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

