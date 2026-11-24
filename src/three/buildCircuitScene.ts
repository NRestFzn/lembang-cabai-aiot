import * as THREE from 'three';
import { CircuitTourStep } from '../data/circuitTour';
import { EspPartKey } from '../data/espParts';
import { getNightFactor } from '../simulation/riskEngine';
import { SimulationMetrics } from '../types/simulation';
import { createCanvasDecal, createHardwareModulesKit, createRoundedBoxGeo, tagEspPart } from './hardwareModules';
import { createStylizedFactory } from './stylizedMaterial';


export interface Esp3DSceneController {
  scene: THREE.Scene;
  calloutAnchors: Array<{ id: string; text: string; part: EspPartKey; anchor: THREE.Vector3 }>;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    exploded: boolean,
    selectedPart: EspPartKey | null,
    tourStep?: CircuitTourStep | null
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => EspPartKey | null;
  dispose: () => void;
}

export function buildCircuitScene(): Esp3DSceneController {
  const scene = new THREE.Scene();
  const factory = createStylizedFactory();
  const geometries: THREE.BufferGeometry[] = [];
  const extraMaterials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    extraMaterials.push(m);
    return m;
  };

  // --- Studio Lighting ---
  const hemiLight = new THREE.HemisphereLight('#fffdf8', '#5e6f9e', 1.25);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff8eb', 1.7);
  sunLight.position.set(5, 8.5, 5.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 40;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 14;
  sunLight.shadow.camera.top = 8;
  sunLight.shadow.camera.bottom = -8;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight('#bfd1f7', 0.48);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  // --- Floor Shadow Catcher ---
  const shadowFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(36, 24)),
    trackMat(new THREE.ShadowMaterial({ color: '#41538f', opacity: 0.24 }))
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.02;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  // =========================================================================
  // 0. ONE GIANT HORIZONTAL SOLDERLESS BREADBOARD (69 Columns x 10 + 4 Rails)
  // =========================================================================
  const bbCols = 69;
  const bbCol = (idx: number) => -7.48 + idx * 0.22; // idx 0..68 -> -7.48 .. +7.48
  const bbW = 15.64;
  const bbD = 4.54;
  const bbTop = 0.22;

  const bbGroup = new THREE.Group();
  bbGroup.position.set(0, 0, 0);
  scene.add(bbGroup);

  const bbBodyMat = factory.createToon('#f6f3eb');
  const bbSkirtMat = factory.createToon('#e5dfd3');
  const bbTrenchMat = factory.createToon('#dad3c5');
  const bbRailRedMat = factory.createToon('#ef4444');
  const bbRailOrangeMat = factory.createToon('#f97316');
  const bbRailBlueMat = factory.createToon('#2563eb');
  const bbSocketRimMat = factory.createToon('#e2dcd0');
  const bbHoleMat = factory.createToon('#a39c90');
  const bbSocketGeo = trackGeo(new THREE.BoxGeometry(0.095, 0.016, 0.095));
  const bbSocketRimGeo = trackGeo(new THREE.BoxGeometry(0.128, 0.008, 0.128));

  // Stepped bottom mounting flange (y: 0 -> 0.05) — light tones, no heavy black outline
  const bbSkirt = new THREE.Mesh(
    trackGeo(createRoundedBoxGeo(bbW + 0.16, 0.05, bbD + 0.16, 0.09)),
    bbSkirtMat
  );
  bbSkirt.position.y = 0;
  bbSkirt.receiveShadow = true;
  bbSkirt.castShadow = true;
  bbGroup.add(bbSkirt);

  // Lower core body with recessed horizontal DIP trench floor (y: 0.04 -> 0.16)
  const bbCore = new THREE.Mesh(
    trackGeo(createRoundedBoxGeo(bbW, 0.12, bbD, 0.06)),
    bbTrenchMat
  );
  bbCore.position.y = 0.04;
  bbCore.receiveShadow = true;
  bbGroup.add(bbCore);

  // 4 horizontal raised strips (y: 0.15 -> 0.22) forming soft grey-white DIP trench & rail grooves
  [
    { z: -1.87, d: 0.56 }, // Top Power Rail (-GND, +5V)
    { z: -0.88, d: 1.1 },  // Upper terminal strip (a..e)
    { z: 0.88, d: 1.1 },   // Lower terminal strip (f..j)
    { z: 1.87, d: 0.56 },  // Bottom Power Rail (+3V3, -GND)
  ].forEach(({ z, d }) => {
    const strip = new THREE.Mesh(
      trackGeo(createRoundedBoxGeo(bbW - 0.14, 0.07, d, 0.04)),
      bbBodyMat
    );
    strip.position.set(0, 0.15, z);
    strip.receiveShadow = true;
    strip.castShadow = true;
    bbGroup.add(strip);
  });

  // Crisp 3D horizontal rail stripes along the full breadboard width
  const railStripeGeo = trackGeo(new THREE.BoxGeometry(bbW - 0.44, 0.008, 0.036));
  [
    { z: -2.1, mat: bbRailBlueMat },    // Top -GND
    { z: -1.64, mat: bbRailRedMat },    // Top +5V
    { z: 1.64, mat: bbRailOrangeMat },  // Bottom +3V3
    { z: 2.1, mat: bbRailBlueMat },     // Bottom -GND
  ].forEach(({ z, mat }) => {
    const s = new THREE.Mesh(railStripeGeo, mat);
    s.position.set(0, bbTop + 0.003, z);
    bbGroup.add(s);
  });

  // Top silkscreen: +, -, 5V, 3V3, GND, row letters a..j, column numbers
  const bbTex = createCanvasDecal(1536, 460, (ctx) => {
    const toPx = (lx: number) => ((lx + bbW / 2) / bbW) * 1536;
    const toPy = (lz: number) => ((lz + bbD / 2) / bbD) * 460;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('GND -', toPx(-7.62) + 28, toPy(-1.98));
    ctx.fillText('- GND', toPx(7.62) - 28, toPy(-1.98));
    ctx.fillText('GND -', toPx(-7.62) + 28, toPy(1.98));
    ctx.fillText('- GND', toPx(7.62) - 28, toPy(1.98));

    ctx.fillStyle = '#ef4444';
    ctx.fillText('5V +', toPx(-7.62) + 26, toPy(-1.76));
    ctx.fillText('+ 5V', toPx(7.62) - 26, toPy(-1.76));

    ctx.fillStyle = '#ea580c';
    ctx.fillText('3V3 +', toPx(-7.62) + 28, toPy(1.76));
    ctx.fillText('+ 3V3', toPx(7.62) - 28, toPy(1.76));

    ctx.fillStyle = '#5c5549';
    ctx.font = 'bold 13px ui-monospace, monospace';
    [
      { lbl: 'a', z: -1.32 },
      { lbl: 'b', z: -1.1 },
      { lbl: 'c', z: -0.88 },
      { lbl: 'd', z: -0.66 },
      { lbl: 'e', z: -0.44 },
      { lbl: 'f', z: 0.44 },
      { lbl: 'g', z: 0.66 },
      { lbl: 'h', z: 0.88 },
      { lbl: 'i', z: 1.1 },
      { lbl: 'j', z: 1.32 },
    ].forEach(({ lbl, z }) => {
      ctx.fillText(lbl, 18, toPy(z));
      ctx.fillText(lbl, 1518, toPy(z));
    });

    [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65].forEach((cNum) => {
      const px = toPx(bbCol(cNum - 1));
      ctx.fillText(String(cNum), px, toPy(-1.49));
      ctx.fillText(String(cNum), px, toPy(1.49));
    });
  });
  textures.push(bbTex);
  const bbDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(bbW - 0.04, bbD - 0.04)),
    trackMat(new THREE.MeshBasicMaterial({ map: bbTex, transparent: true }))
  );
  bbDecal.rotation.x = -Math.PI / 2;
  bbDecal.position.y = bbTop + 0.004;
  bbGroup.add(bbDecal);

  // Instanced tie-point socket rims + dark wells across all 69 columns & 4 continuous rails
  const holeCoords: Array<[number, number]> = [];
  for (let c = 0; c < bbCols; c++) {
    const px = bbCol(c);
    [-1.32, -1.1, -0.88, -0.66, -0.44, 0.44, 0.66, 0.88, 1.1, 1.32].forEach((pz) => {
      holeCoords.push([px, pz]);
    });
    if (c >= 2 && c <= bbCols - 3) {
      [-1.98, -1.76, 1.76, 1.98].forEach((rz) => {
        holeCoords.push([px, rz]);
      });
    }
  }
  const bbRimInst = new THREE.InstancedMesh(bbSocketRimGeo, bbSocketRimMat, holeCoords.length);
  const bbHoleInst = new THREE.InstancedMesh(bbSocketGeo, bbHoleMat, holeCoords.length);
  const bbDummy = new THREE.Object3D();
  holeCoords.forEach(([hx, hz], idx) => {
    bbDummy.position.set(hx, bbTop + 0.002, hz);
    bbDummy.updateMatrix();
    bbRimInst.setMatrixAt(idx, bbDummy.matrix);

    bbDummy.position.set(hx, bbTop + 0.006, hz);
    bbDummy.updateMatrix();
    bbHoleInst.setMatrixAt(idx, bbDummy.matrix);
  });
  bbRimInst.instanceMatrix.needsUpdate = true;
  bbHoleInst.instanceMatrix.needsUpdate = true;
  bbHoleInst.name = 'MEGA_BREADBOARD';
  bbGroup.add(bbRimInst, bbHoleInst);


  // =========================================================================
  // 1-9I. MODULAR 3D HARDWARE KIT (SHARED WITH PHYSICAL UNIT VIEW)
  // =========================================================================
  const {
    modules: {
      espGroup,
      lmGroup,
      trGroup,
      ledBoardGroup,
      bmeGroup,
      soilGroup,
      dsGroup,
      sdGroup,
      camGroup,
      relayGroup,
      pumpGroup,
      solGroup,
      solarGroup,
      mpptGroup,
      batGroup,
    },
    materials: { icDarkMat, ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
  } = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });

  espGroup.position.set(bbCol(24), 0.14, 0);
  espGroup.rotation.y = Math.PI / 2;
  lmGroup.position.set(2.4, 0, -4.2);
  trGroup.position.set(1.8, 0, 4.2);
  ledBoardGroup.position.set(5.8, 0, 4.3);
  bmeGroup.position.set(-5.61, 0.14, -0.14);
  bmeGroup.rotation.y = Math.PI / 2;
  soilGroup.position.set(-6.2, 0, 4.0);
  dsGroup.position.set(-2.0, 0, 4.1);
  sdGroup.position.set(bbCol(56) + 0.11, 0.14, 0.02);
  sdGroup.rotation.y = -Math.PI / 2;
  camGroup.position.set(bbCol(47) + 0.11, 0.14, 0);
  camGroup.rotation.y = Math.PI / 2;
  relayGroup.position.set(7.4, 0, -4.2);
  pumpGroup.position.set(9.4, 0, -1.2);
  solGroup.position.set(9.4, 0, 1.6);
  solarGroup.position.set(-10.0, 0, -4.2);
  mpptGroup.position.set(-6.2, 0, -4.2);
  batGroup.position.set(-1.8, 0, -4.2);
  scene.add(espGroup, lmGroup, trGroup, ledBoardGroup, bmeGroup, soilGroup, dsGroup, sdGroup, camGroup, relayGroup, pumpGroup, solGroup, solarGroup, mpptGroup, batGroup);

  const pcbTop = 0.365;
  const lmTop = 0.145;
  const trTop = 0.145;
  const lbTop = 0.145;
  const bmeTop = 0.135;
  const soilTop = 0.13;
  const dsTop = 0.135;
  const sdTop = 0.14;
  const camTop = 0.305;
  const rlyTop = 0.165;
  const pvTop = 0.19;
  const mpptTop = 0.145;

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
    if (Math.abs(c1 - c2) === 0 || Math.abs(z1 - z2) < 0.01) {
      addAssembledWire(
        [
          [x1, bbTop, z1],
          [x1, yPlane, z1],
          [x2, yPlane, z2],
          [x2, bbTop, z2],
        ],
        colorHex,
        { bbStart: true, bbEnd: true }
      );
    } else {
      addAssembledWire(
        [
          [x1, bbTop, z1],
          [x1, yPlane, z1],
          [x2, yPlane, z1],
          [x2, yPlane, z2],
          [x2, bbTop, z2],
        ],
        colorHex,
        { bbStart: true, bbEnd: true }
      );
    }
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

  // --- C. On-Board Breadboard Jumpers (ESP32, BME280, ESP32-CAM, MicroSD) ---
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

  // ESP32-CAM (c44..c51): 5V (c44 Bot) -> via open gap c42 (outside CAM PCB!) -> Top +5V Rail (c42)
  addAssembledWire(
    [
      [bbCol(44), bbTop, Z_I],
      [bbCol(44), 0.36, Z_I],
      [bbCol(42), 0.36, Z_I],
      [bbCol(42), 0.36, Z_TOP_5V],
      [bbCol(42), bbTop, Z_TOP_5V],
    ],
    '#dc2626',
    { bbStart: true, bbEnd: true }
  );
  // ESP32-CAM GND (c45 Bot) -> Bot -GND Rail (c45)
  addBBJumper(45, Z_I, 45, Z_BOT_GND, '#1f2937', 0.35);
  // ESP32-CAM U0R (c49) -> ESP32 GPIO17 (c25) along Z_A; U0T (c50) -> ESP32 GPIO16 (c26) along Z_B
  addBBJumper(49, Z_A, 25, Z_A, '#06b6d4', 0.35);
  addBBJumper(50, Z_B, 26, Z_B, '#a855f7', 0.35);

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

  // ESP32 GPIO2 (c28, Z_B) -> z = -1.20 (y = 0.48) -> wide-spaced gap c41 -> Transistor (1.8, 4.2)
  addAssembledWire(
    [
      [bbCol(28), bbTop, Z_B],
      [bbCol(28), 0.48, Z_B],
      [bbCol(28), 0.48, -1.2],
      [bbCol(41), 0.48, -1.2],
      [bbCol(41), 0.48, 2.5],
      [bbCol(41), 0.1, 2.5],
      [bbCol(41), 0.1, 5.12],
      [1.8, 0.1, 5.12],
      [1.8, 0.32, 4.78],
    ],
    '#22c55e',
    { bbStart: true, capEnd: true }
  );
  addAssembledWire(
    [
      [1.94, 0.32, 4.78],
      [1.94, 0.1, 5.32],
      [5.8, 0.1, 5.32],
      [5.8, 0.2, 5.42],
    ],
    '#22c55e',
    { capStart: true }
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

  // =========================================================================
  // 10. CALLOUT ANCHORS & UPDATE / PICKING
  // =========================================================================
  const calloutAnchors: Esp3DSceneController['calloutAnchors'] = [
    { id: 'c-pv', text: 'PANEL SURYA 6V 10W', part: 'SOLAR', anchor: new THREE.Vector3(-7.65, pvTop + 0.32, -1.45) },
    { id: 'c-mppt', text: 'CN3791 MPPT CHARGER', part: 'MPPT', anchor: new THREE.Vector3(-7.65, mpptTop + 0.42, 0.55) },
    { id: 'c-bat', text: 'BATERAI LiFePO4 6000mAh', part: 'BATTERY', anchor: new THREE.Vector3(-7.65, 0.92, 2.25) },
    { id: 'c-bme', text: 'BME280 KANOPI', part: 'BME280', anchor: new THREE.Vector3(-4.65, bmeTop + 0.3, -1.55) },
    { id: 'c-soil', text: 'SOIL MOISTURE v1.2', part: 'SOIL_MOISTURE', anchor: new THREE.Vector3(-4.85, soilTop + 0.3, 0.05) },
    { id: 'c-ds', text: 'DS18B20 SOIL TEMP', part: 'DS18B20', anchor: new THREE.Vector3(-4.45, dsTop + 0.32, 1.55) },
    { id: 'c-wifi', text: 'ESP32-WROOM-32', part: 'U1', anchor: new THREE.Vector3(-2.35, pcbTop + 0.32, -0.98) },
    { id: 'c-uart', text: 'USB-C', part: 'J1', anchor: new THREE.Vector3(-2.35, pcbTop + 0.22, 1.9) },
    { id: 'c-lm', text: 'LM2596 REGULATOR', part: 'LM2596', anchor: new THREE.Vector3(0.55, lmTop + 0.5, -1.35) },
    { id: 'c-tr', text: 'TRANSISTOR + FLYBACK', part: 'TRANSISTOR', anchor: new THREE.Vector3(0.55, trTop + 0.45, 0.7) },
    { id: 'c-sd', text: 'MICROSD LOGGER SPI', part: 'MICROSD', anchor: new THREE.Vector3(0.55, sdTop + 0.4, 2.45) },
    { id: 'c-cam', text: 'ESP32-CAM OV2640', part: 'ESP32CAM', anchor: new THREE.Vector3(3.15, camTop + 0.55, -1.75) },
    { id: 'c-res', text: 'LED + RESISTOR', part: 'RESISTOR', anchor: new THREE.Vector3(3.15, lbTop + 0.36, 0.85) },
    { id: 'c-led', text: 'STATUS LED D1', part: 'LED', anchor: new THREE.Vector3(3.15, lbTop + 0.56, 0.25) },
    { id: 'c-jmp', text: 'KABEL JUMPER DUPONT', part: 'JUMPER', anchor: new THREE.Vector3(3.15, 0.35, 2.95) },
    { id: 'c-rly', text: 'RELAY 2-CHANNEL 5V', part: 'RELAY', anchor: new THREE.Vector3(5.85, rlyTop + 0.65, -1.45) },
    { id: 'c-pmp', text: 'POMPA 12V DIAPHRAGM', part: 'PUMP', anchor: new THREE.Vector3(5.85, 0.95, 0.55) },
    { id: 'c-vlv', text: 'SOLENOID VALVE 12V', part: 'SOLENOID', anchor: new THREE.Vector3(5.85, 1.15, 2.35) },
  ];

  // =========================================================================
  // 11. GUIDED TOUR VISUALS (RECTANGULAR HUD CORNER BRACKETS & FLOW ORBS)
  // =========================================================================
  const tourOverlayGroup = new THREE.Group();
  scene.add(tourOverlayGroup);

  const bracketMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.94,
    })
  );
  const edgeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.34,
    })
  );
  const unitBarGeo = trackGeo(new THREE.BoxGeometry(1, 0.022, 1));
  const focusFrameHolder = new THREE.Group();
  focusFrameHolder.visible = false;
  tourOverlayGroup.add(focusFrameHolder);

  const cornerMeshes: Array<{
    sx: number;
    sz: number;
    hBar: THREE.Mesh;
    vBar: THREE.Mesh;
  }> = [];
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const hBar = new THREE.Mesh(unitBarGeo, bracketMat);
      const vBar = new THREE.Mesh(unitBarGeo, bracketMat);
      focusFrameHolder.add(hBar, vBar);
      cornerMeshes.push({ sx, sz, hBar, vBar });
    });
  });

  const edgeTop = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeBot = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeLeft = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeRight = new THREE.Mesh(unitBarGeo, edgeMat);
  focusFrameHolder.add(edgeTop, edgeBot, edgeLeft, edgeRight);

  const orbCoreGeo = trackGeo(new THREE.SphereGeometry(0.068, 12, 12));
  const orbHaloGeo = trackGeo(new THREE.SphereGeometry(0.115, 12, 12));
  const orbCoreMat = trackMat(new THREE.MeshBasicMaterial({ color: '#fef08a' }));
  const orbHaloMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.42 })
  );

  const MAX_FLOW_ORBS = 8;
  const flowOrbPool = Array.from({ length: MAX_FLOW_ORBS }, () => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(orbCoreGeo, orbCoreMat), new THREE.Mesh(orbHaloGeo, orbHaloMat));
    grp.visible = false;
    tourOverlayGroup.add(grp);
    return grp;
  });

  const cachedCurves = new Map<string, THREE.CurvePath<THREE.Vector3>[]>();
  const curRingPos = new THREE.Vector3(0, 0.25, 0);
  let curFrameW = 2.0;
  let curFrameD = 2.0;
  let ringInitialized = false;

  let explodeLerp = 0;

  const update: Esp3DSceneController['update'] = (
    dt,
    elapsed,
    metrics,
    exploded,
    _selectedPart,
    tourStep = null
  ) => {
    const nightFactor = getNightFactor(metrics.timeHours);
    const isNight = nightFactor > 0.52;

    hemiLight.intensity = isNight ? 1.0 : 1.25;
    sunLight.intensity = isNight ? 1.2 : 1.7;

    // LED status color synced with simulation (or highlighted actuator tour step)
    const demoActuators = tourStep?.id === 'actuators';
    if (metrics.isWatering || demoActuators) {
      ledMat.color.set('#4ade80');
      greenLedMat.color.set('#4ade80');
      relayLedMat.color.set('#4ade80');
      solenoidLedMat.color.set('#38bdf8');
      pumpRotorGroup.rotation.y += dt * 10;
    } else if (metrics.patekRiskPct >= 65) {
      ledMat.color.set('#f59e0b');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    } else {
      ledMat.color.set('#ef4444');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    }

    camFlashMat.color.set(
      metrics.patekRiskPct >= 65 || tourStep?.id === 'cam' ? '#fef9c3' : '#9ca3af'
    );

    // Guided Tour Rectangular HUD Focus Frame & Wire Flow Pulses
    if (tourStep) {
      const targetPos = new THREE.Vector3(...tourStep.ringPos);
      const [tgtW, tgtD] = tourStep.frameSize;
      if (!ringInitialized) {
        curRingPos.copy(targetPos);
        curFrameW = tgtW;
        curFrameD = tgtD;
        ringInitialized = true;
      } else {
        const k = Math.min(1, dt * 6.5);
        curRingPos.lerp(targetPos, k);
        curFrameW += (tgtW - curFrameW) * k;
        curFrameD += (tgtD - curFrameD) * k;
      }

      const showFrame = tgtW > 0.1 && tgtD > 0.1 && curFrameW > 0.15;
      focusFrameHolder.visible = showFrame;
      if (showFrame) {
        focusFrameHolder.position.copy(curRingPos);
        const pad = (Math.sin(elapsed * 4.2) * 0.5 + 0.5) * 0.08;
        const w = curFrameW + pad * 2;
        const d = curFrameD + pad * 2;
        const hw = w / 2;
        const hd = d / 2;
        const arm = Math.min(0.48, Math.min(w, d) * 0.34);
        const thick = 0.085;

        cornerMeshes.forEach(({ sx, sz, hBar, vBar }) => {
          hBar.scale.set(arm, 1, thick);
          hBar.position.set(sx * (hw - arm / 2), 0.008, sz * (hd - thick / 2));
          vBar.scale.set(thick, 1, arm);
          vBar.position.set(sx * (hw - thick / 2), 0.008, sz * (hd - arm / 2));
        });

        edgeTop.scale.set(w, 0.7, 0.032);
        edgeTop.position.set(0, 0, -hd + 0.016);
        edgeBot.scale.set(w, 0.7, 0.032);
        edgeBot.position.set(0, 0, hd - 0.016);
        edgeLeft.scale.set(0.032, 0.7, d);
        edgeLeft.position.set(-hw + 0.016, 0, 0);
        edgeRight.scale.set(0.032, 0.7, d);
        edgeRight.position.set(hw - 0.016, 0, 0);

        bracketMat.color.set(tourStep.accentColor);
        edgeMat.color.set(tourStep.accentColor);
        edgeMat.opacity = 0.25 + (Math.sin(elapsed * 4.2) * 0.5 + 0.5) * 0.25;
      }
      orbHaloMat.color.set(tourStep.accentColor);

      let curves = cachedCurves.get(tourStep.id);
      if (!curves) {
        curves = tourStep.flowPaths.map((pts) => {
          const path = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 0; i < pts.length - 1; i++) {
            path.add(
              new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1]))
            );
          }
          return path;
        });
        cachedCurves.set(tourStep.id, curves);
      }

      let orbIdx = 0;
      const orbsPerPath = curves.length > 1 ? 3 : 4;
      curves.forEach((curve, pathIdx) => {
        for (let j = 0; j < orbsPerPath && orbIdx < MAX_FLOW_ORBS; j++) {
          const rawT = (elapsed * 0.55 + j / orbsPerPath + pathIdx * 0.17) % 1;
          const safeT = Math.min(0.9999, Math.max(0, (rawT + 1) % 1));
          const pt = curve.getPointAt(safeT);
          if (!pt) continue;
          const orb = flowOrbPool[orbIdx++];
          orb.position.copy(pt);
          const s = 0.85 + Math.sin(elapsed * 7 + j) * 0.18;
          orb.scale.setScalar(s);
          orb.visible = true;
        }
      });
      for (let k = orbIdx; k < MAX_FLOW_ORBS; k++) {
        flowOrbPool[k].visible = false;
      }
    } else {
      focusFrameHolder.visible = false;
      ringInitialized = false;
      flowOrbPool.forEach((orb) => {
        orb.visible = false;
      });
    }

    // Smooth exploded animation
    const targetExp = exploded ? 1 : 0;
    explodeLerp += (targetExp - explodeLerp) * Math.min(1, dt * 8);

    explodables.forEach((item) => {
      item.group.position.y = item.baseY + item.liftY * explodeLerp;
      item.guideLine.visible = explodeLerp > 0.04;
    });
  };

  const pickPart: Esp3DSceneController['pickPart'] = (raycaster) => {
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const h of hits) {
      let curr: THREE.Object3D | null = h.object;
      while (curr) {
        if (curr.userData.espPart) {
          return curr.userData.espPart as EspPartKey;
        }
        curr = curr.parent;
      }
    }
    return null;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    extraMaterials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    factory.dispose();
  };

  return {
    scene,
    calloutAnchors,
    update,
    pickPart,
    dispose,
  };
}
