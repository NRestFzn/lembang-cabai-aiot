import { EspPartKey } from '../../data/espParts';
import { IsoConfig, ESP_PALETTE, isoProject } from '../../utils/isoDraw';

export const CFG: IsoConfig = {
  originX: 460,
  originY: 315,
  scale: 66,
  inkColor: ESP_PALETTE.ink,
};

export interface CalloutDef {
  id: string;
  text: string;
  part: EspPartKey;
  target: [number, number, number];
  offset: [number, number];
}

export const CALLOUTS: CalloutDef[] = [
  { id: 'c-wifi', text: 'WIFI MODULE', part: 'U1', target: [0, -0.95, 0.72], offset: [115, -52] },
  { id: 'c-led', text: 'STATUS LED', part: 'RGB', target: [0.3, 0.3, 0.62], offset: [52, -88] },
  { id: 'c-boot', text: 'BOOT', part: 'SW1', target: [-0.46, 1.15, 0.64], offset: [-58, -76] },
  { id: 'c-uart', text: 'UART PORT', part: 'J1', target: [0, 2.02, 0.62], offset: [-122, 16] },
  { id: 'c-gpio', text: 'GPIO', part: 'H2', target: [0.76, 0.15, 0.56], offset: [78, 72] },
];

// Static bench geometry (board runs along Y: -2.05 .. +2.05, width X: -0.92 .. +0.92)
export const matW = 4.6;
export const matD = 6.2;
export const bbW = 2.85;
export const bbD = 5.15;
export const bbZ = 0.0;
export const bbTop = 0.34;

export const pcbW = 1.82;
export const pcbD = 4.1;
export const pcbZ = bbTop + 0.16;
export const pcbH = 0.085;
export const pcbTop = pcbZ + pcbH;

// 15 pins along each side (y from -1.54 to +1.54, step 0.22)
export const pinIndices = Array.from({ length: 15 }, (_, i) => i);
export const pinY = (i: number) => -1.54 + i * 0.22;

// Breadboard 2.54mm socket holes (columns left & right of center channel)
export const bbHoleColsX = [-1.05, -0.86, -0.67, -0.48, -0.29, 0.29, 0.48, 0.67, 0.86, 1.05];
export const bbRowsY = Array.from({ length: 19 }, (_, i) => -1.98 + i * 0.22);

/** Explode factor: how far components lift off the PCB when exploded. */
export const explodeFactor = (exploded: boolean) => (exploded ? 0.65 : 0);

// USB cable path when plugged (static: depends only on pcbTop).
const cablePts: Array<[number, number, number]> = [
  [0, 2.48, pcbTop + 0.06],
  [0, 2.75, pcbTop - 0.02],
  [0.05, 3.05, 0.05],
  [0.18, 3.38, -0.26],
  [0.42, 3.72, -0.58],
];
const cableProj = cablePts.map(([x, y, z]) => isoProject(x, y, z, CFG));
export const cableD = `M ${cableProj[0][0]} ${cableProj[0][1]} C ${cableProj[1][0]} ${cableProj[1][1]}, ${cableProj[2][0]} ${cableProj[2][1]}, ${cableProj[3][0]} ${cableProj[3][1]} L ${cableProj[4][0]} ${cableProj[4][1]}`;
