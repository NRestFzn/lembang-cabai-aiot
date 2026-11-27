import * as THREE from 'three';
import type { StylizedFactory } from '../stylizedMaterial';

// Kit interfaces moved verbatim from hardwareModules.ts.

export interface ExplodableItem {
  group: THREE.Group;
  baseY: number;
  liftY: number;
  guideLine: THREE.Line;
}

export interface HardwareKitContext {
  factory: StylizedFactory;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  textures: THREE.Texture[];
}

export interface HardwareModulesKit {
  modules: {
    espGroup: THREE.Group;
    lmGroup: THREE.Group;
    bmeGroup: THREE.Group;
    soilGroup: THREE.Group;
    dsGroup: THREE.Group;
    sdGroup: THREE.Group;
    camGroup: THREE.Group;
    relayGroup: THREE.Group;
    pumpGroup: THREE.Group;
    solGroup: THREE.Group;
    solarGroup: THREE.Group;
    mpptGroup: THREE.Group;
    batGroup: THREE.Group;
  };
  materials: {
    pcbMat: THREE.Material;
    pcbDarkMat: THREE.Material;
    metalSilverMat: THREE.Material;
    icDarkMat: THREE.Material;
    goldMat: THREE.Material;
    usbHoleMat: THREE.Material;
    ledMat: THREE.MeshBasicMaterial;
    greenLedMat: THREE.MeshBasicMaterial;
    relayLedMat: THREE.MeshBasicMaterial;
    solenoidLedMat: THREE.MeshBasicMaterial;
    camFlashMat: THREE.MeshBasicMaterial;
  };
  pumpRotorGroup: THREE.Group;
  explodables: ExplodableItem[];
}
