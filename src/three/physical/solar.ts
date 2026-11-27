import * as THREE from 'three';
import { createRoundedBoxGeo } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';
import { RegisterMove } from './modules';

/** Top solar panel bracket + solar module (original section 2). */
export function buildSolarBracket(
  ctx: PhysicalContext,
  materials: PhysicalMaterials,
  solarGroup: THREE.Group,
  mastX: number,
  mastZ: number,
  registerMove: RegisterMove
): { solarBracket: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  const { darkMetalMat } = materials;
  // =========================================================================
  // 2. TOP SOLAR PANEL BRACKET + REAL SOLAR 3D MODULE
  // =========================================================================
  const solarBracket = new THREE.Group();
  solarBracket.position.set(mastX, 4.98, mastZ);
  solarBracket.rotation.x = 0.28;
  scene.add(solarBracket);

  const uMount = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.54, 0.12, 0.42, 0.04)),
    darkMetalMat,
    1.04
  );
  uMount.position.y = -0.06;
  solarBracket.add(uMount);

  solarGroup.position.set(0, 0.05, 0);
  solarGroup.scale.setScalar(0.95);
  solarBracket.add(solarGroup);
  registerMove(solarGroup, [0, 0.68, 0], true);
  return { solarBracket };
}
