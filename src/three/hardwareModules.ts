import { createKitBuilderContext } from './hardware/kitHelpers';
import type { HardwareKitContext, HardwareModulesKit } from './hardware/types';
import { buildBatteryModule } from './hardware/batteryModule';
import { buildBme280Module } from './hardware/bme280Module';
import { buildDs18b20Module } from './hardware/ds18b20Module';
import { buildEsp32CamModule } from './hardware/esp32CamModule';
import { buildEsp32Module } from './hardware/esp32Module';
import { buildLm2596Module } from './hardware/lm2596Module';
import { buildMicrosdModule } from './hardware/microsdModule';
import { buildMpptModule } from './hardware/mpptModule';
import { buildPumpModule } from './hardware/pumpModule';
import { buildRelayModule } from './hardware/relayModule';
import { buildSoilModule } from './hardware/soilModule';
import { buildSolarModule } from './hardware/solarModule';
import { buildSolenoidModule } from './hardware/solenoidModule';

// Thin entry point: the implementation now lives in ./hardware/.
// The exports below keep the original public API unchanged.
export { createHalfCylinderGeo, createRoundedBoxGeo, createTaperedBladeGeo } from './hardware/geometry';
export { createCanvasDecal, createTextDecalTexture } from './hardware/decals';
export { tagEspPart } from './hardware/tagging';
export type { ExplodableItem, HardwareKitContext, HardwareModulesKit } from './hardware/types';
export type { KitBuilderContext, KitMaterials, KitSharedGeos } from './hardware/kitHelpers';
export { createKitBuilderContext } from './hardware/kitHelpers';
export { buildBatteryModule } from './hardware/batteryModule';
export { buildBme280Module } from './hardware/bme280Module';
export { buildDs18b20Module } from './hardware/ds18b20Module';
export { buildEsp32CamModule } from './hardware/esp32CamModule';
export { buildEsp32Module } from './hardware/esp32Module';
export { buildLm2596Module } from './hardware/lm2596Module';
export { buildMicrosdModule } from './hardware/microsdModule';
export { buildMpptModule } from './hardware/mpptModule';
export { buildPumpModule } from './hardware/pumpModule';
export { buildRelayModule } from './hardware/relayModule';
export { buildSoilModule } from './hardware/soilModule';
export { buildSolarModule } from './hardware/solarModule';
export { buildSolenoidModule } from './hardware/solenoidModule';

export function createHardwareModulesKit(ctx: HardwareKitContext): HardwareModulesKit {
  const kit = createKitBuilderContext(ctx);
  const { materials } = kit;

  const espGroup = buildEsp32Module(kit);
  const lmGroup = buildLm2596Module(kit);
  const bmeGroup = buildBme280Module(kit);
  const soilGroup = buildSoilModule(kit);
  const dsGroup = buildDs18b20Module(kit);
  const sdGroup = buildMicrosdModule(kit);
  const camGroup = buildEsp32CamModule(kit);
  const relayGroup = buildRelayModule(kit);
  const { group: pumpGroup, pumpRotorGroup } = buildPumpModule(kit);
  const solGroup = buildSolenoidModule(kit);
  const solarGroup = buildSolarModule(kit);
  const mpptGroup = buildMpptModule(kit);
  const batGroup = buildBatteryModule(kit);

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
    materials: {
      pcbMat: materials.pcbMat,
      pcbDarkMat: materials.pcbDarkMat,
      metalSilverMat: materials.metalSilverMat,
      icDarkMat: materials.icDarkMat,
      goldMat: materials.goldMat,
      usbHoleMat: materials.usbHoleMat,
      ledMat: materials.ledMat,
      greenLedMat: materials.greenLedMat,
      relayLedMat: materials.relayLedMat,
      solenoidLedMat: materials.solenoidLedMat,
      camFlashMat: materials.camFlashMat,
    },
    pumpRotorGroup,
    explodables: kit.explodables,
  };
}
