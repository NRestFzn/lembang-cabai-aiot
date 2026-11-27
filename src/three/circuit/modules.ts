import * as THREE from 'three';
import { createHardwareModulesKit, HardwareModulesKit } from '../hardwareModules';
import { createCanvasDecal } from '../hardware/decals';
import { tagEspPart } from '../hardware/tagging';
import { CircuitContext } from './context';

export interface ModuleTops {
  pcbTop: number;
  lmTop: number;
  bmeTop: number;
  soilTop: number;
  dsTop: number;
  sdTop: number;
  camTop: number;
  rlyTop: number;
  pvTop: number;
  mpptTop: number;
}

export interface PlacedModules {
  modules: HardwareModulesKit['modules'];
  materials: Pick<
    HardwareModulesKit['materials'],
    'icDarkMat' | 'ledMat' | 'greenLedMat' | 'relayLedMat' | 'solenoidLedMat' | 'camFlashMat'
  >;
  pumpRotorGroup: THREE.Group;
  explodables: HardwareModulesKit['explodables'];
  tops: ModuleTops;
}

/** Modular 3D hardware kit placement (original section 1-9I). */
export function placeHardwareModules(
  ctx: CircuitContext,
  bbCol: (idx: number) => number
): PlacedModules {
  const { scene, factory, trackGeo, trackMat, textures } = ctx;
  // =========================================================================
  // 1-9I. MODULAR 3D HARDWARE KIT (SHARED WITH PHYSICAL UNIT VIEW)
  // =========================================================================
  const {
    modules: {
      espGroup,
      lmGroup,
      bmeGroup,
      soilGroup,
      dsGroup,
      sdGroup,
      camGroup,
      relayGroup,
      pumpGroup,
      solGroup,
      solarGroup,
      mpptGroup,
      batGroup,
    },
    materials: { icDarkMat, ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
  } = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });

  espGroup.position.set(bbCol(24), 0.14, 0);
  espGroup.rotation.y = Math.PI / 2;
  lmGroup.position.set(2.4, 0, -4.2);
  bmeGroup.position.set(-5.61, 0.14, -0.14);
  bmeGroup.rotation.y = Math.PI / 2;
  soilGroup.position.set(-6.2, 0, 4.0);
  dsGroup.position.set(-2.0, 0, 4.1);
  sdGroup.position.set(bbCol(56) + 0.11, 0.14, 0.02);
  sdGroup.rotation.y = -Math.PI / 2;
  camGroup.position.set(bbCol(47) + 0.11, 0.225, 0);
  camGroup.rotation.y = 0;

  // Mount 4 breadboard header pins along the north (-Z) edge (local Z = -0.44 -> world Z = Z_E = -0.44)
  // directly aligned with the copper CSI flex traces and breadboard columns 46..49 (TX, RX, 5V, GND).
  const camPinMat = factory.createToon('#e2bd56');
  const camSpacerGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.07, 0.11));
  const camShaftGeo = trackGeo(new THREE.BoxGeometry(0.048, 0.3, 0.048));
  const camPadGeo = trackGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 12));
  const camHdrGroup = new THREE.Group();
  [-0.33, -0.11, 0.11, 0.33].forEach((px) => {
    const sp = factory.createOutlinedMesh(camSpacerGeo, icDarkMat, 1.08);
    sp.position.set(px, -0.025, -0.44);
    camHdrGroup.add(sp);
    const shaft = factory.createOutlinedMesh(camShaftGeo, camPinMat, 1.08);
    shaft.position.set(px, -0.03, -0.44);
    camHdrGroup.add(shaft);
    const pad = new THREE.Mesh(camPadGeo, camPinMat);
    pad.position.set(px, 0.067, -0.44);
    camHdrGroup.add(pad);
  });
  const camPinTex = createCanvasDecal(320, 64, (c) => {
    c.fillStyle = '#f8fafc';
    c.font = 'bold 26px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const lbls = ['TX', 'RX', '5V', 'GND'];
    const pxs = [-0.33, -0.11, 0.11, 0.33];
    pxs.forEach((px, idx) => {
      const u = ((px + 0.44) / 0.88) * 320;
      c.fillText(lbls[idx], u, 32);
    });
  });
  textures.push(camPinTex);
  const camPinDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.88, 0.1)),
    trackMat(new THREE.MeshBasicMaterial({ map: camPinTex, transparent: true }))
  );
  camPinDecal.rotation.x = -Math.PI / 2;
  camPinDecal.position.set(0, 0.068, -0.355);
  camHdrGroup.add(camPinDecal);
  tagEspPart(camHdrGroup, 'ESP32CAM');
  camGroup.add(camHdrGroup);
  relayGroup.position.set(7.4, 0, -4.2);
  pumpGroup.position.set(9.4, 0, -1.2);
  solGroup.position.set(9.4, 0, 1.6);
  solarGroup.position.set(-10.0, 0, -4.2);
  mpptGroup.position.set(-6.2, 0, -4.2);
  batGroup.position.set(-1.8, 0, -4.2);
  scene.add(espGroup, lmGroup, bmeGroup, soilGroup, dsGroup, sdGroup, camGroup, relayGroup, pumpGroup, solGroup, solarGroup, mpptGroup, batGroup);

  const pcbTop = 0.365;
  const lmTop = 0.145;
  const bmeTop = 0.135;
  const soilTop = 0.13;
  const dsTop = 0.135;
  const sdTop = 0.14;
  const camTop = 0.305;
  const rlyTop = 0.165;
  const pvTop = 0.19;
  const mpptTop = 0.145;
  return {
    modules: {
      espGroup,
      lmGroup,
      bmeGroup,
      soilGroup,
      dsGroup,
      sdGroup,
      camGroup,
      relayGroup,
      pumpGroup,
      solGroup,
      solarGroup,
      mpptGroup,
      batGroup,
    },
    materials: { icDarkMat, ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
    tops: { pcbTop, lmTop, bmeTop, soilTop, dsTop, sdTop, camTop, rlyTop, pvTop, mpptTop },
  };
}
