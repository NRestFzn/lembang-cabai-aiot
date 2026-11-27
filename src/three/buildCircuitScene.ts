import * as THREE from 'three';
import { CircuitTourStep } from '../data/circuitTour';
import { EspPartKey } from '../data/espParts';
import { SimulationMetrics } from '../types/simulation';
import { buildCalloutAnchors } from './circuit/callouts';
import { createCircuitContext } from './circuit/context';
import { buildCircuitController } from './circuit/controller';
import { buildStudioLighting } from './circuit/lighting';
import { buildBreadboard } from './circuit/breadboard';
import { placeHardwareModules } from './circuit/modules';
import { buildTourOverlay } from './circuit/tour';
import { buildCircuitWiring } from './circuit/wiring';

export interface Esp3DSceneController {
  scene: THREE.Scene;
  calloutAnchors: Array<{ id: string; text: string; part: EspPartKey; anchor: THREE.Vector3 }>;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    exploded: boolean,
    selectedPart: EspPartKey | null,
    tourStep?: CircuitTourStep | null
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => EspPartKey | null;
  dispose: () => void;
}

export function buildCircuitScene(): Esp3DSceneController {
  const ctx = createCircuitContext();
  const { scene } = ctx;

  const lighting = buildStudioLighting(ctx);
  const board = buildBreadboard(ctx);
  const placed = placeHardwareModules(ctx, board.bbCol);
  buildCircuitWiring(ctx, placed.materials.icDarkMat, board.bbCol, board.bbTop);
  const calloutAnchors = buildCalloutAnchors(placed.tops);
  const tour = buildTourOverlay(ctx);
  const { update, pickPart, dispose } = buildCircuitController(ctx, {
    hemiLight: lighting.hemiLight,
    sunLight: lighting.sunLight,
    ledMat: placed.materials.ledMat,
    greenLedMat: placed.materials.greenLedMat,
    relayLedMat: placed.materials.relayLedMat,
    solenoidLedMat: placed.materials.solenoidLedMat,
    camFlashMat: placed.materials.camFlashMat,
    pumpRotorGroup: placed.pumpRotorGroup,
    explodables: placed.explodables,
    tour,
  });

  return {
    scene,
    calloutAnchors,
    update,
    pickPart,
    dispose,
  };
}
