import * as THREE from 'three';
import { tagPart, type GardenContext } from './gardenContext';

export interface GardenPumpParts {
  pumpGroup: THREE.Group;
  irrigationGroup: THREE.Group;
  emitterPositions: Array<[number, number, number]>;
}

/** Section 3: water drum + real 12V pump, brass solenoid, pipes & emitters. */
export function buildGardenPump(ctx: GardenContext): GardenPumpParts {
  const { scene, factory, trackGeo } = ctx;
  const mats = ctx.mats;
  const { pumpGroup: realPumpMod, solGroup: realSolMod } = ctx.kit.modules;
// =========================================================================
// 3. WATER DRUM + REAL 12V PUMP (`pump`) & REAL BRASS SOLENOID (`solenoid`)
// =========================================================================
const pumpGroup = new THREE.Group();
scene.add(pumpGroup);

// Sturdy wooden support stand sitting cleanly on the open Lower Terrace (y = -0.18, clear of retaining wall z <= 0.13)
const standDeck = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(1.22, 0.07, 0.82)),
  mats.woodMat,
  1.03
);
standDeck.position.set(-3.0, 0.235, 0.58);
pumpGroup.add(standDeck);

// 4 legs resting squarely on lower terrace ground (y = -0.18 .. 0.20)
const legPositions: Array<[number, number]> = [
  [-3.54, 0.24],
  [-2.46, 0.24],
  [-3.54, 0.92],
  [-2.46, 0.92],
];
legPositions.forEach(([lx, lz]) => {
  const leg = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.09, 0.38, 0.09)),
    mats.woodMat,
    1.05
  );
  leg.position.set(lx, 0.01, lz);
  pumpGroup.add(leg);
});

// Cross-brace bars between stand legs
const frontBrace = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(1.1, 0.06, 0.06)),
  mats.woodMat,
  1.05
);
frontBrace.position.set(-3.0, 0.02, 0.92);
pumpGroup.add(frontBrace);

// Water buffer barrel resting cleanly on stand deck top (y = 0.27 + 0.36 = 0.63)
const drum = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.35, 0.35, 0.72, 14)),
  mats.accentMat,
  1.035
);
drum.position.set(-3.26, 0.63, 0.58);
pumpGroup.add(drum);

const drumLid = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.365, 0.365, 0.07, 14)),
  mats.solarFrameMat,
  1.035
);
drumLid.position.set(-3.26, 1.0, 0.58);
pumpGroup.add(drumLid);

// Real 12V Diaphragm Water Pump resting solidly on stand deck (y = 0.27)
realPumpMod.position.set(-2.66, 0.27, 0.58);
realPumpMod.scale.setScalar(0.24);
pumpGroup.add(realPumpMod);

// Solenoid & pipe network
const irrigationGroup = new THREE.Group();
scene.add(irrigationGroup);

// Helper for off-origin curved TubeGeometry with concentric uniform ink outline (never scales from world origin!)
const addOutlinedTube = (
  parent: THREE.Group,
  curve: THREE.CatmullRomCurve3,
  radius: number,
  outlineThickness: number,
  mat: THREE.Material,
  tubularSegments = 16
) => {
  const tubeGeo = trackGeo(new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false));
  const mesh = new THREE.Mesh(tubeGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  const outlineGeo = trackGeo(new THREE.TubeGeometry(curve, tubularSegments, radius + outlineThickness, 8, false));
  const outline = new THREE.Mesh(outlineGeo, factory.outlineMaterial);
  outline.renderOrder = -1;
  parent.add(outline);
};

// Suction pipe looping cleanly from water drum (-2.94) into rear pump intake nozzle (-2.44, 0.38, 0.525)
const suctionCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.95, 0.38, 0.45),
  new THREE.Vector3(-2.55, 0.39, 0.39),
  new THREE.Vector3(-2.36, 0.38, 0.45),
  new THREE.Vector3(-2.45, 0.38, 0.525),
]);
addOutlinedTube(pumpGroup, suctionCurve, 0.024, 0.006, mats.pipeMat, 14);
tagPart(pumpGroup, 'pump');

// Main pressure pipe curving cleanly from pump outlet nozzle (-2.45, 0.38, 0.635) into real solenoid inlet (-2.14, 0.38, 0.22)
const pipeInCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.45, 0.38, 0.635),
  new THREE.Vector3(-2.24, 0.38, 0.44),
  new THREE.Vector3(-2.14, 0.38, 0.22),
]);
addOutlinedTube(irrigationGroup, pipeInCurve, 0.025, 0.006, mats.pipeMat, 16);

