import type { GardenSceneController } from './garden/gardenController';
import { createGardenController } from './garden/gardenController';
import { createGardenContext } from './garden/gardenContext';
import { buildGardenBeds } from './garden/gardenBeds';
import { buildGardenEnclosure } from './garden/gardenEnclosure';
import { buildGardenFloor } from './garden/gardenFloor';
import { buildGardenLighting } from './garden/gardenLighting';
import { buildGardenPlants } from './garden/gardenPlants';
import { buildGardenPump } from './garden/gardenPump';
import { buildGardenSensors } from './garden/gardenSensors';
import { buildGardenSky } from './garden/gardenSky';
import { buildGardenTerrace } from './garden/gardenTerrace';
import { buildGardenWaterEffects } from './garden/gardenWaterEffects';

export type { GardenSceneController, HotspotItem, PickResult } from './garden/gardenController';

/**
 * Thin orchestrator: builds the shared context, runs the section builders
 * in the original order, and assembles the scene controller.
 * All geometry, materials, numbers and behaviour live in src/three/garden/.
 */
export function buildGardenScene(): GardenSceneController {
  const ctx = createGardenContext();
  const lights = buildGardenLighting(ctx);
  const { shadowFloorMat } = buildGardenFloor(ctx);
  const { terraceGroup } = buildGardenTerrace(ctx);
  buildGardenBeds(ctx, terraceGroup);
  const { plantRefs } = buildGardenPlants(ctx);
  const pump = buildGardenPump(ctx);
  const water = buildGardenWaterEffects(ctx, pump.emitterPositions);
  const enclosure = buildGardenEnclosure(ctx);
  const sensors = buildGardenSensors(ctx, enclosure.enclosureGroup);
  const sky = buildGardenSky(ctx);

  return createGardenController(ctx, {
    lights,
    shadowFloorMat,
    plantRefs,
    emitterPositions: pump.emitterPositions,
    water,
    boxExplodeItems: enclosure.boxExplodeItems,
    sensors,
    sky,
  });
}
