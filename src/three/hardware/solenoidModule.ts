import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 12. 12V BRASS SOLENOID VALVE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildSolenoidModule(kit: KitBuilderContext): THREE.Group {
  const solGroup = new THREE.Group();

  const valveBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 1.38, 14)),
    kit.materials.brassMat,
    1.035
  );
  valveBody.rotation.z = Math.PI / 2;
  valveBody.position.y = 0.26;
  solGroup.add(valveBody);

  [-0.68, 0.68].forEach((hx) => {
    const hexPort = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 6)),
      kit.materials.brassMat,
      1.045
    );
    hexPort.rotation.z = Math.PI / 2;
    hexPort.position.set(hx, 0.26, 0);
    solGroup.add(hexPort);

    const bore = new THREE.Mesh(
      kit.trackGeo(new THREE.CircleGeometry(0.14, 14)),
      kit.materials.usbHoleMat
    );
    bore.rotation.y = hx < 0 ? -Math.PI / 2 : Math.PI / 2;
    bore.position.set(hx + (hx < 0 ? -0.125 : 0.125), 0.26, 0);
    solGroup.add(bore);
  });

  const coilGrp = kit.registerExplodable('SOLENOID', 0, 0, 0.65, solGroup, 0.44);
  const coilBox = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.76, 0.6, 0.72, 0.05)),
    kit.materials.coilBlueMat,
    1.035
  );
  coilBox.position.y = 0.3;
  coilGrp.add(coilBox);

  const coilNut = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 6)),
    kit.materials.brassMat,
    1.06
  );
  coilNut.position.y = 0.64;
  coilGrp.add(coilNut);

  const coilLed = new THREE.Mesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12)),
    kit.materials.solenoidLedMat
  );
  coilLed.position.set(0.24, 0.61, 0.22);
  coilGrp.add(coilLed);

  const solDecalTex = createCanvasDecal(180, 180, (c) => {
    c.fillStyle = '#eff6ff';
    c.textAlign = 'center';
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('SOLENOID', 90, 42);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('12V DC · NC', 90, 138);
  });
  kit.addDecalPlane(coilGrp, 0.68, 0.64, 0.606, solDecalTex);
  tagEspPart(solGroup, 'SOLENOID');
  return solGroup;
}
