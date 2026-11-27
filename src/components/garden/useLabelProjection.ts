import * as THREE from 'three';
import { PART_ORDER, PARTS_INFO } from '../../data/parts';
import { GardenSceneController } from '../../three/buildGardenScene';
import { PartId, SelectedLeafInfo } from '../../types/simulation';

export interface ProjectedLabel {
  id: PartId;
  code: string;
  label: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface ProjectedHotspot {
  key: string;
  kind: 'part' | 'leaf';
  partId: PartId;
  leaf?: SelectedLeafInfo;
  ringColor: string;
  title: string;
  x: number;
  y: number;
  visible: boolean;
}

export const SHORT_LABEL: Record<PartId, string> = {
  solar: 'SOLAR 10W',
  enclosure: 'ESP32 BOX',
  esp32cam: 'ArduCam Module 3',
  dht22: 'BME280 KANOPI',
  soil_probe: 'SOIL PROBE',
  solenoid: 'SOLENOID',
  pump: 'POMPA',
  chili_plant: 'CABAI',
  terrace: 'TERASERING',
};

const isOnScreen = (v: THREE.Vector3) =>
  v.z < 1 && v.x > -0.95 && v.x < 0.95 && v.y > -0.95 && v.y < 0.95;

/** Project one 2D pin label per part (terrace excluded) into screen space. */
export function projectLabels(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  tempVec: THREE.Vector3
): ProjectedLabel[] {
  return PART_ORDER.filter((id) => id !== 'terrace').map((id) => {
    const info = PARTS_INFO[id];
    tempVec.set(...info.anchorLocal);
    tempVec.project(camera);
    const visible = isOnScreen(tempVec);
    return {
      id,
      code: info.code,
      label: SHORT_LABEL[id],
      x: (tempVec.x * 0.5 + 0.5) * width,
      y: (-tempVec.y * 0.5 + 0.5) * height,
      visible,
    };
  });
}

/** Project the scene's interactive hotspots (parts + leaves) into screen space. */
export function projectHotspots(
  garden: GardenSceneController,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  tempVec: THREE.Vector3
): ProjectedHotspot[] {
  return garden.getHotspots().map((hs) => {
    tempVec.set(...hs.worldPos);
    tempVec.project(camera);
    const visible = isOnScreen(tempVec);
    return {
      key: hs.key,
      kind: hs.kind,
      partId: hs.partId,
      leaf: hs.leaf,
      ringColor: hs.ringColor ?? '#fbf8f0',
      title:
        hs.kind === 'leaf' && hs.leaf
          ? `Cek kondisi daun Pohon #${hs.leaf.plantIndex + 1}`
          : PARTS_INFO[hs.partId].name,
      x: (tempVec.x * 0.5 + 0.5) * width,
      y: (-tempVec.y * 0.5 + 0.5) * height,
      visible,
    };
  });
}
