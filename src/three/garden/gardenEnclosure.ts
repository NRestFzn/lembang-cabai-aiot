import * as THREE from 'three';
import { createCanvasDecal } from '../hardwareModules';
import { POLE_X, POLE_Z, tagPart, type BoxExplodeItem, type GardenContext } from './gardenContext';

/**
 * Section 4a: node pole + IP65 enclosure (hollow glands, DIN boards,
 * front window door + status LEDs). Returns the explode-animation items.
 */
export function buildGardenEnclosure(ctx: GardenContext): { enclosureGroup: THREE.Group; boxExplodeItems: BoxExplodeItem[] } {
  const { scene, factory, trackGeo, trackMat, textures } = ctx;
  const mats = ctx.mats;
  const { espGroup, lmGroup, sdGroup, relayGroup, mpptGroup, batGroup } = ctx.kit.modules;
  const { ledMat, greenLedMat } = ctx.kit.materials;
// =========================================================================
// 4. REAL AIoT NODE POLE, IP65 BOX & SENSORS (`solar`, `enclosure`, `esp32cam`, `dht22`, `soil_probe`)
// =========================================================================

// Pole base + aluminum mast (attached to enclosure group)
const enclosureGroup = new THREE.Group();
scene.add(enclosureGroup);

const footing = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.36)),
  mats.stoneMat,
  1.04
);
footing.position.set(POLE_X, 0.32, POLE_Z);
enclosureGroup.add(footing);

const mast = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.052, 0.058, 2.25, 12)),
  mats.poleMat,
  1.05
);
mast.position.set(POLE_X, 1.42, POLE_Z);
enclosureGroup.add(mast);

// Main Weatherproof IP65 Enclosure facing +X toward the chili beds (local +Z -> world +X)
const boxCore = new THREE.Group();
boxCore.position.set(POLE_X + 0.14, 1.66, POLE_Z);
boxCore.rotation.y = Math.PI / 2;
enclosureGroup.add(boxCore);

const boreHoleMat = trackMat(new THREE.MeshBasicMaterial({ color: '#141210' }));
const glandMetalMat = factory.createToon('#292623');
const smokedWindowMat = trackMat(
  new THREE.MeshPhysicalMaterial({
    color: '#cbd5e1',
    transparent: true,
    opacity: 0.24,
    roughness: 0.2,
  })
);
const acrylicPlateMat = factory.createToon('#60a5fa', { transparent: true, opacity: 0.32 });

const boxW = 0.56;
const boxH = 0.58;
const wallT = 0.022;
const cavD = 0.16;

const createMiniHollowGland = (rOuter = 0.025, rBore = 0.016) => {
  const grp = new THREE.Group();
  const outer = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(rOuter, rOuter, 0.036, 12, 1, true)),
    glandMetalMat,
    1.06
  );
  const inner = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(rBore, rBore, 0.04, 12)),
    boreHoleMat
  );
  const lip = factory.createOutlinedMesh(
    trackGeo(new THREE.TorusGeometry((rOuter + rBore) * 0.5, 0.006, 6, 12)),
    glandMetalMat,
    1.06
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.015;
  grp.add(outer, inner, lip);
  return grp;
};

const backPlate = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(boxW, boxH, wallT)),
  mats.boxBodyMat,
  1.025
);
backPlate.position.z = -cavD / 2;
boxCore.add(backPlate);

// Left wall solid; Right wall split for hollow side gland (ArduCam CSI flex cable)
const boxLeftWall = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(wallT, boxH, cavD)),
  mats.boxBodyMat,
  1.03
);
boxLeftWall.position.set(-boxW / 2 + wallT / 2, 0, 0);
boxCore.add(boxLeftWall);

const sideGlandY = 0.14;
const sideGap = 0.05;
const sideBotH = sideGlandY - sideGap / 2 - (-boxH / 2);
const sideTopH = boxH / 2 - (sideGlandY + sideGap / 2);
const boxRightBot = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(wallT, sideBotH, cavD)),
  mats.boxBodyMat,
  1.03
);
boxRightBot.position.set(boxW / 2 - wallT / 2, -boxH / 2 + sideBotH / 2, 0);
const boxRightTop = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(wallT, sideTopH, cavD)),
  mats.boxBodyMat,
  1.03
);
boxRightTop.position.set(boxW / 2 - wallT / 2, boxH / 2 - sideTopH / 2, 0);
boxCore.add(boxRightBot, boxRightTop);

const sideGland = createMiniHollowGland(0.024, 0.015);
sideGland.rotation.z = -Math.PI / 2;
sideGland.position.set(boxW / 2 + 0.008, sideGlandY, 0);
boxCore.add(sideGland);

// Top wall split around PV cable gland
const pvGlandX = -0.12;
const pvGap = 0.06;
const pvLeftW = pvGlandX - pvGap / 2 - (-boxW / 2);
const pvRightW = boxW / 2 - (pvGlandX + pvGap / 2);
const boxTopLeft = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(pvLeftW, wallT, cavD)),
  mats.boxBodyMat,
  1.03
);
boxTopLeft.position.set(-boxW / 2 + pvLeftW / 2, boxH / 2 - wallT / 2, 0);
const boxTopRight = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(pvRightW, wallT, cavD)),
  mats.boxBodyMat,
  1.03
);
boxTopRight.position.set(boxW / 2 - pvRightW / 2, boxH / 2 - wallT / 2, 0);
boxCore.add(boxTopLeft, boxTopRight);

const topGland = createMiniHollowGland(0.03, 0.02);
topGland.position.set(pvGlandX, boxH / 2 + 0.01, -0.01);
boxCore.add(topGland);

