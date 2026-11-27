import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

export interface GardenLights {
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  nodeGlow: THREE.PointLight;
}

export function buildGardenLighting(ctx: GardenContext): GardenLights {
  const { scene } = ctx;
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
  return { hemiLight, sunLight, fillLight, nodeGlow };
}
