import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 15. PAKET BATERAI LiFePO4 4S 12.8V 6000mAh — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildBatteryModule(kit: KitBuilderContext): THREE.Group {
  const batGroup = new THREE.Group();
  const batCradle = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(2.24, 0.14, 0.98, 0.07)),
    kit.materials.icDarkMat,
    1.03
  );
  batCradle.position.y = 0.0;
  batGroup.add(batCradle);

  [-0.96, 0.96].forEach((cx) => {
    const clip = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.1, 0.48, 0.44)),
      kit.materials.metalSilverMat,
      1.05
    );
    clip.position.set(cx, 0.32, 0);
    batGroup.add(clip);
  });

  const cellGrp = kit.registerExplodable('BATTERY', 0, 0, 0.62, batGroup, 0.14);
  const cellSleeveMat = kit.factory.createToon('#0284c7');
  const packBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.76, 0.48, 0.78, 0.08)),
    cellSleeveMat,
    1.03
  );
  packBody.position.y = 0.02;
  cellGrp.add(packBody);

  [-0.27, -0.09, 0.09, 0.27].forEach((rz) => {
    const cellRib = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 1.72, 12)),
      cellSleeveMat,
      1.02
    );
    cellRib.rotation.z = Math.PI / 2;
    cellRib.position.set(0, 0.47, rz);
    cellGrp.add(cellRib);
  });

  const posNub = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16)),
    kit.materials.metalSilverMat,
    1.06
  );
  posNub.rotation.z = Math.PI / 2;
  posNub.position.set(-0.9, 0.3, 0);
  cellGrp.add(posNub);

  const batLabelTex = createCanvasDecal(440, 180, (c) => {
    c.fillStyle = '#0369a1';
    c.fillRect(0, 0, 440, 180);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 4;
    c.strokeRect(8, 8, 424, 164);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('LiFePO4 4S PACK', 220, 52);
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillStyle = '#bae6fd';
    c.fillText('12.8V · 6000mAh · 76.8Wh', 220, 98);
    c.fillStyle = '#fde047';
    c.font = 'bold 25px ui-monospace, monospace';
    c.fillText('+ (12V)             - (GND)', 220, 142);
  });
  kit.addDecalPlane(cellGrp, 1.56, 0.62, 0.562, batLabelTex);
  tagEspPart(batGroup, 'BATTERY');
  return batGroup;
}
