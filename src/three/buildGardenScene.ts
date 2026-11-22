import * as THREE from 'three';
import { ACCENT_SWATCHES, LEAF_CONDITION_META } from '../data/parts';
import { getNightFactor } from '../simulation/riskEngine';
import {
  AccentId,
  LeafCondition,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../types/simulation';
import { createStylizedFactory } from './stylizedMaterial';

export interface PickResult {
  partId: PartId;
  leaf?: SelectedLeafInfo;
}

export interface GardenSceneController {
  scene: THREE.Scene;
  cameraAnchors: Record<PartId, THREE.Vector3>;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    weather: WeatherMode,
    accent: AccentId,
    exploded: boolean,
    showFov: boolean,
    selectedPart: PartId | null,
    selectedLeaf: SelectedLeafInfo | null
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => PickResult | null;
  dispose: () => void;
}

function tagPart(obj: THREE.Object3D, partId: PartId) {
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

export function buildGardenScene(): GardenSceneController {
  const scene = new THREE.Scene();
  const factory = createStylizedFactory();
  const geometries: THREE.BufferGeometry[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  // --- Lighting ---
  const hemiLight = new THREE.HemisphereLight('#fffdf6', '#5e6f9e', 1.15);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff5de', 1.75);
  sunLight.position.set(6, 9, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 28;
  sunLight.shadow.camera.left = -6.5;
  sunLight.shadow.camera.right = 6.5;
  sunLight.shadow.camera.top = 6.5;
  sunLight.shadow.camera.bottom = -6.5;
  sunLight.shadow.bias = -0.0008;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight('#b9ccf5', 0.45);
  fillLight.position.set(-5, 4, -5);
  scene.add(fillLight);

  // Night enclosure LED local glow
  const nodeGlow = new THREE.PointLight('#6cc29f', 0, 3.2);
  nodeGlow.position.set(-2.5, 1.65, -0.95);
  scene.add(nodeGlow);

  // --- Floor Cobalt-Indigo Shadow Catcher ---
  const shadowFloorMat = new THREE.ShadowMaterial({
    color: new THREE.Color('#41538f'),
    opacity: 0.34,
  });
  const shadowFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(36, 36)), shadowFloorMat);
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.82;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  // --- Shared Stylized Materials ---
  const gravelMat = factory.createToon('#a39b8e');
  const subsoilMat = factory.createToon('#b97e54');
  const topsoilMat = factory.createToon('#6c4830');
  const soilDryColor = new THREE.Color('#a87248');
  const soilWetColor = new THREE.Color('#3b271a');
  const bedSoilMat = factory.createToon('#8a5c3b');
  const mulchMat = factory.createToon('#373a42');
  const stoneMat = factory.createToon('#8e8980');
  const woodMat = factory.createToon('#9d6f46');
  const poleMat = factory.createToon('#d8d2c5');
  const boxBodyMat = factory.createToon('#f3efe4');
  const boxLidMat = factory.createToon('#f7f3e8', { transparent: true, opacity: 1 });
  const accentMat = factory.createToon('#6cc29f');
  const accentDarkMat = factory.createToon('#439675');
  const solarFrameMat = factory.createToon('#333846');
  const solarCellMat = factory.createToon('#29417d');
  const pipeMat = factory.createToon('#cfd7dc');
  const brassMat = factory.createToon('#d9a74a');
  const pcbGreenMat = factory.createToon('#3d8b63');
  const batteryBlueMat = factory.createToon('#4a77b5');
  const stemMat = factory.createToon('#594c34'); // woody lower trunk
  const branchMat = factory.createToon('#4f7336'); // green upper branches
  const chiliRedMat = factory.createToon('#d93824');
  const chiliOrangeMat = factory.createToon('#ee6c29');
  const chiliCreamMat = factory.createToon('#e9df93');
  const chiliGreenMat = factory.createToon('#5a9e3b');
  const blossomMat = factory.createToon('#fffdf7');
  const waterDropMat = factory.createToon('#66c7f4', { transparent: true, opacity: 0.9 });
  const patekSpotMat = new THREE.MeshBasicMaterial({ color: '#472d1b' });
  const ledOnMat = new THREE.MeshBasicMaterial({ color: '#4ade80' });
  const ledValveMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
  const ledCamMat = new THREE.MeshBasicMaterial({ color: '#f87171' });

  // =========================================================================
  // 1. 2-TIER TERRACED LEMBANG DIORAMA (`terrace`)
  // =========================================================================
  const terraceGroup = new THREE.Group();
  scene.add(terraceGroup);

  // Upper terrace cutaway block (back, z: -2.25..-0.1)
  const addStrataBlock = (
    parent: THREE.Group,
    w: number,
    d: number,
    yBottom: number,
    topY: number,
    posX: number,
    posZ: number
  ) => {
    const totalH = topY - yBottom;
    const h1 = totalH * 0.28;
    const h2 = totalH * 0.42;
    const h3 = totalH * 0.3;

    const g1 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h1, d)), gravelMat, 1.012);
    g1.position.set(posX, yBottom + h1 / 2, posZ);
    parent.add(g1);

    const g2 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h2, d)), subsoilMat, 1.012);
    g2.position.set(posX, yBottom + h1 + h2 / 2, posZ);
    parent.add(g2);

    const g3 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h3, d)), topsoilMat, 1.012);
    g3.position.set(posX, yBottom + h1 + h2 + h3 / 2, posZ);
    parent.add(g3);
  };

  // Upper terrace: width 7.4, depth 2.2, y from -0.8 to 0.25
  addStrataBlock(terraceGroup, 7.4, 2.2, -0.8, 0.25, 0, -1.1);
  // Lower terrace: width 7.4, depth 2.25, y from -0.8 to -0.18
  addStrataBlock(terraceGroup, 7.4, 2.25, -0.8, -0.18, 0, 1.125);

  // Retaining wall stones between upper and lower terrace (z = 0.0)
  for (let i = 0; i < 9; i++) {
    const sw = 0.78;
    const sh = 0.44 + (i % 2) * 0.05;
    const stone = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(sw, sh, 0.22)),
      i % 3 === 0 ? woodMat : stoneMat,
      1.035
    );
    stone.position.set(-3.2 + i * 0.8, -0.18 + sh / 2 - 0.02, 0.02);
    terraceGroup.add(stone);
  }

  // Wooden terrace step planks on the right path
  for (let s = 0; s < 2; s++) {
    const step = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.95, 0.1, 0.34)),
      woodMat,
      1.04
    );
    step.position.set(2.95, -0.1 + s * 0.18, 0.22 - s * 0.25);
    terraceGroup.add(step);
  }

  // Raised Soil Beds (Bedengan) + Mulch Strips on Upper & Lower Terraces
  const buildBedengan = (x: number, yBase: number, z: number, length: number) => {
    const bedGroup = new THREE.Group();
    const soilGeo = trackGeo(new THREE.BoxGeometry(length, 0.18, 1.05));
    const soilBlock = factory.createOutlinedMesh(soilGeo, bedSoilMat, 1.018);
    soilBlock.position.set(x, yBase + 0.09, z);
    bedGroup.add(soilBlock);

    // Mulch cover slightly narrower on top
    const mulchGeo = trackGeo(new THREE.BoxGeometry(length - 0.08, 0.03, 0.94));
    const mulch = factory.createOutlinedMesh(mulchGeo, mulchMat, 1.015);
    mulch.position.set(x, yBase + 0.19, z);
    bedGroup.add(mulch);

    terraceGroup.add(bedGroup);
  };

  buildBedengan(0.45, 0.25, -1.12, 4.9); // Upper terrace bed
  buildBedengan(0.45, -0.18, 1.08, 4.9); // Lower terrace bed

  tagPart(terraceGroup, 'terrace');

  // =========================================================================
  // 2. CHILI PLANTS (10 TALL BRANCHING CABAI RAWIT BUSHES) (`chili_plant`)
  // =========================================================================
  const plantsGroup = new THREE.Group();
  scene.add(plantsGroup);

  interface PlantAnimRef {
    plantIndex: number;
    terrace: 'Teras Atas' | 'Teras Bawah';
    baseCondition: LeafCondition;
    currentCondition: LeafCondition;
    leafMat: THREE.MeshToonMaterial;
    leafYoungMat: THREE.MeshToonMaterial;
    group: THREE.Group;
    phase: number;
    droplets: THREE.Mesh[];
    patekSpots: THREE.Mesh[];
    leafMeshes: THREE.Object3D[];
  }
  const plantRefs: PlantAnimRef[] = [];

  // Baseline condition distribution across the 10 plants (upper terrace 0..4, lower terrace 5..9)
  // Lower terrace naturally accumulates moisture & spores from upper terrace runoff
  const BASE_PLANT_CONDITIONS: LeafCondition[] = [
    'healthy',
    'yellowing',
    'healthy',
    'healthy',
    'wet_risk',
    'healthy',
    'wet_risk',
    'healthy',
    'yellowing',
    'patek_early',
  ];

  // Smooth ovate-lanceolate chili leaf in local +Z outward space (top surface = +Y)
  const createChiliLeafGeo = () => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.064, 0.042, 0.068, 0.135, 0, 0.225);
    shape.bezierCurveTo(-0.068, 0.135, -0.064, 0.042, 0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.008,
      bevelEnabled: false,
      curveSegments: 8,
    });
    // Rotate so leaf starts at (0,0,0), grows along +Z, thickness in Y
    geo.rotateX(Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const lz = pos.getZ(i);
      const t = THREE.MathUtils.clamp(lz / 0.225, 0, 1);
      // Natural gentle downward droop toward tip + subtle V-cupping along midrib
      const droop = -Math.pow(t, 1.8) * 0.048;
      const midribCup = Math.abs(lx) * 0.16;
      pos.setY(i, ly + droop + midribCup);
    }
    geo.computeVertexNormals();
    return trackGeo(geo);
  };

  // Smooth tapered cabai rawit pod via LatheGeometry
  const createChiliPodGeo = () => {
    const pts = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.021, 0.012),
      new THREE.Vector2(0.028, 0.036),
      new THREE.Vector2(0.024, 0.076),
      new THREE.Vector2(0.016, 0.122),
      new THREE.Vector2(0.007, 0.156),
      new THREE.Vector2(0.001, 0.172),
    ];
    return trackGeo(new THREE.LatheGeometry(pts, 10));
  };

  const leafGeo = createChiliLeafGeo();
  const chiliPodGeo = createChiliPodGeo();
  const petioleGeo = trackGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.046, 5));
  const jointGeo = trackGeo(new THREE.SphereGeometry(0.022, 8, 8));
  const calyxGeo = trackGeo(new THREE.CylinderGeometry(0.023, 0.012, 0.024, 7));
  const pedicelGeo = trackGeo(new THREE.CylinderGeometry(0.005, 0.007, 0.052, 5));
  const dropletGeo = trackGeo(new THREE.SphereGeometry(0.019, 6, 6));
  const spotGeo = trackGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.007, 7));

  const chiliPodMaterials = [chiliRedMat, chiliOrangeMat, chiliCreamMat, chiliGreenMat];

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

  // Attach a leaf cleanly FROM the branch surface outward along local +Z via a petiole
  const attachChiliLeaf = (
    parent: THREE.Object3D,
    pos: [number, number, number],
    rotY: number,
    pitch: number,
    leafScale: number,
    isYoung: boolean,
    pLeafMat: THREE.MeshToonMaterial,
    pLeafYoungMat: THREE.MeshToonMaterial,
    plantIndex: number,
    leafMeshes: THREE.Object3D[],
    droplets: THREE.Mesh[],
    patekSpots: THREE.Mesh[],
    addSpot: boolean
  ) => {
    const holder = new THREE.Group();
    holder.position.set(...pos);
    holder.rotation.y = rotY;

    const tilt = new THREE.Group();
    tilt.rotation.x = -pitch; // +pitch lifts leaf tip upward; -pitch droops
    tilt.scale.setScalar(leafScale);

    // Petiole starts exactly at branch center (0) and extends outward to +0.046 along +Z
    const petiole = factory.createOutlinedMesh(petioleGeo, branchMat, 1.12);
    petiole.rotation.x = Math.PI / 2;
    petiole.position.set(0, 0, 0.023);
    tilt.add(petiole);

    // Leaf blade begins cleanly at petiole tip (z = 0.042)
    const leaf = factory.createOutlinedMesh(leafGeo, isYoung ? pLeafYoungMat : pLeafMat, 1.08);
    leaf.position.set(0, 0.002, 0.042);
    const leafIndex = leafMeshes.length;
    leaf.traverse((obj) => {
      obj.userData.isLeaf = true;
      obj.userData.plantIndex = plantIndex;
      obj.userData.leafIndex = leafIndex;
    });
    leafMeshes.push(leaf);
    tilt.add(leaf);

    // Leaf wetness bead sitting on TOP (+Y) surface of the leaf
    const drop = new THREE.Mesh(dropletGeo, waterDropMat);
    drop.position.set(0.008, 0.014, 0.145);
    drop.scale.setScalar(0.001);
    tilt.add(drop);
    droplets.push(drop);

    if (addSpot) {
      const spot = new THREE.Mesh(spotGeo, patekSpotMat);
      spot.position.set(-0.008, 0.009, 0.135);
      spot.scale.setScalar(0.001);
      tilt.add(spot);
      patekSpots.push(spot);
    }

    holder.add(tilt);
    parent.add(holder);
  };

  // Attach upright / angled cabai rawit pod with pedicel anchored cleanly at (0,0,0) on twig
  const attachChiliPod = (
    parent: THREE.Object3D,
    pos: [number, number, number],
    tiltX: number,
    tiltZ: number,
    mat: THREE.Material,
    podScale = 1
  ) => {
    const podGroup = new THREE.Group();
    podGroup.position.set(...pos);
    podGroup.rotation.set(tiltX, 0, tiltZ);
    podGroup.scale.setScalar(podScale);

    const pedicel = factory.createOutlinedMesh(pedicelGeo, branchMat, 1.14);
    pedicel.position.y = 0.026;
    podGroup.add(pedicel);

    const calyx = factory.createOutlinedMesh(calyxGeo, branchMat, 1.12);
    calyx.position.y = 0.056;
    podGroup.add(calyx);

    const pod = factory.createOutlinedMesh(chiliPodGeo, mat, 1.1);
    pod.position.y = 0.064;
    podGroup.add(pod);

    parent.add(podGroup);
  };

  // Single canonical chili tree builder reused for all 10 plants
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

    const pGroup = new THREE.Group();
    pGroup.position.set(px, py, pz);
    pGroup.rotation.y = rotY;
    pGroup.scale.setScalar(scale);

    // Planting hole soil ring on mulch
    const holeRing = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 10)),
      bedSoilMat,
      1.04
    );
    holeRing.position.y = 0.005;
    pGroup.add(holeRing);

    // Woody main lower trunk (y = 0 .. 0.35)
    const trunk = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.022, 0.036, 0.35, 7)),
      stemMat,
      1.09
    );
    trunk.position.y = 0.175;
    pGroup.add(trunk);

    // Main fork junction node at y = 0.35
    const mainForkJoint = factory.createOutlinedMesh(jointGeo, stemMat, 1.08);
    mainForkJoint.position.y = 0.35;
    pGroup.add(mainForkJoint);

    const droplets: THREE.Mesh[] = [];
    const patekSpots: THREE.Mesh[] = [];
    const leafMeshes: THREE.Object3D[] = [];

    // 2 small lower-stem leaves protruding cleanly outward
    attachChiliLeaf(pGroup, [0, 0.24, 0], 0.5, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, false);
    attachChiliLeaf(pGroup, [0, 0.29, 0], 3.6, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, false);

    // 3 symmetric Primary Fork Limbs (0°, 120°, 240°) curving outward at 31°
    for (let b = 0; b < 3; b++) {
      const yaw = (b / 3) * Math.PI * 2;
      const primaryGroup = new THREE.Group();
      primaryGroup.position.set(0, 0.35, 0);
      primaryGroup.rotation.y = yaw;

      const limbPivot = new THREE.Group();
      limbPivot.rotation.z = -0.54; // local +X is outward!

      const limb = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.015, 0.021, 0.36, 6)),
        stemMat,
        1.1
      );
      limb.position.y = 0.18;
      limbPivot.add(limb);

      // Limb tip fork joint at y = 0.36
      const limbJoint = factory.createOutlinedMesh(jointGeo, branchMat, 1.08);
      limbJoint.scale.setScalar(0.72);
      limbJoint.position.y = 0.36;
      limbPivot.add(limbJoint);

      // 2 mid-limb leaves pointing tangential-outward (+Z/+X and -Z/+X, never inward!)
      attachChiliLeaf(limbPivot, [0, 0.18, 0], 0.45, 0.18, 0.9, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, b === 0);
      attachChiliLeaf(limbPivot, [0, 0.27, 0], Math.PI - 0.45, 0.18, 0.88, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, false);

      // 2 Secondary Twigs fanning sideways-upward from limb tip (y = 0.36)
      for (let s = 0; s < 2; s++) {
        const subYaw = new THREE.Group();
        subYaw.position.set(0, 0.36, 0);
        subYaw.rotation.y = s === 0 ? 0.55 : -0.55;

        const subTilt = new THREE.Group();
        subTilt.rotation.z = 0.24; // curves gracefully back up toward sky

        const subTwig = factory.createOutlinedMesh(
          trackGeo(new THREE.CylinderGeometry(0.009, 0.014, 0.32, 6)),
          branchMat,
          1.12
        );
        subTwig.position.y = 0.16;
        subTilt.add(subTwig);

        // 3 upper-twig leaves pointing strictly outward/tangential (Math.PI/2 = +X outward)
        attachChiliLeaf(subTilt, [0, 0.13, 0], s === 0 ? 0.25 : Math.PI - 0.25, 0.16, 0.95, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, s === 0);
        attachChiliLeaf(subTilt, [0, 0.21, 0], Math.PI / 2, 0.22, 0.92, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, false);
        attachChiliLeaf(subTilt, [0, 0.27, 0], s === 0 ? Math.PI - 0.3 : 0.3, 0.26, 0.82, true, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, false);

        // Upright Cabai Rawit fruit anchored at exact twig apex (0, 0.31, 0)
        const podMat = chiliPodMaterials[(b * 2 + s) % chiliPodMaterials.length];
        attachChiliPod(subTilt, [0, 0.31, 0], s === 0 ? 0.08 : -0.1, -0.08, podMat, 0.98);

        // Side blossom or secondary pod anchored right on twig node (y = 0.22)
        if ((b + s) % 2 === 0) {
          attachChiliPod(
            subTilt,
            [0, 0.22, 0],
            s === 0 ? 0.35 : -0.35,
            -0.42,
            chiliPodMaterials[(b + s + 1) % chiliPodMaterials.length],
            0.84
          );
        } else {
          const flowerStem = new THREE.Group();
          flowerStem.position.set(0, 0.23, 0);
          flowerStem.rotation.z = -0.6;
          const fPed = factory.createOutlinedMesh(petioleGeo, branchMat, 1.12);
          fPed.position.y = 0.022;
          flowerStem.add(fPed);
          const flower = factory.createOutlinedMesh(
            trackGeo(new THREE.OctahedronGeometry(0.025, 0)),
            blossomMat,
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

    // Central upright leader shoot rising above the fork (y = 0.35 .. 0.85)
    const centerLeader = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.01, 0.017, 0.5, 6)),
      branchMat,
      1.12
    );
    centerLeader.position.y = 0.6;
    pGroup.add(centerLeader);

    // Top crown rosette well above side limbs (y = 0.72 .. 0.83)
    for (let cl = 0; cl < 3; cl++) {
      attachChiliLeaf(
        pGroup,
        [0, 0.72 + cl * 0.045, 0],
        cl * ((Math.PI * 2) / 3) + 0.4,
        0.25,
        0.86,
        cl === 2,
        pLeafMat,
        pLeafYoungMat,
        plantIndex,
        leafMeshes,
        droplets,
        patekSpots,
        cl === 1
      );
    }
    // Crown red cabai rawit right at the apex (y = 0.84)
    attachChiliPod(pGroup, [0, 0.84, 0], 0.06, -0.05, chiliRedMat, 1.06);

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
      leafMeshes,
    });
  };

  plantCoords.forEach(([px, py, pz, scale, rotY], idx) => {
    buildCanonicalChiliPlant(idx, px, py, pz, scale, rotY, idx * 0.75);
  });

  // Tag non-leaf plant parts first, then ensure leaves still carry partId='chili_plant'
  tagPart(plantsGroup, 'chili_plant');

  // =========================================================================
  // 3. WATER DRUM + PUMP (`pump`) & SOLENOID + IRRIGATION PIPES (`solenoid`)
  // =========================================================================
  const pumpGroup = new THREE.Group();
  scene.add(pumpGroup);

  // Water buffer barrel on left upper terrace
  const drum = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.72, 14)),
    accentMat,
    1.035
  );
  drum.position.set(-3.15, 0.61, 0.35);
  pumpGroup.add(drum);

  const drumLid = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.375, 0.375, 0.07, 14)),
    solarFrameMat,
    1.035
  );
  drumLid.position.set(-3.15, 0.98, 0.35);
  pumpGroup.add(drumLid);

  // Micro diaphragm pump next to drum
  const pumpBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.3, 0.22, 0.22)),
    solarFrameMat,
    1.05
  );
  pumpBody.position.set(-2.62, 0.38, 0.35);
  pumpGroup.add(pumpBody);

  tagPart(pumpGroup, 'pump');

  // Solenoid & pipe network
  const irrigationGroup = new THREE.Group();
  scene.add(irrigationGroup);

  // Main pipe from pump to solenoid
  const pipeIn = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.7, 8)),
    pipeMat,
    1.1
  );
  pipeIn.rotation.z = Math.PI / 2;
  pipeIn.position.set(-2.3, 0.38, 0.24);
  irrigationGroup.add(pipeIn);

  // Solenoid Valve assembly (`solenoid`)
  const solenoidGroup = new THREE.Group();
  solenoidGroup.position.set(-1.98, 0.38, 0.22);
  const valveBrass = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.12, 0.14)),
    brassMat,
    1.07
  );
  solenoidGroup.add(valveBrass);

  const valveCoil = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.13, 0.16, 0.13)),
    accentDarkMat,
    1.07
  );
  valveCoil.position.y = 0.13;
  solenoidGroup.add(valveCoil);

  const valveLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.024, 8, 8)), ledValveMat);
  valveLed.position.set(0.07, 0.18, 0.07);
  solenoidGroup.add(valveLed);
  irrigationGroup.add(solenoidGroup);

  // Manifold feeding upper bed (z = -0.68) and lower bed (z = 0.62)
  const crossPipe = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 8)),
    pipeMat,
    1.12
  );
  crossPipe.rotation.x = Math.PI / 2;
  crossPipe.position.set(-1.82, 0.32, 0.02);
  irrigationGroup.add(crossPipe);

  // Upper bed drip line
  const upperLine = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
    pipeMat,
    1.12
  );
  upperLine.rotation.z = Math.PI / 2;
  upperLine.position.set(0.5, 0.47, -0.72);
  irrigationGroup.add(upperLine);

  // Step down connector + Lower bed drip line
  const downPipe = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.45, 8)),
    pipeMat,
    1.12
  );
  downPipe.position.set(-1.82, 0.16, 0.66);
  irrigationGroup.add(downPipe);

  const lowerLine = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
    pipeMat,
    1.12
  );
  lowerLine.rotation.z = Math.PI / 2;
  lowerLine.position.set(0.5, 0.04, 0.66);
  irrigationGroup.add(lowerLine);

  // 6 Micro-sprayer / drip emitters along both beds
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
      solarFrameMat,
      1.12
    );
    riser.position.set(ex, ey - 0.02, ez);
    irrigationGroup.add(riser);

    const nozzle = factory.createOutlinedMesh(
      trackGeo(new THREE.ConeGeometry(0.032, 0.05, 6)),
      brassMat,
      1.12
    );
    nozzle.position.set(ex, ey + 0.07, ez);
    irrigationGroup.add(nozzle);
  });

  tagPart(irrigationGroup, 'solenoid');

  // --- Animated Water Spray Particles ---
  const sprayCount = 72;
  const sprayDrops: Array<{ mesh: THREE.Mesh; emitterIdx: number; phase: number; spreadX: number; spreadZ: number }> = [];
  const sprayGroup = new THREE.Group();
  scene.add(sprayGroup);
  const sprayDropGeo = trackGeo(new THREE.SphereGeometry(0.024, 6, 6));
  for (let i = 0; i < sprayCount; i++) {
    const m = new THREE.Mesh(sprayDropGeo, waterDropMat);
    m.visible = false;
    sprayGroup.add(m);
    const angle = (i * 2.399) % (Math.PI * 2);
    sprayDrops.push({
      mesh: m,
      emitterIdx: i % emitterPositions.length,
      phase: (i / sprayCount) % 1,
      spreadX: Math.cos(angle) * (0.28 + (i % 3) * 0.11),
      spreadZ: Math.sin(angle) * 0.35 - 0.25,
    });
  }

  // --- Rain Streaks (when weather === 'rainy') ---
  const rainCount = 70;
  const rainStreaks: Array<{ mesh: THREE.Mesh; x: number; z: number; phase: number }> = [];
  const rainGeo = trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 4));
  const rainGroup = new THREE.Group();
  scene.add(rainGroup);
  for (let i = 0; i < rainCount; i++) {
    const rm = new THREE.Mesh(rainGeo, waterDropMat);
    rm.visible = false;
    rainGroup.add(rm);
    rainStreaks.push({
      mesh: rm,
      x: ((i * 1.73) % 6.8) - 3.4,
      z: ((i * 2.41) % 4.2) - 2.1,
      phase: (i * 0.137) % 1,
    });
  }

  // =========================================================================
  // 4. AIoT NODE POLE & SENSORS (`solar`, `enclosure`, `esp32cam`, `dht22`, `soil_probe`)
  // =========================================================================
  const poleX = -2.75;
  const poleZ = -1.2;

  // Pole base + mast (attached to enclosure group)
  const enclosureGroup = new THREE.Group();
  scene.add(enclosureGroup);

  const footing = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.36)),
    stoneMat,
    1.04
  );
  footing.position.set(poleX, 0.32, poleZ);
  enclosureGroup.add(footing);

  const mast = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.06, 2.25, 10)),
    poleMat,
    1.06
  );
  mast.position.set(poleX, 1.42, poleZ);
  enclosureGroup.add(mast);

  // Main Weatherproof Box (with Exploded / Cutaway internals!)
  const boxCore = new THREE.Group();
  boxCore.position.set(poleX + 0.14, 1.52, poleZ);
  enclosureGroup.add(boxCore);

  const boxBack = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.34, 0.44, 0.36)),
    boxBodyMat,
    1.035
  );
  boxCore.add(boxBack);

  const boxDoor = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.05, 0.42, 0.34)),
    boxLidMat,
    1.035
  );
  boxDoor.position.set(0.18, 0, 0);
  boxCore.add(boxDoor);

  const boxBand = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.055, 0.1, 0.35)),
    accentMat,
    1.04
  );
  boxBand.position.set(0.185, 0.12, 0);
  boxCore.add(boxBand);

  // Status LEDs on front door
  const onLedMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.02, 8, 8)), ledOnMat);
  onLedMesh.position.set(0.21, 0.14, 0.1);
  boxCore.add(onLedMesh);

  // Internal modules inside box (slide outward when exploded!)
  const esp32Board = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.04, 0.18, 0.12)),
    pcbGreenMat,
    1.06
  );
  esp32Board.position.set(0.02, 0.07, -0.07);
  boxCore.add(esp32Board);

  const relayMod = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.05, 0.13, 0.11)),
    accentDarkMat,
    1.06
  );
  relayMod.position.set(0.02, -0.09, -0.07);
  boxCore.add(relayMod);

  const batteryPack = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 10)),
    batteryBlueMat,
    1.06
  );
  batteryPack.position.set(-0.02, -0.04, 0.08);
  boxCore.add(batteryPack);

  const sdModule = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.03, 0.09, 0.08)),
    brassMat,
    1.07
  );
  sdModule.position.set(0.02, 0.1, 0.08);
  boxCore.add(sdModule);

  tagPart(enclosureGroup, 'enclosure');

  // --- Solar Panel (`solar`) ---
  const solarGroup = new THREE.Group();
  solarGroup.position.set(poleX, 2.55, poleZ);
  const solarTilt = new THREE.Group();
  solarTilt.rotation.z = -0.35;
  solarTilt.rotation.x = 0.25;

  const panelFrame = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.74, 0.05, 0.56)),
    solarFrameMat,
    1.035
  );
  solarTilt.add(panelFrame);

  const panelCells = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.66, 0.02, 0.48)),
    solarCellMat,
    1.02
  );
  panelCells.position.y = 0.025;
  solarTilt.add(panelCells);

  solarGroup.add(solarTilt);
  scene.add(solarGroup);
  tagPart(solarGroup, 'solar');

  // --- ESP32-CAM (`esp32cam`) ---
  const camGroup = new THREE.Group();
  camGroup.position.set(poleX + 0.34, 1.88, poleZ + 0.22);
  scene.add(camGroup);

  const camArm = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8)),
    poleMat,
    1.08
  );
  camArm.rotation.z = Math.PI / 2;
  camArm.rotation.y = -0.45;
  camArm.position.set(-0.18, 0, -0.1);
  camGroup.add(camArm);

  const camHead = new THREE.Group();
  camHead.rotation.z = -0.48;
  camHead.rotation.y = -0.12;
  const camBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.14, 0.14)),
    solarFrameMat,
    1.06
  );
  camHead.add(camBody);

  const camLens = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.04, 0.06, 10)),
    accentMat,
    1.08
  );
  camLens.rotation.z = Math.PI / 2;
  camLens.position.x = 0.1;
  camHead.add(camLens);

  const camLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.016, 8, 8)), ledCamMat);
  camLed.position.set(0.095, 0.045, 0.045);
  camHead.add(camLed);

  // Translucent Camera FOV Frustum aimed at upper chili canopy
  const fovGeo = trackGeo(new THREE.ConeGeometry(0.92, 2.2, 4, 1, true));
  const fovMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ef6a4c'),
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fovCone = new THREE.Mesh(fovGeo, fovMat);
  fovCone.rotation.z = Math.PI / 2;
  fovCone.rotation.x = Math.PI / 4;
  fovCone.position.set(1.18, 0, 0);
  camHead.add(fovCone);

  const fovEdges = new THREE.LineSegments(
    trackGeo(new THREE.EdgesGeometry(fovGeo)),
    new THREE.LineBasicMaterial({ color: '#ef6a4c', transparent: true, opacity: 0.65 })
  );
  fovEdges.rotation.copy(fovCone.rotation);
  fovEdges.position.copy(fovCone.position);
  camHead.add(fovEdges);

  camGroup.add(camHead);
  tagPart(camGroup, 'esp32cam');

  // --- DHT22 / BME280 Canopy Radiation Shield (`dht22`) ---
  const dhtGroup = new THREE.Group();
  scene.add(dhtGroup);

  // Slim extension arm from pole toward canopy height
  const dhtBoom = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 1.7, 6)),
    poleMat,
    1.1
  );
  dhtBoom.rotation.z = Math.PI / 2;
  dhtBoom.rotation.y = -0.21;
  dhtBoom.position.set(-1.95, 1.24, -1.03);
  dhtGroup.add(dhtBoom);

  const shieldPos = new THREE.Vector3(-1.12, 1.11, -0.86);
  for (let plate = 0; plate < 4; plate++) {
    const disc = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.025, 12)),
      boxBodyMat,
      1.06
    );
    disc.position.set(shieldPos.x, shieldPos.y + plate * 0.048, shieldPos.z);
    dhtGroup.add(disc);
  }
  const dhtCore = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.07, 0.13, 0.07)),
    accentMat,
    1.07
  );
  dhtCore.position.set(shieldPos.x, shieldPos.y + 0.07, shieldPos.z);
  dhtGroup.add(dhtCore);

  tagPart(dhtGroup, 'dht22');

  // --- Capacitive Soil Moisture Probe (`soil_probe`) ---
  const soilProbeGroup = new THREE.Group();
  scene.add(soilProbeGroup);

  const probePos = new THREE.Vector3(-0.25, 0.48, -0.62);
  const probeHead = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.08, 0.09, 0.04)),
    solarFrameMat,
    1.08
  );
  probeHead.position.set(probePos.x, probePos.y + 0.09, probePos.z);
  soilProbeGroup.add(probeHead);

  const probeBlade = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.055, 0.14, 0.018)),
    pcbGreenMat,
    1.08
  );
  probeBlade.position.set(probePos.x, probePos.y, probePos.z);
  soilProbeGroup.add(probeBlade);

  // Cable connecting soil probe back to pole
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(probePos.x, probePos.y + 0.11, probePos.z),
    new THREE.Vector3(-1.1, 0.49, -0.68),
    new THREE.Vector3(-2.1, 0.48, -0.98),
    new THREE.Vector3(poleX + 0.1, 1.32, poleZ),
  ]);
  const cableMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(cableCurve, 20, 0.014, 6, false)),
    solarFrameMat
  );
  soilProbeGroup.add(cableMesh);
  tagPart(soilProbeGroup, 'soil_probe');

  // =========================================================================
  // 5. CELESTIAL SUN/MOON DISC & HIGHLAND NIGHT DEW/MIST
  // =========================================================================
  const sunMat = new THREE.MeshBasicMaterial({ color: '#e6b83a' });
  const celestialDisc = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 14, 14)), sunMat);
  celestialDisc.position.set(4, 6, -4);
  scene.add(celestialDisc);

  // Subtle floating dew/fog puffs over canopy at night/foggy weather
  const mistPuffs: Array<{ mesh: THREE.Mesh; baseX: number; baseZ: number; phase: number }> = [];
  const mistGeo = trackGeo(new THREE.CylinderGeometry(0.55, 0.68, 0.09, 10));
  const mistMat = new THREE.MeshBasicMaterial({
    color: '#dce6f7',
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const mistGroup = new THREE.Group();
  scene.add(mistGroup);
  for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(mistGeo, mistMat);
    const bx = -1.6 + (i % 4) * 1.35;
    const bz = i < 4 ? -1.1 : 1.05;
    puff.position.set(bx, i < 4 ? 0.95 : 0.52, bz);
    mistGroup.add(puff);
    mistPuffs.push({ mesh: puff, baseX: bx, baseZ: bz, phase: i * 0.9 });
  }

  // Selection indicator ring + leaf marker sphere
  const selectRingGeo = trackGeo(new THREE.RingGeometry(0.26, 0.34, 24));
  const selectRingMat = new THREE.MeshBasicMaterial({
    color: '#ef6a4c',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const selectRing = new THREE.Mesh(selectRingGeo, selectRingMat);
  selectRing.rotation.x = -Math.PI / 2;
  selectRing.visible = false;
  scene.add(selectRing);

  const leafHighlightGeo = trackGeo(new THREE.RingGeometry(0.075, 0.11, 18));
  const leafHighlightRing = new THREE.Mesh(leafHighlightGeo, selectRingMat);
  leafHighlightRing.rotation.x = -Math.PI / 2;
  leafHighlightRing.visible = false;
  scene.add(leafHighlightRing);
  const tempLeafPos = new THREE.Vector3();

  const cameraAnchors: Record<PartId, THREE.Vector3> = {
    solar: new THREE.Vector3(poleX, 2.55, poleZ),
    enclosure: new THREE.Vector3(poleX + 0.14, 1.52, poleZ),
    esp32cam: new THREE.Vector3(poleX + 0.34, 1.88, poleZ + 0.22),
    dht22: new THREE.Vector3(-1.12, 1.15, -0.86),
    soil_probe: new THREE.Vector3(-0.25, 0.52, -0.62),
    solenoid: new THREE.Vector3(-1.98, 0.45, 0.22),
    pump: new THREE.Vector3(-3.0, 0.72, 0.35),
    terrace: new THREE.Vector3(0.4, 0.1, 0.1),
    chili_plant: new THREE.Vector3(0.45, 1.22, -1.12),
  };

  // Helper colors for smooth Day <-> Night interpolation
  const daySunColor = new THREE.Color('#fff5de');
  const duskSunColor = new THREE.Color('#ffae6b');
  const nightMoonColor = new THREE.Color('#86a4e8');
  const dayHemiSky = new THREE.Color('#fffdf6');
  const nightHemiSky = new THREE.Color('#6f87c9');
  const dayHemiGround = new THREE.Color('#6375ab');
  const nightHemiGround = new THREE.Color('#273357');
  const dayShadowColor = new THREE.Color('#41538f');
  const nightShadowColor = new THREE.Color('#0b101d');
  const dayOutlineColor = new THREE.Color('#231e16');
  const nightOutlineColor = new THREE.Color('#101420');

  let explodeLerp = 0;

  const update = (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    weather: WeatherMode,
    accent: AccentId,
    exploded: boolean,
    showFov: boolean,
    selectedPart: PartId | null,
    selectedLeaf: SelectedLeafInfo | null
  ) => {
    // 1. Apply Risograph Accent Swatch
    const swatch = ACCENT_SWATCHES.find((s) => s.id === accent) ?? ACCENT_SWATCHES[0];
    accentMat.color.set(swatch.hex);
    accentDarkMat.color.set(swatch.darkHex);

    // 2. Day / Dusk / Night Lighting & Celestial Arc
    const h = metrics.timeHours;
    const night = getNightFactor(h);
    const duskGlow = Math.max(0, 1 - Math.abs(h - 17.7) / 1.5) + Math.max(0, 1 - Math.abs(h - 6.0) / 1.4);
    const clampedDusk = Math.min(1, duskGlow);

    // Sun angle during 6..18, Moon angle during 18..6
    const isDayArc = h >= 6 && h <= 18;
    const arcProgress = isDayArc ? (h - 6) / 12 : ((h >= 18 ? h - 18 : h + 6) / 12);
    const theta = arcProgress * Math.PI;
    const lightX = -Math.cos(theta) * 7.5;
    const lightY = Math.max(2.2, Math.sin(theta) * 8.5);
    const lightZ = 4.2 - night * 1.4;
    sunLight.position.set(lightX, lightY, lightZ);
    celestialDisc.position.set(lightX * 0.72, lightY * 0.68 + 0.5, -3.5);
    sunMat.color.copy(isDayArc ? (clampedDusk > 0.35 ? duskSunColor : daySunColor) : nightMoonColor);

    const weatherDim = weather === 'sunny' ? 1 : weather === 'foggy' ? 0.72 : 0.58;
    sunLight.color
      .copy(daySunColor)
      .lerp(duskSunColor, clampedDusk * 0.65)
      .lerp(nightMoonColor, night);
    sunLight.intensity = THREE.MathUtils.lerp(1.75, 0.85, night) * weatherDim;

    hemiLight.color.copy(dayHemiSky).lerp(nightHemiSky, night);
    hemiLight.groundColor.copy(dayHemiGround).lerp(nightHemiGround, night);
    hemiLight.intensity = THREE.MathUtils.lerp(1.2, 0.78, night);

    shadowFloorMat.color.copy(dayShadowColor).lerp(nightShadowColor, night);
    shadowFloorMat.opacity = THREE.MathUtils.lerp(0.34, 0.48, night) * weatherDim;

    factory.outlineMaterial.color.copy(dayOutlineColor).lerp(nightOutlineColor, night);

    // Night LED glows
    nodeGlow.intensity = night > 0.35 ? 1.15 * night : 0.15;
    ledValveMat.color.set(metrics.isWatering ? '#4ade80' : metrics.lastDecision === 'TUNDA' ? '#fb923c' : '#facc15');
    ledCamMat.color.set(metrics.patekRiskPct >= 65 ? '#ef4444' : '#64748b');

    // 3. Soil Moisture Color + Leaf Wetness + Patek Spots + Plant Sway
    const soilT = THREE.MathUtils.clamp((metrics.soilMoisturePct - 18) / 68, 0, 1);
    bedSoilMat.color.copy(soilDryColor).lerp(soilWetColor, soilT);

    const dropScale = THREE.MathUtils.clamp(metrics.leafWetnessPct / 75, 0.001, 1.15);
    const globalSpotScale =
      metrics.symptomSeverity > 0.1 ? THREE.MathUtils.clamp(metrics.symptomSeverity * 1.4, 0.001, 1.25) : 0.001;

    plantRefs.forEach((pr) => {
      const sway = Math.sin(elapsed * 1.65 + pr.phase) * (weather === 'rainy' ? 0.055 : 0.025);
      pr.group.rotation.z = sway;
      pr.group.rotation.x = Math.cos(elapsed * 1.2 + pr.phase) * 0.015;

      // Dynamic condition escalation based on baseline + simulation risk/wetness
      let cond: LeafCondition = pr.baseCondition;
      if (metrics.symptomSeverity >= 0.45 || metrics.patekRiskPct >= 78) {
        if (cond === 'yellowing') cond = 'patek_early';
        else if (cond === 'wet_risk') cond = 'yellowing';
        else if (cond === 'healthy' && pr.plantIndex >= 5) cond = 'yellowing';
      } else if (metrics.leafWetnessPct >= 45 || (night > 0.5 && metrics.relativeHumidity >= 86)) {
        if (cond === 'healthy') cond = 'wet_risk';
      }
      pr.currentCondition = cond;

      const meta = LEAF_CONDITION_META[cond];
      pr.leafMat.color.set(meta.leafHex);
      pr.leafYoungMat.color.set(meta.leafYoungHex);

      // Patek spots appear on patek_early plants immediately, or across canopy as global severity grows
      const perPlantSpotScale =
        cond === 'patek_early' ? Math.max(0.85, globalSpotScale) : cond === 'yellowing' ? Math.max(0.42, globalSpotScale) : globalSpotScale;

      pr.droplets.forEach((d) => d.scale.setScalar(cond === 'wet_risk' ? Math.max(0.55, dropScale) : dropScale));
      pr.patekSpots.forEach((s) => s.scale.setScalar(perPlantSpotScale));
    });

    // 4. Watering Spray Particles
    sprayDrops.forEach((sd) => {
      if (!metrics.isWatering) {
        sd.mesh.visible = false;
        return;
      }
      sd.mesh.visible = true;
      sd.phase = (sd.phase + dt * 1.85) % 1;
      const [ex, ey, ez] = emitterPositions[sd.emitterIdx];
      const t = sd.phase;
      sd.mesh.position.set(
        ex + sd.spreadX * t,
        ey + 0.08 + Math.sin(t * Math.PI) * 0.24 - t * 0.28,
        ez + sd.spreadZ * t
      );
      sd.mesh.scale.setScalar(1 - t * 0.35);
    });

    // 5. Rain Animation
    rainStreaks.forEach((rs) => {
      if (weather !== 'rainy') {
        rs.mesh.visible = false;
        return;
      }
      rs.mesh.visible = true;
      rs.phase = (rs.phase + dt * 2.6) % 1;
      rs.mesh.position.set(rs.x, 3.2 - rs.phase * 3.5, rs.z);
    });

    // 6. Highland Mist / Dew Puffs
    const mistStrength = Math.max(
      weather === 'foggy' ? 0.34 : 0,
      night > 0.45 && metrics.relativeHumidity > 82 ? (night - 0.35) * 0.35 : 0
    );
    mistMat.opacity = mistStrength;
    mistGroup.visible = mistStrength > 0.02;
    if (mistGroup.visible) {
      mistPuffs.forEach((mp) => {
        mp.mesh.position.x = mp.baseX + Math.sin(elapsed * 0.4 + mp.phase) * 0.22;
      });
    }

    // 7. Exploded Node / See-Through Enclosure Animation
    const targetExplode = exploded ? 1 : 0;
    explodeLerp = THREE.MathUtils.lerp(explodeLerp, targetExplode, Math.min(1, dt * 8));
    boxDoor.position.x = 0.18 + explodeLerp * 0.55;
    boxBand.position.x = 0.185 + explodeLerp * 0.55;
    boxLidMat.opacity = 1 - explodeLerp * 0.58;
    esp32Board.position.x = 0.02 + explodeLerp * 0.32;
    relayMod.position.x = 0.02 + explodeLerp * 0.24;
    batteryPack.position.x = -0.02 + explodeLerp * 0.16;
    sdModule.position.x = 0.02 + explodeLerp * 0.38;

    // 8. ESP32-CAM FOV Cone
    fovCone.visible = showFov || selectedPart === 'esp32cam';
    fovEdges.visible = fovCone.visible;

    // 9. Selection Marker Ring + Leaf Highlight
    if (selectedLeaf) {
      const pr = plantRefs[selectedLeaf.plantIndex];
      const leafObj = pr?.leafMeshes[selectedLeaf.leafIndex];
      if (leafObj) {
        leafObj.getWorldPosition(tempLeafPos);
        leafHighlightRing.visible = true;
        leafHighlightRing.position.set(tempLeafPos.x, tempLeafPos.y + 0.08, tempLeafPos.z);
        leafHighlightRing.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.15);
      } else {
        leafHighlightRing.visible = false;
      }
      selectRing.visible = false;
    } else if (selectedPart) {
      leafHighlightRing.visible = false;
      const anchor = cameraAnchors[selectedPart];
      selectRing.visible = true;
      selectRing.position.set(anchor.x, anchor.y - 0.16, anchor.z);
      const pulse = 1 + Math.sin(elapsed * 4.5) * 0.12;
      selectRing.scale.setScalar(pulse);
    } else {
      selectRing.visible = false;
      leafHighlightRing.visible = false;
    }
  };

  const pickPart = (raycaster: THREE.Raycaster): PickResult | null => {
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      if (!hit.object.visible) continue;
      if (hit.object.userData?.isLeaf) {
        const plantIndex = hit.object.userData.plantIndex as number;
        const leafIndex = hit.object.userData.leafIndex as number;
        const pr = plantRefs[plantIndex];
        const condition = pr?.currentCondition ?? 'healthy';
        return {
          partId: 'chili_plant',
          leaf: {
            plantIndex,
            leafIndex,
            terrace: pr?.terrace ?? 'Teras Atas',
            condition,
            colorHex: LEAF_CONDITION_META[condition].leafHex,
          },
        };
      }
      const partId = hit.object.userData?.partId as PartId | undefined;
      if (partId) return { partId };
    }
    return null;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    patekSpotMat.dispose();
    ledOnMat.dispose();
    ledValveMat.dispose();
    ledCamMat.dispose();
    sunMat.dispose();
    mistMat.dispose();
    fovMat.dispose();
    selectRingMat.dispose();
    shadowFloorMat.dispose();
    factory.dispose();
  };

  return {
    scene,
    cameraAnchors,
    update,
    pickPart,
    dispose,
  };
}
