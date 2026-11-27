import * as THREE from 'three';
import { EspPartKey } from '../../data/espParts';
import { getNightFactor } from '../../simulation/riskEngine';
import { HardwareModulesKit } from '../hardwareModules';
import type { PhysicalNodeSceneController } from '../buildPhysicalNodeScene';
import { PhysicalContext } from './context';
import { ExplodeMoveItem } from './modules';

export interface PhysicalControllerDeps {
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  ledMat: THREE.MeshBasicMaterial;
  greenLedMat: THREE.MeshBasicMaterial;
  relayLedMat: THREE.MeshBasicMaterial;
  solenoidLedMat: THREE.MeshBasicMaterial;
  camFlashMat: THREE.MeshBasicMaterial;
  pumpRotorGroup: THREE.Group;
  explodables: HardwareModulesKit['explodables'];
  explodeItems: ExplodeMoveItem[];
}

/**
 * Walks up from a hit object to the nearest tagged ancestor.
 * (Extracted from the original pickPart so the hit loop is a flat
 * early-return instead of a nested while loop; logic identical.)
 */
function findTaggedPart(obj: THREE.Object3D): EspPartKey | null {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr.userData.espPart) {
      return curr.userData.espPart as EspPartKey;
    }
    curr = curr.parent;
  }
  return null;
}

/** update / pickPart / dispose (original tail: explode animation + picking + dispose). */
export function buildPhysicalController(
  ctx: PhysicalContext,
  deps: PhysicalControllerDeps
): Pick<PhysicalNodeSceneController, 'update' | 'pickPart' | 'dispose'> {
  const { scene, factory, geometries, extraMaterials, textures } = ctx;
  const {
    hemiLight,
    sunLight,
    ledMat,
    greenLedMat,
    relayLedMat,
    solenoidLedMat,
    camFlashMat,
    pumpRotorGroup,
    explodables,
    explodeItems,
  } = deps;
  let explodeLerp = 0;

  const update: PhysicalNodeSceneController['update'] = (
    dt,
    _elapsed,
    metrics,
    explodeTarget
  ) => {
    const nightFactor = getNightFactor(metrics.timeHours);
    const isNight = nightFactor > 0.52;

    hemiLight.intensity = isNight ? 1.0 : 1.28;
    sunLight.intensity = isNight ? 1.25 : 1.65;

    if (metrics.isWatering) {
      ledMat.color.set('#4ade80');
      greenLedMat.color.set('#4ade80');
      relayLedMat.color.set('#4ade80');
      solenoidLedMat.color.set('#38bdf8');
      pumpRotorGroup.rotation.y += dt * 10;
    } else if (metrics.patekRiskPct >= 65) {
      ledMat.color.set('#f59e0b');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    } else {
      ledMat.color.set('#ef4444');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    }

    camFlashMat.color.set(metrics.patekRiskPct >= 65 ? '#fef9c3' : '#9ca3af');

    // Smooth Disassembly / Explode Animation (0 = Rakit Rapat, 1 = Bongkar Penuh)
    explodeLerp += (explodeTarget - explodeLerp) * Math.min(1, dt * 6.5);

    explodeItems.forEach((item) => {
      item.obj.position.copy(item.basePos).addScaledVector(item.offset, explodeLerp);
      if (item.baseRot && item.rotOffset) {
        item.obj.rotation.set(
          item.baseRot.x + item.rotOffset.x * explodeLerp,
          item.baseRot.y + item.rotOffset.y * explodeLerp,
          item.baseRot.z + item.rotOffset.z * explodeLerp
        );
      }
      if (item.guideLine) {
        item.guideLine.visible = explodeLerp > 0.04;
      }
    });

    // Sub-parts inside ESP32 / LM2596 / Pump / Solenoid micro-explode subtly past 55% disassemble!
    const subExplode = Math.max(0, (explodeLerp - 0.55) / 0.45);
    explodables.forEach((item) => {
      item.group.position.y = item.baseY + item.liftY * subExplode * 0.72;
      item.guideLine.visible = subExplode > 0.06;
    });
  };

  const pickPart: PhysicalNodeSceneController['pickPart'] = (raycaster) => {
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const h of hits) {
      const part = findTaggedPart(h.object);
      if (part) return part;
    }
    return null;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    extraMaterials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    factory.dispose();
  };

  return { update, pickPart, dispose };
}
