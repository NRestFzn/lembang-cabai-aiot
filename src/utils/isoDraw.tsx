import React from 'react';

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

interface IsoBoxProps {
  cfg: IsoConfig;
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  shades: ShadeSet;
  strokeWidth?: number;
  rimStroke?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export const IsoBox: React.FC<IsoBoxProps> = ({
  cfg,
  x,
  y,
  z,
  dx,
  dy,
  dz,
  shades,
  strokeWidth = 1.4,
  rimStroke = false,
  onClick,
  selected = false,
}) => {
  const ink = cfg.inkColor ?? ESP_PALETTE.ink;
  const sw = selected ? strokeWidth + 0.9 : strokeWidth;

  const t0 = isoProject(x, y, z + dz, cfg);
  const t1 = isoProject(x + dx, y, z + dz, cfg);
  const t2 = isoProject(x + dx, y + dy, z + dz, cfg);
  const t3 = isoProject(x, y + dy, z + dz, cfg);

  const b1 = isoProject(x + dx, y, z, cfg);
  const b2 = isoProject(x + dx, y + dy, z, cfg);
  const b3 = isoProject(x, y + dy, z, cfg);

  return (
    <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <polygon
        points={ptsAttr([t1, t2, b2, b1])}
        fill={shades.right}
        stroke={ink}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polygon
        points={ptsAttr([t3, t2, b2, b3])}
        fill={shades.left}
        stroke={ink}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polygon
        points={ptsAttr([t0, t1, t2, t3])}
        fill={shades.top}
        stroke={ink}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {rimStroke && shades.rim && (
        <polyline
          points={ptsAttr([t3, t0, t1])}
          fill="none"
          stroke={shades.rim}
          strokeWidth={Math.max(0.8, strokeWidth * 0.65)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.75}
        />
      )}
      {selected && (
        <polygon
          points={ptsAttr([t0, t1, t2, t3])}
          fill="none"
          stroke="#6cc29f"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
};

interface IsoChamferSlabProps {
  cfg: IsoConfig;
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  chamfer: number;
  shades: ShadeSet;
  strokeWidth?: number;
}

/**
 * Chamfered isometric slab (for workbench mat, breadboard, and PCB corners).
 */
export const IsoChamferSlab: React.FC<IsoChamferSlabProps> = ({
  cfg,
  x,
  y,
  z,
  dx,
  dy,
  dz,
  chamfer: c,
  shades,
  strokeWidth = 2.0,
}) => {
  const ink = cfg.inkColor ?? ESP_PALETTE.ink;

  // 8-point chamfered footprint clockwise from top-left:
  const footprint: Array<[number, number]> = [
    [x + c, y],
    [x + dx - c, y],
    [x + dx, y + c],
    [x + dx, y + dy - c],
    [x + dx - c, y + dy],
    [x + c, y + dy],
    [x, y + dy - c],
    [x, y + c],
  ];

  const topPts = footprint.map(([px, py]) => isoProject(px, py, z + dz, cfg));
  const botPts = footprint.map(([px, py]) => isoProject(px, py, z, cfg));

  // Front-facing side wall segments (indices 1->2, 2->3, 3->4, 4->5, 5->6)
  const sideSegments: Array<{ i: number; j: number; fill: string }> = [
    { i: 1, j: 2, fill: shades.right },
    { i: 2, j: 3, fill: shades.right },
    { i: 3, j: 4, fill: shades.right },
    { i: 4, j: 5, fill: shades.left },
    { i: 5, j: 6, fill: shades.left },
  ];

  return (
    <g>
      {sideSegments.map(({ i, j, fill }, idx) => (
        <polygon
          key={idx}
          points={ptsAttr([topPts[i], topPts[j], botPts[j], botPts[i]])}
          fill={fill}
          stroke={ink}
          strokeWidth={strokeWidth * 0.72}
          strokeLinejoin="round"
        />
      ))}
      <polygon
        points={ptsAttr(topPts)}
        fill={shades.top}
        stroke={ink}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Outer crisp silhouette */}
      <polygon
        points={ptsAttr([
          topPts[0],
          topPts[1],
          topPts[2],
          botPts[2],
          botPts[3],
          botPts[4],
          botPts[5],
          botPts[6],
          topPts[6],
          topPts[7],
        ])}
        fill="none"
        stroke={ink}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {shades.rim && (
        <polyline
          points={ptsAttr([topPts[6], topPts[7], topPts[0], topPts[1]])}
          fill="none"
          stroke={shades.rim}
          strokeWidth={Math.max(0.8, strokeWidth * 0.5)}
          strokeLinecap="round"
          opacity={0.75}
        />
      )}
    </g>
  );
};

interface IsoCylinderProps {
  cfg: IsoConfig;
  cx: number;
  cy: number;
  z: number;
  r: number;
  h: number;
  shades: ShadeSet;
  strokeWidth?: number;
  onClick?: () => void;
}

export const IsoCylinder: React.FC<IsoCylinderProps> = ({
  cfg,
  cx,
  cy,
  z,
  r,
  h,
  shades,
  strokeWidth = 1.2,
  onClick,
}) => {
  const ink = cfg.inkColor ?? ESP_PALETTE.ink;
  const rx = r * Math.SQRT2 * COS30 * cfg.scale;
  const ry = r * Math.SQRT2 * SIN30 * cfg.scale;
  const [tx, ty] = isoProject(cx, cy, z + h, cfg);
  const [bx, by] = isoProject(cx, cy, z, cfg);

  const sidePath = [
    `M ${tx - rx} ${ty}`,
    `L ${bx - rx} ${by}`,
    `A ${rx} ${ry} 0 0 0 ${bx + rx} ${by}`,
    `L ${tx + rx} ${ty}`,
    `Z`,
  ].join(' ');

  return (
    <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <path d={sidePath} fill={shades.left} stroke={ink} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={shades.top} stroke={ink} strokeWidth={strokeWidth} />
    </g>
  );
};

interface IsoDropGuideProps {
  cfg: IsoConfig;
  x: number;
  y: number;
  zBottom: number;
  zTop: number;
}

export const IsoDropGuide: React.FC<IsoDropGuideProps> = ({ cfg, x, y, zBottom, zTop }) => {
  if (zTop <= zBottom + 0.02) return null;
  const [x1, y1] = isoProject(x, y, zBottom, cfg);
  const [x2, y2] = isoProject(x, y, zTop, cfg);
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#231e16"
      strokeWidth={1.0}
      strokeDasharray="3 3"
      opacity={0.45}
    />
  );
};
