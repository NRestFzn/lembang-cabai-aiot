import * as THREE from 'three';
import { tagEspPart } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';
import { RegisterMove } from './modules';

/** Ventilated 4-plate radiation shield + GY-BME280 (original section 5). */
export function buildRadiationShield(
  ctx: PhysicalContext,
  materials: PhysicalMaterials,
  bmeGroup: THREE.Group,
  mastX: number,
  registerMove: RegisterMove
): { shieldGroup: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  const { aluMat, shieldWhiteMat } = materials;
  // =========================================================================
  // 5. VENTILATED 4-PLATE RADIATION SHIELD IN FRONT OF BOX (+Z) + GY-BME280
  // =========================================================================
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(mastX + 0.65, 1.32, 1.72);
  scene.add(shieldGroup);

  // Horizontal forward boom extending cleanly from beneath IP65 box out in FRONT of box (+Z)
  const shieldBackBoom = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 2.24, 10)),
    aluMat,
    1.05
  );
  shieldBackBoom.rotation.x = Math.PI / 2;
  shieldBackBoom.position.set(-0.32, -0.44, -1.12);
  shieldGroup.add(shieldBackBoom);

  const shieldCrossArm = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.68, 10)),
    aluMat,
    1.05
  );
  shieldCrossArm.rotation.z = Math.PI / 2;
  shieldCrossArm.position.set(-0.66, -0.44, -2.22);
  shieldGroup.add(shieldCrossArm);

  const shieldRiser = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.68, 10)),
    aluMat,
    1.05
  );
  shieldRiser.position.set(-0.32, -0.12, 0);
  shieldGroup.add(shieldRiser);

  const shieldArmTop = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 8)),
    aluMat,
    1.05
  );
  shieldArmTop.rotation.z = Math.PI / 2;
  shieldArmTop.position.set(-0.16, 0.22, 0);
  shieldGroup.add(shieldArmTop);

  // 3 stainless tie rods
  [-0.22, 0, 0.22].forEach((rx, idx) => {
    const rz = idx === 1 ? -0.24 : 0.14;
    const rod = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.72, 6)),
      aluMat,
      1.08
    );
    rod.position.set(rx, 0.05, rz);
    shieldGroup.add(rod);
  });

  // Real GY-BME280 mounted horizontally on middle carrier plate
  bmeGroup.position.set(0, -0.02, 0);
  bmeGroup.scale.setScalar(0.42);
  shieldGroup.add(bmeGroup);

  const shieldOffsets: Array<{ baseY: number; lift: number; rTop: number; rBot: number }> = [
    { baseY: -0.18, lift: -0.36, rTop: 0.42, rBot: 0.48 },
    { baseY: -0.05, lift: -0.14, rTop: 0.4, rBot: 0.46 },
    { baseY: 0.14, lift: 0.34, rTop: 0.4, rBot: 0.46 },
    { baseY: 0.27, lift: 0.62, rTop: 0.44, rBot: 0.48 },
  ];
  shieldOffsets.forEach(({ baseY, lift, rTop, rBot }) => {
    const disc = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(rTop, rBot, 0.04, 18)),
      shieldWhiteMat,
      1.04
    );
    disc.position.y = baseY;
    shieldGroup.add(disc);
    tagEspPart(disc, 'BME280');
    registerMove(disc, [0, lift, 0], true);
  });
  return { shieldGroup };
}
