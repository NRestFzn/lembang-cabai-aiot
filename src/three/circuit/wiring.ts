import * as THREE from 'three';
import { tagEspPart } from '../hardwareModules';
import { CircuitContext } from './context';

/**
 * Full assembled circuit wiring (original section 9J, sub-sections A-E).
 * The wire-routing engine (addAssembledWire / addBBJumper) lives here with
 * the harness it builds. One flattening vs the original: addBBJumper used to
 * branch into two near-identical addAssembledWire calls; it now picks the
 * point list with a ternary and calls addAssembledWire once.
 */
export function buildCircuitWiring(
  ctx: CircuitContext,
  icDarkMat: THREE.Material,
  bbCol: (idx: number) => number,
  bbTop: number
): { harnessGroup: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  // =========================================================================
  // 9J. FULL ASSEMBLED 3D CIRCUIT WIRING (SPACIOUS & ORTHOGONAL)
  // =========================================================================
  const harnessGroup = new THREE.Group();
  scene.add(harnessGroup);

  const wireMatCache = new Map<string, THREE.Material>();
  const getWireMat = (hex: string) => {
    let m = wireMatCache.get(hex);
    if (!m) {
      m = factory.createToon(hex);
      wireMatCache.set(hex, m);
    }
    return m;
  };
  const headerBootGeo = trackGeo(new THREE.BoxGeometry(0.088, 0.145, 0.088));

  interface FloorH {
    z: number;
    xMin: number;
    xMax: number;
    y: number;
  }
  interface FloorV {
    x: number;
    zMin: number;
    zMax: number;
    y: number;
  }
  const floorHSegs: FloorH[] = [];
  const floorVSegs: FloorV[] = [];
  const bbCollarGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.085, 8));

  const addAssembledWire = (
    pts: [number, number, number][],
    colorHex: string,
    opts?: { radius?: number; capStart?: boolean; capEnd?: boolean; bbEnd?: boolean; bbStart?: boolean }
  ) => {
    const expanded: [number, number, number][] = [pts[0]];
    const newH: FloorH[] = [];
    const newV: FloorV[] = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay, az] = pts[i];
      const [bx, by, bz] = pts[i + 1];
      const isFlatPlane = Math.abs(ay - by) < 0.03 && ay <= 0.6;

      if (isFlatPlane && Math.abs(az - bz) < 0.01 && Math.abs(ax - bx) > 0.26) {
        const minX = Math.min(ax, bx);
        const maxX = Math.max(ax, bx);
        const dir = bx > ax ? 1 : -1;
        const crossings = floorVSegs
          .filter(
            (v) =>
              v.x > minX + 0.14 &&
              v.x < maxX - 0.14 &&
              az >= v.zMin - 0.04 &&
              az <= v.zMax + 0.04 &&
              Math.abs(v.y - ay) < 0.05
          )
          .map((v) => v.x)
          .sort((u, v) => (dir > 0 ? u - v : v - u));

        const groups: Array<{ start: number; end: number }> = [];
        crossings.forEach((cx) => {
          const prevGrp = groups[groups.length - 1];
          if (!prevGrp || Math.abs(cx - prevGrp.end) > 0.34) {
            groups.push({ start: cx, end: cx });
          } else {
            prevGrp.end = cx;
          }
        });

        groups.forEach(({ start, end }) => {
          expanded.push([start - dir * 0.13, ay, az]);
          expanded.push([start - dir * 0.02, ay + 0.1, az]);
          if (Math.abs(end - start) > 0.02) {
            expanded.push([end + dir * 0.02, ay + 0.1, az]);
          }
          expanded.push([end + dir * 0.13, ay, az]);
        });
        newH.push({ z: az, xMin: minX, xMax: maxX, y: ay });
      } else if (isFlatPlane && Math.abs(ax - bx) < 0.01 && Math.abs(az - bz) > 0.26) {
        const minZ = Math.min(az, bz);
        const maxZ = Math.max(az, bz);
        const dir = bz > az ? 1 : -1;
        const crossings = floorHSegs
          .filter(
            (h) =>
              h.z > minZ + 0.14 &&
              h.z < maxZ - 0.14 &&
              ax >= h.xMin - 0.04 &&
              ax <= h.xMax + 0.04 &&
              Math.abs(h.y - ay) < 0.05
          )
          .map((h) => h.z)
          .sort((u, v) => (dir > 0 ? u - v : v - u));

        const groups: Array<{ start: number; end: number }> = [];
        crossings.forEach((cz) => {
          const prevGrp = groups[groups.length - 1];
          if (!prevGrp || Math.abs(cz - prevGrp.end) > 0.34) {
            groups.push({ start: cz, end: cz });
          } else {
            prevGrp.end = cz;
          }
        });

        groups.forEach(({ start, end }) => {
          expanded.push([ax, ay, start - dir * 0.13]);
          expanded.push([ax, ay + 0.1, start - dir * 0.02]);
          if (Math.abs(end - start) > 0.02) {
            expanded.push([ax, ay + 0.1, end + dir * 0.02]);
          }
          expanded.push([ax, ay, end + dir * 0.13]);
        });
        newV.push({ x: ax, zMin: minZ, zMax: maxZ, y: ay });
      }

      expanded.push([bx, by, bz]);
    }
    floorHSegs.push(...newH);
    floorVSegs.push(...newV);

    const vectors = expanded.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CurvePath<THREE.Vector3>();
    const fillet = 0.095;
    let prev = vectors[0].clone();

    for (let i = 1; i < vectors.length - 1; i++) {
      const curr = vectors[i];
      const next = vectors[i + 1];
      const vIn = new THREE.Vector3().subVectors(prev, curr);
      const vOut = new THREE.Vector3().subVectors(next, curr);
      const r = Math.min(fillet, vIn.length() * 0.42, vOut.length() * 0.42);
      if (r > 0.005) {
        const pIn = curr.clone().addScaledVector(vIn.normalize(), r);
        const pOut = curr.clone().addScaledVector(vOut.normalize(), r);
        if (prev.distanceTo(pIn) > 0.002) {
          curve.add(new THREE.LineCurve3(prev, pIn));
        }
        curve.add(new THREE.QuadraticBezierCurve3(pIn, curr.clone(), pOut));
        prev = pOut;
      } else {
        if (prev.distanceTo(curr) > 0.002) {
          curve.add(new THREE.LineCurve3(prev, curr));
        }
        prev = curr.clone();
      }
    }

    const last = vectors[vectors.length - 1];
    if (prev.distanceTo(last) > 0.002) {
      curve.add(new THREE.LineCurve3(prev, last));
    }

    const tube = new THREE.Mesh(
      trackGeo(
        new THREE.TubeGeometry(curve, Math.max(28, expanded.length * 10), opts?.radius ?? 0.022, 8, false)
      ),
      getWireMat(colorHex)
    );
    tube.castShadow = true;
    harnessGroup.add(tube);

    if (opts?.capStart) {
      const [sx, sy, sz] = pts[0];
      const boot = factory.createOutlinedMesh(headerBootGeo, icDarkMat, 1.07);
      boot.position.set(sx, sy - 0.03, sz);
      harnessGroup.add(boot);
    }
    if (opts?.capEnd) {
      const [ex, ey, ez] = pts[pts.length - 1];
      const boot = factory.createOutlinedMesh(headerBootGeo, icDarkMat, 1.07);
      boot.position.set(ex, ey - 0.03, ez);
      harnessGroup.add(boot);
    }
    if (opts?.bbStart) {
      const [sx, sy, sz] = pts[0];
      const collar = factory.createOutlinedMesh(bbCollarGeo, icDarkMat, 1.07);
      collar.position.set(sx, sy + 0.042, sz);
      harnessGroup.add(collar);
    }
    if (opts?.bbEnd) {
      const [ex, ey, ez] = pts[pts.length - 1];
      const collar = factory.createOutlinedMesh(bbCollarGeo, icDarkMat, 1.07);
      collar.position.set(ex, ey + 0.042, ez);
      harnessGroup.add(collar);
    }
  };

  // Helper: clean point-to-point breadboard jumper
  const addBBJumper = (
    c1: number,
    z1: number,
    c2: number,
    z2: number,
    colorHex: string,
    yPlane = 0.36
  ) => {
    const x1 = bbCol(c1);
    const x2 = bbCol(c2);
    const isStraight = Math.abs(c1 - c2) === 0 || Math.abs(z1 - z2) < 0.01;
    const pts: [number, number, number][] = isStraight
      ? [
          [x1, bbTop, z1],
          [x1, yPlane, z1],
          [x2, yPlane, z2],
          [x2, bbTop, z2],
        ]
      : [
          [x1, bbTop, z1],
          [x1, yPlane, z1],
          [x2, yPlane, z1],
          [x2, yPlane, z2],
          [x2, bbTop, z2],
        ];
    addAssembledWire(pts, colorHex, { bbStart: true, bbEnd: true });
  };

  // Breadboard row & rail Y/Z constants
  const Z_TOP_GND = -1.98;
  const Z_TOP_5V = -1.76;
  const Z_A = -1.32;
  const Z_B = -1.1;
  const Z_C = -0.88;
  const Z_D = -0.66;
  const Z_E = -0.44;
  const Z_I = 1.1;
  const Z_J = 1.32;
  const Z_BOT_3V3 = 1.76;
  const Z_BOT_GND = 1.98;

  // --- A. Solar (-10.0, -4.2) -> MPPT (-6.2, -4.2) -> Battery (-1.8, -4.2) -> LM2596 (2.4, -4.2) ---
  // BAT+ tie-points sit on col 12 (Z_B/Z_C/Z_D); BAT- tie-points sit cleanly on col 32 (Z_C/Z_D/Z_E) — zero crossing cluster!
  addAssembledWire(
    [
      [-9.08, 0.25, -4.3],
      [-7.21, 0.285, -4.34],
    ],
    '#dc2626',
    { radius: 0.026 }
  );
  addAssembledWire(
    [
      [-9.08, 0.25, -4.1],
      [-7.21, 0.285, -4.02],
    ],
    '#1f2937',
    { radius: 0.026 }
  );
  // MPPT BAT+ (-5.19, 0.285, -4.34) -> open col 4 Z_B (12V+ Bus, left of BME280!)
  addAssembledWire(
    [
      [-5.19, 0.285, -4.34],
      [-5.02, 0.285, -4.34],
      [-5.02, 0.1, -4.34],
      [-5.02, 0.1, -2.86],
      [bbCol(4) - 0.14, 0.1, -2.86],
      [bbCol(4) - 0.14, 0.44, -2.86],
      [bbCol(4) - 0.14, 0.44, Z_B],
      [bbCol(4), 0.44, Z_B],
      [bbCol(4), bbTop, Z_B],
    ],
    '#dc2626',
    { bbEnd: true }
  );
  // Battery+ (-2.76, 0.32, -4.20) -> col 4 Z_C (12.8V Pack+)
  addAssembledWire(
    [
      [-2.76, 0.32, -4.2],
      [-2.76, 0.1, -4.2],
      [-2.76, 0.1, -3.08],
      [bbCol(4), 0.1, -3.08],
      [bbCol(4), 0.5, -3.08],
      [bbCol(4), 0.5, Z_C],
      [bbCol(4), bbTop, Z_C],
    ],
    '#dc2626',
    { bbEnd: true }
  );
  // col 4 Z_D -> col 3 -> z = -2.64 -> open aisle x = -3.65 (clear right of MPPT!) -> back lane z = -5.35 -> LM2596 IN+ (1.17, 0.285, -4.34)
  addAssembledWire(
    [
      [bbCol(4), bbTop, Z_D],
      [bbCol(4), 0.56, Z_D],
      [bbCol(3), 0.56, Z_D],
      [bbCol(3), 0.56, -2.64],
      [bbCol(3), 0.24, -2.64],
      [-3.65, 0.24, -2.64],
      [-3.65, 0.24, -5.35],
      [-3.65, 0.1, -5.35],
      [0.85, 0.1, -5.35],
      [0.85, 0.1, -4.34],
      [0.85, 0.285, -4.34],
      [1.17, 0.285, -4.34],
    ],
    '#dc2626',
    { bbStart: true }
  );
  // col 4 Z_E -> z = -2.50 -> open aisle x = -3.45 (clear right of MPPT!) -> back lane z = -5.58 -> Relay COM1 (8.43, 0.27, -4.56)
  addAssembledWire(
    [
      [bbCol(4), bbTop, Z_E],
      [bbCol(4), 0.62, Z_E],
      [bbCol(4) + 0.14, 0.62, Z_E],
      [bbCol(4) + 0.14, 0.62, -2.5],
      [bbCol(4) + 0.14, 0.3, -2.5],
      [-3.45, 0.3, -2.5],
      [-3.45, 0.3, -5.58],
      [-3.45, 0.1, -5.58],
      [8.62, 0.1, -5.58],
      [8.62, 0.34, -5.58],
      [8.62, 0.34, -4.56],
      [8.43, 0.27, -4.56],
    ],
    '#dc2626',
    { bbStart: true, radius: 0.026 }
  );

  // BAT- Bus on col 13 (Z_C/D/E) — directly below Battery/MPPT between BME280 and ESP32!
  // MPPT BAT- (-5.19, 0.285, -4.02) -> z = -3.45 -> col 13 Z_C
  addAssembledWire(
    [
      [-5.19, 0.285, -4.02],
      [-4.96, 0.285, -4.02],
      [-4.96, 0.1, -4.02],
      [-4.96, 0.1, -3.45],
      [bbCol(13) - 0.14, 0.1, -3.45],
      [bbCol(13) - 0.14, 0.46, -3.45],
      [bbCol(13) - 0.14, 0.46, Z_C],
      [bbCol(13), 0.46, Z_C],
      [bbCol(13), bbTop, Z_C],
    ],
    '#1f2937',
    { bbEnd: true }
  );
  // Battery- (-0.84, 0.32, -4.20) -> z = -3.25 -> col 13 Z_D
  addAssembledWire(
    [
      [-0.84, 0.32, -4.2],
      [-0.84, 0.1, -4.2],
      [-0.84, 0.1, -3.25],
      [bbCol(13), 0.1, -3.25],
      [bbCol(13), 0.52, -3.25],
      [bbCol(13), 0.52, Z_D],
      [bbCol(13), bbTop, Z_D],
    ],
    '#1f2937',
    { bbEnd: true }
  );
  // col 13 Z_E -> x = bbCol(13) + 0.14 -> z = -2.85 -> elevated over OUT lines -> LM2596 IN- (1.17, 0.285, -4.02)
  addAssembledWire(
    [
      [bbCol(13), bbTop, Z_E],
      [bbCol(13), 0.58, Z_E],
      [bbCol(13) + 0.14, 0.58, Z_E],
      [bbCol(13) + 0.14, 0.58, -2.85],
      [0.85, 0.58, -2.85],
      [0.85, 0.58, -4.02],
      [0.85, 0.285, -4.02],
      [1.17, 0.285, -4.02],
    ],
    '#1f2937',
    { bbStart: true }
  );

  // LM2596 5.00V OUT+ (right terminal: 3.63, -4.34) -> front of LM2596 -> col 37 -> DIRECTLY into ESP32 VIN (col 31 Z_J)
  addAssembledWire(
    [
      [3.63, 0.285, -4.34],
      [3.92, 0.285, -4.34],
      [3.92, 0.12, -4.34],
      [3.92, 0.12, -3.12],
      [bbCol(37), 0.12, -3.12],
      [bbCol(37), 0.46, -3.12],
      [bbCol(37), 0.46, Z_J],
      [bbCol(31), 0.46, Z_J],
      [bbCol(31), bbTop, Z_J],
    ],
    '#dc2626',
    { radius: 0.026, bbEnd: true }
  );
  // LM2596 5.00V OUT- (right terminal: 3.63, -4.02) -> front of LM2596 -> col 38 -> z = 2.22 -> DIRECTLY into ESP32 GND (col 30 Z_J)
  addAssembledWire(
    [
      [3.63, 0.285, -4.02],
      [4.08, 0.285, -4.02],
      [4.08, 0.12, -4.02],
      [4.08, 0.12, -2.92],
      [bbCol(38), 0.12, -2.92],
      [bbCol(38), 0.46, -2.92],
      [bbCol(38), 0.46, 2.22],
      [bbCol(30), 0.46, 2.22],
      [bbCol(30), 0.46, Z_J],
      [bbCol(30), bbTop, Z_J],
    ],
    '#1f2937',
    { radius: 0.026, bbEnd: true }
  );

  // --- B. Breadboard Common GND Link (Top -GND <-> Bottom -GND at col 2 via left edge, clear of -7.90 skirt) ---
  addAssembledWire(
    [
      [bbCol(2), bbTop, Z_TOP_GND],
      [bbCol(2), 0.36, Z_TOP_GND],
      [-8.12, 0.36, Z_TOP_GND],
      [-8.12, 0.12, Z_TOP_GND],
      [-8.12, 0.12, Z_BOT_GND],
      [-8.12, 0.36, Z_BOT_GND],
      [bbCol(2), 0.36, Z_BOT_GND],
      [bbCol(2), bbTop, Z_BOT_GND],
    ],
    '#1f2937',
    { bbStart: true, bbEnd: true }
  );

  // --- C. On-Board Breadboard Jumpers (ESP32, BME280, ArduCam power, MicroSD) ---
  // NOTE (ArduCam swap): the camera is now an ArduCam Camera Module 3 (IMX708)
  // on MIPI CSI-2 — it is NOT an ESP32-CAM on UART2. Only its 5V/GND power
  // jumpers remain on the breadboard; the former U0R/U0T jumpers (c49->GPIO17,
  // c50->GPIO16) were removed, and GPIO16/17 are now spare.
  // ESP32 GND Top (c30) -> Top -GND (common GND link at c2 also bridges Top -GND <-> Bot -GND cleanly without clipping c30 Z_J!)
  addBBJumper(30, Z_B, 30, Z_TOP_GND, '#1f2937', 0.35);
  // ESP32 VIN bus (c31 Z_I) -> via open col 36 (y = 0.44 cleanly over SPI/UART) -> Top +5V Rail (c36) to feed CAM/SD/Relay
  addAssembledWire(
    [
      [bbCol(31), bbTop, Z_I],
      [bbCol(31), 0.44, Z_I],
      [bbCol(36), 0.44, Z_I],
      [bbCol(36), 0.44, Z_TOP_5V],
      [bbCol(36), bbTop, Z_TOP_5V],
    ],
    '#dc2626',
    { bbStart: true, bbEnd: true }
  );
  // ESP32 3V3 (c31 Top) -> open gap c35 -> Bot +3V3 Rail (dedicated lane z = -0.96, y = 0.40)
  addAssembledWire(
    [
      [bbCol(31), bbTop, Z_B],
      [bbCol(31), 0.4, Z_B],
      [bbCol(31), 0.4, -0.96],
      [bbCol(35), 0.4, -0.96],
      [bbCol(35), 0.4, Z_BOT_3V3],
      [bbCol(35), bbTop, Z_BOT_3V3],
    ],
    '#f97316',
    { bbStart: true, bbEnd: true }
  );

  // BME280 (c7..c10): VCC (c7) -> Bot +3V3 (via col 5), GND (c8) -> Top -GND
  addAssembledWire(
    [
      [bbCol(7), bbTop, Z_B],
      [bbCol(7), 0.36, Z_B],
      [bbCol(5), 0.36, Z_B],
      [bbCol(5), 0.36, Z_BOT_3V3],
      [bbCol(5), bbTop, Z_BOT_3V3],
    ],
    '#f97316',
    { bbStart: true, bbEnd: true }
  );
  addBBJumper(8, Z_B, 8, Z_TOP_GND, '#1f2937', 0.35);
  // BME280 SCL (c9) -> ESP32 GPIO22 (c18) along Z_B; SDA (c10) -> ESP32 GPIO21 (c21) along Z_A
  addBBJumper(9, Z_B, 18, Z_B, '#3b82f6', 0.34);
  addBBJumper(10, Z_A, 21, Z_A, '#06b6d4', 0.34);

  // ArduCam Camera Module 3 (c46..c49, plugged via 4-pin header at Z_E):
  // Connected via clean orthogonal breadboard jumpers just like BME280 & MicroSD:
  //   c46 TX/TRIG -> ESP32 GPIO17 (c25, along Z_A)
  //   c47 RX/DATA -> ESP32 GPIO16 (c26, routed via clean lane z = -1.21 avoiding c31 3V3)
  //   c48 5V      -> Top +5V Rail (c48)
  //   c49 GND     -> Top -GND Rail (c49)
  addBBJumper(49, Z_C, 49, Z_TOP_GND, '#1f2937', 0.35);
  addBBJumper(48, Z_D, 48, Z_TOP_5V, '#dc2626', 0.38);
  addBBJumper(46, Z_A, 25, Z_A, '#06b6d4', 0.34);
  addAssembledWire(
    [
      [bbCol(47), bbTop, Z_B],
      [bbCol(47), 0.35, Z_B],
      [bbCol(47), 0.35, -1.21],
      [bbCol(26), 0.35, -1.21],
      [bbCol(26), 0.35, Z_B],
      [bbCol(26), bbTop, Z_B],
    ],
    '#a855f7',
    { bbStart: true, bbEnd: true }
  );

  // MicroSD (c54..c59): GND (c54) -> Top -GND, VCC (c55) -> Top +5V
  addBBJumper(54, Z_B, 54, Z_TOP_GND, '#1f2937', 0.35);
  addBBJumper(55, Z_C, 55, Z_TOP_5V, '#dc2626', 0.38);
  // MicroSD SPI (MISO c56 -> c22, MOSI c57 -> c17, SCK c58 -> c23, CS c59 -> c24)
  // Routed cleanly in dedicated Z lanes above upper row (-1.46, -1.58, -2.22, -2.36)
  addAssembledWire(
    [
      [bbCol(56), bbTop, Z_C],
      [bbCol(56), 0.34, Z_C],
      [bbCol(56), 0.34, -1.46],
      [bbCol(22), 0.34, -1.46],
      [bbCol(22), 0.34, Z_C],
      [bbCol(22), bbTop, Z_C],
    ],
    '#14b8a6',
    { bbStart: true, bbEnd: true }
  );
  addAssembledWire(
    [
      [bbCol(57), bbTop, Z_C],
      [bbCol(57), 0.36, Z_C],
      [bbCol(57), 0.36, -1.58],
      [bbCol(17), 0.36, -1.58],
      [bbCol(17), 0.36, Z_C],
      [bbCol(17), bbTop, Z_C],
    ],
    '#3b82f6',
    { bbStart: true, bbEnd: true }
  );
  addAssembledWire(
    [
      [bbCol(58), bbTop, Z_A],
      [bbCol(58), 0.36, Z_A],
      [bbCol(58), 0.36, -2.22],
      [bbCol(23), 0.36, -2.22],
      [bbCol(23), 0.36, Z_A],
      [bbCol(23), bbTop, Z_A],
    ],
    '#22c55e',
    { bbStart: true, bbEnd: true }
  );
  addAssembledWire(
    [
      [bbCol(59), bbTop, Z_A],
      [bbCol(59), 0.38, Z_A],
      [bbCol(59), 0.38, -2.36],
      [bbCol(24), 0.38, -2.36],
      [bbCol(24), 0.38, Z_B],
      [bbCol(24), bbTop, Z_B],
    ],
    '#9333ea',
    { bbStart: true, bbEnd: true }
  );

  // --- D. Bottom Row External Modules -> Breadboard Holes & Power Rails ---
  // Soil Moisture (-6.2, 4.0): JST at x = -5.07, z = [3.86 (GND), 4.00 (VCC), 4.14 (AOUT)]
  addAssembledWire(
    [
      [-5.07, 0.21, 3.86],
      [bbCol(8), 0.1, 3.86],
      [bbCol(8), 0.1, 2.5],
      [bbCol(8), 0.36, 2.5],
      [bbCol(8), 0.36, Z_BOT_GND],
      [bbCol(8), bbTop, Z_BOT_GND],
    ],
    '#1f2937',
    { bbEnd: true }
  );
  addAssembledWire(
    [
      [-5.07, 0.21, 4.0],
      [bbCol(10), 0.1, 4.0],
      [bbCol(10), 0.1, 2.66],
      [bbCol(10), 0.36, 2.66],
      [bbCol(10), 0.36, Z_BOT_3V3],
      [bbCol(10), bbTop, Z_BOT_3V3],
    ],
    '#f97316',
    { bbEnd: true }
  );
  // Soil AOUT -> goes straight UP at x = -5.07 (completely clear of DS18B20 probe!) into col 20 Z_J
  addAssembledWire(
    [
      [-5.07, 0.21, 4.14],
      [-5.07, 0.1, 2.86],
      [bbCol(20), 0.1, 2.86],
      [bbCol(20), 0.36, 2.86],
      [bbCol(20), 0.36, Z_J],
      [bbCol(20), bbTop, Z_J],
    ],
    '#eab308',
    { bbEnd: true }
  );

  // DS18B20 (-2.0, 4.1): pins at x = -0.86, z = [3.92 (VCC), 4.10 (DQ), 4.28 (GND)]
  addAssembledWire(
    [
      [-0.86, 0.26, 3.92],
      [bbCol(28), 0.12, 3.92],
      [bbCol(28), 0.12, 2.5],
      [bbCol(28), 0.36, 2.5],
      [bbCol(28), 0.36, Z_BOT_3V3],
      [bbCol(28), bbTop, Z_BOT_3V3],
    ],
    '#f97316',
    { capStart: true, bbEnd: true }
  );
  addAssembledWire(
    [
      [-0.86, 0.26, 4.28],
      [bbCol(29), 0.12, 4.28],
      [bbCol(29), 0.12, 2.66],
      [bbCol(29), 0.36, 2.66],
      [bbCol(29), 0.36, Z_BOT_GND],
      [bbCol(29), bbTop, Z_BOT_GND],
    ],
    '#1f2937',
    { capStart: true, bbEnd: true }
  );
  // DS18B20 DQ -> via wide-spaced gap c40 -> z = -1.50 (y = 0.44) into ESP32 GPIO4 (c27, Z_A)
  addAssembledWire(
    [
      [-0.86, 0.26, 4.1],
      [-0.56, 0.26, 4.1],
      [-0.56, 0.12, 4.1],
      [bbCol(40), 0.12, 4.1],
      [bbCol(40), 0.12, 2.5],
      [bbCol(40), 0.44, 2.5],
      [bbCol(40), 0.44, -1.5],
      [bbCol(27), 0.44, -1.5],
      [bbCol(27), 0.44, Z_A],
      [bbCol(27), bbTop, Z_A],
    ],
    '#facc15',
    { capStart: true, bbEnd: true }
  );

  // --- E. Relay (7.4, -4.2) -> Breadboard +5V/-GND Rails & ESP32 IN1/IN2 + Pump/Solenoid ---
  // Relay VCC (6.48, -4.05) -> Top +5V Rail (col 61); GND (6.48, -4.71) -> Top -GND Rail (col 62)
  addAssembledWire(
    [
      [6.48, 0.32, -4.05],
      [bbCol(61), 0.12, -4.05],
      [bbCol(61), 0.12, -2.85],
      [bbCol(61), 0.36, -2.85],
      [bbCol(61), 0.36, Z_TOP_5V],
      [bbCol(61), bbTop, Z_TOP_5V],
    ],
    '#dc2626',
    { capStart: true, bbEnd: true }
  );
  addAssembledWire(
    [
      [6.48, 0.32, -4.71],
      [bbCol(62), 0.12, -4.71],
      [bbCol(62), 0.12, -2.85],
      [bbCol(62), 0.36, -2.85],
      [bbCol(62), 0.36, Z_TOP_GND],
      [bbCol(62), bbTop, Z_TOP_GND],
    ],
    '#1f2937',
    { capStart: true, bbEnd: true }
  );
  // Relay IN1 (6.48, -4.49) -> straight down empty right end c63 -> z = 1.46 -> ESP32 GPIO26 (c25, Z_I)
  addAssembledWire(
    [
      [6.48, 0.32, -4.49],
      [bbCol(63), 0.32, -4.49],
      [bbCol(63), 0.12, -4.49],
      [bbCol(63), 0.12, -2.85],
      [bbCol(63), 0.36, -2.85],
      [bbCol(63), 0.36, 1.46],
      [bbCol(25), 0.36, 1.46],
      [bbCol(25), 0.36, Z_I],
      [bbCol(25), bbTop, Z_I],
    ],
    '#16a34a',
    { capStart: true, bbEnd: true }
  );
  // Relay IN2 (6.48, -4.27) -> straight down empty right end c64 -> z = 1.58 -> ESP32 GPIO27 (c26, Z_J)
  addAssembledWire(
    [
      [6.48, 0.32, -4.27],
      [bbCol(64), 0.32, -4.27],
      [bbCol(64), 0.12, -4.27],
      [bbCol(64), 0.12, -3.02],
      [bbCol(64), 0.38, -3.02],
      [bbCol(64), 0.38, 1.58],
      [bbCol(26), 0.38, 1.58],
      [bbCol(26), 0.38, Z_J],
      [bbCol(26), bbTop, Z_J],
    ],
    '#ec4899',
    { capStart: true, bbEnd: true }
  );

  // Relay 12V Outputs -> Pump (9.4, -1.2) & Solenoid (9.4, 1.6); Pump & Solenoid GND -> BB GND Rail
  addAssembledWire(
    [
      [8.43, 0.27, -4.56],
      [8.76, 0.24, -4.56],
      [8.76, 0.24, -3.82],
      [8.43, 0.27, -3.82],
    ],
    '#dc2626',
    { radius: 0.026 }
  );
  addAssembledWire(
    [
      [8.43, 0.27, -4.75],
      [9.0, 0.1, -4.75],
      [9.0, 0.1, -2.0],
      [8.45, 0.1, -2.0],
      [8.45, 0.44, -1.34],
      [8.72, 0.44, -1.34],
    ],
    '#dc2626',
    { radius: 0.028 }
  );
  addAssembledWire(
    [
      [8.43, 0.27, -4.01],
      [10.55, 0.1, -4.01],
      [10.55, 0.1, 1.4],
      [9.4, 0.56, 1.4],
    ],
    '#dc2626',
    { radius: 0.028 }
  );
  // Pump GND- (8.72, -1.06) -> Breadboard Top -GND Rail (col 66)
  addAssembledWire(
    [
      [8.72, 0.44, -1.06],
      [8.1, 0.12, -1.06],
      [8.1, 0.12, -1.98],
      [bbCol(66), 0.36, -1.98],
      [bbCol(66), bbTop, Z_TOP_GND],
    ],
    '#1f2937',
    { bbEnd: true }
  );
  // Solenoid GND- (9.07, 1.60) -> Breadboard Bottom -GND Rail (col 66)
  addAssembledWire(
    [
      [9.07, 0.56, 1.6],
      [8.1, 0.12, 1.6],
      [8.1, 0.12, 1.98],
      [bbCol(66), 0.36, 1.98],
      [bbCol(66), bbTop, Z_BOT_GND],
    ],
    '#1f2937',
    { bbEnd: true }
  );

  tagEspPart(harnessGroup, 'JUMPER');
  return { harnessGroup };
}
