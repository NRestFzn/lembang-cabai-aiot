import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 2. LM2596 DC-DC REGULATOR MODULE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildLm2596Module(kit: KitBuilderContext): THREE.Group {
  const lmGroup = new THREE.Group();
  const lmZ = 0.06;
  const lmH = 0.085;
  const lmTop = lmZ + lmH;
  const lmPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(2.58, lmH, 1.54, 0.08)),
    kit.materials.bluePcbMat,
    1.022
  );
  lmPcb.position.y = lmZ;
  lmGroup.add(lmPcb);

  const lmSilkTex = createCanvasDecal(512, 320, (c) => {
    c.strokeStyle = 'rgba(130, 175, 245, 0.35)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(65, 110);
    c.lineTo(135, 110);
    c.lineTo(190, 210);
    c.moveTo(270, 110);
    c.lineTo(395, 110);
    c.lineTo(445, 150);
    c.stroke();

    c.strokeStyle = 'rgba(241, 242, 239, 0.78)';
    c.lineWidth = 2.5;
    c.setLineDash([7, 5]);
    c.strokeRect(182, 182, 90, 96);
    c.strokeRect(272, 200, 130, 74);
    c.setLineDash([]);

    c.fillStyle = '#eef0f0';
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillText('LM2596 DC-DC', 175, 36);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('IN', 64, 72);
    c.fillText('+', 64, 130);
    c.fillText('-', 64, 198);
    c.fillText('OUT', 428, 72);
    c.fillText('+', 432, 130);
    c.fillText('-', 432, 198);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('ADJ', 385, 175);
    c.fillText('+', 108, 60);
    c.fillText('+', 350, 60);
  });
  kit.addDecalPlane(lmGroup, 2.46, 1.44, lmTop + 0.003, lmSilkTex);

  kit.addGoldPads(lmGroup, lmTop + 0.006, [
    [-1.14, -0.62],
    [1.14, -0.62],
    [-1.14, 0.62],
    [1.14, 0.62],
  ]);

  kit.addScrewTerminal('LM2596', lmGroup, -1.06, 0.02, lmTop, kit.materials.blueTermMat, 'left');
  kit.addScrewTerminal('LM2596', lmGroup, 1.06, 0.02, lmTop, kit.materials.blueTermMat, 'right');
  kit.addElectrolyticCap('LM2596', lmGroup, -0.58, -0.34, lmTop, 0.19, 0.46);
  kit.addElectrolyticCap('LM2596', lmGroup, 0.58, -0.34, lmTop, 0.19, 0.46);

  const indGrp = kit.registerExplodable('LM2596', 0.0, -0.34, 0.64, lmGroup, lmTop);
  const indBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 18)),
    kit.materials.icDarkMat,
    1.04
  );
  indBody.position.y = 0.2;
  indGrp.add(indBody);
  const indDecal = createCanvasDecal(128, 128, (c) => {
    c.strokeStyle = '#9aa4b2';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(64, 64, 42, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#eef0f0';
    c.font = 'bold 34px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('330', 64, 65);
  });
  kit.textures.push(indDecal);
  const indTopDisk = new THREE.Mesh(
    kit.trackGeo(new THREE.CircleGeometry(0.25, 16)),
    kit.trackMat(new THREE.MeshBasicMaterial({ map: indDecal, transparent: true }))
  );
  indTopDisk.rotation.x = -Math.PI / 2;
  indTopDisk.position.y = 0.405;
  indGrp.add(indTopDisk);

  const lmIcGrp = kit.registerExplodable('LM2596', -0.26, 0.32, 0.52, lmGroup, lmTop);
  const lmIcBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.44, 0.16, 0.42)),
    kit.materials.icDarkMat,
    1.05
  );
  lmIcBody.position.y = 0.08;
  lmIcGrp.add(lmIcBody);
  const lmIcDecal = createCanvasDecal(128, 128, (c) => {
    c.fillStyle = '#d1d5db';
    c.font = 'bold 20px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('LM2596S', 64, 52);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillText('-ADJ', 64, 80);
  });
  kit.addDecalPlane(lmIcGrp, 0.4, 0.38, 0.164, lmIcDecal);

  const lmTab = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.42, 0.05, 0.14)),
    kit.materials.metalSilverMat,
    1.07
  );
  lmTab.position.set(0, 0.025, -0.25);
  lmIcGrp.add(lmTab);
  [-0.14, -0.07, 0, 0.07, 0.14].forEach((px) => {
    const leg = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.032, 0.03, 0.12)),
      kit.materials.metalSilverMat,
      1.09
    );
    leg.position.set(px, 0.018, 0.24);
    lmIcGrp.add(leg);
  });

  const ss34Grp = kit.registerExplodable('LM2596', -0.68, 0.42, 0.48, lmGroup, lmTop);
  const ssBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.28, 0.11, 0.18)),
    kit.materials.icDarkMat,
    1.06
  );
  ssBody.position.y = 0.055;
  ss34Grp.add(ssBody);
  const ssDecal = createCanvasDecal(128, 96, (c) => {
    c.fillStyle = '#e5e7eb';
    c.fillRect(10, 12, 16, 72);
    c.font = 'bold 26px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('SS34', 76, 56);
  });
  kit.addDecalPlane(ss34Grp, 0.26, 0.16, 0.114, ssDecal);

  const trimGrp = kit.registerExplodable('LM2596', 0.64, 0.08, 0.48, lmGroup, lmTop);
  const trimBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.32, 0.26, 0.24)),
    kit.materials.blueTermMat,
    1.06
  );
  trimBody.position.y = 0.13;
  trimGrp.add(trimBody);
  const trimDecal = createCanvasDecal(128, 96, (c) => {
    c.fillStyle = '#eef0f0';
    c.font = 'bold 26px ui-monospace, monospace';
    c.fillText('103', 18, 56);
  });
  kit.addDecalPlane(trimGrp, 0.28, 0.2, 0.264, trimDecal);
  const brassScrew = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 10)),
    kit.materials.goldMat,
    1.08
  );
  brassScrew.position.set(0.09, 0.28, 0);
  trimGrp.add(brassScrew);

  const voltGrp = kit.registerExplodable('LM2596', 0.36, 0.44, 0.46, lmGroup, lmTop);
  const voltCase = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.68, 0.14, 0.34)),
    kit.materials.icDarkMat,
    1.05
  );
  voltCase.position.y = 0.07;
  voltGrp.add(voltCase);
  const voltDecal = createCanvasDecal(256, 128, (c) => {
    c.fillStyle = '#181614';
    c.fillRect(10, 12, 236, 104);
    c.fillStyle = '#ef4444';
    c.font = 'bold 64px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('5.00 V', 128, 66);
  });
  kit.addDecalPlane(voltGrp, 0.62, 0.28, 0.144, voltDecal);

  const lmLed = new THREE.Mesh(kit.trackGeo(new THREE.BoxGeometry(0.09, 0.04, 0.06)), kit.materials.smdRedLedMat);
  lmLed.position.set(-0.62, lmTop + 0.02, 0.12);
  lmGroup.add(lmLed);
  tagEspPart(lmGroup, 'LM2596');
  return lmGroup;
}
