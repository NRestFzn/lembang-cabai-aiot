// Isometric projection math + the ESP board colour palette.
// Pure helpers shared by every Iso* shape component.
export const COS30 = 0.8660254;
export const SIN30 = 0.5;

export interface IsoConfig {
  originX: number;
  originY: number;
  scale: number;
  inkColor?: string;
}

export function isoProject(x: number, y: number, z: number, cfg: IsoConfig): [number, number] {
  return [
    cfg.originX + (x - y) * COS30 * cfg.scale,
    cfg.originY + (x + y) * SIN30 * cfg.scale - z * cfg.scale,
  ];
}

export function ptsAttr(pts: Array<[number, number]>): string {
  return pts.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(' ');
}

/**
 * Returns an SVG transform matrix(a, b, c, d, e, f) that lays flat onto the
 * isometric top plane at height z, anchored at (x, y).
 */
export function isoPlaneMatrix(x: number, y: number, z: number, cfg: IsoConfig): string {
  const [tx, ty] = isoProject(x, y, z, cfg);
  const a = COS30;
  const b = SIN30;
  const c = -COS30;
  const d = SIN30;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${tx.toFixed(2)} ${ty.toFixed(2)})`;
}

export interface ShadeSet {
  top: string;
  left: string;
  right: string;
  rim?: string;
}

export const ESP_PALETTE = {
  ink: '#231e16',
  mat: { top: '#e2dccb', left: '#cfc8b8', right: '#b5ae9f', rim: '#f1ede2' },
  breadboard: { top: '#f1f2ef', left: '#e3e0d2', right: '#cfc8b8', rim: '#ffffff' },
  pcbBoard: { top: '#2d3036', left: '#202227', right: '#141619', rim: '#555b66' },
  pcbDark: { top: '#1c1e22', left: '#15171a', right: '#0e1012' },
  metalSilver: { top: '#eef0f0', left: '#c6ccce', right: '#7d8286', rim: '#ffffff' },
  metalDark: { top: '#5d5954', left: '#423e3a', right: '#292623' },
  icDark: { top: '#3d3935', left: '#292623', right: '#1d1b18' },
  gold: { top: '#e2bd56', left: '#c49d35', right: '#99771d' },
  solder: { top: '#d6dce0', left: '#aeb6bc', right: '#838b92' },
  rubberCable: { top: '#55504a', left: '#3d3935', right: '#292623' },
  plugHousing: { top: '#5d5954', left: '#423e3a', right: '#292623' },
  ledGlow: { top: '#8af0ae', left: '#53c77c', right: '#2e9954' },
  ledIdle: { top: '#eef0f0', left: '#c6ccce', right: '#9aa2a8' },
};

