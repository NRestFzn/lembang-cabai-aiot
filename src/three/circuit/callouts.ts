import * as THREE from 'three';
import { EspPartKey } from '../../data/espParts';
import { ModuleTops } from './modules';

export interface CalloutAnchor {
  id: string;
  text: string;
  part: EspPartKey;
  anchor: THREE.Vector3;
}

/** Callout anchors (original section 10). */
export function buildCalloutAnchors(tops: ModuleTops): CalloutAnchor[] {
  const { pcbTop, lmTop, bmeTop, soilTop, dsTop, sdTop, camTop, rlyTop, pvTop, mpptTop } = tops;
  const calloutAnchors: CalloutAnchor[] = [
    { id: 'c-pv', text: 'PANEL SURYA 6V 10W', part: 'SOLAR', anchor: new THREE.Vector3(-7.65, pvTop + 0.32, -1.45) },
    { id: 'c-mppt', text: 'CN3791 MPPT CHARGER', part: 'MPPT', anchor: new THREE.Vector3(-7.65, mpptTop + 0.42, 0.55) },
    { id: 'c-bat', text: 'BATERAI LiFePO4 6000mAh', part: 'BATTERY', anchor: new THREE.Vector3(-7.65, 0.92, 2.25) },
    { id: 'c-bme', text: 'BME280 KANOPI', part: 'BME280', anchor: new THREE.Vector3(-4.65, bmeTop + 0.3, -1.55) },
    { id: 'c-soil', text: 'SOIL MOISTURE v1.2', part: 'SOIL_MOISTURE', anchor: new THREE.Vector3(-4.85, soilTop + 0.3, 0.05) },
    { id: 'c-ds', text: 'DS18B20 SOIL TEMP', part: 'DS18B20', anchor: new THREE.Vector3(-4.45, dsTop + 0.32, 1.55) },
    { id: 'c-wifi', text: 'ESP32-WROOM-32', part: 'U1', anchor: new THREE.Vector3(-2.35, pcbTop + 0.32, -0.98) },
    { id: 'c-uart', text: 'USB-C', part: 'J1', anchor: new THREE.Vector3(-2.35, pcbTop + 0.22, 1.9) },
    { id: 'c-lm', text: 'LM2596 REGULATOR', part: 'LM2596', anchor: new THREE.Vector3(0.55, lmTop + 0.5, -1.35) },
    { id: 'c-sd', text: 'MICROSD LOGGER SPI', part: 'MICROSD', anchor: new THREE.Vector3(0.55, sdTop + 0.4, 2.45) },
    { id: 'c-cam', text: 'ArduCam Module 3 IMX708', part: 'ESP32CAM', anchor: new THREE.Vector3(3.15, camTop + 0.55, -1.75) },
    { id: 'c-jmp', text: 'KABEL JUMPER DUPONT', part: 'JUMPER', anchor: new THREE.Vector3(3.15, 0.35, 2.95) },
    { id: 'c-rly', text: 'RELAY 2-CHANNEL 5V', part: 'RELAY', anchor: new THREE.Vector3(5.85, rlyTop + 0.65, -1.45) },
    { id: 'c-pmp', text: 'POMPA 12V DIAPHRAGM', part: 'PUMP', anchor: new THREE.Vector3(5.85, 0.95, 0.55) },
    { id: 'c-vlv', text: 'SOLENOID VALVE 12V', part: 'SOLENOID', anchor: new THREE.Vector3(5.85, 1.15, 2.35) },
  ];
  return calloutAnchors;
}
