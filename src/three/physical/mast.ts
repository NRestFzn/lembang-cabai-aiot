import * as THREE from 'three';
import { createRoundedBoxGeo } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';

export interface MastStand {
  mastX: number;
  mastZ: number;
  mastFlange: THREE.Group;
  mastPole: THREE.Group;
}

/** Aluminum pole / mast stand (original section 1). */
export function buildMast(ctx: PhysicalContext, materials: PhysicalMaterials): MastStand {
  const { scene, factory, trackGeo } = ctx;
  const { aluMat, darkMetalMat } = materials;
  // =========================================================================
  // 1. ALUMINUM POLE / MAST STAND
  // =========================================================================
  const mastX = -1.15;
  const mastZ = -0.52;

  const mastFlange = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.62, 0.09, 0.62, 0.06)),
    darkMetalMat,
    1.03
  );
  mastFlange.position.set(mastX, 0.08, mastZ);
  scene.add(mastFlange);

  const mastPole = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 4.82, 16)),
    aluMat,
    1.03
  );
  mastPole.position.set(mastX, 2.52, mastZ);
  scene.add(mastPole);
  return { mastX, mastZ, mastFlange, mastPole };
}
