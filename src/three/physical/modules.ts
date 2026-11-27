import * as THREE from 'three';
import { createHardwareModulesKit, HardwareModulesKit } from '../hardwareModules';
import { PhysicalContext } from './context';

export interface ExplodeMoveItem {
  obj: THREE.Object3D;
  basePos: THREE.Vector3;
  offset: THREE.Vector3;
  baseRot?: THREE.Euler;
  rotOffset?: THREE.Euler;
  guideLine?: THREE.Line;
}

export type RegisterMove = (
  obj: THREE.Object3D,
  offset: [number, number, number],
  withGuide?: boolean,
  rotOffset?: [number, number, number]
) => void;

export interface PhysicalKit {
  modules: HardwareModulesKit['modules'];
  materials: Pick<
    HardwareModulesKit['materials'],
    'ledMat' | 'greenLedMat' | 'relayLedMat' | 'solenoidLedMat' | 'camFlashMat'
  >;
  pumpRotorGroup: THREE.Group;
  explodables: HardwareModulesKit['explodables'];
  explodeItems: ExplodeMoveItem[];
  registerMove: RegisterMove;
}

/** Hardware modules kit + explode registry (shared with the circuit view). */
export function buildHardwareModules(ctx: PhysicalContext): PhysicalKit {
  const { factory, trackGeo, trackMat, textures } = ctx;
  // --- Hardware Modules Kit (reused from Prototype Workbench!) ---
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
    materials: { ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
  } = createHardwareModulesKit({ factory, trackGeo, trackMat, textures });

  // Explode registry for physical housing & internal layers
  const explodeItems: ExplodeMoveItem[] = [];
  const registerMove = (
    obj: THREE.Object3D,
    offset: [number, number, number],
    withGuide = true,
    rotOffset?: [number, number, number]
  ) => {
    const basePos = obj.position.clone();
    const offVec = new THREE.Vector3(...offset);
    let guideLine: THREE.Line | undefined;

    if (withGuide && obj.parent && offVec.lengthSq() > 0.001) {
      const lineGeo = trackGeo(
        new THREE.BufferGeometry().setFromPoints([
          basePos.clone(),
          basePos.clone().add(offVec),
        ])
      );
      const lineMat = trackMat(
        new THREE.LineDashedMaterial({
          color: '#231e16',
          dashSize: 0.07,
          gapSize: 0.05,
          transparent: true,
          opacity: 0.45,
        })
      );
      guideLine = new THREE.Line(lineGeo, lineMat);
      guideLine.computeLineDistances();
      guideLine.visible = false;
      obj.parent.add(guideLine);
    }

    explodeItems.push({
      obj,
      basePos,
      offset: offVec,
      baseRot: obj.rotation.clone(),
      rotOffset: rotOffset ? new THREE.Euler(...rotOffset) : undefined,
      guideLine,
    });
  };
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
    materials: { ledMat, greenLedMat, relayLedMat, solenoidLedMat, camFlashMat },
    pumpRotorGroup,
    explodables,
    explodeItems,
    registerMove,
  };
}
