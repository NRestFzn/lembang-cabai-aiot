import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 10. 2-CHANNEL 5V OPTOCOUPLER RELAY MODULE — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildRelayModule(kit: KitBuilderContext): THREE.Group {
  const relayGroup = new THREE.Group();

  const rlyZ = 0.08;
  const rlyH = 0.085;
  const rlyTop = rlyZ + rlyH;
  const rlyPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(2.26, rlyH, 1.88, 0.07)),
    kit.materials.redPcbMat,
    1.022
  );
  rlyPcb.position.y = rlyZ;
  relayGroup.add(rlyPcb);

  kit.addGoldPads(relayGroup, rlyTop + 0.005, [
    [-1.02, -0.82],
    [1.02, -0.82],
    [-1.02, 0.82],
    [1.02, 0.82],
  ]);

  const rlySilkTex = createCanvasDecal(512, 420, (c) => {
    c.fillStyle = '#fef2f2';
    c.textBaseline = 'middle';
    c.font = 'bold 18px ui-monospace, monospace';
    c.textAlign = 'left';
    ['GND', 'IN1', 'IN2', 'VCC'].forEach((lbl, i) => {
      c.fillText(lbl, 46, 84 + i * 44);
    });
    c.font = 'bold 14px ui-monospace, monospace';
    c.fillText('JD-VCC', 30, 318);
    c.textAlign = 'center';
    c.font = 'bold 19px ui-monospace, monospace';
    c.fillText('2CH 5V RELAY', 256, 30);
    c.textAlign = 'right';
    c.font = 'bold 13px ui-monospace, monospace';
    c.fillText('NO1 COM1 NC1', 418, 128);
    c.fillText('NO2 COM2 NC2', 418, 294);
  });
  kit.addDecalPlane(relayGroup, 2.18, 1.8, rlyTop + 0.003, rlySilkTex);

  [-0.36, 0.38].forEach((rz) => {
    const rlyCubeGrp = kit.registerExplodable('RELAY', -0.02, rz, 0.72, relayGroup, rlyTop);
    const rlyCube = kit.factory.createOutlinedMesh(
      kit.trackGeo(createRoundedBoxGeo(0.74, 0.56, 0.62, 0.03)),
      kit.materials.relayBlueCubeMat,
      1.035
    );
    rlyCube.position.y = 0.28;
    rlyCubeGrp.add(rlyCube);
    const rlyCapTex = createCanvasDecal(180, 140, (c) => {
      c.fillStyle = '#eff6ff';
      c.textAlign = 'center';
      c.font = 'bold 22px ui-monospace, monospace';
      c.fillText('SONGLE', 90, 34);
      c.font = 'bold 15px ui-monospace, monospace';
      c.fillText('SRD-05VDC', 90, 72);
      c.fillText('SL-C · 10A', 90, 104);
    });
    kit.addDecalPlane(rlyCubeGrp, 0.66, 0.52, 0.566, rlyCapTex);
  });

  [-0.36, 0.38].forEach((rz) => {
    const tBlkGrp = kit.registerExplodable('RELAY', 0.88, rz, 0.55, relayGroup, rlyTop);
    const tBlk = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.32, 0.28, 0.62)),
      kit.materials.greenTermMat,
      1.045
    );
    tBlk.position.y = 0.14;
    tBlkGrp.add(tBlk);
    [-0.19, 0, 0.19].forEach((sz) => {
      const scr = kit.factory.createOutlinedMesh(
        kit.trackGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.035, 10)),
        kit.materials.metalSilverMat,
        1.07
      );
      scr.position.set(0, 0.29, sz);
      tBlkGrp.add(scr);
      const hole = new THREE.Mesh(
        kit.trackGeo(new THREE.BoxGeometry(0.05, 0.11, 0.11)),
        kit.materials.usbHoleMat
      );
      hole.position.set(0.15, 0.1, sz);
      tBlkGrp.add(hole);
    });
  });

  const rlyCtrlHdr = kit.registerExplodable('RELAY', -0.92, -0.18, 0.44, relayGroup, rlyTop);
  [-0.33, -0.11, 0.11, 0.33].forEach((pz) => {
    kit.addShortPin(rlyCtrlHdr, 0, pz);
  });

  const optoGrp = kit.registerExplodable('RELAY', -0.58, -0.1, 0.5, relayGroup, rlyTop);
  [-0.24, 0.24].forEach((oz) => {
    const opto = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.24, 0.09, 0.18)),
      kit.materials.icDarkMat,
      1.07
    );
    opto.position.set(0, 0.045, oz);
    optoGrp.add(opto);
    const led = new THREE.Mesh(
      kit.trackGeo(new THREE.BoxGeometry(0.09, 0.04, 0.06)),
      kit.materials.relayLedMat
    );
    led.position.set(0.02, 0.02, oz + 0.17);
    optoGrp.add(led);
  });

  const jdGrp = kit.registerExplodable('RELAY', -0.82, 0.56, 0.48, relayGroup, rlyTop);
  const jdCap = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.18, 0.16, 0.26)),
    kit.materials.goldMat,
    1.06
  );
  jdCap.position.y = 0.08;
  jdGrp.add(jdCap);
  tagEspPart(relayGroup, 'RELAY');
  return relayGroup;
}
