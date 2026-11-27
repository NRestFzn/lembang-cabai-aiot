import * as THREE from 'three';
import { createRoundedBoxGeo } from '../hardwareModules';
import { PhysicalContext } from './context';

export interface PhysicalMaterials {
  plinthMat: THREE.Material;
  aluMat: THREE.Material;
  darkMetalMat: THREE.Material;
  ip65BodyMat: THREE.Material;
  ip65DoorMat: THREE.Material;
  gasketMat: THREE.Material;
  shieldWhiteMat: THREE.Material;
  acrylicPlateMat: THREE.Material;
  smokedWindowMat: THREE.Material;
  pipeBlueMat: THREE.Material;
}

export interface PhysicalLighting {
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  materials: PhysicalMaterials;
}

/** Studio lighting, floor shadow catcher, pedestal + shared materials. */
export function buildStudioLighting(ctx: PhysicalContext): PhysicalLighting {
  const { scene, factory, trackGeo, trackMat } = ctx;
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
  return {
    hemiLight,
    sunLight,
    fillLight,
    materials: {
      plinthMat,
      aluMat,
      darkMetalMat,
      ip65BodyMat,
      ip65DoorMat,
      gasketMat,
      shieldWhiteMat,
      acrylicPlateMat,
      smokedWindowMat,
      pipeBlueMat,
    },
  };
}
