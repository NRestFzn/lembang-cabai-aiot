import * as THREE from 'three';
import { tagPart, type GardenContext } from './gardenContext';

/** Raised soil beds (bedengan) + mulch strips on the upper & lower terraces. */
export function buildGardenBeds(ctx: GardenContext, terraceGroup: THREE.Group): void {
  const { factory, trackGeo } = ctx;
  const mats = ctx.mats;
// Raised Soil Beds (Bedengan) + Mulch Strips on Upper & Lower Terraces
const buildBedengan = (x: number, yBase: number, z: number, length: number) => {
  const bedGroup = new THREE.Group();
  const soilGeo = trackGeo(new THREE.BoxGeometry(length, 0.18, 1.05));
  const soilBlock = factory.createOutlinedMesh(soilGeo, mats.bedSoilMat, 1.018);
  soilBlock.position.set(x, yBase + 0.09, z);
  bedGroup.add(soilBlock);

  // Mulch cover slightly narrower on top
  const mulchGeo = trackGeo(new THREE.BoxGeometry(length - 0.08, 0.03, 0.94));
  const mulch = factory.createOutlinedMesh(mulchGeo, mats.mulchMat, 1.015);
  mulch.position.set(x, yBase + 0.19, z);
  bedGroup.add(mulch);

  terraceGroup.add(bedGroup);
};

buildBedengan(0.45, 0.25, -1.12, 4.9); // Upper terrace bed
buildBedengan(0.45, -0.18, 1.08, 4.9); // Lower terrace bed

tagPart(terraceGroup, 'terrace');
}
