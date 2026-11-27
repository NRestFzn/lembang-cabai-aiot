// Peripherals + actuators: camera, MicroSD logger, relay and the
// pump/solenoid steps (tour stages 09–12), on the right of the board.
import { col, Z_A, Z_B, Z_C, Z_I, Z_J } from './tourLayout';
import { CircuitTourStep } from './tourTypes';

export const TOUR_STEPS_PERIPHERALS: CircuitTourStep[] = [
  {
    id: 'cam',
    part: 'ESP32CAM',
    stage: '09 / 12 · Konfirmasi Visual Daun',
    title: 'ArduCam Camera Module 3 (IMX708 12MP)',
    description:
      'Mengambil daya 5V dari rail atas (kolom 42). Saat skor patek tinggi, ArduCam Camera Module 3 (Sony IMX708 12MP, 4608×2592) memotret gejala bercak patek secara visual lewat kabel flex MIPI CSI-2 ke host-nya — kamera ini tidak dibangunkan lewat UART2.',
    flowSummary: 'CSI flex ↔ host (MIPI CSI-2) · 5V dari rail atas (Kolom 42)',
    accentColor: '#a855f7',
    target: [2.2, 0.2, 0.15],
    camPos: [2.2, 10.0, 0.5],
    ringPos: [2.86, 0.52, 0.0],
    frameSize: [2.62, 1.98],
    flowPaths: [
      // Power: 5V rail tap (col 42) east along the south row (Z_I) to the
      // cam's south edge (col 48) — matches the visible red wire in wiring.ts.
      // Image data travels over the MIPI CSI-2 flex to the host, NOT over
      // UART2 (GPIO16/17). The former U0R/U0T jumper run (cols 49/50) is
      // removed — see wiring.ts.
      [
        [col(42), 0.35, Z_I],
        [col(48), 0.35, Z_I],
      ],
      // Data: CSI flex ribbon from the cam's FPC (x 2.04) west across the
      // board to the ESP32 east edge — matches the visible orange ribbon.
      [
        [2.04, 0.34, 0],
        [0.9, 0.32, 0],
        [-0.15, 0.54, 0],
      ],
    ],
    durationSec: 5.5,
  },
  {
    id: 'microsd',
    part: 'MICROSD',
    stage: '10 / 12 · Penyimpanan Offline-First',
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
    id: 'relay',
    part: 'RELAY',
    stage: '11 / 12 · Saklar Daya Optocoupler',
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
    stage: '12 / 12 · Eksekusi Pembibitan Komunal 12V',
    title: 'Pompa Diaphragm & Solenoid Valve 12V',
    description:
      'Saat keputusan AIoT adalah SIRAM untuk zona pembibitan komunal Poktan, Relay NO1 & NO2 mengalirkan 12.8V ke pompa & katup solenoid. Saat TUNDA malam hari, katup terkunci otomatis agar bibit terlindung dari embun berlebih.',
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
