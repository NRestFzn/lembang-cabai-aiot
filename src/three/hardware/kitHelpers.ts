import * as THREE from 'three';
import type { EspPartKey } from '../../data/espParts';
import type { StylizedFactory } from '../stylizedMaterial';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { ExplodableItem, HardwareKitContext } from './types';

/**
 * Shared materials, geometries and assembly helpers for the hardware-module
 * builders. All values are the ones createHardwareModulesKit used to create
 * inline; they were hoisted here because several builders share them
 * (e.g. purple/teal/white PCB mats are defined in the BME280 section but
 * also used by the soil and DS18B20 builders).
 */
export interface KitMaterials {
  pcbMat: THREE.Material;
  pcbDarkMat: THREE.Material;
  metalSilverMat: THREE.Material;
  icDarkMat: THREE.Material;
  goldMat: THREE.Material;
  usbHoleMat: THREE.MeshBasicMaterial;
  ledMat: THREE.MeshBasicMaterial;
  bluePcbMat: THREE.Material;
  blueTermMat: THREE.Material;
  capSleeveMat: THREE.Material;
  greenTermMat: THREE.Material;
  tanBodyMat: THREE.Material;
  greenLedMat: THREE.MeshBasicMaterial;
  smdRedLedMat: THREE.MeshBasicMaterial;
  purplePcbMat: THREE.Material;
  tealPcbMat: THREE.Material;
  whiteJstMat: THREE.Material;
  redPcbMat: THREE.Material;
  relayBlueCubeMat: THREE.Material;
  relayLedMat: THREE.MeshBasicMaterial;
  pumpBodyDarkMat: THREE.Material;
  brassMat: THREE.Material;
  coilBlueMat: THREE.Material;
  solenoidLedMat: THREE.MeshBasicMaterial;
  camFlashMat: THREE.MeshBasicMaterial;
}

export function createKitMaterials(
  factory: StylizedFactory,
  trackMat: <T extends THREE.Material>(m: T) => T
): KitMaterials {
  return {
    pcbMat: factory.createToon('#2d3036'),
    pcbDarkMat: factory.createToon('#1c1e22'),
    metalSilverMat: factory.createToon('#eef0f0'),
    icDarkMat: factory.createToon('#292623'),
    goldMat: factory.createToon('#e2bd56'),
    usbHoleMat: trackMat(new THREE.MeshBasicMaterial({ color: '#181614' })),
    ledMat: trackMat(new THREE.MeshBasicMaterial({ color: '#eef0f0' })),
    bluePcbMat: factory.createToon('#415fa8'),
    blueTermMat: factory.createToon('#3874d6'),
    capSleeveMat: factory.createToon('#456594'),
    greenTermMat: factory.createToon('#2eb366'),
    tanBodyMat: factory.createToon('#dfc496'),
    greenLedMat: trackMat(new THREE.MeshBasicMaterial({ color: '#4ade80' })),
    smdRedLedMat: trackMat(new THREE.MeshBasicMaterial({ color: '#ef4444' })),
    purplePcbMat: factory.createToon('#6e3ea3'),
    tealPcbMat: factory.createToon('#1f6f5b'),
    whiteJstMat: factory.createToon('#f3efe4'),
    camFlashMat: trackMat(new THREE.MeshBasicMaterial({ color: '#fef08a' })),
    redPcbMat: factory.createToon('#b91c1c'),
    relayBlueCubeMat: factory.createToon('#2563eb'),
    relayLedMat: trackMat(new THREE.MeshBasicMaterial({ color: '#7f1d1d' })),
    pumpBodyDarkMat: factory.createToon('#1f2937'),
    brassMat: factory.createToon('#d4a338'),
    coilBlueMat: factory.createToon('#1d4ed8'),
    solenoidLedMat: trackMat(new THREE.MeshBasicMaterial({ color: '#1e3a8a' })),
  };
}

export interface KitSharedGeos {
  spacerGeo: THREE.BufferGeometry;
  pinShaftGeo: THREE.BufferGeometry;
  ringGeo: THREE.BufferGeometry;
}

export function createKitSharedGeos(
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T
): KitSharedGeos {
  return {
    spacerGeo: trackGeo(new THREE.BoxGeometry(0.11, 0.07, 0.11)),
    pinShaftGeo: trackGeo(new THREE.BoxGeometry(0.048, 0.3, 0.048)),
    ringGeo: trackGeo(new THREE.CylinderGeometry(0.056, 0.056, 0.02, 10)),
  };
}

/** Everything a single module builder needs: the kit context plus shared state. */
export interface KitBuilderContext {
  factory: StylizedFactory;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  textures: THREE.Texture[];
  materials: KitMaterials;
  geos: KitSharedGeos;
  explodables: ExplodableItem[];
  registerExplodable: (
    part: EspPartKey,
    gx: number,
    gz: number,
    liftY: number,
    parent: THREE.Group,
    baseY: number
  ) => THREE.Group;
  addDecalPlane: (
    parent: THREE.Group,
    w: number,
    d: number,
    y: number,
    tex: THREE.CanvasTexture
  ) => void;
  addGoldPads: (parent: THREE.Group, y: number, coords: Array<[number, number]>) => void;
  addScrewTerminal: (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    bodyMat: THREE.Material,
    facing: 'left' | 'right' | 'front'
  ) => void;
  addElectrolyticCap: (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    radius?: number,
    height?: number
  ) => void;
  /** Spacer + shaft + gold ring header pin, as used by the ESP32/BME280/MicroSD/CAM headers. */
  addHeaderPin: (parent: THREE.Group, x: number, z: number, baseZ: number, topY: number) => void;
  /** Short spacer + pin header, as used by the DS18B20 adapter and relay control headers. */
  addShortPin: (parent: THREE.Group, x: number, z: number) => void;
}

