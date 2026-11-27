import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 5. GY-BME280 CANOPY MICROCLIMATE SENSOR — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildBme280Module(kit: KitBuilderContext): THREE.Group {

  const bmeGroup = new THREE.Group();
  const bmeZ = 0.06;
  const bmeH = 0.075;
  const bmeTop = bmeZ + bmeH;
  const bmePcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.32, bmeH, 1.06, 0.07)),
    kit.materials.purplePcbMat,
    1.025
  );
  bmePcb.position.y = bmeZ;
  bmeGroup.add(bmePcb);

  const bmeSilkTex = createCanvasDecal(280, 224, (c) => {
    c.strokeStyle = 'rgba(192, 148, 240, 0.45)';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(95, 112);
    c.lineTo(225, 112);
    c.moveTo(150, 55);
    c.lineTo(225, 55);
    c.moveTo(150, 165);
    c.lineTo(225, 165);
    c.stroke();

    c.fillStyle = '#f8f5ff';
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('GY-BME280', 18, 204);
    c.font = 'bold 16px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText('VCC', 206, 46);
    c.fillText('GND', 206, 92);
    c.fillText('SCL', 206, 138);
    c.fillText('SDA', 206, 184);
  });
  kit.addDecalPlane(bmeGroup, 1.24, 0.98, bmeTop + 0.003, bmeSilkTex);

  kit.addGoldPads(bmeGroup, bmeTop + 0.006, [
    [-0.46, -0.34],
    [0.52, -0.33],
    [0.52, -0.11],
    [0.52, 0.11],
    [0.52, 0.33],
  ]);

  const boschGrp = kit.registerExplodable('BME280', -0.22, 0.04, 0.52, bmeGroup, bmeTop);
  const boschCap = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.32, 0.11, 0.32)),
    kit.materials.metalSilverMat,
    1.06
  );
  boschCap.position.y = 0.055;
  boschGrp.add(boschCap);
  const boschPort = new THREE.Mesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 10)),
    kit.materials.icDarkMat
  );
  boschPort.position.set(0.06, 0.112, -0.05);
  boschGrp.add(boschPort);

  [-0.22, -0.04, 0.14].forEach((rz, idx) => {
    const smd = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.14, 0.045, 0.075)),
      idx < 2 ? kit.materials.icDarkMat : kit.materials.goldMat,
      1.09
    );
    smd.position.set(0.12, bmeTop + 0.022, rz);
    bmeGroup.add(smd);
  });

  const bmeHdr = kit.registerExplodable('BME280', 0.52, 0, 0.38, bmeGroup, 0);
  [-0.33, -0.11, 0.11, 0.33].forEach((pz) => {
    kit.addHeaderPin(bmeHdr, 0, pz, bmeZ, bmeTop);
  });
  tagEspPart(bmeGroup, 'BME280');
  return bmeGroup;
}
