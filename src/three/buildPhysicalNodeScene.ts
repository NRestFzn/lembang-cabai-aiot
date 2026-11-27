import * as THREE from 'three';
import { EspPartKey } from '../data/espParts';
import { SimulationMetrics } from '../types/simulation';
import { buildCameraArm } from './physical/cameraArm';
import { createPhysicalContext } from './physical/context';
import { buildPhysicalController } from './physical/controller';
import { buildEnclosure } from './physical/enclosure';
import { buildStudioLighting } from './physical/lighting';
import { buildMast } from './physical/mast';
import { buildHardwareModules } from './physical/modules';
import { buildProbesAndCables } from './physical/probes';
import { buildRadiationShield } from './physical/shield';
import { buildSolarBracket } from './physical/solar';

export interface PhysicalNodeSceneController {
  scene: THREE.Scene;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    explodeTarget: number
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => EspPartKey | null;
  dispose: () => void;
}

export function buildPhysicalNodeScene(): PhysicalNodeSceneController {
  const ctx = createPhysicalContext();
  const { scene } = ctx;

  const lighting = buildStudioLighting(ctx);
  const kit = buildHardwareModules(ctx);
  const mast = buildMast(ctx, lighting.materials);
  buildSolarBracket(ctx, lighting.materials, kit.modules.solarGroup, mast.mastX, mast.mastZ, kit.registerMove);
  const enclosure = buildEnclosure(ctx, lighting.materials, kit, kit.registerMove, mast.mastX);
  buildCameraArm(
    ctx,
    lighting.materials,
    kit.modules.camGroup,
    mast.mastX,
    mast.mastZ,
    kit.registerMove
  );
  buildRadiationShield(ctx, lighting.materials, kit.modules.bmeGroup, mast.mastX, kit.registerMove);
  buildProbesAndCables(
    ctx,
    lighting.materials,
    kit,
    mast.mastX,
    mast.mastZ,
    enclosure.boxW,
    enclosure.camGlandY,
    enclosure.glandHoleX,
    kit.registerMove,
    enclosure.backPlateShell,
    mast.mastPole,
    mast.mastFlange
  );
  const { update, pickPart, dispose } = buildPhysicalController(ctx, {
    hemiLight: lighting.hemiLight,
    sunLight: lighting.sunLight,
    ledMat: kit.materials.ledMat,
    greenLedMat: kit.materials.greenLedMat,
    relayLedMat: kit.materials.relayLedMat,
    solenoidLedMat: kit.materials.solenoidLedMat,
    camFlashMat: kit.materials.camFlashMat,
    pumpRotorGroup: kit.pumpRotorGroup,
    explodables: kit.explodables,
    explodeItems: kit.explodeItems,
  });

  return { scene, update, pickPart, dispose };
}
