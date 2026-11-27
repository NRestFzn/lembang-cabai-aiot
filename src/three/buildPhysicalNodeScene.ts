import * as THREE from 'three';
import { EspPartKey } from '../data/espParts';
import { getNightFactor } from '../simulation/riskEngine';
import { SimulationMetrics } from '../types/simulation';
import {
  createCanvasDecal,
  createHardwareModulesKit,
  createRoundedBoxGeo,
  tagEspPart,
} from './hardwareModules';
import { createStylizedFactory } from './stylizedMaterial';

export interface PhysicalNodeSceneController {
  scene: THREE.Scene;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    explodeTarget: number
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => EspPartKey | null;
  dispose: () => void;
}

interface ExplodeMoveItem {
  obj: THREE.Object3D;
  basePos: THREE.Vector3;
  offset: THREE.Vector3;
  baseRot?: THREE.Euler;
  rotOffset?: THREE.Euler;
  guideLine?: THREE.Line;
}

export function buildPhysicalNodeScene(): PhysicalNodeSceneController {
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
  const hemiLight = new THREE.HemisphereLight('#fffdf8', '#5e6f9e', 1.28);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff8eb', 1.65);
  sunLight.position.set(5.5, 9.5, 6.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 32;
  sunLight.shadow.camera.left = -8;
  sunLight.shadow.camera.right = 8;
  sunLight.shadow.camera.top = 8;
  sunLight.shadow.camera.bottom = -4;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight('#c5d7fb', 0.55);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  // --- Floor Shadow Catcher + Studio Pedestal (No Soil / No Plants) ---
  const shadowFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(24, 18)),
    trackMat(new THREE.ShadowMaterial({ color: '#41538f', opacity: 0.22 }))
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = 0;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  const plinthMat = factory.createToon('#e5dfd3');
  const aluMat = factory.createToon('#cbd5e1');
  const darkMetalMat = factory.createToon('#334155');
  const ip65BodyMat = factory.createToon('#ece7dc');
  const ip65DoorMat = factory.createToon('#f5f2eb');
  const gasketMat = factory.createToon('#1e293b');
  const shieldWhiteMat = factory.createToon('#f4f1ea');
  const acrylicPlateMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#93c5fd', transparent: true, opacity: 0.45 })
  );
  const smokedWindowMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#1e293b', transparent: true, opacity: 0.34 })
  );
  const pipeBlueMat = factory.createToon('#38bdf8');

  // Clean studio mounting base (no soil/terrain)
  const studioBase = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(7.6, 0.08, 3.8, 0.14)),
    plinthMat,
    1.015
  );
  studioBase.position.set(0.85, 0.0, 0.10);
  scene.add(studioBase);

  // --- Hardware Modules Kit (reused from Prototype Workbench!) ---
  const {
    modules: {
      espGroup,
      lmGroup,
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
    materials: { ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
  } = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });

  // Explode registry for physical housing & internal layers
  const explodeItems: ExplodeMoveItem[] = [];
  const registerMove = (
    obj: THREE.Object3D,
    offset: [number, number, number],
    withGuide = true,
    rotOffset?: [number, number, number]
  ) => {
    const basePos = obj.position.clone();
    const offVec = new THREE.Vector3(...offset);
    let guideLine: THREE.Line | undefined;

    if (withGuide && obj.parent && offVec.lengthSq() > 0.001) {
      const lineGeo = trackGeo(
        new THREE.BufferGeometry().setFromPoints([
          basePos.clone(),
          basePos.clone().add(offVec),
        ])
      );
      const lineMat = trackMat(
        new THREE.LineDashedMaterial({
          color: '#231e16',
          dashSize: 0.07,
          gapSize: 0.05,
          transparent: true,
          opacity: 0.45,
        })
      );
      guideLine = new THREE.Line(lineGeo, lineMat);
      guideLine.computeLineDistances();
      guideLine.visible = false;
      obj.parent.add(guideLine);
    }

    explodeItems.push({
      obj,
      basePos,
      offset: offVec,
      baseRot: obj.rotation.clone(),
      rotOffset: rotOffset ? new THREE.Euler(...rotOffset) : undefined,
      guideLine,
    });
  };

  // =========================================================================
  // 1. ALUMINUM POLE / MAST STAND
  // =========================================================================
  const mastX = -1.15;
  const mastZ = -0.52;

  const mastFlange = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.62, 0.09, 0.62, 0.06)),
    darkMetalMat,
    1.03
  );
  mastFlange.position.set(mastX, 0.08, mastZ);
  scene.add(mastFlange);

  const mastPole = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 4.82, 16)),
    aluMat,
    1.03
  );
  mastPole.position.set(mastX, 2.52, mastZ);
  scene.add(mastPole);

  // =========================================================================
  // 2. TOP SOLAR PANEL BRACKET + REAL SOLAR 3D MODULE
  // =========================================================================
  const solarBracket = new THREE.Group();
  solarBracket.position.set(mastX, 4.98, mastZ);
  solarBracket.rotation.x = 0.28;
  scene.add(solarBracket);

  const uMount = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.54, 0.12, 0.42, 0.04)),
    darkMetalMat,
    1.04
  );
  uMount.position.y = -0.06;
  solarBracket.add(uMount);

  solarGroup.position.set(0, 0.05, 0);
  solarGroup.scale.setScalar(0.95);
  solarBracket.add(solarGroup);
  registerMove(solarGroup, [0, 0.68, 0], true);

  // =========================================================================
  // 3. WEATHERPROOF IP65 CONTROL ENCLOSURE + REAL INTERNAL ELECTRONICS STACK
  // =========================================================================
  const boxCenter = new THREE.Group();
  boxCenter.position.set(mastX, 2.48, 0.06);
  scene.add(boxCenter);

  // Pole mounting clamps holding enclosure behind backplate
  [-1.02, 1.02].forEach((cy) => {
    const clamp = factory.createOutlinedMesh(
      trackGeo(createRoundedBoxGeo(0.42, 0.14, 0.34, 0.03)),
      darkMetalMat,
      1.04
    );
    clamp.position.set(0, cy, -0.5);
    boxCenter.add(clamp);
  });

  const boxW = 3.06;
  const boxH = 3.1;
  const wallT = 0.08;
  const cavD = 0.72;

  const backPlateShell = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(boxW, boxH, wallT)),
    ip65BodyMat,
    1.02
  );
  backPlateShell.position.z = -cavD / 2;
  boxCenter.add(backPlateShell);

  const boreHoleMat = trackMat(new THREE.MeshBasicMaterial({ color: '#141210' }));
  const createHollowGland = (radius = 0.115, boreR = 0.082) => {
    const grp = new THREE.Group();
    const outer = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(radius, radius, 0.15, 14, 1, true)),
      darkMetalMat,
      1.05
    );
    const inner = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(boreR, boreR, 0.16, 14)),
      boreHoleMat
    );
    const lip = factory.createOutlinedMesh(
      trackGeo(new THREE.TorusGeometry((radius + boreR) * 0.5, 0.026, 8, 16)),
      darkMetalMat,
      1.05
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.06;
    grp.add(outer, inner, lip);
    return grp;
  };

  // Left wall solid; Right wall split around hollow side gland (y = +0.62) for ESP32-CAM cable!
  const leftWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(wallT, boxH, cavD)),
    ip65BodyMat,
    1.025
  );
  leftWall.position.set(-boxW / 2 + wallT / 2, 0, 0);
  boxCenter.add(leftWall);

  const camGlandY = 0.62;
  const camGapH = 0.22;
  const botRightH = camGlandY - camGapH / 2 - (-boxH / 2);
  const topRightH = boxH / 2 - (camGlandY + camGapH / 2);
  const rightBotWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(wallT, botRightH, cavD)),
    ip65BodyMat,
    1.025
  );
  rightBotWall.position.set(boxW / 2 - wallT / 2, -boxH / 2 + botRightH / 2, 0);
  const rightTopWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(wallT, topRightH, cavD)),
    ip65BodyMat,
    1.025
  );
  rightTopWall.position.set(boxW / 2 - wallT / 2, boxH / 2 - topRightH / 2, 0);
  boxCenter.add(rightBotWall, rightTopWall);

  const camSideGland = createHollowGland(0.11, 0.078);
  camSideGland.rotation.z = -Math.PI / 2;
  camSideGland.position.set(boxW / 2 + 0.04, camGlandY, 0.02);
  boxCenter.add(camSideGland);

  // Bottom wall split into 5 segments leaving 4 actual open pass-through gland holes!
  const botGlandXs = [-0.96, -0.32, 0.32, 0.96];
  const botGapW = 0.2;
  const botBounds: Array<[number, number]> = [
    [-boxW / 2, botGlandXs[0] - botGapW / 2],
    [botGlandXs[0] + botGapW / 2, botGlandXs[1] - botGapW / 2],
    [botGlandXs[1] + botGapW / 2, botGlandXs[2] - botGapW / 2],
    [botGlandXs[2] + botGapW / 2, botGlandXs[3] - botGapW / 2],
    [botGlandXs[3] + botGapW / 2, boxW / 2],
  ];
  botBounds.forEach(([x0, x1]) => {
    const segW = x1 - x0;
    const seg = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(segW, wallT, cavD)),
      ip65BodyMat,
      1.025
    );
    seg.position.set((x0 + x1) / 2, -boxH / 2 + wallT / 2, 0);
    boxCenter.add(seg);
  });

  // Top wall split cleanly around Top Cable Gland pass-through hole at x = -0.82 (above CN3791 MPPT!)
  const glandHoleX = -0.82;
  const glandGapW = 0.24;
  const leftTopW = glandHoleX - glandGapW / 2 - (-boxW / 2);
  const rightTopW = boxW / 2 - (glandHoleX + glandGapW / 2);
  const topLeftWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(leftTopW, wallT, cavD)),
    ip65BodyMat,
    1.025
  );
  topLeftWall.position.set(-boxW / 2 + leftTopW / 2, boxH / 2 - wallT / 2, 0);
  const topRightWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(rightTopW, wallT, cavD)),
    ip65BodyMat,
    1.025
  );
  topRightWall.position.set(boxW / 2 - rightTopW / 2, boxH / 2 - wallT / 2, 0);
  boxCenter.add(topLeftWall, topRightWall);

  // Open hollow Top M16 Cable Gland Collar (actual visible open hole for PV+ / PV- entry!)
  const topGlandGroup = createHollowGland(0.145, 0.11);
  topGlandGroup.position.set(glandHoleX, boxH / 2 + 0.04, -0.02);
  boxCenter.add(topGlandGroup);

  // Dark rubber waterproof perimeter gasket around front lip
  const gasketRing = new THREE.Group();
  gasketRing.position.z = cavD / 2 + 0.005;
  boxCenter.add(gasketRing);
  const gTopBotGeo = trackGeo(new THREE.BoxGeometry(boxW - 0.04, 0.045, 0.025));
  const gSideGeo = trackGeo(new THREE.BoxGeometry(0.045, boxH - 0.04, 0.025));
  [boxH / 2 - 0.04, -boxH / 2 + 0.04].forEach((gy) => {
    const g = new THREE.Mesh(gTopBotGeo, gasketMat);
    g.position.y = gy;
    gasketRing.add(g);
  });
  [-boxW / 2 + 0.04, boxW / 2 - 0.04].forEach((gx) => {
    const g = new THREE.Mesh(gSideGeo, gasketMat);
    g.position.x = gx;
    gasketRing.add(g);
  });

  // 4 Open Hollow Bottom Waterproof M16 Cable Glands
  botGlandXs.forEach((gx) => {
    const gland = createHollowGland(0.105, 0.075);
    gland.rotation.x = Math.PI;
    gland.position.set(gx, -boxH / 2 - 0.04, 0.08);
    boxCenter.add(gland);
  });

  // Internal Translucent Acrylic DIN Backplate (pulls forward slightly on disassemble)
  const backplateGroup = new THREE.Group();
  backplateGroup.position.set(0, 0, -cavD / 2 + 0.12);
  boxCenter.add(backplateGroup);

  const dinPlate = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(boxW - 0.24, boxH - 0.24, 0.045)),
    acrylicPlateMat,
    1.015
  );
  backplateGroup.add(dinPlate);
  registerMove(backplateGroup, [0, 0, 0.65], true);

  // Mount ALL real 3D internal hardware modules onto boxCenter with clean zero-overlap spacing
  const mountBoard = (
    mod: THREE.Group,
    x: number,
    y: number,
    z: number,
    scale: number,
    explodeOffset: [number, number, number],
    rotZ = 0
  ) => {
    mod.position.set(x, y, z);
    mod.rotation.set(Math.PI / 2, 0, rotZ);
    mod.scale.setScalar(scale);
    boxCenter.add(mod);
    registerMove(mod, explodeOffset, true);
  };

  // Top row: CN3791 MPPT (left) & 12.8V 4S LiFePO4 Pack (right)
  mountBoard(mpptGroup, -0.78, 1.08, -0.14, 0.38, [-0.16, 0.14, 1.15]);
  mountBoard(batGroup, 0.62, 1.1, -0.14, 0.42, [0.16, 0.14, 1.15]);

  // Middle row: LM2596 5.00V (left) & Hero ESP32-DevKit (right, centered cleanly between Battery & Relay)
  mountBoard(lmGroup, -0.78, 0.18, -0.14, 0.37, [-0.18, 0.0, 1.42]);
  mountBoard(espGroup, 0.64, 0.12, -0.14, 0.32, [0.18, 0.0, 1.56]);

  // Bottom row: MicroSD (left) & 2CH Relay (right) cleanly spaced
  mountBoard(sdGroup, -0.68, -1.04, -0.14, 0.36, [-0.20, -0.14, 1.25], 0);
  mountBoard(relayGroup, 0.68, -1.02, -0.14, 0.36, [0.20, -0.14, 1.32]);

  // Clean Internal Harness Lines connecting DIN modules inside Box
  const internalWireMatRed = factory.createToon('#dc2626');
  const internalWireMatBlk = factory.createToon('#1f2937');
  const internalWireMatOrn = factory.createToon('#f97316');
  const addBoxWire = (pts: [number, number, number][], mat: THREE.Material) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 16, 0.018, 6, false)),
      mat
    );
    backplateGroup.add(mesh);
  };
  addBoxWire([[-0.48, 1.12, 0.08], [0.24, 1.12, 0.08]], internalWireMatRed);
  addBoxWire([[-0.48, 1.0, 0.06], [0.24, 1.0, 0.06]], internalWireMatBlk);
  addBoxWire([[0.24, 0.96, 0.08], [-0.95, 0.22, 0.08]], internalWireMatRed);
  addBoxWire([[-0.42, 0.14, 0.08], [0.62, -0.5, 0.08]], internalWireMatRed);
  addBoxWire([[0.62, -0.5, 0.08], [0.76, -0.78, 0.08]], internalWireMatOrn);

  // Detachable Front Polycarbonate Enclosure Door (swings forward-left cleanly when exploded!)
  const frontDoor = new THREE.Group();
  frontDoor.position.set(0, 0, cavD / 2 + 0.055);
  boxCenter.add(frontDoor);

  const frameTopBot = trackGeo(new THREE.BoxGeometry(boxW, 0.34, 0.06));
  const frameSides = trackGeo(new THREE.BoxGeometry(0.28, boxH - 0.68, 0.06));
  [boxH / 2 - 0.17, -boxH / 2 + 0.17].forEach((fy) => {
    const f = factory.createOutlinedMesh(frameTopBot, ip65DoorMat, 1.02);
    f.position.y = fy;
    frontDoor.add(f);
  });
  [-boxW / 2 + 0.14, boxW / 2 - 0.14].forEach((fx) => {
    const f = factory.createOutlinedMesh(frameSides, ip65DoorMat, 1.02);
    f.position.x = fx;
    frontDoor.add(f);
  });

  const doorWindow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(boxW - 0.56, boxH - 0.68, 0.03)),
    smokedWindowMat
  );
  frontDoor.add(doorWindow);

  const doorTex = createCanvasDecal(512, 96, (c) => {
    c.fillStyle = '#231e16';
    c.font = 'bold 34px ui-monospace, monospace';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText('SENTINEL AIoT · IP65', 24, 48);
  });
  textures.push(doorTex);
  const doorBadge = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(boxW - 0.4, 0.26)),
    trackMat(new THREE.MeshBasicMaterial({ map: doorTex, transparent: true }))
  );
  doorBadge.position.set(0, boxH / 2 - 0.16, 0.036);
  frontDoor.add(doorBadge);

  const doorStatLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.042, 10, 10)), ledMat);
  doorStatLed.position.set(boxW / 2 - 0.26, boxH / 2 - 0.16, 0.04);
  frontDoor.add(doorStatLed);

  const doorPwrLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.042, 10, 10)), greenLedMat);
  doorPwrLed.position.set(boxW / 2 - 0.4, boxH / 2 - 0.16, 0.04);
  frontDoor.add(doorPwrLed);

  tagEspPart(frontDoor, 'U1');
  registerMove(frontDoor, [-1.75, 0.0, 2.3], true, [0, 0.36, 0]);

  // =========================================================================
  // 4. ESP32-CAM WEATHERPROOF VISOR ARM (CLEAN SIDE-FRONT CLEAR OF BOX & SOLAR)
  // =========================================================================
  const camArmGroup = new THREE.Group();
  camArmGroup.position.set(mastX + 2.15, 4.18, mastZ + 0.15);
  scene.add(camArmGroup);

  // Horizontal aluminum arm from mast (x = -2.15 local) out to camera mount (x = 0 local)
  const camBoomX = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 2.18, 10)),
    aluMat,
    1.05
  );
  camBoomX.rotation.z = Math.PI / 2;
  camBoomX.position.set(-1.08, 0, 0);
  camArmGroup.add(camBoomX);

  // Forward projection arm into open air in front-right of box (+Z)
  const camBoomZ = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.72, 10)),
    aluMat,
    1.05
  );
  camBoomZ.rotation.x = Math.PI / 2;
  camBoomZ.position.set(0, 0, 0.34);
  camArmGroup.add(camBoomZ);

  const camTiltHead = new THREE.Group();
  camTiltHead.position.set(0, -0.05, 0.72);
  camTiltHead.rotation.set(0.32, 0, 0);
  camArmGroup.add(camTiltHead);

  // Real ESP32-CAM OV2640 oriented facing outward (+Z)
  camGroup.position.set(0, 0, 0);
  camGroup.rotation.set(Math.PI / 2, 0, 0);
  camGroup.scale.setScalar(0.42);
  camTiltHead.add(camGroup);

  // Sleek Weatherproof Camera Visor Hood (framed cleanly around camera without oversized box collision)
  const camHood = new THREE.Group();
  camHood.position.set(0, 0.02, 0.08);
  camTiltHead.add(camHood);

  const hoodTopVisor = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.76, 0.1, 0.56, 0.04)),
    darkMetalMat,
    1.04
  );
  hoodTopVisor.position.set(0, 0.44, 0.04);
  const hoodBotPlate = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.76, 0.08, 0.46, 0.04)),
    darkMetalMat,
    1.04
  );
  hoodBotPlate.position.set(0, -0.48, 0);
  const hoodLeftWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.07, 0.94, 0.44)),
    darkMetalMat,
    1.04
  );
  hoodLeftWall.position.set(-0.35, -0.02, 0);
  const hoodRightWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.07, 0.94, 0.44)),
    darkMetalMat,
    1.04
  );
  hoodRightWall.position.set(0.35, -0.02, 0);
  const hoodBackPlate = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.74, 0.94, 0.06)),
    darkMetalMat,
    1.04
  );
  hoodBackPlate.position.set(0, -0.02, -0.2);
  const hoodFrontGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.64, 0.84, 0.025)),
    smokedWindowMat
  );
  hoodFrontGlass.position.set(0, -0.02, 0.22);
  camHood.add(
    hoodTopVisor,
    hoodBotPlate,
    hoodLeftWall,
    hoodRightWall,
    hoodBackPlate,
    hoodFrontGlass
  );
  tagEspPart(camHood, 'ESP32CAM');
  registerMove(camHood, [0, 0.55, 0.85], true);

  // =========================================================================
  // 5. VENTILATED 4-PLATE RADIATION SHIELD IN FRONT OF BOX (+Z) + GY-BME280
  // =========================================================================
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(mastX + 0.65, 1.32, 1.72);
  scene.add(shieldGroup);

  // Horizontal forward boom extending cleanly from beneath IP65 box out in FRONT of box (+Z)
  const shieldBackBoom = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 2.24, 10)),
    aluMat,
    1.05
  );
  shieldBackBoom.rotation.x = Math.PI / 2;
  shieldBackBoom.position.set(-0.32, -0.44, -1.12);
  shieldGroup.add(shieldBackBoom);

  const shieldCrossArm = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.68, 10)),
    aluMat,
    1.05
  );
  shieldCrossArm.rotation.z = Math.PI / 2;
  shieldCrossArm.position.set(-0.66, -0.44, -2.22);
  shieldGroup.add(shieldCrossArm);

  const shieldRiser = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.68, 10)),
    aluMat,
    1.05
  );
  shieldRiser.position.set(-0.32, -0.12, 0);
  shieldGroup.add(shieldRiser);

  const shieldArmTop = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 8)),
    aluMat,
    1.05
  );
  shieldArmTop.rotation.z = Math.PI / 2;
  shieldArmTop.position.set(-0.16, 0.22, 0);
  shieldGroup.add(shieldArmTop);

  // 3 stainless tie rods
  [-0.22, 0, 0.22].forEach((rx, idx) => {
    const rz = idx === 1 ? -0.24 : 0.14;
    const rod = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.72, 6)),
      aluMat,
      1.08
    );
    rod.position.set(rx, 0.05, rz);
    shieldGroup.add(rod);
  });

  // Real GY-BME280 mounted horizontally on middle carrier plate
  bmeGroup.position.set(0, -0.02, 0);
  bmeGroup.scale.setScalar(0.42);
  shieldGroup.add(bmeGroup);

  const shieldOffsets: Array<{ baseY: number; lift: number; rTop: number; rBot: number }> = [
    { baseY: -0.18, lift: -0.36, rTop: 0.42, rBot: 0.48 },
    { baseY: -0.05, lift: -0.14, rTop: 0.4, rBot: 0.46 },
    { baseY: 0.14, lift: 0.34, rTop: 0.4, rBot: 0.46 },
    { baseY: 0.27, lift: 0.62, rTop: 0.44, rBot: 0.48 },
  ];
  shieldOffsets.forEach(({ baseY, lift, rTop, rBot }) => {
    const disc = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(rTop, rBot, 0.04, 18)),
      shieldWhiteMat,
      1.04
    );
    disc.position.y = baseY;
    shieldGroup.add(disc);
    tagEspPart(disc, 'BME280');
    registerMove(disc, [0, lift, 0], true);
  });

  // =========================================================================
  // 6. BOTTOM SOIL PROBES (ON STUDIO STAND, NO DIRT) + HYDRAULIC PUMP/SOLENOID
  // =========================================================================
  const probeRack = new THREE.Group();
  probeRack.position.set(0.35, 0.08, 0.92);
  scene.add(probeRack);

  soilGroup.position.set(-0.20, 0.02, 0.45);
  soilGroup.scale.setScalar(0.62);
  probeRack.add(soilGroup);
  registerMove(soilGroup, [0, 0.38, 0.18], true);

  dsGroup.position.set(0.0, 0.02, -0.30);
  dsGroup.scale.setScalar(0.62);
  probeRack.add(dsGroup);
  registerMove(dsGroup, [0, 0.38, -0.18], true);

  // Hydraulic Manifold Base (12V Pump + Brass Solenoid Valve + Blue Water Tubing)
  const hydroGroup = new THREE.Group();
  hydroGroup.position.set(3.05, 0.08, -0.10);
  scene.add(hydroGroup);

  pumpGroup.position.set(-0.08, 0.0, -0.82);
  pumpGroup.scale.setScalar(0.8);
  hydroGroup.add(pumpGroup);
  registerMove(pumpGroup, [0, 0.45, -0.15], true);

  solGroup.position.set(0.05, 0.04, 0.88);
  solGroup.scale.setScalar(0.82);
  hydroGroup.add(solGroup);
  registerMove(solGroup, [0, 0.42, 0.15], true);

  // Clear blue PVC irrigation manifold pipe linking Pump Outlet -> Solenoid Valve Inlet
  const hydroPipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.64, 0.32, -0.64),
    new THREE.Vector3(1.05, 0.32, -0.64),
    new THREE.Vector3(1.05, 0.25, 0.88),
    new THREE.Vector3(0.65, 0.25, 0.88),
  ]);
  const hydroPipe = factory.createOutlinedMesh(
    trackGeo(new THREE.TubeGeometry(hydroPipeCurve, 22, 0.055, 10, false)),
    pipeBlueMat,
    1.04
  );
  hydroGroup.add(hydroPipe);
  tagEspPart(hydroPipe, 'SOLENOID');

  // --- External Routing Cables (Solar -> Mast -> Box Glands -> Probes & Hydro) ---
  const addExternalCable = (pts: [number, number, number][], color: string, part: EspPartKey) => {
    const cMat = factory.createToon(color);
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 24, 0.022, 7, false)),
      cMat
    );
    mesh.castShadow = true;
    tagEspPart(mesh, part);
    scene.add(mesh);
  };

  // Solar -> through open Top Cable Gland hole -> straight into CN3791 MPPT PV+ (Red) & PV- (Black)
  addExternalCable(
    [
      [mastX + 0.78, 4.86, mastZ],
      [mastX + 0.22, 4.62, mastZ + 0.22],
      [mastX + glandHoleX - 0.03, 4.35, 0.02],
      [mastX + glandHoleX - 0.03, 4.02, 0.02],
      [mastX + glandHoleX - 0.03, 3.64, -0.02],
      [mastX - 1.1, 3.59, -0.06],
    ],
    '#dc2626',
    'SOLAR'
  );
  addExternalCable(
    [
      [mastX + 0.78, 4.84, mastZ + 0.12],
      [mastX + 0.24, 4.58, mastZ + 0.28],
      [mastX + glandHoleX + 0.04, 4.35, 0.05],
      [mastX + glandHoleX + 0.04, 4.02, 0.05],
      [mastX + glandHoleX + 0.04, 3.54, -0.02],
      [mastX - 1.1, 3.49, -0.06],
    ],
    '#1f2937',
    'SOLAR'
  );
  // ESP32-CAM -> along aluminum boom -> through hollow Right Side Gland -> straight into ESP32 UART/5V inside box
  addExternalCable(
    [
      [mastX + 2.15, 4.05, mastZ + 0.72],
      [mastX + 2.15, 4.18, mastZ + 0.22],
      [mastX + 1.85, 3.65, 0.08],
      [mastX + boxW / 2 + 0.14, 2.48 + camGlandY, 0.08],
      [mastX + boxW / 2 - 0.05, 2.48 + camGlandY, 0.04],
      [mastX + 0.64, 2.82, -0.02],
    ],
    '#a855f7',
    'ESP32CAM'
  );
  // BME280 Canopy Shield -> along front boom -> straight THROUGH Bottom Gland 1 -> straight into ESP32 I2C inside box
  addExternalCable(
    [
      [mastX + 0.65, 1.28, 1.72],
      [mastX + 0.34, 0.88, 1.68],
      [mastX + 0.34, 0.74, 0.22],
      [mastX - 0.96, 0.74, 0.14],
      [mastX - 0.96, 0.98, 0.14],
      [mastX - 0.96, 1.86, -0.04],
      [mastX + 0.44, 2.38, -0.04],
    ],
    '#7c3aed',
    'BME280'
  );
  // Soil Moisture Probe -> straight THROUGH Bottom Gland 2 -> straight into ESP32 GPIO34 inside box
  addExternalCable(
    [
      [mastX + 0.48, 2.28, -0.04],
      [mastX - 0.32, 1.98, -0.04],
      [mastX - 0.32, 0.98, 0.14],
      [mastX - 0.32, 0.24, 0.85],
      [-0.10, 0.16, 1.37],
      [0.77, 0.16, 1.37],
    ],
    '#eab308',
    'SOIL_MOISTURE'
  );
  // DS18B20 Probe Adapter -> straight THROUGH Bottom Gland 3 -> straight into ESP32 GPIO4 inside box
  addExternalCable(
    [
      [mastX + 0.54, 2.18, -0.04],
      [mastX + 0.32, 1.82, -0.02],
      [mastX + 0.32, 0.98, 0.14],
      [mastX + 0.32, 0.3, 0.62],
      [1.12, 0.18, 0.62],
    ],
    '#292623',
    'DS18B20'
  );
  // 12V Pump & Solenoid -> straight THROUGH Bottom Gland 4 -> straight into Relay 2CH NO1/NO2 inside box
  addExternalCable(
    [
      [mastX + 0.96, 1.46, -0.04],
      [mastX + 0.96, 0.98, 0.14],
      [mastX + 0.96, 0.22, -0.42],
      [1.95, 0.24, -0.92],
      [2.35, 0.34, -0.92],
    ],
    '#dc2626',
    'PUMP'
  );
  addExternalCable(
    [
      [mastX + 0.92, 1.38, -0.04],
      [mastX + 0.96, 0.98, 0.14],
      [0.15, 0.42, 0.12],
      [2.82, 0.74, 0.68],
      [3.08, 0.74, 0.78],
    ],
    '#2563eb',
    'SOLENOID'
  );

  // Mark remaining physical enclosure shells
  tagEspPart(backPlateShell, 'U1');
  tagEspPart(mastPole, 'U1');
  tagEspPart(mastFlange, 'U1');

  let explodeLerp = 0;

  const update: PhysicalNodeSceneController['update'] = (
    dt,
    _elapsed,
    metrics,
    explodeTarget
  ) => {
    const nightFactor = getNightFactor(metrics.timeHours);
    const isNight = nightFactor > 0.52;

    hemiLight.intensity = isNight ? 1.0 : 1.28;
    sunLight.intensity = isNight ? 1.25 : 1.65;

    if (metrics.isWatering) {
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

    camFlashMat.color.set(metrics.patekRiskPct >= 65 ? '#fef9c3' : '#9ca3af');

    // Smooth Disassembly / Explode Animation (0 = Rakit Rapat, 1 = Bongkar Penuh)
    explodeLerp += (explodeTarget - explodeLerp) * Math.min(1, dt * 6.5);

    explodeItems.forEach((item) => {
      item.obj.position.copy(item.basePos).addScaledVector(item.offset, explodeLerp);
      if (item.baseRot && item.rotOffset) {
        item.obj.rotation.set(
          item.baseRot.x + item.rotOffset.x * explodeLerp,
          item.baseRot.y + item.rotOffset.y * explodeLerp,
          item.baseRot.z + item.rotOffset.z * explodeLerp
        );
      }
      if (item.guideLine) {
        item.guideLine.visible = explodeLerp > 0.04;
      }
    });

    // Sub-parts inside ESP32 / LM2596 / Pump / Solenoid micro-explode subtly past 55% disassemble!
    const subExplode = Math.max(0, (explodeLerp - 0.55) / 0.45);
    explodables.forEach((item) => {
      item.group.position.y = item.baseY + item.liftY * subExplode * 0.72;
      item.guideLine.visible = subExplode > 0.06;
    });
  };

  const pickPart: PhysicalNodeSceneController['pickPart'] = (raycaster) => {
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

  return { scene, update, pickPart, dispose };
}
