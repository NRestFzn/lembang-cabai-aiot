import * as THREE from 'three';
import { createStylizedFactory, StylizedFactory } from '../stylizedMaterial';

/**
 * Shared mutable build state for the circuit (breadboard) scene.
 * Created once by the orchestrator and handed to every builder module,
 * which destructures the scene / factory / trackers it needs.
 */
export interface CircuitContext {
  scene: THREE.Scene;
  factory: StylizedFactory;
  geometries: THREE.BufferGeometry[];
  extraMaterials: THREE.Material[];
  textures: THREE.Texture[];
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
}

export function createCircuitContext(): CircuitContext {
  const scene = new THREE.Scene();
  const factory = createStylizedFactory();
  const geometries: THREE.BufferGeometry[] = [];
  const extraMaterials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    extraMaterials.push(m);
    return m;
  };

  return { scene, factory, geometries, extraMaterials, textures, trackGeo, trackMat };
}
