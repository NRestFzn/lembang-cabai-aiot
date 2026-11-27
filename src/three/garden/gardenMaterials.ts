import * as THREE from 'three';
import type { StylizedFactory } from '../stylizedMaterial';

/** Every material shared across garden sections (plus the field-wire colours). */
export interface GardenMaterials {
  gravelMat: THREE.MeshToonMaterial;
  subsoilMat: THREE.MeshToonMaterial;
  topsoilMat: THREE.MeshToonMaterial;
  soilDryColor: THREE.Color;
  soilWetColor: THREE.Color;
  bedSoilMat: THREE.MeshToonMaterial;
  mulchMat: THREE.MeshToonMaterial;
  stoneMat: THREE.MeshToonMaterial;
  woodMat: THREE.MeshToonMaterial;
  poleMat: THREE.MeshToonMaterial;
  boxBodyMat: THREE.MeshToonMaterial;
  boxLidMat: THREE.MeshToonMaterial;
  accentMat: THREE.MeshToonMaterial;
  accentDarkMat: THREE.MeshToonMaterial;
  solarFrameMat: THREE.MeshToonMaterial;
  pipeMat: THREE.MeshToonMaterial;
  brassMat: THREE.MeshToonMaterial;
  stemMat: THREE.MeshToonMaterial;
  branchMat: THREE.MeshToonMaterial;
  bambooMat: THREE.MeshToonMaterial;
  bambooNodeMat: THREE.MeshToonMaterial;
  wireMat: THREE.MeshToonMaterial;
  chiliRedMat: THREE.MeshToonMaterial;
  chiliOrangeMat: THREE.MeshToonMaterial;
  chiliCreamMat: THREE.MeshToonMaterial;
  chiliGreenMat: THREE.MeshToonMaterial;
  blossomMat: THREE.MeshToonMaterial;
  waterDropMat: THREE.MeshToonMaterial;
  patekSpotMat: THREE.MeshBasicMaterial;
  severeSpotMat: THREE.MeshBasicMaterial;
  ledOnMat: THREE.MeshBasicMaterial;
  ledValveMat: THREE.MeshBasicMaterial;
  ledCamMat: THREE.MeshBasicMaterial;
  wireRedMat: THREE.MeshToonMaterial;
  wireBlkMat: THREE.MeshToonMaterial;
  wireYlwMat: THREE.MeshToonMaterial;
  wireBluMat: THREE.MeshToonMaterial;
}

// --- Shared Stylized Materials ---
export function createGardenMaterials(factory: StylizedFactory): GardenMaterials {
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
  const wireRedMat = factory.createToon('#dc2626');
  const wireBlkMat = factory.createToon('#1f2937');
  const wireYlwMat = factory.createToon('#eab308');
  const wireBluMat = factory.createToon('#2563eb');
  return {
    gravelMat, subsoilMat, topsoilMat, soilDryColor, soilWetColor, bedSoilMat,
    mulchMat, stoneMat, woodMat, poleMat, boxBodyMat, boxLidMat, accentMat,
    accentDarkMat, solarFrameMat, pipeMat, brassMat, stemMat, branchMat,
    bambooMat, bambooNodeMat, wireMat, chiliRedMat, chiliOrangeMat,
    chiliCreamMat, chiliGreenMat, blossomMat, waterDropMat, patekSpotMat,
    severeSpotMat, ledOnMat, ledValveMat, ledCamMat, wireRedMat, wireBlkMat,
    wireYlwMat, wireBluMat,
  };
}
