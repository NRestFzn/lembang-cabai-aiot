// Circuit-module catalogue: the subset of parts shown in the 2D circuit
// view, grouped by power / sensor / control / actuator category.
import { EspPartKey } from './esp32Parts';

export type CircuitModuleCategory = 'Daya' | 'Sensor' | 'Kontrol' | 'Aktuator';

export interface CircuitCatalogItem {
  part: EspPartKey;
  code: string;
  label: string;
  category: CircuitModuleCategory;
  voltage: string;
  pins: string[];
  focusOffset: [number, number, number];
  targetPos: [number, number, number];
}

export const CIRCUIT_CATALOG: CircuitCatalogItem[] = [
  {
    part: 'SOLAR',
    code: 'PV1',
    label: 'Panel Surya 6V / 10W',
    category: 'Daya',
    voltage: '6V · 10W',
    pins: ['PV+', 'PV-'],
    focusOffset: [1.4, 3.6, 3.4],
    targetPos: [-7.65, 0.2, -1.45],
  },
  {
    part: 'MPPT',
    code: 'CHG1',
    label: 'CN3791 MPPT Charger',
    category: 'Daya',
    voltage: 'PV → 14.6V',
    pins: ['PV+', 'PV-', 'BAT+', 'BAT-'],
    focusOffset: [1.2, 3.2, 3.0],
    targetPos: [-7.65, 0.2, 0.55],
  },
  {
    part: 'BATTERY',
    code: 'BAT1',
    label: 'LiFePO4 4S Pack 12.8V',
    category: 'Daya',
    voltage: '12.8V · 6Ah',
    pins: ['B+', 'B-'],
    focusOffset: [1.3, 3.2, 3.0],
    targetPos: [-7.65, 0.35, 2.25],
  },
  {
    part: 'LM2596',
    code: 'REG1',
    label: 'LM2596 Buck Converter',
    category: 'Daya',
    voltage: '12V → 5V',
    pins: ['IN+', 'IN-', 'OUT+', 'OUT-'],
    focusOffset: [1.2, 3.2, 3.0],
    targetPos: [0.55, 0.25, -1.35],
  },
  {
    part: 'BME280',
    code: 'SEN1',
    label: 'GY-BME280 Kanopi',
    category: 'Sensor',
    voltage: '3.3V · I2C',
    pins: ['VCC', 'GND', 'SCL (22)', 'SDA (21)'],
    focusOffset: [1.1, 2.8, 2.6],
    targetPos: [-4.65, 0.15, -1.55],
  },
  {
    part: 'SOIL_MOISTURE',
    code: 'SEN2',
    label: 'Capacitive Soil v1.2',
    category: 'Sensor',
    voltage: '3.3V · ADC',
    pins: ['GND', 'VCC', 'AOUT (34)'],
    focusOffset: [1.2, 2.9, 2.7],
    targetPos: [-4.85, 0.15, 0.05],
  },
  {
    part: 'DS18B20',
    code: 'SEN3',
    label: 'DS18B20 Suhu Tanah',
    category: 'Sensor',
    voltage: '3.3V · 1-Wire',
    pins: ['VCC', 'DQ (4)', 'GND'],
    focusOffset: [1.2, 2.9, 2.7],
    targetPos: [-4.65, 0.18, 1.55],
  },
  {
    part: 'U1',
    code: 'MCU1',
    label: 'ESP32-WROOM-32 DevKit',
    category: 'Kontrol',
    voltage: '5V / 3.3V',
    pins: ['I2C 21/22', 'ADC 34', '1W 4', 'SPI 5/18/19/23', 'RLY 26/27'],
    focusOffset: [1.8, 4.4, 4.2],
    targetPos: [-2.35, 0.3, 0],
  },
  {
    part: 'MICROSD',
    code: 'LOG1',
    label: 'MicroSD Logger SPI',
    category: 'Kontrol',
    voltage: '5V / SPI',
    pins: ['CS (5)', 'SCK (18)', 'MOSI (23)', 'MISO (19)', 'VCC', 'GND'],
    focusOffset: [1.1, 2.8, 2.6],
    targetPos: [0.55, 0.15, 2.45],
  },
  {
    part: 'ESP32CAM',
    code: 'CAM1',
    label: 'ArduCam Camera Module 3 IMX708',
    category: 'Kontrol',
    voltage: '5V / CSI-2',
    pins: ['5V', 'GND', 'CSI flex', 'IMX708 12MP'],
    focusOffset: [1.3, 3.2, 3.0],
    targetPos: [3.15, 0.35, -1.75],
  },
  {
    part: 'RELAY',
    code: 'RLY1',
    label: 'Relay 2-Channel 5V',
    category: 'Aktuator',
    voltage: '5V → 12V',
    pins: ['GND', 'IN1 (26)', 'IN2 (27)', 'VCC', 'NO/COM/NC'],
    focusOffset: [1.4, 3.5, 3.2],
    targetPos: [5.85, 0.35, -1.45],
  },
  {
    part: 'PUMP',
    code: 'PMP1',
    label: 'Pompa Diaphragm 12V',
    category: 'Aktuator',
    voltage: '12V DC',
    pins: ['12V+ (NO1)', 'GND-'],
    focusOffset: [1.3, 3.2, 3.0],
    targetPos: [5.85, 0.4, 0.55],
  },
  {
    part: 'SOLENOID',
    code: 'VLV1',
    label: 'Solenoid Valve 12V',
    category: 'Aktuator',
    voltage: '12V DC · NC',
    pins: ['12V+ (NO2)', 'GND-'],
    focusOffset: [1.3, 3.2, 3.0],
    targetPos: [5.85, 0.45, 2.35],
  },
  {
    part: 'JUMPER',
    code: 'W1–W5',
    label: 'Kabel Jumper DuPont',
    category: 'Aktuator',
    voltage: '24AWG · 2.54mm',
    pins: ['VCC (Merah)', 'GND (Hitam)', 'Sinyal (Kuning/Biru/Hijau)'],
    focusOffset: [1.2, 3.0, 2.8],
    targetPos: [3.15, 0.2, 2.95],
  },
];
