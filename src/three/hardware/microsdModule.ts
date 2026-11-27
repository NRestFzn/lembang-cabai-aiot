import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 8. MICROSD LOGGER MODULE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildMicrosdModule(kit: KitBuilderContext): THREE.Group {
  const sdGroup = new THREE.Group();
  const sdZ = 0.06;
  const sdH = 0.08;
  const sdTop = sdZ + sdH;
  const sdPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.62, sdH, 1.44, 0.07)),
    kit.materials.bluePcbMat,
    1.022
  );
  sdPcb.position.y = sdZ;
  sdGroup.add(sdPcb);

  kit.addGoldPads(sdGroup, sdTop + 0.005, [
    [-0.72, -0.62],
    [0.72, -0.62],
    [-0.72, 0.62],
    [0.72, 0.62],
  ]);

  const sdPinNames = ['CS', 'SCK', 'MOSI', 'MISO', 'VCC', 'GND'];
  const sdPinZs = [-0.55, -0.33, -0.11, 0.11, 0.33, 0.55];
  const sdSilkTex = createCanvasDecal(320, 280, (c) => {
    c.fillStyle = '#eef6ff';
    c.textBaseline = 'middle';
    c.font = 'bold 16px ui-monospace, monospace';
    c.textAlign = 'left';
    sdPinZs.forEach((pz, i) => {
      const py = ((pz + 0.72) / 1.44) * 280;
      c.fillText(sdPinNames[i], 46, py);
    });
    c.textAlign = 'center';
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('MicroSD', 232, 26);
    c.font = 'bold 13px ui-monospace, monospace';
    c.fillStyle = '#bfdbfe';
    c.fillText('SPI · 3.3V/5V', 175, 252);
  });
  kit.addDecalPlane(sdGroup, 1.54, 1.36, sdTop + 0.003, sdSilkTex);

  const sdHdr = kit.registerExplodable('MICROSD', -0.68, 0, 0.42, sdGroup, 0);
  sdPinZs.forEach((pz) => {
    kit.addHeaderPin(sdHdr, 0, pz, sdZ, sdTop);
  });

  const sdLdo = kit.registerExplodable('MICROSD', -0.1, -0.28, 0.48, sdGroup, sdTop);
  const sdLdoBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.24, 0.08, 0.28)),
    kit.materials.icDarkMat,
    1.07
  );
  sdLdoBody.position.y = 0.04;
  sdLdo.add(sdLdoBody);
  const sdLdoTab = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.16, 0.03, 0.08)),
    kit.materials.metalSilverMat,
    1.09
  );
  sdLdoTab.position.set(0, 0.015, -0.16);
  sdLdo.add(sdLdoTab);

  const sdBuf = kit.registerExplodable('MICROSD', -0.1, 0.22, 0.52, sdGroup, sdTop);
  const sdBufBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.26, 0.075, 0.34)),
    kit.materials.icDarkMat,
    1.06
  );
  sdBufBody.position.y = 0.038;
  sdBuf.add(sdBufBody);
  [-0.12, -0.04, 0.04, 0.12].forEach((lz) => {
    [-0.16, 0.16].forEach((lx) => {
      const leg = kit.factory.createOutlinedMesh(
        kit.trackGeo(new THREE.BoxGeometry(0.05, 0.02, 0.03)),
        kit.materials.metalSilverMat,
        1.1
      );
      leg.position.set(lx, 0.01, lz);
      sdBuf.add(leg);
    });
  });

  const sdSlotGrp = kit.registerExplodable('MICROSD', 0.36, 0, 0.58, sdGroup, sdTop);
  const sdCage = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.68, 0.14, 0.72)),
    kit.materials.metalSilverMat,
    1.04
  );
  sdCage.position.y = 0.07;
  sdSlotGrp.add(sdCage);
  const sdSlotHole = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.04, 0.08, 0.54)),
    kit.materials.usbHoleMat
  );
  sdSlotHole.position.set(0.34, 0.07, 0);
  sdSlotGrp.add(sdSlotHole);

  const sdCardBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.42, 0.042, 0.48)),
    kit.materials.icDarkMat,
    1.06
  );
  sdCardBody.position.set(0.46, 0.07, 0);
  sdSlotGrp.add(sdCardBody);
  const sdCardTex = createCanvasDecal(128, 128, (c) => {
    c.fillStyle = '#1f2937';
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#f59e0b';
    c.fillRect(10, 16, 44, 96);
    c.fillStyle = '#fef3c7';
    c.font = 'bold 24px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('32GB', 92, 54);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillText('uSD', 92, 86);
  });
  kit.addDecalPlane(sdSlotGrp, 0.38, 0.44, 0.095, sdCardTex);
  tagEspPart(sdGroup, 'MICROSD');
  return sdGroup;
}