export function createKitBuilderContext(ctx: HardwareKitContext): KitBuilderContext {
  const { factory, trackGeo, trackMat, textures } = ctx;
  const materials = createKitMaterials(factory, trackMat);
  const geos = createKitSharedGeos(trackGeo);

  const explodables: ExplodableItem[] = [];

  const registerExplodable = (
    part: EspPartKey,
    gx: number,
    gz: number,
    liftY: number,
    parent: THREE.Group,
    baseY: number
  ): THREE.Group => {
    const grp = new THREE.Group();
    grp.position.set(gx, baseY, gz);
    parent.add(grp);

    const lineGeo = trackGeo(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(gx, baseY, gz),
        new THREE.Vector3(gx, baseY + liftY, gz),
      ])
    );
    const lineMat = trackMat(
      new THREE.LineDashedMaterial({
        color: '#231e16',
        dashSize: 0.05,
        gapSize: 0.04,
        transparent: true,
        opacity: 0.45,
      })
    );
    const guideLine = new THREE.Line(lineGeo, lineMat);
    guideLine.computeLineDistances();
    guideLine.visible = false;
    parent.add(guideLine);

    explodables.push({ group: grp, baseY, liftY, guideLine });
    tagEspPart(grp, part);
    return grp;
  };

  const addDecalPlane = (
    parent: THREE.Group,
    w: number,
    d: number,
    y: number,
    tex: THREE.CanvasTexture
  ) => {
    textures.push(tex);
    const m = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(w, d)),
      trackMat(new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    parent.add(m);
  };

  const addGoldPads = (parent: THREE.Group, y: number, coords: Array<[number, number]>) => {
    coords.forEach(([px, pz]) => {
      const r = factory.createOutlinedMesh(geos.ringGeo, materials.goldMat, 1.08);
      r.position.set(px, y, pz);
      parent.add(r);
    });
  };

  const addScrewTerminal = (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    bodyMat: THREE.Material,
    facing: 'left' | 'right' | 'front'
  ) => {
    const grp = registerExplodable(part, x, z, 0.38, parent, baseY);
    const rotY = facing === 'front' ? Math.PI / 2 : 0;
    const inner = new THREE.Group();
    inner.rotation.y = rotY;
    grp.add(inner);

    const blk = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.34, 0.34, 0.68)),
      bodyMat,
      1.05
    );
    blk.position.y = 0.17;
    inner.add(blk);

    const sideSign = facing === 'left' ? -1 : 1;
    [-0.16, 0.16].forEach((sz) => {
      const screw = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.04, 12)),
        materials.metalSilverMat,
        1.07
      );
      screw.position.set(0, 0.345, sz);
      inner.add(screw);

      const slot = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.13, 0.014, 0.025)),
        materials.icDarkMat
      );
      slot.position.set(0, 0.368, sz);
      inner.add(slot);

      const hole = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.02, 0.14, 0.14)),
        materials.usbHoleMat
      );
      hole.position.set(sideSign * 0.172, 0.14, sz);
      inner.add(hole);
    });
  };

  const addElectrolyticCap = (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    radius = 0.19,
    height = 0.46
  ) => {
    const cap = registerExplodable(part, x, z, 0.56, parent, baseY);
    const sleeve = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(radius, radius, height, 16)),
      materials.capSleeveMat,
      1.05
    );
    sleeve.position.y = height / 2;
    cap.add(sleeve);

    const stripe = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.05, height * 0.92, 0.04)),
      materials.metalSilverMat
    );
    stripe.position.set(0, height / 2, radius * 0.92);
    cap.add(stripe);

    const topTex = createCanvasDecal(128, 128, (c) => {
      c.fillStyle = '#e2e6ea';
      c.beginPath();
      c.arc(64, 64, 60, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#7d8286';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(28, 28);
      c.lineTo(100, 100);
      c.moveTo(100, 28);
      c.lineTo(28, 100);
      c.stroke();
    });
    textures.push(topTex);
    const capTop = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(radius * 0.92, 16)),
      trackMat(new THREE.MeshBasicMaterial({ map: topTex }))
    );
    capTop.rotation.x = -Math.PI / 2;
    capTop.position.y = height + 0.004;
    cap.add(capTop);
  };

  const addHeaderPin = (parent: THREE.Group, x: number, z: number, baseZ: number, topY: number) => {
    const sp = factory.createOutlinedMesh(geos.spacerGeo, materials.icDarkMat, 1.08);
    sp.position.set(x, baseZ - 0.035, z);
    parent.add(sp);

    const shaft = factory.createOutlinedMesh(geos.pinShaftGeo, materials.goldMat, 1.1);
    shaft.position.set(x, baseZ - 0.11, z);
    parent.add(shaft);

    const ring = factory.createOutlinedMesh(geos.ringGeo, materials.goldMat, 1.08);
    ring.position.set(x, topY + 0.008, z);
    parent.add(ring);
  };

  const addShortPin = (parent: THREE.Group, x: number, z: number) => {
    const sp = factory.createOutlinedMesh(geos.spacerGeo, materials.icDarkMat, 1.08);
    sp.position.set(x, 0.035, z);
    parent.add(sp);

    const pin = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.04, 0.2, 0.04)),
      materials.goldMat,
      1.1
    );
    pin.position.set(x, 0.12, z);
    parent.add(pin);
  };

  return {
    factory,
    trackGeo,
    trackMat,
    textures,
    materials,
    geos,
    explodables,
    registerExplodable,
    addDecalPlane,
    addGoldPads,
    addScrewTerminal,
    addElectrolyticCap,
    addHeaderPin,
    addShortPin,
  };
}
