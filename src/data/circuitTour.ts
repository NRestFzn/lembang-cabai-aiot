import { EspPartKey } from './espParts';

const col = (idx: number) => -7.48 + idx * 0.22;

const Z_TOP_5V = -1.76;
const Z_A = -1.32;
const Z_B = -1.1;
const Z_C = -0.88;
const Z_D = -0.66;
const Z_E = -0.44;
const Z_I = 1.1;
const Z_J = 1.32;
const Z_BOT_3V3 = 1.76;

export interface CircuitTourStep {
  id: string;
  part: EspPartKey | 'OVERVIEW';
  stage: string;
  title: string;
  description: string;
  flowSummary: string;
  accentColor: string;
  target: [number, number, number];
  camPos: [number, number, number];
  ringPos: [number, number, number];
  frameSize: [number, number];
  flowPaths: Array<[number, number, number][]>;
  durationSec: number;
}

export const CIRCUIT_TOUR_STEPS: CircuitTourStep[] = [
  {
    id: 'overview',
    part: 'OVERVIEW',
    stage: 'Arsitektur Node AIoT Lembang',
    title: 'Rangkaian Terintegrasi Sentinel Cabai',
    description:
      'Semua modul terpasang rapi di atas satu breadboard utama: jalur panen daya surya 12.8V di sisi atas, regulasi 5V/3.3V ke ESP32 dan sensor di tengah, hingga saklar relay pompa & solenoid di kanan.',
    flowSummary: 'Solar 6V → CN3791 MPPT → Baterai 12.8V → LM2596 5V → ESP32 & Aktuator',
    accentColor: '#10b981',
    target: [-0.2, 0.2, 0.45],
    camPos: [-0.2, 37.5, 1.0],
    ringPos: [0, 0.25, 0],
    frameSize: [0, 0],
    flowPaths: [
      [
        [-9.08, 0.25, -4.3],
        [-7.21, 0.285, -4.34],
      ],
      [
        [-2.76, 0.32, -4.2],
        [-2.76, 0.1, -3.08],
        [col(4), 0.5, Z_D],
        [-3.65, 0.24, -5.35],
        [1.17, 0.285, -4.34],
      ],
      [
        [3.63, 0.285, -4.34],
        [3.92, 0.12, -3.12],
        [col(37), 0.46, Z_J],
        [col(31), 0.46, Z_J],
      ],
    ],
    durationSec: 4.5,
  },
  {
    id: 'solar',
    part: 'SOLAR',
    stage: '01 / 13 · Panen Energi',
    title: 'Panel Surya 6V / 10W',
    description:
      'Dipasang di puncak tiang node (~1,6 m) untuk memanen energi matahari sepanjang hari. Output DC (PV+ merah, PV- hitam) langsung mengalir menuju modul CN3791 MPPT charger.',
    flowSummary: 'Panel Surya (PV+ / PV-) → CN3791 MPPT Charger',
    accentColor: '#f59e0b',
    target: [-8.2, 0.2, -3.7],
    camPos: [-8.2, 12.2, -3.35],
    ringPos: [-10.0, 0.28, -4.2],
    frameSize: [2.75, 2.25],
    flowPaths: [
      [
        [-9.08, 0.25, -4.3],
        [-7.21, 0.285, -4.34],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'mppt',
    part: 'MPPT',
    stage: '02 / 13 · MPPT & Charging',
    title: 'CN3791 MPPT Solar Charger',
    description:
      'Melacak titik daya maksimum saat cuaca Lembang mendung atau berkabut agar pengisian tetap optimal, lalu menyalurkan daya aman via bus BAT+ (kolom 4) & BAT- (kolom 13) ke paket baterai.',
    flowSummary: 'PV Input → CN3791 MPPT → Bus BAT+ (Kolom 4) & BAT- (Kolom 13)',
    accentColor: '#f59e0b',
    target: [-5.1, 0.2, -2.9],
    camPos: [-5.1, 11.4, -2.55],
    ringPos: [-6.2, 0.32, -4.2],
    frameSize: [2.42, 1.72],
    flowPaths: [
      [
        [-5.19, 0.285, -4.34],
        [-5.02, 0.1, -2.86],
        [col(4) - 0.14, 0.44, -2.86],
        [col(4), 0.44, Z_B],
        [col(4), 0.5, Z_C],
        [col(4), 0.5, -3.08],
        [-2.76, 0.1, -3.08],
        [-2.76, 0.32, -4.2],
      ],
    ],
    durationSec: 6.0,
  },
  {
    id: 'battery',
    part: 'BATTERY',
    stage: '03 / 13 · Penyimpanan Daya 12.8V',
    title: 'Paket Baterai LiFePO4 4S 12.8V (6000mAh)',
    description:
      'Menyimpan cadangan energi 76.8Wh yang tahan suhu dingin. Jalur positif 12.8V di kolom 4 memasok dua cabang: ke step-down LM2596 (untuk ESP32) dan langsung ke Relay COM1 untuk beban 12V.',
    flowSummary: 'Baterai 12.8V+ (Kolom 4) → LM2596 IN+ & Relay COM1',
    accentColor: '#ef4444',
    target: [-1.4, 0.2, -3.1],
    camPos: [-1.4, 13.0, -2.7],
    ringPos: [-1.8, 0.32, -4.2],
    frameSize: [2.56, 1.32],
    flowPaths: [
      [
        [-2.76, 0.32, -4.2],
        [-2.76, 0.1, -3.08],
        [col(4), 0.5, -3.08],
        [col(4), 0.56, Z_D],
        [col(3), 0.56, -2.64],
        [-3.65, 0.24, -2.64],
        [-3.65, 0.24, -5.35],
        [0.85, 0.1, -5.35],
        [0.85, 0.285, -4.34],
        [1.17, 0.285, -4.34],
      ],
      [
        [col(4), 0.62, Z_E],
        [col(4) + 0.14, 0.3, -2.5],
        [-3.45, 0.3, -2.5],
        [-3.45, 0.1, -5.58],
        [8.62, 0.1, -5.58],
        [8.62, 0.34, -4.56],
        [8.43, 0.27, -4.56],
      ],
    ],
    durationSec: 6.5,
  },
  {
    id: 'lm2596',
    part: 'LM2596',
    stage: '04 / 13 · Regulasi 12.8V → 5.00V',
    title: 'Buck Converter LM2596 (5.00V)',
    description:
      'Menurunkan tegangan baterai 12.8V menjadi 5.00V stabil agar ESP32 aman dari lonjakan & brownout. Dari terminal kanan OUT+ & OUT-, kabel merah-hitam masuk lewat celah tengah langsung ke pin VIN & GND ESP32.',
    flowSummary: 'LM2596 OUT+ (5V) & OUT- → ESP32 VIN (Kolom 31) & GND (Kolom 30)',
    accentColor: '#ef4444',
    target: [1.3, 0.2, -1.6],
    camPos: [1.3, 17.2, -1.2],
    ringPos: [2.4, 0.32, -4.2],
    frameSize: [2.92, 1.88],
    flowPaths: [
      [
        [3.63, 0.285, -4.34],
        [3.92, 0.12, -3.12],
        [col(37), 0.46, -3.12],
        [col(37), 0.46, Z_J],
        [col(31), 0.46, Z_J],
        [col(31), 0.22, Z_J],
      ],
      [
        [3.63, 0.285, -4.02],
        [4.08, 0.12, -2.92],
        [col(38), 0.46, -2.92],
        [col(38), 0.46, 2.22],
        [col(30), 0.46, 2.22],
        [col(30), 0.46, Z_J],
        [col(30), 0.22, Z_J],
      ],
    ],
    durationSec: 6.5,
  },
  {
    id: 'esp32',
    part: 'U1',
    stage: '05 / 13 · Otak Kontrol & Bus 3.3V',
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
    stage: '06 / 13 · Sensor Udara & Embun',
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
    stage: '07 / 13 · Sensor Kelembaban Tanah',
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
    stage: '08 / 13 · Sensor Suhu Tanah',
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
  {
    id: 'cam',
    part: 'ESP32CAM',
    stage: '09 / 13 · Konfirmasi Visual Daun',
    title: 'ESP32-CAM (OV2640 2MP)',
    description:
      'Mengambil daya 5V dari rail atas (kolom 42). Saat skor patek tinggi, ESP32 membangunkan ESP32-CAM lewat jalur serial UART2 (U0R/U0T) untuk memotret gejala bercak patek secara visual.',
    flowSummary: 'ESP32 GPIO16/17 (UART2) ↔ ESP32-CAM (Kolom 49/50)',
    accentColor: '#a855f7',
    target: [2.2, 0.2, 0.15],
    camPos: [2.2, 10.0, 0.5],
    ringPos: [2.86, 0.52, 0.0],
    frameSize: [2.62, 1.98],
    flowPaths: [
      [
        [col(25), 0.35, Z_A],
        [col(49), 0.35, Z_A],
      ],
      [
        [col(26), 0.35, Z_B],
        [col(50), 0.35, Z_B],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'microsd',
    part: 'MICROSD',
    stage: '10 / 13 · Penyimpanan Offline-First',
    title: 'MicroSD Card SPI Logger',
    description:
      'Ditenagai 5V dari rail atas (kolom 55). Semua log suhu, RH, kelembaban tanah, dan keputusan siram disimpan lokal via bus SPI (CS/SCK/MOSI/MISO) agar aman saat sinyal lereng Lembang putus.',
    flowSummary: 'ESP32 SPI (GPIO5/18/23/19) ↔ MicroSD (Kolom 56–59)',
    accentColor: '#14b8a6',
    target: [4.1, 0.2, -0.2],
    camPos: [4.1, 10.2, 0.15],
    ringPos: [4.84, 0.52, 0.02],
    frameSize: [1.82, 1.96],
    flowPaths: [
      [
        [col(17), 0.36, Z_C],
        [col(17), 0.36, -1.58],
        [col(57), 0.36, -1.58],
        [col(57), 0.36, Z_C],
      ],
      [
        [col(24), 0.38, Z_B],
        [col(24), 0.38, -2.36],
        [col(59), 0.38, -2.36],
        [col(59), 0.38, Z_A],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'driver',
    part: 'TRANSISTOR',
    stage: '11 / 13 · Driver Indikator & Proteksi',
    title: 'NPN Switch (2N2222) + LED Trainer',
    description:
      'Sinyal logika 3.3V dari GPIO2 ESP32 (kolom 41) mengendalikan transistor NPN + dioda flyback 1N4007 agar aman menggerakkan indikator status di papan LED Trainer tanpa membebani pin MCU.',
    flowSummary: 'ESP32 GPIO2 → NPN Switch Q1 → LED Indikator Status D1',
    accentColor: '#22c55e',
    target: [3.8, 0.2, 3.85],
    camPos: [3.8, 11.4, 4.2],
    ringPos: [3.8, 0.30, 4.35],
    frameSize: [5.15, 2.65],
    flowPaths: [
      [
        [col(28), 0.48, Z_B],
        [col(41), 0.48, -1.2],
        [col(41), 0.48, 2.5],
        [col(41), 0.1, 5.12],
        [1.8, 0.32, 4.78],
        [1.94, 0.1, 5.32],
        [5.8, 0.2, 5.42],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'relay',
    part: 'RELAY',
    stage: '12 / 13 · Saklar Daya Optocoupler',
    title: 'Modul Relay 2-Channel 5V',
    description:
      'Menerima perintah logika IN1 (GPIO26, hijau) & IN2 (GPIO27, pink) serta koil 5V untuk menyambung-putuskan suplai baterai 12.8V pada terminal COM1/COM2 ke aktuator dengan isolasi optocoupler.',
    flowSummary: 'ESP32 GPIO26/27 → Relay IN1/IN2 · Bus 12.8V COM1/COM2',
    accentColor: '#ec4899',
    target: [6.8, 0.2, -3.1],
    camPos: [6.8, 10.6, -2.75],
    ringPos: [7.4, 0.32, -4.2],
    frameSize: [2.62, 2.24],
    flowPaths: [
      [
        [col(25), 0.36, Z_I],
        [col(25), 0.36, 1.46],
        [col(63), 0.36, 1.46],
        [col(63), 0.32, -4.49],
        [6.48, 0.32, -4.49],
      ],
      [
        [col(26), 0.38, Z_J],
        [col(26), 0.38, 1.58],
        [col(64), 0.38, 1.58],
        [col(64), 0.32, -4.27],
        [6.48, 0.32, -4.27],
      ],
    ],
    durationSec: 6.0,
  },
  {
    id: 'actuators',
    part: 'PUMP',
    stage: '13 / 13 · Eksekusi Irigasi Presisi 12V',
    title: 'Pompa Diaphragm & Solenoid Valve 12V',
    description:
      'Saat keputusan AIoT adalah SIRAM, Relay NO1 & NO2 mengalirkan 12.8V untuk menghidupkan pompa dan membuka katup solenoid kuningan. Saat TUNDA malam hari, katup terkunci agar kanopi tidak basah berkepanjangan.',
    flowSummary: 'Relay NO1/NO2 (12.8V) → Pompa & Solenoid → Kembali ke -GND (Kolom 66)',
    accentColor: '#ef4444',
    target: [9.0, 0.2, 0.05],
    camPos: [9.0, 12.8, 0.4],
    ringPos: [9.35, 0.32, 0.2],
    frameSize: [3.15, 4.45],
    flowPaths: [
      [
        [8.43, 0.27, -4.75],
        [9.0, 0.1, -4.75],
        [9.0, 0.1, -2.0],
        [8.45, 0.1, -2.0],
        [8.72, 0.44, -1.34],
      ],
      [
        [8.43, 0.27, -4.01],
        [10.55, 0.1, -4.01],
        [10.55, 0.1, 1.4],
        [9.4, 0.56, 1.4],
      ],
    ],
    durationSec: 6.5,
  },
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
  TRANSISTOR: 'driver',
  RESISTOR: 'driver',
  LED: 'driver',
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