// Bottom wall split around 4 sensor & actuator glands
const miniGlandXs = [-0.18, -0.06, 0.06, 0.18];
const miniGapW = 0.045;
const miniBotBounds: Array<[number, number]> = [
  [-boxW / 2, miniGlandXs[0] - miniGapW / 2],
  [miniGlandXs[0] + miniGapW / 2, miniGlandXs[1] - miniGapW / 2],
  [miniGlandXs[1] + miniGapW / 2, miniGlandXs[2] - miniGapW / 2],
  [miniGlandXs[2] + miniGapW / 2, miniGlandXs[3] - miniGapW / 2],
  [miniGlandXs[3] + miniGapW / 2, boxW / 2],
];
miniBotBounds.forEach(([x0, x1]) => {
  const seg = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(x1 - x0, wallT, cavD)),
    mats.boxBodyMat,
    1.03
  );
  seg.position.set((x0 + x1) / 2, -boxH / 2 + wallT / 2, 0);
  boxCore.add(seg);
});
miniGlandXs.forEach((gx) => {
  const g = createMiniHollowGland(0.022, 0.014);
  g.rotation.x = Math.PI;
  g.position.set(gx, -boxH / 2 - 0.008, 0.015);
  boxCore.add(g);
});

// Translucent Acrylic DIN Backplate inside Box
const dinBackplate = new THREE.Group();
dinBackplate.position.set(0, 0, -cavD / 2 + 0.024);
boxCore.add(dinBackplate);
const dinPlateMesh = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(boxW - 0.05, boxH - 0.05, 0.012)),
  acrylicPlateMat,
  1.02
);
dinBackplate.add(dinPlateMesh);

// Explode items tracked inside boxCore along local +Z (world +X)
const boxExplodeItems: Array<{ obj: THREE.Object3D; baseZ: number; offsetZ: number; baseX: number; offsetX: number }> = [
  { obj: dinBackplate, baseZ: dinBackplate.position.z, offsetZ: 0.18, baseX: 0, offsetX: 0 },
];

const mountDioramaBoard = (
  mod: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale: number,
  offsetZ: number,
  offsetX = 0
) => {
  mod.position.set(x, y, z);
  mod.rotation.set(Math.PI / 2, 0, 0);
  mod.scale.setScalar(scale);
  boxCore.add(mod);
  boxExplodeItems.push({ obj: mod, baseZ: z, offsetZ, baseX: x, offsetX });
};

// Bottom DIN Boards inside IP65 Box: MicroSD & Relay 2CH
mountDioramaBoard(mpptGroup, -0.14, 0.19, -0.028, 0.068, 0.34, -0.04);
mountDioramaBoard(batGroup, 0.11, 0.195, -0.028, 0.075, 0.34, 0.04);
mountDioramaBoard(lmGroup, -0.14, 0.02, -0.028, 0.066, 0.42, -0.04);
mountDioramaBoard(espGroup, 0.11, 0.01, -0.028, 0.058, 0.46, 0.04);
mountDioramaBoard(sdGroup, -0.12, -0.18, -0.028, 0.062, 0.36, -0.04);
mountDioramaBoard(relayGroup, 0.12, -0.18, -0.028, 0.064, 0.38, 0.04);

// Detachable Front Polycarbonate Window Door + Status LEDs
const frontDoor = new THREE.Group();
frontDoor.position.set(0, 0, cavD / 2 + 0.012);
boxCore.add(frontDoor);

const fTopBot = trackGeo(new THREE.BoxGeometry(boxW, 0.062, 0.016));
const fSides = trackGeo(new THREE.BoxGeometry(0.052, boxH - 0.124, 0.016));
[boxH / 2 - 0.031, -boxH / 2 + 0.031].forEach((fy) => {
  const f = factory.createOutlinedMesh(fTopBot, mats.boxLidMat, 1.025);
  f.position.y = fy;
  frontDoor.add(f);
});
[-boxW / 2 + 0.026, boxW / 2 - 0.026].forEach((fx) => {
  const f = factory.createOutlinedMesh(fSides, mats.boxLidMat, 1.025);
  f.position.x = fx;
  frontDoor.add(f);
});

const doorGlass = new THREE.Mesh(
  trackGeo(new THREE.BoxGeometry(boxW - 0.104, boxH - 0.124, 0.008)),
  smokedWindowMat
);
frontDoor.add(doorGlass);

const boxDoorTex = createCanvasDecal(512, 96, (c) => {
  c.fillStyle = '#231e16';
  c.font = 'bold 34px ui-monospace, monospace';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('SENTINEL AIoT · IP65', 24, 48);
});
textures.push(boxDoorTex);
const doorTitlePlane = new THREE.Mesh(
  trackGeo(new THREE.PlaneGeometry(boxW - 0.08, 0.048)),
  trackMat(new THREE.MeshBasicMaterial({ map: boxDoorTex, transparent: true }))
);
doorTitlePlane.position.set(0, boxH / 2 - 0.03, 0.01);
frontDoor.add(doorTitlePlane);

const onLedMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.011, 8, 8)), greenLedMat);
onLedMesh.position.set(boxW / 2 - 0.075, boxH / 2 - 0.03, 0.012);
frontDoor.add(onLedMesh);
const statLedMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.011, 8, 8)), ledMat);
statLedMesh.position.set(boxW / 2 - 0.045, boxH / 2 - 0.03, 0.012);
frontDoor.add(statLedMesh);

boxExplodeItems.push({ obj: frontDoor, baseZ: frontDoor.position.z, offsetZ: 0.64, baseX: 0, offsetX: 0 });
tagPart(enclosureGroup, 'enclosure');
  return { enclosureGroup, boxExplodeItems };
}
