import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 11. 12V DIAPHRAGM WATER PUMP — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildPumpModule(kit: KitBuilderContext): { group: THREE.Group; pumpRotorGroup: THREE.Group } {
  const pumpGroup = new THREE.Group();
  const pumpBracket = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.75, 0.08, 0.92, 0.06)),
    kit.materials.icDarkMat,
    1.03
  );
  pumpBracket.position.y = 0.04;
  pumpGroup.add(pumpBracket);

  const motorGrp = kit.registerExplodable('PUMP', -0.25, 0, 0.55, pumpGroup, 0.08);
  const motorCan = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.94, 20)),
    kit.materials.metalSilverMat,
    1.035
  );
  motorCan.rotation.z = Math.PI / 2;
  motorCan.position.y = 0.36;
  motorGrp.add(motorCan);

  const motorEndCap = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.14, 18)),
    kit.materials.pumpBodyDarkMat,
    1.04
  );
  motorEndCap.rotation.z = Math.PI / 2;
  motorEndCap.position.set(-0.5, 0.36, 0);
  motorGrp.add(motorEndCap);

  const pumpLblTex = createCanvasDecal(256, 128, (c) => {
    c.fillStyle = '#1e293b';
    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('12V PUMP', 128, 52);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillStyle = '#475569';
    c.fillText('DIAPHRAGM · 3L/m', 128, 92);
  });
  kit.addDecalPlane(motorGrp, 0.68, 0.34, 0.725, pumpLblTex);

  [
    { z: -0.14, mat: kit.factory.createToon('#dc2626') },
    { z: 0.14, mat: kit.materials.icDarkMat },
  ].forEach((tab) => {
    const wire = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.24, 8)),
      tab.mat,
      1.08
    );
    wire.rotation.z = Math.PI / 2;
    wire.position.set(-0.68, 0.36, tab.z);
    motorGrp.add(wire);
  });

  const headGrp = kit.registerExplodable('PUMP', 0.48, 0, 0.68, pumpGroup, 0.08);
  const headBlock = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.56, 0.66, 0.74, 0.08)),
    kit.materials.pumpBodyDarkMat,
    1.035
  );
  headBlock.position.y = 0.36;
  headGrp.add(headBlock);

  const sightGlass = new THREE.Mesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16)),
    kit.factory.createToon('#0284c7')
  );
  sightGlass.position.y = 0.695;
  headGrp.add(sightGlass);

  const pumpRotorGroup = new THREE.Group();
  pumpRotorGroup.position.y = 0.715;
  headGrp.add(pumpRotorGroup);
  const blade1 = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.28, 0.018, 0.045)),
    kit.materials.metalSilverMat
  );
  const blade2 = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.045, 0.018, 0.28)),
    kit.materials.metalSilverMat
  );
  pumpRotorGroup.add(blade1, blade2);

  [-0.22, 0.22].forEach((nz) => {
    const nozzle = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.085, 0.11, 0.34, 14)),
      kit.materials.metalSilverMat,
      1.05
    );
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.set(0.42, 0.38, nz);
    headGrp.add(nozzle);
    const bore = new THREE.Mesh(
      kit.trackGeo(new THREE.CircleGeometry(0.055, 12)),
      kit.materials.usbHoleMat
    );
    bore.rotation.y = Math.PI / 2;
    bore.position.set(0.595, 0.38, nz);
    headGrp.add(bore);
  });
  tagEspPart(pumpGroup, 'PUMP');
  return { group: pumpGroup, pumpRotorGroup };
}
