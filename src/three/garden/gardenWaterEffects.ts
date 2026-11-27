import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

export interface SprayDrop {
  mesh: THREE.Mesh;
  emitterIdx: number;
  phase: number;
  spreadX: number;
  spreadZ: number;
}

export interface SporeParticle {
  mesh: THREE.Mesh;
  baseX: number;
  phase: number;
  yOff: number;
}

export interface RainStreak {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  phase: number;
}

export interface GardenWaterEffects {
  gemborGroup: THREE.Group;
  gemborRestPos: THREE.Vector3;
  gemborNozzleTip: THREE.Object3D;
  gemborNozzleWorld: THREE.Vector3;
  sprayDrops: SprayDrop[];
  sporeParticles: SporeParticle[];
  rainStreaks: RainStreak[];
}

/**
 * Animated manual watering can (gembor) + spray / spore / rain particles.
 * The gembor lift amount itself is controller state (see gardenController).
 */
export function buildGardenWaterEffects(
  ctx: GardenContext,
  emitterPositions: Array<[number, number, number]>
): GardenWaterEffects {
  const { scene, factory, trackGeo, trackMat } = ctx;
  const mats = ctx.mats;
// --- Tier 1 Visual Prop: Animated Manual Watering Can (Gembor) ---
const gemborMat = factory.createToon('#3b82f6');
const gemborGroup = new THREE.Group();
const gemborRestPos = new THREE.Vector3(2.55, -0.05, 1.86);
gemborGroup.position.copy(gemborRestPos);
gemborGroup.rotation.y = -0.5;
const gemborBody = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 12)),
  gemborMat,
  1.04
);
const gemborHandle = factory.createOutlinedMesh(
  trackGeo(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI)),
  gemborMat,
  1.06
);
gemborHandle.position.set(-0.04, 0.11, 0);
gemborHandle.rotation.z = 0.25;
const gemborSpout = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.018, 0.032, 0.28, 8)),
  gemborMat,
  1.06
);
gemborSpout.rotation.z = -0.85;
gemborSpout.position.set(0.19, 0.07, 0);
const gemborHead = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.044, 0.022, 0.042, 8)),
  mats.brassMat,
  1.08
);
gemborHead.rotation.z = -0.85;
gemborHead.position.set(0.30, 0.15, 0);
const gemborNozzleTip = new THREE.Object3D();
gemborNozzleTip.position.set(0.32, 0.16, 0);
gemborGroup.add(gemborBody, gemborHandle, gemborSpout, gemborHead, gemborNozzleTip);
scene.add(gemborGroup);

const gemborNozzleWorld = new THREE.Vector3();

// --- Animated Water Spray Particles (Nursery Mist in AIoT vs Gembor Pour in Manual Mode) ---
const sprayCount = 66;
const sprayDrops: Array<{ mesh: THREE.Mesh; emitterIdx: number; phase: number; spreadX: number; spreadZ: number }> = [];
const sprayGroup = new THREE.Group();
scene.add(sprayGroup);
const sprayDropGeo = trackGeo(new THREE.SphereGeometry(0.021, 6, 6));
for (let i = 0; i < sprayCount; i++) {
  const m = new THREE.Mesh(sprayDropGeo, mats.waterDropMat);
  m.visible = false;
  sprayGroup.add(m);
  const angle = (i * 2.399) % (Math.PI * 2);
  sprayDrops.push({
    mesh: m,
    emitterIdx: i % emitterPositions.length,
    phase: (i / sprayCount) % 1,
    spreadX: Math.cos(angle) * (0.14 + (i % 3) * 0.05),
    spreadZ: Math.sin(angle) * 0.18,
  });
}

// --- Spore-Dispersion & Highland Wind Particles (Upper -> Lower Terrace Flow) ---
const sporeCount = 26;
const sporeParticles: Array<{ mesh: THREE.Mesh; baseX: number; phase: number; yOff: number }> = [];
const sporeMat = trackMat(
  new THREE.MeshBasicMaterial({
    color: '#d97706',
    transparent: true,
    opacity: 0.72,
  })
);
const sporeGeo = trackGeo(new THREE.SphereGeometry(0.022, 6, 6));
const sporeGroup = new THREE.Group();
scene.add(sporeGroup);
for (let i = 0; i < sporeCount; i++) {
  const sm = new THREE.Mesh(sporeGeo, sporeMat);
  sm.visible = false;
  sporeGroup.add(sm);
  sporeParticles.push({
    mesh: sm,
    baseX: -1.7 + ((i * 0.83) % 4.1),
    phase: (i / sporeCount) % 1,
    yOff: (i % 4) * 0.09,
  });
}

// --- Rain Streaks (when weather === 'rainy') ---
const rainCount = 70;
const rainStreaks: Array<{ mesh: THREE.Mesh; x: number; z: number; phase: number }> = [];
const rainGeo = trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 4));
const rainGroup = new THREE.Group();
scene.add(rainGroup);
for (let i = 0; i < rainCount; i++) {
  const rm = new THREE.Mesh(rainGeo, mats.waterDropMat);
  rm.visible = false;
  rainGroup.add(rm);
  rainStreaks.push({
    mesh: rm,
    x: ((i * 1.73) % 6.8) - 3.4,
    z: ((i * 2.41) % 4.2) - 2.1,
    phase: (i * 0.137) % 1,
  });
}
  return {
    gemborGroup, gemborRestPos, gemborNozzleTip, gemborNozzleWorld,
    sprayDrops, sporeParticles, rainStreaks,
  };
}
