import * as THREE from 'three';
import { createRoundedBoxGeo } from '../hardwareModules';
import { POLE_X, POLE_Z, tagPart, type GardenContext } from './gardenContext';

export interface GardenSensorParts {
  solarGroup: THREE.Group;
  camGroup: THREE.Group;
  fovCone: THREE.Mesh;
  fovEdges: THREE.LineSegments;
  fovMat: THREE.MeshBasicMaterial;
  dhtGroup: THREE.Group;
  soilProbeGroup: THREE.Group;
}

/**
 * Section 4b: solar panel + ArduCam Module 3 + BME280 shield + soil probes +
 * field actuator power cables (added to the enclosure group).
 */
export function buildGardenSensors(ctx: GardenContext, enclosureGroup: THREE.Group): GardenSensorParts {
  const { scene, factory, trackGeo } = ctx;
  const mats = ctx.mats;
  const { solarGroup: realSolarMod, camGroup: realCamMod, bmeGroup, soilGroup, dsGroup } = ctx.kit.modules;
// --- Real Solar Panel 6V / 10W (`solar`) ---
const solarGroup = new THREE.Group();
solarGroup.position.set(POLE_X, 2.55, POLE_Z);
const solarTilt = new THREE.Group();
// Single-axis tilt so solar panel edges stay 100% parallel with the rectangular terrace & beds
solarTilt.rotation.set(0.28, 0, 0);

const solarBracket = factory.createOutlinedMesh(
  trackGeo(createRoundedBoxGeo(0.22, 0.04, 0.16, 0.015)),
  mats.solarFrameMat,
  1.04
);
solarBracket.position.y = -0.025;
solarTilt.add(solarBracket);

realSolarMod.position.set(0, 0.01, 0);
realSolarMod.scale.setScalar(0.31);
solarTilt.add(realSolarMod);

solarGroup.add(solarTilt);
scene.add(solarGroup);

// PV Power wire curving cleanly from underneath Solar Panel into Top Hollow Gland of IP65 Box
const pvWireLocalCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.16, -0.03, -0.04),
  new THREE.Vector3(0.14, -0.21, 0.12),
  new THREE.Vector3(0.13, -0.59, 0.12),
]);
solarGroup.add(
  new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(pvWireLocalCurve, 14, 0.01, 6, false)),
    mats.wireRedMat
  )
);
tagPart(solarGroup, 'solar');

// --- Real ArduCam Camera Module 3 (IMX708 12MP) (`esp32cam`) ---
const camGroup = new THREE.Group();
camGroup.position.set(POLE_X + 0.34, 2.12, POLE_Z);
scene.add(camGroup);

const camArm = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8)),
  mats.poleMat,
  1.08
);
camArm.rotation.z = Math.PI / 2;
camArm.position.set(-0.17, 0, 0);
camGroup.add(camArm);

const camHead = new THREE.Group();
camHead.rotation.z = -0.46;

// Compact dark weatherproof camera visor hood facing +X
const camHoodBack = factory.createOutlinedMesh(
  trackGeo(createRoundedBoxGeo(0.08, 0.22, 0.17, 0.02)),
  mats.solarFrameMat,
  1.05
);
camHoodBack.position.set(-0.02, 0, 0);
camHead.add(camHoodBack);
const camHoodVisor = factory.createOutlinedMesh(
  trackGeo(new THREE.BoxGeometry(0.14, 0.02, 0.18)),
  mats.solarFrameMat,
  1.05
);
camHoodVisor.position.set(0.03, 0.115, 0);
camHead.add(camHoodVisor);

// Real ArduCam Camera Module 3 (IMX708 12MP) mounted facing outward (+X) along FOV axis.
// The board is the smaller 25x24mm module (was ESP32-CAM); the 0.09 mount scale
// is unchanged, so it sits proportionally smaller on the same arm/hood.
const camRealMount = new THREE.Group();
camRealMount.position.set(0.025, 0, 0);
camRealMount.rotation.y = Math.PI / 2;
realCamMod.position.set(0, 0, 0);
realCamMod.rotation.set(Math.PI / 2, 0, 0);
realCamMod.scale.setScalar(0.09);
camRealMount.add(realCamMod);
camHead.add(camRealMount);

const camLed = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.015, 8, 8)), mats.ledCamMat);
camLed.position.set(0.08, 0.095, 0.075);
camHead.add(camLed);

// Translucent Camera FOV Frustum aimed at upper chili canopy.
// ArduCam IMX708 fixed-focus ~66 deg HFOV: cone radius = 2.2 * tan(33 deg) = 1.43
// over the 2.2 length, so the full apex angle is ~66 deg (was 0.92 / ~45 deg).
const fovGeo = trackGeo(new THREE.ConeGeometry(1.43, 2.2, 4, 1, true));
const fovMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ef6a4c'),
  transparent: true,
  opacity: 0.14,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const fovCone = new THREE.Mesh(fovGeo, fovMat);
fovCone.rotation.z = Math.PI / 2;
fovCone.rotation.x = Math.PI / 4;
fovCone.position.set(1.18, 0, 0);
camHead.add(fovCone);

const fovEdges = new THREE.LineSegments(
  trackGeo(new THREE.EdgesGeometry(fovGeo)),
  new THREE.LineBasicMaterial({ color: '#ef6a4c', transparent: true, opacity: 0.65 })
);
fovEdges.rotation.copy(fovCone.rotation);
fovEdges.position.copy(fovCone.position);
camHead.add(fovEdges);

camGroup.add(camHead);
tagPart(camGroup, 'esp32cam');

