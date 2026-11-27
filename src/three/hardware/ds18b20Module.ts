import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 7. DS18B20 WATERPROOF SOIL TEMP PROBE + PULL-UP ADAPTER — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildDs18b20Module(kit: KitBuilderContext): THREE.Group {
  const dsGroup = new THREE.Group();
  const probeGrp = kit.registerExplodable('DS18B20', -0.62, 0, 0.42, dsGroup, 0.14);
  const steelTip = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.08, 16)),
    kit.materials.metalSilverMat,
    1.04
  );
  steelTip.rotation.z = Math.PI / 2;
  probeGrp.add(steelTip);

  const heatShrink = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.155, 0.155, 0.24, 14)),
    kit.materials.icDarkMat,
    1.05
  );
  heatShrink.rotation.z = Math.PI / 2;
  heatShrink.position.x = 0.6;
  probeGrp.add(heatShrink);

  const dsCableDefs: Array<{ zEnd: number; color: string }> = [
    { zEnd: -0.18, color: '#e2483d' },
    { zEnd: 0, color: '#e2bd56' },
    { zEnd: 0.18, color: '#292623' },
  ];
  dsCableDefs.forEach(({ zEnd, color }) => {
    const cMat = kit.factory.createToon(color);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 0.14, 0),
      new THREE.Vector3(0.28, 0.18, zEnd * 0.55),
      new THREE.Vector3(0.5, 0.18, zEnd),
    ]);
    const cMesh = new THREE.Mesh(
      kit.trackGeo(new THREE.TubeGeometry(curve, 16, 0.026, 7, false)),
      cMat
    );
    cMesh.castShadow = true;
    dsGroup.add(cMesh);
  });

  const dsZ = 0.06;
  const dsH = 0.075;
  const dsTop = dsZ + dsH;
  const dsPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.95, dsH, 0.86, 0.06)),
    kit.materials.tealPcbMat,
    1.025
  );
  dsPcb.position.set(0.78, dsZ, 0);
  dsGroup.add(dsPcb);

  const dsSilkTex = createCanvasDecal(220, 200, (c) => {
    c.fillStyle = '#ecfdf5';
    c.font = 'bold 19px ui-monospace, monospace';
    c.fillText('DS18B20', 84, 24);
    c.font = 'bold 15px ui-monospace, monospace';
    c.fillText('4.7kΩ', 76, 178);
    c.textAlign = 'right';
    c.fillText('VCC', 178, 54);
    c.fillText('DQ', 178, 102);
    c.fillText('GND', 178, 152);
  });
  const dsDecalM = new THREE.Mesh(
    kit.trackGeo(new THREE.PlaneGeometry(0.88, 0.78)),
    kit.trackMat(new THREE.MeshBasicMaterial({ map: dsSilkTex, transparent: true }))
  );
  kit.textures.push(dsSilkTex);
  dsDecalM.rotation.x = -Math.PI / 2;
  dsDecalM.position.set(0.78, dsTop + 0.003, 0);
  dsGroup.add(dsDecalM);

  const dsTerm = kit.registerExplodable('DS18B20', 0.48, 0, 0.4, dsGroup, dsTop);
  const dsTermBlk = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.24, 0.24, 0.56)),
    kit.materials.greenTermMat,
    1.05
  );
  dsTermBlk.position.y = 0.12;
  dsTerm.add(dsTermBlk);
  [-0.18, 0, 0.18].forEach((sz) => {
    const scr = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10)),
      kit.materials.metalSilverMat,
      1.07
    );
    scr.position.set(0, 0.25, sz);
    dsTerm.add(scr);
  });

  const dsRes = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.16, 0.05, 0.08)),
    kit.materials.tanBodyMat,
    1.08
  );
  dsRes.position.set(0.72, dsTop + 0.025, 0.14);
  dsGroup.add(dsRes);

  const dsHdr = kit.registerExplodable('DS18B20', 1.14, 0, 0.36, dsGroup, dsTop);
  [-0.18, 0, 0.18].forEach((pz) => {
    kit.addShortPin(dsHdr, 0, pz);
  });
  tagEspPart(dsGroup, 'DS18B20');
  return dsGroup;
}
