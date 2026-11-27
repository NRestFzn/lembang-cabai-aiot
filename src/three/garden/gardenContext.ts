import * as THREE from 'three';
import type { LeafCondition, PartId } from '../../types/simulation';
import { createHardwareModulesKit, type HardwareModulesKit } from '../hardwareModules';
import { createStylizedFactory, type StylizedFactory } from '../stylizedMaterial';
import { createGardenMaterials, type GardenMaterials } from './gardenMaterials';

/** Centreline of the AIoT node pole: exact centre of the upper bedengan. */
export const POLE_X = -2.75;
export const POLE_Z = -1.12;

/** Per-plant animation state shared by the plant builders and the controller. */
export interface PlantAnimRef {
  plantIndex: number;
  terrace: 'Teras Atas' | 'Teras Bawah';
  baseCondition: LeafCondition;
  currentCondition: LeafCondition;
  leafMat: THREE.MeshToonMaterial;
  leafYoungMat: THREE.MeshToonMaterial;
  group: THREE.Group;
  phase: number;
  droplets: THREE.Mesh[];
  patekSpots: THREE.Mesh[];
  severeSpots: THREE.Mesh[];
  leafMeshes: THREE.Object3D[];
}

/** One item animated outward when the enclosure is exploded. */
export interface BoxExplodeItem {
  obj: THREE.Object3D;
  baseZ: number;
  offsetZ: number;
  baseX: number;
  offsetX: number;
}

/**
 * Everything the garden builders share: the scene, the stylized factory,
 * the resource trackers (for dispose), the hardware-modules kit and the
 * shared material set.
 */
export interface GardenContext {
  scene: THREE.Scene;
  factory: StylizedFactory;
  geometries: THREE.BufferGeometry[];
  disposableMaterials: THREE.Material[];
  textures: THREE.Texture[];
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  kit: HardwareModulesKit;
  mats: GardenMaterials;
}

export function tagPart(obj: THREE.Object3D, partId: PartId): void {
  obj.traverse((child) => {
    child.userData.partId = partId;
  });
}

export function createGardenContext(): GardenContext {
  const scene = new THREE.Scene();
  const factory = createStylizedFactory();
  const geometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposableMaterials.push(m);
    return m;
  };

  // Real 3D Hardware Modules Kit shared with Rangkaian Prototype & Alat Asli
  const kit = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });
  const mats = createGardenMaterials(factory);

  return { scene, factory, geometries, disposableMaterials, textures, trackGeo, trackMat, kit, mats };
}
