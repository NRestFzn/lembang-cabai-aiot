import * as THREE from 'three';
import { createHardwareModulesKit, HardwareModulesKit } from '../hardwareModules';
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
  camGroup.position.set(bbCol(47) + 0.11, 0.14, 0);
  camGroup.rotation.y = Math.PI / 2;
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
