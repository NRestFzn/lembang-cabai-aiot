// Controller + sensors: ESP32 and the canopy/soil sensor steps
// (tour stages 05–08), in the middle of the board.
import { col, Z_TOP_5V, Z_A, Z_B, Z_I, Z_J, Z_BOT_3V3 } from './tourLayout';
import { CircuitTourStep } from './tourTypes';

export const TOUR_STEPS_CONTROL: CircuitTourStep[] = [
  {
    id: 'esp32',
    part: 'U1',
    stage: '05 / 12 · Otak Kontrol & Bus 3.3V',
    title: 'ESP32-DevKit (WROOM-32 + USB-C)',
    description:
      'Menyala dari suplai 5V di pin VIN & GND (dengan port USB-C untuk flashing). Regulator onboard AMS1117 menghasilkan 3.3V ke rail bawah (kabel oranye) untuk memberi daya sensor, sementara MCU menghitung VPD & skor patek.',
    flowSummary: 'VIN 5V → AMS1117 3.3V → Rail +3V3 (Kolom 35) & Rail +5V (Kolom 36)',
    accentColor: '#10b981',
    target: [-2.1, 0.2, 0.25],
    camPos: [-2.1, 10.6, 0.6],
    ringPos: [-2.2, 0.52, 0.0],
    frameSize: [4.55, 2.42],
    flowPaths: [
      [
        [col(31), 0.22, Z_B],
        [col(31), 0.4, -0.96],
        [col(35), 0.4, -0.96],
        [col(35), 0.4, Z_BOT_3V3],
      ],
      [
        [col(31), 0.22, Z_I],
        [col(36), 0.44, Z_I],
        [col(36), 0.44, Z_TOP_5V],
      ],
    ],
    durationSec: 6.5,
  },
  {
    id: 'bme280',
    part: 'BME280',
    stage: '06 / 12 · Sensor Udara & Embun',
    title: 'Sensor Mikroiklim Kanopi GY-BME280',
    description:
      'Ditenagai 3.3V dari rail bawah (kolom 5), sensor ini mengukur suhu, kelembaban relatif (RH), dan tekanan udara tajuk cabai lalu mengirimkannya ke ESP32 via jalur I2C SCL (GPIO22) & SDA (GPIO21).',
    flowSummary: 'BME280 (SCL Kolom 9 / SDA Kolom 10) → ESP32 GPIO22 & GPIO21',
    accentColor: '#0ea5e9',
    target: [-4.6, 0.2, 0.05],
    camPos: [-4.6, 9.2, 0.35],
    ringPos: [-5.61, 0.52, -0.14],
    frameSize: [1.32, 1.08],
    flowPaths: [
      [
        [col(9), 0.34, Z_B],
        [col(18), 0.34, Z_B],
      ],
      [
        [col(10), 0.34, Z_A],
        [col(21), 0.34, Z_A],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'soil',
    part: 'SOIL_MOISTURE',
    stage: '07 / 12 · Sensor Kelembaban Tanah',
    title: 'Capacitive Soil Moisture v1.2',
    description:
      'Menggunakan prinsip kapasitif anti-korosi (suplai 3.3V) untuk memantau kadar air tanah zona perakaran cabai, lalu mengirimkan sinyal analog AOUT (kabel kuning) ke pin ADC1 GPIO34 ESP32.',
    flowSummary: 'Soil Moisture AOUT → Kolom 20 (ESP32 GPIO34)',
    accentColor: '#eab308',
    target: [-5.2, 0.2, 2.85],
    camPos: [-5.2, 10.6, 3.2],
    ringPos: [-6.2, 0.30, 4.0],
    frameSize: [3.2, 1.32],
    flowPaths: [
      [
        [-5.07, 0.21, 4.14],
        [-5.07, 0.1, 2.86],
        [col(20), 0.36, 2.86],
        [col(20), 0.36, Z_J],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'ds18b20',
    part: 'DS18B20',
    stage: '08 / 12 · Sensor Suhu Tanah',
    title: 'Probe Suhu Tanah Waterproof DS18B20',
    description:
      'Probe baja tahan air dengan adapter pull-up 4.7kΩ membaca suhu perakaran untuk mengkalibrasi risiko embun malam. Data digital 1-Wire DQ mengalir lewat kolom 40 menuju GPIO4 ESP32.',
    flowSummary: 'DS18B20 DQ → Kolom 40 → ESP32 GPIO4 (Kolom 27)',
    accentColor: '#eab308',
    target: [-1.4, 0.2, 2.6],
    camPos: [-1.4, 10.8, 2.95],
    ringPos: [-1.7, 0.30, 4.1],
    frameSize: [2.95, 1.28],
    flowPaths: [
      [
        [-0.86, 0.26, 4.1],
        [col(40), 0.12, 4.1],
        [col(40), 0.44, -1.5],
        [col(27), 0.44, -1.5],
        [col(27), 0.44, Z_A],
      ],
    ],
    durationSec: 5.5,
  },
];
