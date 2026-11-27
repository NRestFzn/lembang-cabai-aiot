import * as THREE from 'three';
import { ACCENT_SWATCHES, LEAF_CONDITION_META } from '../data/parts';
import { evaluateCanopyLeafCondition, getNightFactor } from '../simulation/riskEngine';
import {
  AccentId,
  LeafCondition,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../types/simulation';
import {
  createCanvasDecal,
  createHardwareModulesKit,
  createRoundedBoxGeo,
} from './hardwareModules';
import { createStylizedFactory } from './stylizedMaterial';

export interface PickResult {
  partId: PartId;
  leaf?: SelectedLeafInfo;
}

export interface HotspotItem {
  key: string;
  kind: 'part' | 'leaf';
  partId: PartId;
  worldPos: [number, number, number];
  leaf?: SelectedLeafInfo;
  ringColor?: string;
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
  getHotspots: () => HotspotItem[];
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
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Real 3D Hardware Modules Kit shared with Rangkaian Prototype & Alat Asli
  const {
    modules: {
      espGroup,
      lmGroup,
      bmeGroup,
      soilGroup,
      dsGroup,
      sdGroup,
      camGroup: realCamMod,
      relayGroup,
      pumpGroup: realPumpMod,
      solGroup: realSolMod,
      solarGroup: realSolarMod,
      mpptGroup,
      batGroup,
    },
    materials: { ledMat, greenLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
  } = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });

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
  const pipeMat = factory.createToon('#cfd7dc');
  const brassMat = factory.createToon('#d9a74a');
  const stemMat = factory.createToon('#594c34'); // woody lower trunk
  const branchMat = factory.createToon('#4f7336'); // green upper branches
  const bambooMat = factory.createToon('#cfb074'); // bamboo ajir stakes
  const bambooNodeMat = factory.createToon('#a38148'); // bamboo node rings
  const wireMat = factory.createToon('#b8c0cc'); // horizontal support wire
  const chiliRedMat = factory.createToon('#d93824');
  const chiliOrangeMat = factory.createToon('#ee6c29');
  const chiliCreamMat = factory.createToon('#e9df93');
  const chiliGreenMat = factory.createToon('#3f7f34');
  const blossomMat = factory.createToon('#fffdf7');
  const waterDropMat = factory.createToon('#66c7f4', { transparent: true, opacity: 0.9 });
  const patekSpotMat = new THREE.MeshBasicMaterial({ color: '#472d1b' });
  const severeSpotMat = new THREE.MeshBasicMaterial({ color: '#24130a' });
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
    severeSpots: THREE.Mesh[];
    leafMeshes: THREE.Object3D[];
  }
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

  // Smooth curved hanging cabai keriting pod geometry (starts at calyx 0, curves down to -0.24)
  const createCurlyChiliGeo = () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.008, -0.06, 0.004),
      new THREE.Vector3(0.022, -0.13, 0.01),
      new THREE.Vector3(0.044, -0.195, 0.014),
      new THREE.Vector3(0.072, -0.232, 0.012),
    ]);
    const tubularSegments = 12;
    const radialSegments = 8;
    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const p = curve.getPointAt(t);
      const N = frames.normals[i];
      const B = frames.binormals[i];
      // Taper smoothly from calyx top (0.017) down to sharp tip (0.002)
      const r = t === 0 ? 0.002 : 0.017 * Math.pow(1 - t * 0.88, 0.72);
      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2;
        const sin = Math.sin(theta);
        const cos = -Math.cos(theta);
        const nx = cos * N.x + sin * B.x;
        const ny = cos * N.y + sin * B.y;
        const nz = cos * N.z + sin * B.z;
        normals.push(nx, ny, nz);
        positions.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      }
    }

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    return trackGeo(geo);
  };

  const leafGeo = createChiliLeafGeo();
  const chiliPodGeo = createCurlyChiliGeo();
  const petioleGeo = trackGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.046, 5));
  const jointGeo = trackGeo(new THREE.SphereGeometry(0.022, 8, 8));
  const calyxGeo = trackGeo(new THREE.CylinderGeometry(0.01, 0.019, 0.022, 7));
  const pedicelGeo = trackGeo(new THREE.CylinderGeometry(0.004, 0.006, 0.046, 5));
  const stakeGeo = trackGeo(new THREE.CylinderGeometry(0.014, 0.017, 1.0, 6));
  const stakeNodeGeo = trackGeo(new THREE.CylinderGeometry(0.0185, 0.0185, 0.015, 6));
  const wireRingGeo = trackGeo(new THREE.TorusGeometry(0.275, 0.0065, 6, 28));
  const wireOutlineGeo = trackGeo(new THREE.TorusGeometry(0.275, 0.01, 6, 28));
  const dropletGeo = trackGeo(new THREE.SphereGeometry(0.019, 6, 6));
  const spotGeo = trackGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.007, 7));

  const chiliPodMaterials = [chiliRedMat, chiliRedMat, chiliGreenMat, chiliOrangeMat, chiliCreamMat];

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
    severeSpots: THREE.Mesh[],
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

      const severeSpot = new THREE.Mesh(spotGeo, severeSpotMat);
      severeSpot.position.set(0.011, 0.0095, 0.095);
      severeSpot.scale.setScalar(0.001);
      tilt.add(severeSpot);
      severeSpots.push(severeSpot);
    }

    holder.add(tilt);
    parent.add(holder);
  };

  // Attach hanging curved cabai keriting pod anchored cleanly at (0,0,0) on branch
  const attachChiliPod = (
    parent: THREE.Object3D,
    pos: [number, number, number],
    rotY: number,
    outTilt: number,
    mat: THREE.Material,
    podScale = 1,
    severeSpots?: THREE.Mesh[]
  ) => {
    const podGroup = new THREE.Group();
    podGroup.position.set(...pos);
    podGroup.rotation.set(0, rotY, outTilt);
    podGroup.scale.setScalar(podScale);

    const pedicel = factory.createOutlinedMesh(pedicelGeo, branchMat, 1.14);
    pedicel.position.y = -0.022;
    podGroup.add(pedicel);

    const calyx = factory.createOutlinedMesh(calyxGeo, branchMat, 1.12);
    calyx.position.y = -0.05;
    podGroup.add(calyx);

    const pod = factory.createOutlinedMesh(chiliPodGeo, mat, 1.12);
    pod.position.y = -0.055;
    podGroup.add(pod);

    if (severeSpots) {
      const podLesion = new THREE.Mesh(spotGeo, severeSpotMat);
      podLesion.rotation.x = Math.PI / 2;
      podLesion.position.set(0.004, -0.145, 0.018);
      podLesion.scale.setScalar(0.001);
      podGroup.add(podLesion);
      severeSpots.push(podLesion);
    }

    parent.add(podGroup);
  };

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
      const stake = factory.createOutlinedMesh(stakeGeo, bambooMat, 1.08);
      stake.position.set(sx, 0.48, sz);
      cageGroup.add(stake);

      [0.22, 0.52, 0.8].forEach((ny) => {
        const node = factory.createOutlinedMesh(stakeNodeGeo, bambooNodeMat, 1.07);
        node.position.set(sx, ny, sz);
        cageGroup.add(node);
      });
    });

    // 3 Horizontal Wire / String Rings tying the 4 stakes together
    [0.3, 0.58, 0.84].forEach((ry) => {
      const ring = new THREE.Mesh(wireRingGeo, wireMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ry;
      ring.castShadow = true;
      cageGroup.add(ring);

      const ringOutline = new THREE.Mesh(wireOutlineGeo, factory.outlineMaterial);
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
    const severeSpots: THREE.Mesh[] = [];
    const leafMeshes: THREE.Object3D[] = [];

    // 2 small lower-stem leaves protruding cleanly outward
    attachChiliLeaf(pGroup, [0, 0.24, 0], 0.5, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);
    attachChiliLeaf(pGroup, [0, 0.29, 0], 3.6, 0.14, 0.78, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

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

      // 2 mid-limb leaves pointing tangential-outward
      attachChiliLeaf(limbPivot, [0, 0.18, 0], 0.45, 0.18, 0.9, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, b === 0);
      attachChiliLeaf(limbPivot, [0, 0.27, 0], Math.PI - 0.45, 0.18, 0.88, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

      // Hanging red / green cabai keriting from mid-limb node (visible below foliage!)
      attachChiliPod(
        limbPivot,
        [0, 0.25, 0],
        b * 0.7,
        0.38, // compensates for limbPivot -0.42 so chili hangs straight down!
        b === 2 ? chiliGreenMat : chiliRedMat,
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
          branchMat,
          1.12
        );
        subTwig.position.y = 0.16;
        subTilt.add(subTwig);

        // 3 upper-twig leaves pointing strictly outward/tangential
        attachChiliLeaf(subTilt, [0, 0.13, 0], s === 0 ? 0.25 : Math.PI - 0.25, 0.16, 0.95, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, s === 0);
        attachChiliLeaf(subTilt, [0, 0.21, 0], Math.PI / 2, 0.22, 0.92, false, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);
        attachChiliLeaf(subTilt, [0, 0.27, 0], s === 0 ? Math.PI - 0.3 : 0.3, 0.26, 0.82, true, pLeafMat, pLeafYoungMat, plantIndex, leafMeshes, droplets, patekSpots, severeSpots, false);

        // Hanging Cabai Keriting fruit dangling from upper twig node (y = 0.26)
        const podMat = chiliPodMaterials[(b * 2 + s) % chiliPodMaterials.length];
        attachChiliPod(subTilt, [0, 0.26, 0], s === 0 ? 0.4 : -0.4, 0.2, podMat, 1.0, severeSpots);

        // Blossom on alternate twigs
        if ((b + s) % 2 === 1) {
          const flowerStem = new THREE.Group();
          flowerStem.position.set(0, 0.29, 0);
          flowerStem.rotation.z = -0.5;
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

    // Central upright leader shoot rising above the fork (y = 0.35 .. 0.86)
    const centerLeader = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.01, 0.017, 0.51, 6)),
      branchMat,
      1.12
    );
    centerLeader.position.y = 0.605;
    pGroup.add(centerLeader);

    // Top crown rosette (y = 0.74 .. 0.84)
    for (let cl = 0; cl < 3; cl++) {
      attachChiliLeaf(
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
    attachChiliPod(pGroup, [0, 0.78, 0], 1.1, 0.08, chiliRedMat, 1.02, severeSpots);

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

  // =========================================================================
  // 3. WATER DRUM + REAL 12V PUMP (`pump`) & REAL BRASS SOLENOID (`solenoid`)
  // =========================================================================
  const pumpGroup = new THREE.Group();
  scene.add(pumpGroup);

  // Sturdy wooden support stand sitting cleanly on the open Lower Terrace (y = -0.18, clear of retaining wall z <= 0.13)
  const standDeck = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(1.22, 0.07, 0.82)),
    woodMat,
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
      woodMat,
      1.05
    );
    leg.position.set(lx, 0.01, lz);
    pumpGroup.add(leg);
  });

  // Cross-brace bars between stand legs
  const frontBrace = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(1.1, 0.06, 0.06)),
    woodMat,
    1.05
  );
  frontBrace.position.set(-3.0, 0.02, 0.92);
  pumpGroup.add(frontBrace);

  // Water buffer barrel resting cleanly on stand deck top (y = 0.27 + 0.36 = 0.63)
  const drum = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.35, 0.35, 0.72, 14)),
    accentMat,
    1.035
  );
  drum.position.set(-3.26, 0.63, 0.58);
  pumpGroup.add(drum);

  const drumLid = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.365, 0.365, 0.07, 14)),
    solarFrameMat,
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
  addOutlinedTube(pumpGroup, suctionCurve, 0.024, 0.006, pipeMat, 14);
  tagPart(pumpGroup, 'pump');

  // Main pressure pipe curving cleanly from pump outlet nozzle (-2.45, 0.38, 0.635) into real solenoid inlet (-2.14, 0.38, 0.22)
  const pipeInCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.45, 0.38, 0.635),
    new THREE.Vector3(-2.24, 0.38, 0.44),
    new THREE.Vector3(-2.14, 0.38, 0.22),
  ]);
  addOutlinedTube(irrigationGroup, pipeInCurve, 0.025, 0.006, pipeMat, 16);

  // Real 12V Brass Solenoid Valve assembly (`solenoid`) feeding main terraced beds
  const solenoidGroup = new THREE.Group();
  solenoidGroup.position.set(-1.98, 0.38, 0.22);
  realSolMod.position.set(0, -0.052, 0);
  realSolMod.scale.setScalar(0.2);
  solenoidGroup.add(realSolMod);

  // Support post under solenoid resting on lower terrace ground (y = -0.18 .. 0.34)
  const solenoidPost = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.52, 8)),
    poleMat,
    1.07
  );
  solenoidPost.position.set(0, -0.31, 0);
  solenoidGroup.add(solenoidPost);

  irrigationGroup.add(solenoidGroup);

  // Short straight outlet stub bridging brass valve outlet (-1.83) to T-splitter hub (-1.80)
  const outletStub = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.07, 8)),
    pipeMat,
    1.1
  );
  outletStub.rotation.z = Math.PI / 2;
  outletStub.position.set(-1.825, 0.38, 0.22);
  irrigationGroup.add(outletStub);

  // T-splitter junction sphere & elbow spheres so every pipe joint is 100% sealed with zero open cut ends
  const fittingGeo = trackGeo(new THREE.SphereGeometry(0.036, 10, 10));
  const tJunction = factory.createOutlinedMesh(fittingGeo, pipeMat, 1.1);
  tJunction.position.set(-1.8, 0.38, 0.22);
  irrigationGroup.add(tJunction);

  const upperElbow = factory.createOutlinedMesh(fittingGeo, pipeMat, 1.1);
  upperElbow.position.set(-1.8, 0.47, -0.72);
  irrigationGroup.add(upperElbow);

  const lowerElbow = factory.createOutlinedMesh(fittingGeo, pipeMat, 1.1);
  lowerElbow.position.set(-1.8, 0.04, 0.66);
  irrigationGroup.add(lowerElbow);

  // Both branches start at the EXACT same T-splitter hub (-1.80, 0.38, 0.22) and end inside the elbow fittings
  const upperBranchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.8, 0.38, 0.22),
    new THREE.Vector3(-1.8, 0.38, -0.05),
    new THREE.Vector3(-1.8, 0.43, -0.45),
    new THREE.Vector3(-1.8, 0.47, -0.72),
  ]);
  addOutlinedTube(irrigationGroup, upperBranchCurve, 0.024, 0.006, pipeMat, 18);

  const lowerBranchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.8, 0.38, 0.22),
    new THREE.Vector3(-1.8, 0.34, 0.48),
    new THREE.Vector3(-1.8, 0.04, 0.66),
  ]);
  addOutlinedTube(irrigationGroup, lowerBranchCurve, 0.024, 0.006, pipeMat, 14);

  // Upper bed drip line (connects cleanly at x = -1.84)
  const upperLine = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
    pipeMat,
    1.12
  );
  upperLine.rotation.z = Math.PI / 2;
  upperLine.position.set(0.5, 0.47, -0.72);
  irrigationGroup.add(upperLine);

  // Lower bed drip line (connects cleanly at x = -1.84)
  const lowerLine = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 4.7, 8)),
    pipeMat,
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

  // --- Tier 1 Visual Prop: Animated Manual Watering Can (Gembor) ---
  const gemborMat = factory.createToon('#3b82f6');
  const gemborGroup = new THREE.Group();
  const gemborRestPos = new THREE.Vector3(2.55, -0.05, 1.86);
  gemborGroup.position.copy(gemborRestPos);
  gemborGroup.rotation.y = -0.5;
  const gemborBody = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 12)),
    gemborMat,
    1.04
  );
  const gemborHandle = factory.createOutlinedMesh(
    trackGeo(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI)),
    gemborMat,
    1.06
  );
  gemborHandle.position.set(-0.04, 0.11, 0);
  gemborHandle.rotation.z = 0.25;
  const gemborSpout = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.032, 0.28, 8)),
    gemborMat,
    1.06
  );
  gemborSpout.rotation.z = -0.85;
  gemborSpout.position.set(0.19, 0.07, 0);
  const gemborHead = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.044, 0.022, 0.042, 8)),
    brassMat,
    1.08
  );
  gemborHead.rotation.z = -0.85;
  gemborHead.position.set(0.30, 0.15, 0);
  const gemborNozzleTip = new THREE.Object3D();
  gemborNozzleTip.position.set(0.32, 0.16, 0);
  gemborGroup.add(gemborBody, gemborHandle, gemborSpout, gemborHead, gemborNozzleTip);
  scene.add(gemborGroup);

  const gemborNozzleWorld = new THREE.Vector3();
  let gemborLift = 0;

  // --- Animated Water Spray Particles (Nursery Mist in AIoT vs Gembor Pour in Manual Mode) ---
  const sprayCount = 66;
  const sprayDrops: Array<{ mesh: THREE.Mesh; emitterIdx: number; phase: number; spreadX: number; spreadZ: number }> = [];
  const sprayGroup = new THREE.Group();
  scene.add(sprayGroup);
  const sprayDropGeo = trackGeo(new THREE.SphereGeometry(0.021, 6, 6));
  for (let i = 0; i < sprayCount; i++) {
    const m = new THREE.Mesh(sprayDropGeo, waterDropMat);
    m.visible = false;
    sprayGroup.add(m);
    const angle = (i * 2.399) % (Math.PI * 2);
    sprayDrops.push({
      mesh: m,
      emitterIdx: i % emitterPositions.length,
      phase: (i / sprayCount) % 1,
      spreadX: Math.cos(angle) * (0.14 + (i % 3) * 0.05),
      spreadZ: Math.sin(angle) * 0.18,
    });
  }

  // --- Spore-Dispersion & Highland Wind Particles (Upper -> Lower Terrace Flow) ---
  const sporeCount = 26;
  const sporeParticles: Array<{ mesh: THREE.Mesh; baseX: number; phase: number; yOff: number }> = [];
  const sporeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#d97706',
      transparent: true,
      opacity: 0.72,
    })
  );
  const sporeGeo = trackGeo(new THREE.SphereGeometry(0.022, 6, 6));
  const sporeGroup = new THREE.Group();
  scene.add(sporeGroup);
  for (let i = 0; i < sporeCount; i++) {
    const sm = new THREE.Mesh(sporeGeo, sporeMat);
    sm.visible = false;
    sporeGroup.add(sm);
    sporeParticles.push({
      mesh: sm,
      baseX: -1.7 + ((i * 0.83) % 4.1),
      phase: (i / sporeCount) % 1,
      yOff: (i % 4) * 0.09,
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
  // 4. REAL AIoT NODE POLE, IP65 BOX & SENSORS (`solar`, `enclosure`, `esp32cam`, `dht22`, `soil_probe`)
  // =========================================================================
  const poleX = -2.75;
  const poleZ = -1.12; // Exact centerline of upper bedengan (-1.12)

  // Pole base + aluminum mast (attached to enclosure group)
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
    trackGeo(new THREE.CylinderGeometry(0.052, 0.058, 2.25, 12)),
    poleMat,
    1.05
  );
  mast.position.set(poleX, 1.42, poleZ);
  enclosureGroup.add(mast);

  // Main Weatherproof IP65 Enclosure facing +X toward the chili beds (local +Z -> world +X)
  const boxCore = new THREE.Group();
  boxCore.position.set(poleX + 0.14, 1.66, poleZ);
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
    boxBodyMat,
    1.025
  );
  backPlate.position.z = -cavD / 2;
  boxCore.add(backPlate);

  // Left wall solid; Right wall split for hollow side gland (ESP32-CAM boom cable)
  const boxLeftWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(wallT, boxH, cavD)),
    boxBodyMat,
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
    boxBodyMat,
    1.03
  );
  boxRightBot.position.set(boxW / 2 - wallT / 2, -boxH / 2 + sideBotH / 2, 0);
  const boxRightTop = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(wallT, sideTopH, cavD)),
    boxBodyMat,
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
    boxBodyMat,
    1.03
  );
  boxTopLeft.position.set(-boxW / 2 + pvLeftW / 2, boxH / 2 - wallT / 2, 0);
  const boxTopRight = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(pvRightW, wallT, cavD)),
    boxBodyMat,
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
      boxBodyMat,
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
    const f = factory.createOutlinedMesh(fTopBot, boxLidMat, 1.025);
    f.position.y = fy;
    frontDoor.add(f);
  });
  [-boxW / 2 + 0.026, boxW / 2 - 0.026].forEach((fx) => {
    const f = factory.createOutlinedMesh(fSides, boxLidMat, 1.025);
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

  // --- Real Solar Panel 6V / 10W (`solar`) ---
  const solarGroup = new THREE.Group();
  solarGroup.position.set(poleX, 2.55, poleZ);
  const solarTilt = new THREE.Group();
  // Single-axis tilt so solar panel edges stay 100% parallel with the rectangular terrace & beds
  solarTilt.rotation.set(0.28, 0, 0);

  const solarBracket = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.22, 0.04, 0.16, 0.015)),
    solarFrameMat,
    1.04
  );
  solarBracket.position.y = -0.025;
  solarTilt.add(solarBracket);

  realSolarMod.position.set(0, 0.01, 0);
  realSolarMod.scale.setScalar(0.31);
  solarTilt.add(realSolarMod);

  solarGroup.add(solarTilt);
  scene.add(solarGroup);

  // PV Power wire curving cleanly from underneath Solar Panel into Top Hollow Gland of IP65 Box
  const pvWireLocalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, -0.03, -0.04),
    new THREE.Vector3(0.14, -0.21, 0.12),
    new THREE.Vector3(0.13, -0.59, 0.12),
  ]);
  const wireRedMat = factory.createToon('#dc2626');
  const wireBlkMat = factory.createToon('#1f2937');
  const wireYlwMat = factory.createToon('#eab308');
  const wireBluMat = factory.createToon('#2563eb');
  solarGroup.add(
    new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(pvWireLocalCurve, 14, 0.01, 6, false)),
      wireRedMat
    )
  );
  tagPart(solarGroup, 'solar');

  // --- Real ESP32-CAM OV2640 (`esp32cam`) ---
  const camGroup = new THREE.Group();
  camGroup.position.set(poleX + 0.34, 2.12, poleZ);
  scene.add(camGroup);

  const camArm = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8)),
    poleMat,
    1.08
  );
  camArm.rotation.z = Math.PI / 2;
  camArm.position.set(-0.17, 0, 0);
  camGroup.add(camArm);

  const camHead = new THREE.Group();
  camHead.rotation.z = -0.46;

  // Compact dark weatherproof camera visor hood facing +X
  const camHoodBack = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.08, 0.22, 0.17, 0.02)),
    solarFrameMat,
    1.05
  );
  camHoodBack.position.set(-0.02, 0, 0);
  camHead.add(camHoodBack);
  const camHoodVisor = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.14, 0.02, 0.18)),
    solarFrameMat,
    1.05
  );
  camHoodVisor.position.set(0.03, 0.115, 0);
  camHead.add(camHoodVisor);

  // Real ESP32-CAM OV2640 module mounted facing outward (+X) along FOV axis
  const camRealMount = new THREE.Group();
  camRealMount.position.set(0.025, 0, 0);
  camRealMount.rotation.y = Math.PI / 2;
  realCamMod.position.set(0, 0, 0);
  realCamMod.rotation.set(Math.PI / 2, 0, 0);
  realCamMod.scale.setScalar(0.09);
  camRealMount.add(realCamMod);
  camHead.add(camRealMount);

  const camLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.015, 8, 8)), ledCamMat);
  camLed.position.set(0.08, 0.095, 0.075);
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

  // --- Ventilated Radiation Shield + Real GY-BME280 (`dht22`) ---
  const dhtGroup = new THREE.Group();
  scene.add(dhtGroup);

  // Single straight slanted arm along z = -1.12 coming from control box down to the sensor shield
  const boomStart = new THREE.Vector3(poleX + 0.22, 1.56, poleZ);
  const boomEnd = new THREE.Vector3(-0.95, 1.24, poleZ);
  const boomDir = new THREE.Vector3().subVectors(boomEnd, boomStart);
  const boomLen = boomDir.length();
  const dhtBoom = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.016, boomLen, 6)),
    poleMat,
    1.1
  );
  dhtBoom.position.copy(boomStart).addScaledVector(boomDir, 0.5);
  dhtBoom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), boomDir.clone().normalize());
  dhtGroup.add(dhtBoom);

  const shieldPos = new THREE.Vector3(-0.95, 1.07, poleZ);
  for (let plate = 0; plate < 4; plate++) {
    const disc = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.115, 0.135, 0.022, 14)),
      boxBodyMat,
      1.05
    );
    disc.position.set(shieldPos.x, shieldPos.y + plate * 0.052, shieldPos.z);
    dhtGroup.add(disc);
  }
  // Real Purple GY-BME280 PCB seated visibly inside the ventilated louver stack
  bmeGroup.position.set(shieldPos.x, shieldPos.y + 0.075, shieldPos.z);
  bmeGroup.scale.setScalar(0.11);
  dhtGroup.add(bmeGroup);

  tagPart(dhtGroup, 'dht22');

  // --- Real Capacitive Soil Moisture Probe v1.2 + DS18B20 Waterproof Probe (`soil_probe`) ---
  const soilProbeGroup = new THREE.Group();
  scene.add(soilProbeGroup);

  const probePos = new THREE.Vector3(-1.02, 0.455, -0.83);
  const probeSoilCutout = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.15, 0.022, 12)),
    bedSoilMat,
    1.04
  );
  probeSoilCutout.position.set(-0.93, 0.46, -0.83);
  soilProbeGroup.add(probeSoilCutout);

  // Real Capacitive Soil Moisture v1.2 blade stuck into soil
  soilGroup.position.set(probePos.x, probePos.y + 0.11, probePos.z);
  soilGroup.rotation.set(0, 0, -Math.PI / 2);
  soilGroup.scale.setScalar(0.145);
  soilProbeGroup.add(soilGroup);

  // Real DS18B20 stainless probe & 4.7kΩ pull-up adapter sitting right beside Soil Moisture
  dsGroup.position.set(-0.82, probePos.y + 0.035, -0.83);
  dsGroup.rotation.set(0, -0.25, 0);
  dsGroup.scale.setScalar(0.13);
  soilProbeGroup.add(dsGroup);

  // Sensor signal cables routing along z = -0.83 up the mast into Bottom Hollow Glands 2 & 3
  const soilCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(probePos.x + 0.02, probePos.y + 0.19, -0.83),
    new THREE.Vector3(-1.5, 0.52, -0.83),
    new THREE.Vector3(-2.35, 0.52, -0.83),
    new THREE.Vector3(-2.62, 0.72, -0.96),
    new THREE.Vector3(poleX + 0.155, 1.36, poleZ + 0.06),
  ]);
  soilProbeGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(soilCableCurve, 24, 0.011, 6, false)), wireYlwMat)
  );

  const dsCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.74, probePos.y + 0.055, -0.81),
    new THREE.Vector3(-1.45, 0.50, -0.81),
    new THREE.Vector3(-2.32, 0.50, -0.81),
    new THREE.Vector3(-2.59, 0.70, -0.94),
    new THREE.Vector3(poleX + 0.155, 1.36, poleZ - 0.06),
  ]);
  soilProbeGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(dsCableCurve, 24, 0.011, 6, false)), wireBlkMat)
  );
  tagPart(soilProbeGroup, 'soil_probe');

  // --- Field Actuator Power Cables: IP65 Relay -> 12V Pump & 12V Brass Solenoid ---
  const pumpPowerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(poleX + 0.155, 1.36, poleZ - 0.18),
    new THREE.Vector3(poleX + 0.04, 0.92, poleZ - 0.05),
    new THREE.Vector3(poleX - 0.05, 0.36, -0.45),
    new THREE.Vector3(-2.82, 0.36, 0.42),
    new THREE.Vector3(-2.82, 0.36, 0.54),
  ]);
  enclosureGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(pumpPowerCurve, 24, 0.011, 6, false)), wireRedMat)
  );

  const solPowerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(poleX + 0.155, 1.36, poleZ - 0.16),
    new THREE.Vector3(poleX + 0.08, 0.92, poleZ - 0.02),
    new THREE.Vector3(-2.52, 0.52, -0.35),
    new THREE.Vector3(-2.12, 0.46, 0.10),
    new THREE.Vector3(-1.98, 0.46, 0.22),
  ]);
  enclosureGroup.add(
    new THREE.Mesh(trackGeo(new THREE.TubeGeometry(solPowerCurve, 24, 0.011, 6, false)), wireBluMat)
  );

  // =========================================================================
  // 5. CELESTIAL SUN/MOON DISC & HIGHLAND NIGHT DEW/MIST
  // =========================================================================
  const sunMat = new THREE.MeshBasicMaterial({ color: '#e6b83a' });
  const celestialDisc = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 14, 14)), sunMat);
  celestialDisc.position.set(4, 6, -4);
  scene.add(celestialDisc);

  // Unified dynamic highland dew/mist blanket spanning both terraces (soft rounded-rect + flowing wisps)
  const mistGeo = trackGeo(new THREE.PlaneGeometry(7.0, 4.3, 48, 28));
  mistGeo.rotateX(-Math.PI / 2);

  const createMistShaderMat = (layerOffset: number) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uLayer: { value: layerOffset },
        uColor: { value: new THREE.Color('#dce8fc') },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uLayer;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Follow 2-tier terrace height smoothly from back upper terrace (z < 0) to front lower terrace (z > 0)
          float terraceLift = smoothstep(0.45, -0.45, pos.z) * 0.42;
          float wave1 = sin(pos.x * 1.15 + uTime * 0.75 + uLayer * 2.1) * cos(pos.z * 1.35 - uTime * 0.55);
          float wave2 = sin(pos.x * 2.3 - uTime * 0.45 + pos.z * 1.8) * 0.45;
          pos.y += terraceLift + (wave1 + wave2) * 0.04;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        uniform float uLayer;
        uniform vec3 uColor;
        varying vec2 vUv;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.55 * noise2(p);
          v += 0.30 * noise2(p * 2.07 + vec2(3.1, 1.7));
          v += 0.15 * noise2(p * 4.13 - vec2(1.9, 4.2));
          return v;
        }

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float t = uTime * (0.28 + uLayer * 0.08);
          // Organic wavy rounded-rectangle SDF so edges look soft & non-boxy
          float warp = sin(p.y * 4.8 + t * 1.4 + uLayer) * 0.055 + cos(p.x * 4.2 - t * 1.1) * 0.055;
          vec2 boxHalf = vec2(0.72, 0.68);
          vec2 q = abs(p) - boxHalf;
          float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.14 + warp;
          float edgeMask = 1.0 - smoothstep(-0.14, 0.14, sdf);

          vec2 flowA = vUv * vec2(4.4, 2.8) + vec2(t * 0.16, -t * 0.08);
          vec2 flowB = vUv * vec2(3.1, 2.2) + vec2(-t * 0.11, t * 0.09) + uLayer * 2.3;
          float wisp = fbm(flowA) * 0.6 + fbm(flowB) * 0.4;
          float density = 0.34 + 0.66 * smoothstep(0.24, 0.82, wisp);

          float alpha = edgeMask * density * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

  const mistMatLower = createMistShaderMat(0);
  const mistMatUpper = createMistShaderMat(1.4);
  const mistGroup = new THREE.Group();
  mistGroup.position.set(0.35, 0.44, 0.0);
  scene.add(mistGroup);

  const mistLayerLower = new THREE.Mesh(mistGeo, mistMatLower);
  mistGroup.add(mistLayerLower);

  const mistLayerUpper = new THREE.Mesh(mistGeo, mistMatUpper);
  mistLayerUpper.position.y = 0.22;
  mistGroup.add(mistLayerUpper);

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
    enclosure: new THREE.Vector3(poleX + 0.14, 1.68, poleZ),
    esp32cam: new THREE.Vector3(poleX + 0.34, 2.12, poleZ),
    dht22: new THREE.Vector3(-0.95, 1.18, poleZ),
    soil_probe: new THREE.Vector3(-0.92, 0.58, -0.83),
    solenoid: new THREE.Vector3(-1.98, 0.45, 0.22),
    pump: new THREE.Vector3(-2.66, 0.55, 0.58),
    terrace: new THREE.Vector3(0.4, 0.1, 0.1),
    chili_plant: new THREE.Vector3(0.45, 1.22, -1.12),
  };

  const CLICKABLE_TOOL_IDS: PartId[] = [
    'solar',
    'enclosure',
    'esp32cam',
    'dht22',
    'soil_probe',
    'solenoid',
    'pump',
  ];

  // Interactive leaf hotspots: 2 live upper CAM+canopy plants (0, 1) + full lower-terrace condition showcase (5, 6, 7, 8, 9)
  const FEATURED_LEAVES: Array<{ plantIndex: number; leafIndex: number }> = [
    { plantIndex: 0, leafIndex: 27 },
    { plantIndex: 1, leafIndex: 27 },
    { plantIndex: 5, leafIndex: 27 },
    { plantIndex: 6, leafIndex: 27 },
    { plantIndex: 7, leafIndex: 27 },
    { plantIndex: 8, leafIndex: 27 },
    { plantIndex: 9, leafIndex: 27 },
  ];

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

    // Night LED glows & Active Hardware Indicators
    nodeGlow.intensity = night > 0.35 ? 1.15 * night : 0.15;
    ledValveMat.color.set(metrics.isWatering ? '#4ade80' : metrics.lastDecision === 'TUNDA' ? '#fb923c' : '#facc15');
    solenoidLedMat.color.set(metrics.isWatering ? '#4ade80' : metrics.lastDecision === 'TUNDA' ? '#fb923c' : '#1e3a8a');
    ledCamMat.color.set(metrics.patekRiskPct >= 65 ? '#ef4444' : '#64748b');
    camFlashMat.color.set(metrics.patekRiskPct >= 75 ? '#fef08a' : '#78716c');
    if (metrics.isWatering) {
      pumpRotorGroup.rotation.y += dt * 11;
    }

    // 3. Soil Moisture Color + Leaf Wetness + Patek Spots + Plant Sway
    const soilT = THREE.MathUtils.clamp((metrics.soilMoisturePct - 18) / 68, 0, 1);
    bedSoilMat.color.copy(soilDryColor).lerp(soilWetColor, soilT);

    const dropScale = THREE.MathUtils.clamp(metrics.leafWetnessPct / 75, 0.001, 1.15);
    const globalSpotScale =
      metrics.symptomSeverity > 0.1 ? THREE.MathUtils.clamp(metrics.symptomSeverity * 1.4, 0.001, 1.25) : 0.001;

    const manualPouring = !metrics.aiotMode && metrics.isWatering;
    const isDrought = metrics.soilMoisturePct <= 26;
    plantRefs.forEach((pr) => {
      const sway = Math.sin(elapsed * 1.65 + pr.phase) * (weather === 'rainy' ? 0.055 : 0.025);
      const isUpperTerrace = pr.plantIndex <= 4;
      const inCamOrCanopy = pr.plantIndex === 0 || pr.plantIndex === 1;
      let cond: LeafCondition = pr.baseCondition;
      let plantDropScale = 0.001;
      let plantSpotScale = 0.001;
      let plantSevereSpotScale = 0.001;

      if (inCamOrCanopy) {
        cond = evaluateCanopyLeafCondition(pr.plantIndex as 0 | 1, metrics);
        const droughtYellowOnly = isDrought && metrics.patekRiskPct < 52 && metrics.symptomSeverity < 0.12;
        plantDropScale =
          droughtYellowOnly
            ? 0.001
            : manualPouring || cond === 'wet_risk' || cond === 'patek_early' || cond === 'patek_infected'
            ? Math.max(0.62, dropScale)
            : dropScale;
        plantSpotScale =
          droughtYellowOnly
            ? 0.001
            : cond === 'patek_infected'
            ? Math.max(1.35, globalSpotScale)
            : cond === 'patek_early'
            ? Math.max(0.9, globalSpotScale)
            : cond === 'yellowing'
            ? Math.max(0.45, globalSpotScale)
            : globalSpotScale;
        plantSevereSpotScale = !droughtYellowOnly && cond === 'patek_infected' ? 1.25 : 0.001;
      } else if (isUpperTerrace) {
        // Remaining upper terrace plants (2, 3, 4) also progress through patek_early -> patek_infected (or drought yellowing)
        if (metrics.symptomSeverity >= 0.72 || (metrics.patekRiskPct >= 88 && metrics.symptomSeverity >= 0.5)) {
          cond = 'patek_infected';
        } else if (metrics.symptomSeverity >= 0.42 || (metrics.patekRiskPct >= 75 && metrics.symptomSeverity >= 0.25)) {
          cond = 'patek_early';
        } else if (metrics.symptomSeverity >= 0.16 || metrics.patekRiskPct >= 56 || isDrought) {
          cond = 'yellowing';
        } else if (
          manualPouring ||
          metrics.leafWetnessPct >= 40 ||
          weather === 'rainy' ||
          weather === 'foggy' ||
          (night > 0.5 && metrics.relativeHumidity >= 86)
        ) {
          cond = 'wet_risk';
        } else {
          cond = 'healthy';
        }
        const droughtYellowOnly = isDrought && metrics.patekRiskPct < 56 && metrics.symptomSeverity < 0.16;
        plantDropScale =
          droughtYellowOnly
            ? 0.001
            : manualPouring || cond === 'wet_risk' || cond === 'patek_early' || cond === 'patek_infected'
            ? Math.max(0.55, dropScale)
            : dropScale;
        plantSpotScale =
          droughtYellowOnly
            ? 0.001
            : cond === 'patek_infected'
            ? Math.max(1.3, globalSpotScale)
            : cond === 'patek_early'
            ? Math.max(0.9, globalSpotScale)
            : cond === 'yellowing'
            ? Math.max(0.42, globalSpotScale)
            : globalSpotScale;
        plantSevereSpotScale = !droughtYellowOnly && cond === 'patek_infected' ? 1.2 : 0.001;
      } else {
        // Lower terrace (plants 5..9) stays as clear reference showcase for all 5 condition types
        cond = pr.baseCondition;
        plantDropScale =
          weather === 'rainy'
            ? Math.max(0.7, dropScale)
            : cond === 'wet_risk'
            ? 0.85
            : cond === 'patek_early' || cond === 'patek_infected'
            ? 0.5
            : 0.001;
        plantSpotScale =
          cond === 'patek_infected' ? 1.45 : cond === 'patek_early' ? 1.05 : cond === 'yellowing' ? 0.44 : 0.001;
        plantSevereSpotScale = cond === 'patek_infected' ? 1.25 : 0.001;
      }

      // Apply slight physical wilt droop & height sag for bone-dry drought OR active patek blight
      const blightDroop = cond === 'patek_infected' ? 0.055 : 0;
      const wiltDroop = isUpperTerrace && isDrought ? 0.08 : blightDroop;
      pr.group.rotation.z = sway + wiltDroop * 0.5;
      pr.group.rotation.x = Math.cos(elapsed * 1.2 + pr.phase) * 0.015 + wiltDroop;
      pr.group.scale.y = isUpperTerrace && isDrought ? 0.93 : cond === 'patek_infected' ? 0.96 : 1.0;

      pr.currentCondition = cond;
      const meta = LEAF_CONDITION_META[cond];
      pr.leafMat.color.set(meta.leafHex);
      pr.leafYoungMat.color.set(meta.leafYoungHex);

      pr.droplets.forEach((d) => d.scale.setScalar(plantDropScale));
      pr.patekSpots.forEach((s) => s.scale.setScalar(plantSpotScale));
      pr.severeSpots.forEach((s) => s.scale.setScalar(plantSevereSpotScale));
    });

    // 4. Animated Gembor (Manual Mode rises & sweeps back-and-forth over upper canopy!) + Watering Spray Particles
    gemborLift = THREE.MathUtils.lerp(gemborLift, manualPouring ? 1 : 0, Math.min(1, dt * 5.5));
    const sweepX = -0.55 + Math.sin(elapsed * 2.6) * 0.95; // sweeps back-and-forth over CAM + canopy plants (-1.50 .. +0.40)
    const activeGemborX = THREE.MathUtils.lerp(gemborRestPos.x, sweepX, gemborLift);
    const activeGemborY = THREE.MathUtils.lerp(gemborRestPos.y, 1.62, gemborLift) + Math.sin(elapsed * 5.2) * 0.04 * gemborLift;
    const activeGemborZ = THREE.MathUtils.lerp(gemborRestPos.z, -0.62, gemborLift);
    gemborGroup.position.set(activeGemborX, activeGemborY, activeGemborZ);
    gemborGroup.rotation.set(
      0,
      THREE.MathUtils.lerp(-0.5, Math.PI * 0.48, gemborLift),
      THREE.MathUtils.lerp(0, -1.36 - Math.sin(elapsed * 5.2) * 0.1, gemborLift)
    );
    gemborNozzleTip.getWorldPosition(gemborNozzleWorld);

    sprayDrops.forEach((sd) => {
      if (!metrics.isWatering) {
        sd.mesh.visible = false;
        return;
      }
      sd.mesh.visible = true;
      sd.phase = (sd.phase + dt * 2.15) % 1;
      const t = sd.phase;
      if (metrics.aiotMode) {
        const [ex, ey, ez] = emitterPositions[sd.emitterIdx];
        sd.mesh.position.set(
          ex + sd.spreadX * 1.9 * t,
          ey + 0.08 + Math.sin(t * Math.PI) * 0.24 - t * 0.28,
          ez + sd.spreadZ * 1.8 * t
        );
      } else {
        // Pour directly from rising/sweeping gembor brass rose nozzle onto upper chili canopy
        sd.mesh.position.set(
          gemborNozzleWorld.x + sd.spreadX * 1.45 * t,
          gemborNozzleWorld.y - t * t * 0.85,
          gemborNozzleWorld.z - 0.28 * t + sd.spreadZ * 1.2 * t
        );
      }
      sd.mesh.scale.setScalar(1 - t * 0.35);
    });

    // 4B. Spore-Dispersion Wind Particles drifting from Upper Terrace -> Lower Terrace
    const showSpores = weather === 'foggy' || weather === 'rainy' || metrics.patekRiskPct >= 55;
    sporeParticles.forEach((sp) => {
      sp.mesh.visible = showSpores;
      if (!showSpores) return;
      sp.phase = (sp.phase + dt * 0.28) % 1;
      const zDrift = -1.25 + sp.phase * 2.55;
      const ySlope = 0.85 - sp.phase * 0.42 + sp.yOff + Math.sin(sp.phase * Math.PI * 2 + elapsed) * 0.06;
      sp.mesh.position.set(sp.baseX + sp.phase * 0.42, ySlope, zDrift);
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

    // 6. Unified Dynamic Highland Mist / Dew Blanket
    const mistStrength = Math.max(
      weather === 'foggy' ? 0.46 : 0,
      night > 0.45 && metrics.relativeHumidity > 82 ? (night - 0.35) * 0.46 : 0
    );
    mistGroup.visible = mistStrength > 0.02;
    if (mistGroup.visible) {
      mistMatLower.uniforms.uTime.value = elapsed;
      mistMatLower.uniforms.uOpacity.value = mistStrength;
      mistMatLower.uniforms.uColor.value.set(night > 0.5 ? '#c7daf8' : '#eef3fb');

      mistMatUpper.uniforms.uTime.value = elapsed;
      mistMatUpper.uniforms.uOpacity.value = mistStrength * 0.65;
      mistMatUpper.uniforms.uColor.value.set(night > 0.5 ? '#d8e7ff' : '#f5f8fd');
    }

    // 7. Exploded Node / See-Through Enclosure Animation
    const targetExplode = exploded ? 1 : 0;
    explodeLerp = THREE.MathUtils.lerp(explodeLerp, targetExplode, Math.min(1, dt * 8));
    boxExplodeItems.forEach((item) => {
      item.obj.position.z = item.baseZ + explodeLerp * item.offsetZ;
      item.obj.position.x = item.baseX + explodeLerp * item.offsetX;
    });
    boxLidMat.opacity = 1 - explodeLerp * 0.45;

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
        const isFeatured = FEATURED_LEAVES.some(
          (f) => f.plantIndex === plantIndex && leafIndex >= 26
        );
        if (!isFeatured) return null;
        const pr = plantRefs[plantIndex];
        const condition = pr?.currentCondition ?? 'healthy';
        return {
          partId: 'chili_plant',
          leaf: {
            plantIndex,
            leafIndex: 27,
            terrace: pr?.terrace ?? 'Teras Atas',
            condition,
            colorHex: LEAF_CONDITION_META[condition].leafHex,
          },
        };
      }
      const partId = hit.object.userData?.partId as PartId | undefined;
      if (partId && CLICKABLE_TOOL_IDS.includes(partId)) {
        return { partId };
      }
      if (partId) return null;
    }
    return null;
  };

  const getHotspots = (): HotspotItem[] => {
    const items: HotspotItem[] = CLICKABLE_TOOL_IDS.map((partId) => {
      const p = cameraAnchors[partId];
      return {
        key: `part-${partId}`,
        kind: 'part',
        partId,
        worldPos: [p.x, p.y, p.z],
      };
    });

    FEATURED_LEAVES.forEach(({ plantIndex, leafIndex }) => {
      const pr = plantRefs[plantIndex];
      const leafObj = pr?.leafMeshes[leafIndex];
      if (!pr || !leafObj) return;
      leafObj.getWorldPosition(tempLeafPos);
      const condition = pr.currentCondition;
      items.push({
        key: `leaf-${plantIndex}-${leafIndex}`,
        kind: 'leaf',
        partId: 'chili_plant',
        worldPos: [tempLeafPos.x, tempLeafPos.y + 0.04, tempLeafPos.z],
        ringColor: LEAF_CONDITION_META[condition].badgeColor,
        leaf: {
          plantIndex,
          leafIndex,
          terrace: pr.terrace,
          condition,
          colorHex: LEAF_CONDITION_META[condition].leafHex,
        },
      });
    });

    return items;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    patekSpotMat.dispose();
    severeSpotMat.dispose();
    ledOnMat.dispose();
    ledValveMat.dispose();
    ledCamMat.dispose();
    sunMat.dispose();
    mistMatLower.dispose();
    mistMatUpper.dispose();
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
    getHotspots,
    dispose,
  };
}
