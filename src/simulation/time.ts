// Simulation clock helpers: formatting, day-phase labels and the
// smooth day/night factor used by the microclimate + leaf models.
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

