// Circuit tour steps, split by board region into ./tour/ and re-assembled
// here in the original order. Public API unchanged.
import { EspPartKey } from './espParts';
import { TOUR_STEPS_CONTROL } from './tour/tourStepsControl';
import { TOUR_STEPS_PERIPHERALS } from './tour/tourStepsPeripherals';
import { TOUR_STEPS_POWER } from './tour/tourStepsPower';
import type { CircuitTourStep } from './tour/tourTypes';

export type { CircuitTourStep } from './tour/tourTypes';

export const CIRCUIT_TOUR_STEPS: CircuitTourStep[] = [
  ...TOUR_STEPS_POWER,
  ...TOUR_STEPS_CONTROL,
  ...TOUR_STEPS_PERIPHERALS,
];

const PART_TO_TOUR_ID: Partial<Record<EspPartKey, string>> = {
  SOLAR: 'solar',
  MPPT: 'mppt',
  BATTERY: 'battery',
  LM2596: 'lm2596',
  U1: 'esp32',
  ANT1: 'esp32',
  U2: 'esp32',
  U3: 'esp32',
  SW1: 'esp32',
  SW2: 'esp32',
  RGB: 'esp32',
  J1: 'esp32',
  H1: 'esp32',
  H2: 'esp32',
  RC: 'esp32',
  BME280: 'bme280',
  SOIL_MOISTURE: 'soil',
  DS18B20: 'ds18b20',
  ESP32CAM: 'cam',
  MICROSD: 'microsd',
  RELAY: 'relay',
  PUMP: 'actuators',
  SOLENOID: 'actuators',
  JUMPER: 'overview',
};

export function getTourStepForPart(part: EspPartKey): CircuitTourStep | null {
  const id = PART_TO_TOUR_ID[part];
  if (!id) return null;
  return CIRCUIT_TOUR_STEPS.find((s) => s.id === id) ?? null;
}
