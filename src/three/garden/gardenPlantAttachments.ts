import * as THREE from 'three';
import type { GardenContext } from './gardenContext';
import { createChiliLeafGeo, createCurlyChiliGeo } from './gardenPlantGeometry';

/** Geometries shared by every chili plant (built once, reused 10x). */
export interface PlantPartGeometries {
  leafGeo: THREE.BufferGeometry;
  chiliPodGeo: THREE.BufferGeometry;
  petioleGeo: THREE.BufferGeometry;
  jointGeo: THREE.BufferGeometry;
  calyxGeo: THREE.BufferGeometry;
  pedicelGeo: THREE.BufferGeometry;
  stakeGeo: THREE.BufferGeometry;
  stakeNodeGeo: THREE.BufferGeometry;
  wireRingGeo: THREE.BufferGeometry;
  wireOutlineGeo: THREE.BufferGeometry;
  dropletGeo: THREE.BufferGeometry;
  spotGeo: THREE.BufferGeometry;
}

export function createPlantGeometries(ctx: GardenContext): PlantPartGeometries {
const leafGeo = createChiliLeafGeo(ctx);
const chiliPodGeo = createCurlyChiliGeo(ctx);
const petioleGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.046, 5));
const jointGeo = ctx.trackGeo(new THREE.SphereGeometry(0.022, 8, 8));
const calyxGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.01, 0.019, 0.022, 7));
const pedicelGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.004, 0.006, 0.046, 5));
const stakeGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.014, 0.017, 1.0, 6));
const stakeNodeGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.0185, 0.0185, 0.015, 6));
const wireRingGeo = ctx.trackGeo(new THREE.TorusGeometry(0.275, 0.0065, 6, 28));
const wireOutlineGeo = ctx.trackGeo(new THREE.TorusGeometry(0.275, 0.01, 6, 28));
const dropletGeo = ctx.trackGeo(new THREE.SphereGeometry(0.019, 6, 6));
const spotGeo = ctx.trackGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.007, 7));
  return {
    leafGeo, chiliPodGeo, petioleGeo, jointGeo, calyxGeo, pedicelGeo,
    stakeGeo, stakeNodeGeo, wireRingGeo, wireOutlineGeo, dropletGeo, spotGeo,
  };
}

// Attach a leaf cleanly FROM the branch surface outward along local +Z via a petiole
export function attachChiliLeaf(
  ctx: GardenContext,
  geos: PlantPartGeometries,
  parent: THREE.Object3D,
  pos: [number, number, number],
  rotY: number,
  pitch: number,
  leafScale: number,
  isYoung: boolean,
  pLeafMat: THREE.MeshToonMaterial,
  pLeafYoungMat: THREE.MeshToonMaterial,
  plantIndex: number,
  leafMeshes: THREE.Object3D[],
  droplets: THREE.Mesh[],
  patekSpots: THREE.Mesh[],
  severeSpots: THREE.Mesh[],
  addSpot: boolean
  ): void {
  const mats = ctx.mats;
  const holder = new THREE.Group();
  holder.position.set(...pos);
  holder.rotation.y = rotY;

  const tilt = new THREE.Group();
  tilt.rotation.x = -pitch; // +pitch lifts leaf tip upward; -pitch droops
  tilt.scale.setScalar(leafScale);

  // Petiole starts exactly at branch center (0) and extends outward to +0.046 along +Z
  const petiole = ctx.factory.createOutlinedMesh(geos.petioleGeo, mats.branchMat, 1.12);
  petiole.rotation.x = Math.PI / 2;
  petiole.position.set(0, 0, 0.023);
  tilt.add(petiole);

  // Leaf blade begins cleanly at petiole tip (z = 0.042)
  const leaf = ctx.factory.createOutlinedMesh(geos.leafGeo, isYoung ? pLeafYoungMat : pLeafMat, 1.08);
  leaf.position.set(0, 0.002, 0.042);
  const leafIndex = leafMeshes.length;
  leaf.traverse((obj) => {
    obj.userData.isLeaf = true;
    obj.userData.plantIndex = plantIndex;
    obj.userData.leafIndex = leafIndex;
  });
  leafMeshes.push(leaf);
  tilt.add(leaf);

  // Leaf wetness bead sitting on TOP (+Y) surface of the leaf
  const drop = new THREE.Mesh(geos.dropletGeo, mats.waterDropMat);
  drop.position.set(0.008, 0.014, 0.145);
  drop.scale.setScalar(0.001);
  tilt.add(drop);
  droplets.push(drop);

  if (addSpot) {
    const spot = new THREE.Mesh(geos.spotGeo, mats.patekSpotMat);
    spot.position.set(-0.008, 0.009, 0.135);
    spot.scale.setScalar(0.001);
    tilt.add(spot);
    patekSpots.push(spot);

    const severeSpot = new THREE.Mesh(geos.spotGeo, mats.severeSpotMat);
    severeSpot.position.set(0.011, 0.0095, 0.095);
    severeSpot.scale.setScalar(0.001);
    tilt.add(severeSpot);
    severeSpots.push(severeSpot);
  }

  holder.add(tilt);
  parent.add(holder);
}

// Attach hanging curved cabai keriting pod anchored cleanly at (0,0,0) on branch
export function attachChiliPod(
  ctx: GardenContext,
  geos: PlantPartGeometries,
  parent: THREE.Object3D,
  pos: [number, number, number],
  rotY: number,
  outTilt: number,
  mat: THREE.Material,
  podScale = 1,
  severeSpots?: THREE.Mesh[]
  ): void {
  const mats = ctx.mats;
  const podGroup = new THREE.Group();
  podGroup.position.set(...pos);
  podGroup.rotation.set(0, rotY, outTilt);
  podGroup.scale.setScalar(podScale);

  const pedicel = ctx.factory.createOutlinedMesh(geos.pedicelGeo, mats.branchMat, 1.14);
  pedicel.position.y = -0.022;
  podGroup.add(pedicel);

  const calyx = ctx.factory.createOutlinedMesh(geos.calyxGeo, mats.branchMat, 1.12);
  calyx.position.y = -0.05;
  podGroup.add(calyx);

  const pod = ctx.factory.createOutlinedMesh(geos.chiliPodGeo, mat, 1.12);
  pod.position.y = -0.055;
  podGroup.add(pod);

  if (severeSpots) {
    const podLesion = new THREE.Mesh(geos.spotGeo, mats.severeSpotMat);
    podLesion.rotation.x = Math.PI / 2;
    podLesion.position.set(0.004, -0.145, 0.018);
    podLesion.scale.setScalar(0.001);
    podGroup.add(podLesion);
    severeSpots.push(podLesion);
  }

  parent.add(podGroup);
}
