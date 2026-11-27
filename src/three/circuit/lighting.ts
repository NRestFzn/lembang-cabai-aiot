import * as THREE from 'three';
import { CircuitContext } from './context';

export interface CircuitLighting {
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
}

/** Studio lighting + floor shadow catcher (original sections: Studio Lighting, Floor Shadow Catcher). */
export function buildStudioLighting(ctx: CircuitContext): CircuitLighting {
  const { scene, trackGeo, trackMat } = ctx;
  // --- Studio Lighting ---
  const hemiLight = new THREE.HemisphereLight('#fffdf8', '#5e6f9e', 1.25);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff8eb', 1.7);
  sunLight.position.set(5, 8.5, 5.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 40;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 14;
  sunLight.shadow.camera.top = 8;
  sunLight.shadow.camera.bottom = -8;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight('#bfd1f7', 0.48);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  // --- Floor Shadow Catcher ---
  const shadowFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(36, 24)),
    trackMat(new THREE.ShadowMaterial({ color: '#41538f', opacity: 0.24 }))
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.02;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);
  return { hemiLight, sunLight, fillLight };
}
