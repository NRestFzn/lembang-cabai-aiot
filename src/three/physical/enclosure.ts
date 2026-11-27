import * as THREE from 'three';
import { createCanvasDecal, createRoundedBoxGeo, tagEspPart } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';
import { PhysicalKit, RegisterMove } from './modules';

export interface Enclosure {
  boxCenter: THREE.Group;
  backPlateShell: THREE.Group;
  boxW: number;
  boxH: number;
  cavD: number;
  glandHoleX: number;
  camGlandY: number;
}

/** Weatherproof IP65 enclosure + internal electronics stack + front door (original section 3). */
export function buildEnclosure(
  ctx: PhysicalContext,
  materials: PhysicalMaterials,
  kit: PhysicalKit,
  registerMove: RegisterMove,
  mastX: number
): Enclosure {
  const { scene, factory, trackGeo, trackMat, textures } = ctx;
  const { darkMetalMat, ip65BodyMat, ip65DoorMat, gasketMat, acrylicPlateMat, smokedWindowMat } = materials;
  const {
    modules: { mpptGroup, batGroup, lmGroup, espGroup, sdGroup, relayGroup },
    materials: { ledMat, greenLedMat },
  } = kit;
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

  // Left wall solid; Right wall split around hollow side gland (y = +0.62) for ArduCam CSI flex / power cable!
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
  return { boxCenter, backPlateShell, boxW, boxH, cavD, glandHoleX, camGlandY };
}
