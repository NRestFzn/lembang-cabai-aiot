import * as THREE from 'three';
import { LEAF_CONDITION_META } from '../../data/parts';
import type { LeafCondition } from '../../types/simulation';
import { tagPart, type GardenContext, type PlantAnimRef } from './gardenContext';
import { attachChiliLeaf, attachChiliPod, createPlantGeometries } from './gardenPlantAttachments';

/** Section 2: 10 tall branching cabai rawit bushes + their bamboo ajir cages. */
export function buildGardenPlants(ctx: GardenContext): { plantsGroup: THREE.Group; plantRefs: PlantAnimRef[] } {
  const { scene, factory, trackGeo } = ctx;
  const mats = ctx.mats;
// =========================================================================
// 2. CHILI PLANTS (10 TALL BRANCHING CABAI RAWIT BUSHES) (`chili_plant`)
// =========================================================================
const plantsGroup = new THREE.Group();
scene.add(plantsGroup);

const plantRefs: PlantAnimRef[] = [];

// Upper terrace (0..4) starts healthy & reacts dynamically to irrigation + microclimate (0..1 under CAM+BME280).
// Lower terrace (5..9) holds static reference showcase of every leaf condition type (healthy -> patek_infected).
const BASE_PLANT_CONDITIONS: LeafCondition[] = [
  'healthy',
  'healthy',
  'healthy',
  'healthy',
  'healthy',
  'healthy',
  'wet_risk',
  'yellowing',
  'patek_early',
  'patek_infected',
];
const chiliPodMaterials = [mats.chiliRedMat, mats.chiliRedMat, mats.chiliGreenMat, mats.chiliOrangeMat, mats.chiliCreamMat];

// 10 spots across upper & lower beds (single canonical chili plant model reused with Y-rotation)
const plantCoords: Array<[number, number, number, number, number]> = [
  // Upper terrace (yTop = 0.455): [x, y, z, scale, rotY]
  [-1.45, 0.455, -1.12, 1.0, 0.2],
  [-0.5, 0.455, -1.08, 1.05, 1.45],
  [0.45, 0.455, -1.15, 0.98, 2.7],
  [1.4, 0.455, -1.09, 1.04, 3.9],
  [2.32, 0.455, -1.14, 1.0, 5.1],
  // Lower terrace (yTop = 0.025)
  [-1.45, 0.025, 1.06, 1.0, 0.85],
  [-0.5, 0.025, 1.11, 1.04, 2.1],
  [0.45, 0.025, 1.05, 1.02, 3.35],
  [1.4, 0.025, 1.1, 0.97, 4.6],
  [2.32, 0.025, 1.07, 1.03, 5.8],
];

const plantGeos = createPlantGeometries(ctx);

// Single canonical chili tree + rigid 4-stake bamboo ajir cage reused for all 10 plants
const buildCanonicalChiliPlant = (
  plantIndex: number,
  px: number,
  py: number,
  pz: number,
  scale: number,
  rotY: number,
  phase: number
) => {
  const baseCondition = BASE_PLANT_CONDITIONS[plantIndex] ?? 'healthy';
  const condMeta = LEAF_CONDITION_META[baseCondition];
  const pLeafMat = factory.createToon(condMeta.leafHex);
  const pLeafYoungMat = factory.createToon(condMeta.leafYoungHex);

  // Rigid Bamboo Ajir Support Cage (4 stakes + bamboo node bands + 3 horizontal wire rings)
  const cageGroup = new THREE.Group();
  cageGroup.position.set(px, py, pz);
  cageGroup.scale.setScalar(scale);

  const stakeOffsets: Array<[number, number]> = [
    [0.195, 0.195],
    [-0.195, 0.195],
    [-0.195, -0.195],
    [0.195, -0.195],
  ];
  stakeOffsets.forEach(([sx, sz]) => {
    const stake = factory.createOutlinedMesh(plantGeos.stakeGeo, mats.bambooMat, 1.08);
    stake.position.set(sx, 0.48, sz);
    cageGroup.add(stake);

    [0.22, 0.52, 0.8].forEach((ny) => {
      const node = factory.createOutlinedMesh(plantGeos.stakeNodeGeo, mats.bambooNodeMat, 1.07);
      node.position.set(sx, ny, sz);
      cageGroup.add(node);
    });
  });

  // 3 Horizontal Wire / String Rings tying the 4 stakes together
  [0.3, 0.58, 0.84].forEach((ry) => {
    const ring = new THREE.Mesh(plantGeos.wireRingGeo, mats.wireMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    ring.castShadow = true;
    cageGroup.add(ring);

    const ringOutline = new THREE.Mesh(plantGeos.wireOutlineGeo, factory.outlineMaterial);
    ringOutline.rotation.x = Math.PI / 2;
    ringOutline.position.y = ry;
    ringOutline.renderOrder = -1;
    cageGroup.add(ringOutline);
  });

  plantsGroup.add(cageGroup);

  const pGroup = new THREE.Group();
  pGroup.position.set(px, py, pz);
  pGroup.rotation.y = rotY;
  pGroup.scale.setScalar(scale);

  // Planting hole soil ring on mulch
  const holeRing = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 10)),
    mats.bedSoilMat,
    1.04
  );
  holeRing.position.y = 0.005;
  pGroup.add(holeRing);

  // Woody main lower trunk (y = 0 .. 0.35)
  const trunk = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.036, 0.35, 7)),
    mats.stemMat,
    1.09
  );
  trunk.position.y = 0.175;
  pGroup.add(trunk);

  // Main fork junction node at y = 0.35
  const mainForkJoint = factory.createOutlinedMesh(plantGeos.jointGeo, mats.stemMat, 1.08);
  mainForkJoint.position.y = 0.35;
  pGroup.add(mainForkJoint);

  const droplets: THREE.Mesh[] = [];
  const patekSpots: THREE.Mesh[] = [];
  const severeSpots: THREE.Mesh[] = [];
  const leafMeshes: THREE.Object3D[] = [];

  // 2 small lower-stem leaves protruding cleanly outward
  attachChiliLeaf(ctx, plantGeos, pGroup, [0, 0.24, 0], 0.5, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);
  attachChiliLeaf(ctx, plantGeos, pGroup, [0, 0.29, 0], 3.6, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

  // 3 symmetric Primary Fork Limbs (0°, 120°, 240°) held inside the bamboo ajir cage
  for (let b = 0; b < 3; b++) {
    const yaw = (b / 3) * Math.PI * 2;
    const primaryGroup = new THREE.Group();
    primaryGroup.position.set(0, 0.35, 0);
    primaryGroup.rotation.y = yaw;

    const limbPivot = new THREE.Group();
    limbPivot.rotation.z = -0.42; // fits nicely inside wire rings!

    const limb = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.015, 0.021, 0.36, 6)),
      mats.stemMat,
      1.1
    );
    limb.position.y = 0.18;
    limbPivot.add(limb);

    // Limb tip fork joint at y = 0.36
    const limbJoint = factory.createOutlinedMesh(plantGeos.jointGeo, mats.branchMat, 1.08);
    limbJoint.scale.setScalar(0.72);
    limbJoint.position.y = 0.36;
    limbPivot.add(limbJoint);

    // 2 mid-limb leaves pointing tangential-outward
    attachChiliLeaf(ctx, plantGeos, limbPivot, [0, 0.18, 0], 0.45, 0.18, 0.9, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, b === 0);
    attachChiliLeaf(ctx, plantGeos, limbPivot, [0, 0.27, 0], Math.PI - 0.45, 0.18, 0.88, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

    // Hanging red / green cabai keriting from mid-limb node (visible below foliage!)
    attachChiliPod(ctx, plantGeos, 
      limbPivot,
      [0, 0.25, 0],
      b * 0.7,
      0.38, // compensates for limbPivot -0.42 so chili hangs straight down!
      b === 2 ? mats.chiliGreenMat : mats.chiliRedMat,
      0.95,
      severeSpots
    );

    // 2 Secondary Twigs fanning sideways-upward from limb tip (y = 0.36)
    for (let s = 0; s < 2; s++) {
      const subYaw = new THREE.Group();
      subYaw.position.set(0, 0.36, 0);
      subYaw.rotation.y = s === 0 ? 0.52 : -0.52;

      const subTilt = new THREE.Group();
      subTilt.rotation.z = 0.2; // curves gracefully back up toward sky

      const subTwig = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.009, 0.014, 0.32, 6)),
        mats.branchMat,
        1.12
      );
      subTwig.position.y = 0.16;
      subTilt.add(subTwig);

      // 3 upper-twig leaves pointing strictly outward/tangential
      attachChiliLeaf(ctx, plantGeos, subTilt, [0, 0.13, 0], s === 0 ? 0.25 : Math.PI - 0.25, 0.16, 0.95, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, s === 0);
      attachChiliLeaf(ctx, plantGeos, subTilt, [0, 0.21, 0], Math.PI / 2, 0.22, 0.92, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);
      attachChiliLeaf(ctx, plantGeos, subTilt, [0, 0.27, 0], s === 0 ? Math.PI - 0.3 : 0.3, 0.26, 0.82, true, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

      // Hanging Cabai Keriting fruit dangling from upper twig node (y = 0.26)
      const podMat = chiliPodMaterials[(b * 2 + s) % chiliPodMaterials.length];
      attachChiliPod(ctx, plantGeos, subTilt, [0, 0.26, 0], s === 0 ? 0.4 : -0.4, 0.2, podMat, 1.0, severeSpots);

      // Blossom on alternate twigs
      if ((b + s) % 2 === 1) {
        const flowerStem = new THREE.Group();
        flowerStem.position.set(0, 0.29, 0);
        flowerStem.rotation.z = -0.5;
        const fPed = factory.createOutlinedMesh(plantGeos.petioleGeo, mats.branchMat, 1.12);
        fPed.position.y = 0.022;
        flowerStem.add(fPed);
        const flower = factory.createOutlinedMesh(
          trackGeo(new THREE.OctahedronGeometry(0.025, 0)),
          mats.blossomMat,
          1.14
        );
        flower.position.y = 0.048;
        flowerStem.add(flower);
        subTilt.add(flowerStem);
      }

      subYaw.add(subTilt);
      limbPivot.add(subYaw);
    }

    primaryGroup.add(limbPivot);
    pGroup.add(primaryGroup);
  }

  // Central upright leader shoot rising above the fork (y = 0.35 .. 0.86)
  const centerLeader = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.01, 0.017, 0.51, 6)),
    mats.branchMat,
    1.12
  );
  centerLeader.position.y = 0.605;
  pGroup.add(centerLeader);

  // Top crown rosette (y = 0.74 .. 0.84)
  for (let cl = 0; cl < 3; cl++) {
    attachChiliLeaf(ctx, plantGeos, 
      pGroup,
      [0, 0.74 + cl * 0.045, 0],
      cl * ((Math.PI * 2) / 3) + 0.4,
      0.24,
      0.86,
      cl === 2,
      pLeafMat,
      pLeafYoungMat,
      plantIndex,
      leafMeshes,
      droplets,
      patekSpots,
      severeSpots,
      cl === 1
    );
  }
  // Crown hanging red cabai keriting from upper stem
  attachChiliPod(ctx, plantGeos, pGroup, [0, 0.78, 0], 1.1, 0.08, mats.chiliRedMat, 1.02, severeSpots);

  plantsGroup.add(pGroup);
  plantRefs.push({
    plantIndex,
    terrace: plantIndex < 5 ? 'Teras Atas' : 'Teras Bawah',
    baseCondition,
    currentCondition: baseCondition,
    leafMat: pLeafMat,
    leafYoungMat: pLeafYoungMat,
    group: pGroup,
    phase,
    droplets,
    patekSpots,
    severeSpots,
    leafMeshes,
  });
};

plantCoords.forEach(([px, py, pz, scale, rotY], idx) => {
  buildCanonicalChiliPlant(idx, px, py, pz, scale, rotY, idx * 0.75);
});

// Tag non-leaf plant parts first, then ensure leaves still carry partId='chili_plant'
tagPart(plantsGroup, 'chili_plant');
  return { plantsGroup, plantRefs };
}
