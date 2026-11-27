import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

export interface GardenFloor {
  shadowFloorMat: THREE.ShadowMaterial;
  shadowFloor: THREE.Mesh;
}

export function buildGardenFloor(ctx: GardenContext): GardenFloor {
  const { scene, trackGeo } = ctx;
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
  return { shadowFloorMat, shadowFloor };
}
