import * as THREE from 'three';
import { createTaperedBladeGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 6. CAPACITIVE SOIL MOISTURE SENSOR v1.2 — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildSoilModule(kit: KitBuilderContext): THREE.Group {
  const soilGroup = new THREE.Group();
  const soilZ = 0.06;
  const soilH = 0.07;
  const soilTop = soilZ + soilH;
  const soilBlade = kit.factory.createOutlinedMesh(
    kit.trackGeo(createTaperedBladeGeo(2.38, soilH, 0.88, 0.55)),
    kit.materials.pcbMat,
    1.022
  );
  soilBlade.position.y = soilZ;
  soilGroup.add(soilBlade);

  const soilSilkTex = createCanvasDecal(512, 192, (c) => {
    c.strokeStyle = '#e2bd56';
    c.lineWidth = 10;
    c.strokeRect(108, 22, 190, 148);
    c.fillStyle = '#d4aa3c';
    c.fillRect(130, 56, 148, 80);

    c.fillStyle = '#f3efe4';
    c.fillRect(302, 12, 9, 168);

    c.fillStyle = '#eef0f0';
    c.font = 'bold 16px ui-monospace, monospace';
    c.fillText('Capacitive Soil v1.2', 318, 26);
    c.font = 'bold 15px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText('GND', 432, 62);
    c.fillText('VCC', 432, 102);
    c.fillText('AOUT', 432, 142);
  });
  kit.addDecalPlane(soilGroup, 2.26, 0.82, soilTop + 0.003, soilSilkTex);

  const ne555Grp = kit.registerExplodable('SOIL_MOISTURE', 0.36, -0.02, 0.48, soilGroup, soilTop);
  const neBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.24, 0.07, 0.22)),
    kit.materials.icDarkMat,
    1.07
  );
  neBody.position.y = 0.035;
  ne555Grp.add(neBody);
  [-0.08, -0.025, 0.03, 0.085].forEach((lx) => {
    [-0.13, 0.13].forEach((side) => {
      const leg = kit.factory.createOutlinedMesh(
        kit.trackGeo(new THREE.BoxGeometry(0.024, 0.02, 0.05)),
        kit.materials.metalSilverMat,
        1.1
      );
      leg.position.set(lx, 0.012, side);
      ne555Grp.add(leg);
    });
  });

  const ldoSoil = kit.registerExplodable('SOIL_MOISTURE', 0.36, 0.26, 0.44, soilGroup, soilTop);
  const ldoBody = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.18, 0.06, 0.14)),
    kit.materials.icDarkMat,
    1.08
  );
  ldoBody.position.y = 0.03;
  ldoSoil.add(ldoBody);

  const jstGrp = kit.registerExplodable('SOIL_MOISTURE', 1.0, 0, 0.4, soilGroup, soilTop);
  const jstShell = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.24, 0.16, 0.46)),
    kit.materials.whiteJstMat,
    1.05
  );
  jstShell.position.y = 0.08;
  jstGrp.add(jstShell);
  [-0.14, 0, 0.14].forEach((pz) => {
    const pin = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.1, 0.035, 0.035)),
      kit.materials.metalSilverMat,
      1.1
    );
    pin.position.set(0.13, 0.08, pz);
    jstGrp.add(pin);
  });
  tagEspPart(soilGroup, 'SOIL_MOISTURE');
  return soilGroup;
}
