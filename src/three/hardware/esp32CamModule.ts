import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 9. ESP32-CAM OV2640 MODULE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildEsp32CamModule(kit: KitBuilderContext): THREE.Group {
  const camGroup = new THREE.Group();
  const camZ = 0.22;
  const camH = 0.085;
  const camTop = camZ + camH;
  const camPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.62, camH, 2.28, 0.08)),
    kit.materials.pcbMat,
    1.022
  );
  camPcb.position.y = camZ;
  camGroup.add(camPcb);

  const camPinRows = Array.from({ length: 8 }, (_, i) => -0.77 + i * 0.22);
  const camLeftPins = ['5V', 'GND', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'];
  const camRightPins = ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'];

  const camHdrGrp = kit.registerExplodable('ESP32CAM', 0, 0, 0.32, camGroup, 0);
  camPinRows.forEach((pz) => {
    [-0.66, 0.66].forEach((px) => {
      kit.addHeaderPin(camHdrGrp, px, pz, camZ, camTop);
    });
  });

  const camSilkTex = createCanvasDecal(384, 540, (c) => {
    c.fillStyle = '#eef0f0';
    c.textBaseline = 'middle';
    c.font = 'bold 17px ui-monospace, monospace';
    camPinRows.forEach((pz, i) => {
      const py = ((pz + 1.14) / 2.28) * 540;
      c.textAlign = 'left';
      c.fillText(camLeftPins[i], 46, py);
      c.textAlign = 'right';
      c.fillText(camRightPins[i], 338, py);
    });
    c.textAlign = 'center';
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillText('ESP32-CAM', 192, 488);
    c.font = 'bold 15px ui-monospace, monospace';
    c.fillStyle = '#9ca3af';
    c.fillText('AI-Thinker · OV2640', 192, 514);
  });
  kit.addDecalPlane(camGroup, 1.56, 2.22, camTop + 0.003, camSilkTex);

  const camSdSlot = kit.registerExplodable('ESP32CAM', 0, -0.66, 0.55, camGroup, camTop);
  const camSdMetal = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.74, 0.12, 0.64)),
    kit.materials.metalSilverMat,
    1.04
  );
  camSdMetal.position.y = 0.06;
  camSdSlot.add(camSdMetal);

  const ovGrp = kit.registerExplodable('ESP32CAM', 0, 0.25, 0.72, camGroup, camTop);
  const zifConn = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.48, 0.08, 0.14)),
    kit.materials.icDarkMat,
    1.06
  );
  zifConn.position.set(0, 0.04, -0.44);
  ovGrp.add(zifConn);

  const fpcMat = kit.factory.createToon('#d97706');
  const fpcRibbon = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.32, 0.025, 0.36)),
    fpcMat,
    1.05
  );
  fpcRibbon.position.set(0, 0.03, -0.22);
  ovGrp.add(fpcRibbon);

  const camBaseBox = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.56, 0.18, 0.56)),
    kit.materials.icDarkMat,
    1.05
  );
  camBaseBox.position.y = 0.09;
  ovGrp.add(camBaseBox);

  const camBarrel = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.21, 0.23, 0.24, 18)),
    kit.materials.icDarkMat,
    1.05
  );
  camBarrel.position.y = 0.28;
  ovGrp.add(camBarrel);

  const lensRingMat = kit.factory.createToon('#38bdf8');
  const lensRim = new THREE.Mesh(
    kit.trackGeo(new THREE.RingGeometry(0.11, 0.16, 18)),
    lensRingMat
  );
  lensRim.rotation.x = -Math.PI / 2;
  lensRim.position.y = 0.404;
  ovGrp.add(lensRim);

  const lensGlassMat = kit.trackMat(new THREE.MeshBasicMaterial({ color: '#0f172a' }));
  const lensGlass = new THREE.Mesh(
    kit.trackGeo(new THREE.CircleGeometry(0.11, 18)),
    lensGlassMat
  );
  lensGlass.rotation.x = -Math.PI / 2;
  lensGlass.position.y = 0.406;
  ovGrp.add(lensGlass);

  const flashGrp = kit.registerExplodable('ESP32CAM', -0.36, 0.72, 0.48, camGroup, camTop);
  const flashHousing = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.22, 0.08, 0.22)),
    kit.materials.metalSilverMat,
    1.06
  );
  flashHousing.position.y = 0.04;
  flashGrp.add(flashHousing);
  const flashLens = new THREE.Mesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 14)),
    kit.materials.camFlashMat
  );
  flashLens.position.y = 0.085;
  flashGrp.add(flashLens);
  tagEspPart(camGroup, 'ESP32CAM');
  return camGroup;
}
