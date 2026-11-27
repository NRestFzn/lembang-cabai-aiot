import * as THREE from 'three';
import type { EspPartKey } from '../../data/espParts';

// Tagging helper moved verbatim from hardwareModules.ts.

export function tagEspPart(obj: THREE.Object3D, part: EspPartKey) {
  obj.traverse((child) => {
    child.userData.espPart = part;
  });
}
