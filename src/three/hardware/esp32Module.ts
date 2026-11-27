import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal, createTextDecalTexture } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';
import type { EspPartKey } from '../../data/espParts';

// 1. STANDALONE ESP32-WROOM-32 MODULE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildEsp32Module(kit: KitBuilderContext): THREE.Group {
  const espGroup = new THREE.Group();

  const pcbW = 2.08;
  const pcbD = 4.1;
  const pcbZ = 0.28;
  const pcbH = 0.085;
  const pcbTop = pcbZ + pcbH;

  const pinRows = Array.from({ length: 15 }, (_, i) => -1.54 + i * 0.22);

  const h1Group = new THREE.Group();
  const h2Group = new THREE.Group();
  espGroup.add(h1Group, h2Group);

  pinRows.forEach((pz) => {
    kit.addHeaderPin(h1Group, -0.88, pz, pcbZ, pcbTop);
    kit.addHeaderPin(h2Group, 0.88, pz, pcbZ, pcbTop);
  });
  tagEspPart(h1Group, 'H1');
  tagEspPart(h2Group, 'H2');

  const pcbMesh = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(pcbW, pcbH, pcbD, 0.09)),
    kit.materials.pcbMat,
    1.022
  );
  pcbMesh.position.y = pcbZ;
  tagEspPart(pcbMesh, 'U1');
  espGroup.add(pcbMesh);

  const leftPins = ['EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', '13', 'GND', 'VIN'];
  const rightPins = ['23', '22', 'TX0', 'RX0', '21', '19', '18', '5', '17', '16', '4', '2', '15', 'GND', '3V3'];
  const espSilkTex = createCanvasDecal(512, 1024, (c) => {
    c.fillStyle = '#eef0f0';
    c.textBaseline = 'middle';
    c.font = 'bold 21px ui-monospace, monospace';

    pinRows.forEach((pz, i) => {
      const py = ((pz + pcbD / 2) / pcbD) * 1024;
      c.textAlign = 'left';
      c.fillText(leftPins[i], 60, py);
      c.textAlign = 'right';
      c.fillText(rightPins[i], 452, py);
    });

    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('ESP32-DevKit', 256, 632);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillStyle = '#b7c2d6';
    c.fillText('LEMBANG AIoT', 256, 666);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillStyle = '#fde047';
    c.fillText('USB-C', 256, 868);
  });
  kit.textures.push(espSilkTex);
  const pcbDecal = new THREE.Mesh(
    kit.trackGeo(new THREE.PlaneGeometry(pcbW - 0.04, pcbD - 0.04)),
    kit.trackMat(new THREE.MeshBasicMaterial({ map: espSilkTex, transparent: true }))
  );
  pcbDecal.rotation.x = -Math.PI / 2;
  pcbDecal.position.set(0, pcbTop + 0.003, 0);
  tagEspPart(pcbDecal, 'U1');
  espGroup.add(pcbDecal);

  // ANT1
  const antGroup = kit.registerExplodable('ANT1', 0, -1.8, 0.25, espGroup, pcbTop);
  const antBase = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(1.04, 0.02, 0.44)),
    kit.materials.pcbDarkMat,
    1.04
  );
  antBase.position.y = 0.01;
  antGroup.add(antBase);

  const meanderPts = [
    new THREE.Vector3(-0.38, 0.025, 0.14),
    new THREE.Vector3(-0.38, 0.025, -0.14),
    new THREE.Vector3(-0.19, 0.025, -0.14),
    new THREE.Vector3(-0.19, 0.025, 0.1),
    new THREE.Vector3(0.0, 0.025, 0.1),
    new THREE.Vector3(0.0, 0.025, -0.14),
    new THREE.Vector3(0.19, 0.025, -0.14),
    new THREE.Vector3(0.19, 0.025, 0.1),
    new THREE.Vector3(0.38, 0.025, 0.1),
  ];
  const meanderMesh = new THREE.Mesh(
    kit.trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(meanderPts, false, 'catmullrom', 0.05), 36, 0.02, 6, false)),
    kit.materials.goldMat
  );
  antGroup.add(meanderMesh);
  tagEspPart(antGroup, 'ANT1');

  // U1 RF Shield
  const u1Group = kit.registerExplodable('U1', 0, -0.98, 0.72, espGroup, pcbTop);
  const rfShield = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(1.04, 0.21, 1.2)),
    kit.materials.metalSilverMat,
    1.035
  );
  rfShield.position.y = 0.105;
  u1Group.add(rfShield);

  const rfDecalTex = createTextDecalTexture([
    { text: 'ESP-WROOM-32', font: 'bold 46px ui-monospace, monospace', y: 225, color: '#3b4046' },
    { text: 'Wi-Fi · BLE · 240MHz', font: 'bold 28px ui-monospace, monospace', y: 285, color: '#6b7280' },
  ]);
  kit.textures.push(rfDecalTex);
  const rfDecal = new THREE.Mesh(
    kit.trackGeo(new THREE.PlaneGeometry(0.96, 1.05)),
    kit.trackMat(new THREE.MeshBasicMaterial({ map: rfDecalTex, transparent: true }))
  );
  rfDecal.rotation.x = -Math.PI / 2;
  rfDecal.position.y = 0.214;
  u1Group.add(rfDecal);
  tagEspPart(u1Group, 'U1');

  // U3 AMS1117
  const u3Group = kit.registerExplodable('U3', -0.36, 0.05, 0.52, espGroup, pcbTop);
  const u3Body = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.28, 0.09, 0.34)),
    kit.materials.icDarkMat,
    1.07
  );
  u3Body.position.y = 0.045;
  u3Group.add(u3Body);
  const u3Tab = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.1, 0.04, 0.22)),
    kit.materials.metalSilverMat,
    1.08
  );
  u3Tab.position.set(-0.16, 0.02, 0);
  u3Group.add(u3Tab);
  [-0.11, 0, 0.11].forEach((lz) => {
    const leg = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.08, 0.025, 0.04)),
      kit.materials.metalSilverMat,
      1.1
    );
    leg.position.set(0.17, 0.015, lz);
    u3Group.add(leg);
  });
  tagEspPart(u3Group, 'U3');

  // U2 CP2102
  const u2Group = kit.registerExplodable('U2', 0.08, 0.88, 0.58, espGroup, pcbTop);
  const u2Body = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.36, 0.075, 0.36)),
    kit.materials.icDarkMat,
    1.07
  );
  u2Body.position.y = 0.038;
  u2Group.add(u2Body);
  [-0.12, -0.04, 0.04, 0.12].forEach((off) => {
    [-0.2, 0.2].forEach((side) => {
      const p = kit.factory.createOutlinedMesh(
        kit.trackGeo(new THREE.BoxGeometry(0.03, 0.02, 0.05)),
        kit.materials.metalSilverMat,
        1.1
      );
      p.position.set(off, 0.01, side);
      u2Group.add(p);
    });
  });
  tagEspPart(u2Group, 'U2');

  // RGB LED
  const rgbGroup = kit.registerExplodable('RGB', 0.3, 0.28, 0.56, espGroup, pcbTop);
  const rgbBase = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.22, 0.055, 0.22)),
    kit.materials.metalSilverMat,
    1.07
  );
  rgbBase.position.y = 0.028;
  rgbGroup.add(rgbBase);
  const rgbDome = new THREE.Mesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.072, 0.072, 0.025, 14)),
    kit.materials.ledMat
  );
  rgbDome.position.y = 0.065;
  rgbGroup.add(rgbDome);
  tagEspPart(rgbGroup, 'RGB');

  // RC SMD Passives
  const rcGroup = kit.registerExplodable('RC', 0, 0.4, 0.38, espGroup, pcbTop);
  [
    [-0.38, -0.7],
    [-0.16, -0.7],
    [0.36, -0.58],
    [-0.42, 0.16],
    [0.44, 0.45],
    [0.44, 0.65],
  ].forEach(([rx, rz], idx) => {
    const smd = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.11, 0.04, 0.065)),
      idx % 2 === 0 ? kit.materials.icDarkMat : kit.materials.goldMat,
      1.09
    );
    smd.position.set(rx, 0.02, rz);
    rcGroup.add(smd);
  });
  tagEspPart(rcGroup, 'RC');

  // SW1 & SW2
  const buildButton = (key: EspPartKey, bx: number, bz: number) => {
    const grp = kit.registerExplodable(key, bx, bz, 0.65, espGroup, pcbTop);
    const housing = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.28, 0.07, 0.28)),
      kit.materials.metalSilverMat,
      1.06
    );
    housing.position.y = 0.035;
    grp.add(housing);
    const plunger = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12)),
      kit.materials.icDarkMat,
      1.08
    );
    plunger.position.y = 0.095;
    grp.add(plunger);
    tagEspPart(grp, key);
  };
  buildButton('SW1', -0.46, 1.15);
  buildButton('SW2', 0.44, 1.38);

  // J1 USB-C Receptacle
  const j1Group = kit.registerExplodable('J1', 0, 1.9, 0.54, espGroup, pcbTop);
  const usbShell = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.58, 0.19, 0.46, 0.04)),
    kit.materials.metalSilverMat,
    1.045
  );
  usbShell.position.y = 0.0;
  j1Group.add(usbShell);
  const usbCollar = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.46, 0.14, 0.08, 0.025)),
    kit.materials.icDarkMat,
    1.04
  );
  usbCollar.position.set(0, 0.025, 0.22);
  j1Group.add(usbCollar);
  const usbCavity = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.38, 0.095, 0.04)),
    kit.materials.usbHoleMat
  );
  usbCavity.position.set(0, 0.095, 0.245);
  j1Group.add(usbCavity);
  const usbTongue = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.28, 0.025, 0.05)),
    kit.materials.goldMat
  );
  usbTongue.position.set(0, 0.095, 0.248);
  j1Group.add(usbTongue);
  const usbTopTex = createCanvasDecal(160, 128, (c) => {
    c.fillStyle = '#1e293b';
    c.fillRect(16, 16, 128, 96);
    c.strokeStyle = '#64748b';
    c.lineWidth = 4;
    c.strokeRect(18, 18, 124, 92);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('USB-C', 80, 52);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('5V / DATA', 80, 86);
  });
  kit.addDecalPlane(j1Group, 0.44, 0.34, 0.194, usbTopTex);
  tagEspPart(j1Group, 'J1');
  return espGroup;
}
