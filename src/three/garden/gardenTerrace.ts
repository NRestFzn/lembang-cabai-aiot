import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

export function buildGardenTerrace(ctx: GardenContext): { terraceGroup: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  const mats = ctx.mats;
// =========================================================================
// 1. 2-TIER TERRACED LEMBANG DIORAMA (`terrace`)
// =========================================================================
const terraceGroup = new THREE.Group();
scene.add(terraceGroup);

// Upper terrace cutaway block (back, z: -2.25..-0.1)
const addStrataBlock = (
  parent: THREE.Group,
  w: number,
  d: number,
  yBottom: number,
  topY: number,
  posX: number,
  posZ: number
) => {
  const totalH = topY - yBottom;
  const h1 = totalH * 0.28;
  const h2 = totalH * 0.42;
  const h3 = totalH * 0.3;

  const g1 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h1, d)), mats.gravelMat, 1.012);
  g1.position.set(posX, yBottom + h1 / 2, posZ);
  parent.add(g1);

  const g2 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h2, d)), mats.subsoilMat, 1.012);
  g2.position.set(posX, yBottom + h1 + h2 / 2, posZ);
  parent.add(g2);

  const g3 = factory.createOutlinedMesh(trackGeo(new THREE.BoxGeometry(w, h3, d)), mats.topsoilMat, 1.012);
  g3.position.set(posX, yBottom + h1 + h2 + h3 / 2, posZ);
  parent.add(g3);
};

// Upper terrace: width 7.4, depth 2.2, y from -0.8 to 0.25
addStrataBlock(terraceGroup, 7.4, 2.2, -0.8, 0.25, 0, -1.1);
// Lower terrace: width 7.4, depth 2.25, y from -0.8 to -0.18
addStrataBlock(terraceGroup, 7.4, 2.25, -0.8, -0.18, 0, 1.125);

// Retaining wall stones between upper and lower terrace (z = 0.0)
for (let i = 0; i < 9; i++) {
  const sw = 0.78;
  const sh = 0.44 + (i % 2) * 0.05;
  const stone = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(sw, sh, 0.22)),
    i % 3 === 0 ? mats.woodMat : mats.stoneMat,
    1.035
  );
  stone.position.set(-3.2 + i * 0.8, -0.18 + sh / 2 - 0.02, 0.02);
  terraceGroup.add(stone);
}

// Wooden terrace step planks on the right path
for (let s = 0; s < 2; s++) {
  const step = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.95, 0.1, 0.34)),
    mats.woodMat,
    1.04
  );
  step.position.set(2.95, -0.1 + s * 0.18, 0.22 - s * 0.25);
  terraceGroup.add(step);
}
  return { terraceGroup };
}