// --- Ventilated Radiation Shield + Real GY-BME280 (`dht22`) ---
const dhtGroup = new THREE.Group();
scene.add(dhtGroup);

// Single straight slanted arm along z = -1.12 coming from control box down to the sensor shield
const boomStart = new THREE.Vector3(POLE_X + 0.22, 1.56, POLE_Z);
const boomEnd = new THREE.Vector3(-0.95, 1.24, POLE_Z);
const boomDir = new THREE.Vector3().subVectors(boomEnd, boomStart);
const boomLen = boomDir.length();
const dhtBoom = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.016, 0.016, boomLen, 6)),
  mats.poleMat,
  1.1
);
dhtBoom.position.copy(boomStart).addScaledVector(boomDir, 0.5);
dhtBoom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), boomDir.clone().normalize());
dhtGroup.add(dhtBoom);

const shieldPos = new THREE.Vector3(-0.95, 1.07, POLE_Z);
for (let plate = 0; plate < 4; plate++) {
  const disc = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.115, 0.135, 0.022, 14)),
    mats.boxBodyMat,
    1.05
  );
  disc.position.set(shieldPos.x, shieldPos.y + plate * 0.052, shieldPos.z);
  dhtGroup.add(disc);
}
// Real Purple GY-BME280 PCB seated visibly inside the ventilated louver stack
bmeGroup.position.set(shieldPos.x, shieldPos.y + 0.075, shieldPos.z);
bmeGroup.scale.setScalar(0.11);
dhtGroup.add(bmeGroup);

tagPart(dhtGroup, 'dht22');

// --- Real Capacitive Soil Moisture Probe v1.2 + DS18B20 Waterproof Probe (`soil_probe`) ---
const soilProbeGroup = new THREE.Group();
scene.add(soilProbeGroup);

const probePos = new THREE.Vector3(-1.02, 0.455, -0.83);
const probeSoilCutout = factory.createOutlinedMesh(
  trackGeo(new THREE.CylinderGeometry(0.14, 0.15, 0.022, 12)),
  mats.bedSoilMat,
  1.04
);
probeSoilCutout.position.set(-0.93, 0.46, -0.83);
soilProbeGroup.add(probeSoilCutout);

// Real Capacitive Soil Moisture v1.2 blade stuck into soil
soilGroup.position.set(probePos.x, probePos.y + 0.11, probePos.z);
soilGroup.rotation.set(0, 0, -Math.PI / 2);
soilGroup.scale.setScalar(0.145);
soilProbeGroup.add(soilGroup);

// Real DS18B20 stainless probe & 4.7kΩ pull-up adapter sitting right beside Soil Moisture
dsGroup.position.set(-0.82, probePos.y + 0.035, -0.83);
dsGroup.rotation.set(0, -0.25, 0);
dsGroup.scale.setScalar(0.13);
soilProbeGroup.add(dsGroup);

// Sensor signal cables routing along z = -0.83 up the mast into Bottom Hollow Glands 2 & 3
const soilCableCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(probePos.x + 0.02, probePos.y + 0.19, -0.83),
  new THREE.Vector3(-1.5, 0.52, -0.83),
  new THREE.Vector3(-2.35, 0.52, -0.83),
  new THREE.Vector3(-2.62, 0.72, -0.96),
  new THREE.Vector3(POLE_X + 0.155, 1.36, POLE_Z + 0.06),
]);
soilProbeGroup.add(
  new THREE.Mesh(trackGeo(new THREE.TubeGeometry(soilCableCurve, 24, 0.011, 6, false)), mats.wireYlwMat)
);

const dsCableCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.74, probePos.y + 0.055, -0.81),
  new THREE.Vector3(-1.45, 0.50, -0.81),
  new THREE.Vector3(-2.32, 0.50, -0.81),
  new THREE.Vector3(-2.59, 0.70, -0.94),
  new THREE.Vector3(POLE_X + 0.155, 1.36, POLE_Z - 0.06),
]);
soilProbeGroup.add(
  new THREE.Mesh(trackGeo(new THREE.TubeGeometry(dsCableCurve, 24, 0.011, 6, false)), mats.wireBlkMat)
);
tagPart(soilProbeGroup, 'soil_probe');

// --- Field Actuator Power Cables: IP65 Relay -> 12V Pump & 12V Brass Solenoid ---
const pumpPowerCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(POLE_X + 0.155, 1.36, POLE_Z - 0.18),
  new THREE.Vector3(POLE_X + 0.04, 0.92, POLE_Z - 0.05),
  new THREE.Vector3(POLE_X - 0.05, 0.36, -0.45),
  new THREE.Vector3(-2.82, 0.36, 0.42),
  new THREE.Vector3(-2.82, 0.36, 0.54),
]);
enclosureGroup.add(
  new THREE.Mesh(trackGeo(new THREE.TubeGeometry(pumpPowerCurve, 24, 0.011, 6, false)), mats.wireRedMat)
);

const solPowerCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(POLE_X + 0.155, 1.36, POLE_Z - 0.16),
  new THREE.Vector3(POLE_X + 0.08, 0.92, POLE_Z - 0.02),
  new THREE.Vector3(-2.52, 0.52, -0.35),
  new THREE.Vector3(-2.12, 0.46, 0.10),
  new THREE.Vector3(-1.98, 0.46, 0.22),
]);
enclosureGroup.add(
  new THREE.Mesh(trackGeo(new THREE.TubeGeometry(solPowerCurve, 24, 0.011, 6, false)), mats.wireBluMat)
);
  return { solarGroup, camGroup, fovCone, fovEdges, fovMat, dhtGroup, soilProbeGroup };
}