// Real 12V Brass Solenoid Valve assembly (`solenoid`) feeding main terraced beds
const solenoidGroup = new THREE.Group();
solenoidGroup.position.set(-1.98, 0.38, 0.22);
realSolMod.position.set(0, -0.052, 0);
realSolMod.scale.setScalar(0.2);
solenoidGroup.add(realSolMod);

// Support post under solenoid resting on lower terrace ground (y = -0.18 .. 0.34)
const solenoidPost = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.52, 8)),
  mats.poleMat,
  1.07
);
solenoidPost.position.set(0, -0.31, 0);
solenoidGroup.add(solenoidPost);

irrigationGroup.add(solenoidGroup);

// Short straight outlet stub bridging brass valve outlet (-1.83) to T-splitter hub (-1.80)
const outletStub = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.07, 8)),
  mats.pipeMat,
  1.1
);
outletStub.rotation.z = Math.PI / 2;
outletStub.position.set(-1.825, 0.38, 0.22);
irrigationGroup.add(outletStub);

// T-splitter junction sphere & elbow spheres so every pipe joint is 100% sealed with zero open cut ends
const fittingGeo = trackGeo(new THREE.SphereGeometry(0.036, 10, 10));
const tJunction = factory.createOutlinedMesh(fittingGeo, mats.pipeMat, 1.1);
tJunction.position.set(-1.8, 0.38, 0.22);
irrigationGroup.add(tJunction);

const upperElbow = factory.createOutlinedMesh(fittingGeo, mats.pipeMat, 1.1);
upperElbow.position.set(-1.8, 0.47, -0.72);
irrigationGroup.add(upperElbow);

const lowerElbow = factory.createOutlinedMesh(fittingGeo, mats.pipeMat, 1.1);
lowerElbow.position.set(-1.8, 0.04, 0.66);
irrigationGroup.add(lowerElbow);

// Both branches start at the EXACT same T-splitter hub (-1.80, 0.38, 0.22) and end inside the elbow fittings
const upperBranchCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.8, 0.38, 0.22),
  new THREE.Vector3(-1.8, 0.38, -0.05),
  new THREE.Vector3(-1.8, 0.43, -0.45),
  new THREE.Vector3(-1.8, 0.47, -0.72),
]);
addOutlinedTube(irrigationGroup, upperBranchCurve, 0.024, 0.006, mats.pipeMat, 18);

const lowerBranchCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.8, 0.38, 0.22),
  new THREE.Vector3(-1.8, 0.34, 0.48),
  new THREE.Vector3(-1.8, 0.04, 0.66),
]);
addOutlinedTube(irrigationGroup, lowerBranchCurve, 0.024, 0.006, mats.pipeMat, 14);

// Upper bed drip line (connects cleanly at x = -1.84)
const upperLine = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
  mats.pipeMat,
  1.12
);
upperLine.rotation.z = Math.PI / 2;
upperLine.position.set(0.5, 0.47, -0.72);
irrigationGroup.add(upperLine);

// Lower bed drip line (connects cleanly at x = -1.84)
const lowerLine = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
  mats.pipeMat,
  1.12
);
lowerLine.rotation.z = Math.PI / 2;
lowerLine.position.set(0.5, 0.04, 0.66);
irrigationGroup.add(lowerLine);

// 6 Micro-sprayer / drip emitters along both main beds (Mode Otomatis)
const emitterPositions: Array<[number, number, number]> = [
  [-1.0, 0.56, -0.72],
  [0.45, 0.56, -0.72],
  [1.9, 0.56, -0.72],
  [-1.0, 0.13, 0.66],
  [0.45, 0.13, 0.66],
  [1.9, 0.13, 0.66],
];
emitterPositions.forEach(([ex, ey, ez]) => {
  const riser = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6)),
    mats.solarFrameMat,
    1.12
  );
  riser.position.set(ex, ey - 0.02, ez);
  irrigationGroup.add(riser);

  const nozzle = factory.createOutlinedMesh(
    trackGeo(new THREE.ConeGeometry(0.032, 0.05, 6)),
    mats.brassMat,
    1.12
  );
  nozzle.position.set(ex, ey + 0.07, ez);
  irrigationGroup.add(nozzle);
});

tagPart(irrigationGroup, 'solenoid');
  return { pumpGroup, irrigationGroup, emitterPositions };
}
