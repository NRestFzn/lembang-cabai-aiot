export type EspPartKey =
  | 'U1'
  | 'ANT1'
  | 'U2'
  | 'U3'
  | 'SW1'
  | 'SW2'
  | 'RGB'
  | 'J1'
  | 'H1'
  | 'H2'
  | 'RC'
  | 'LM2596'
  | 'TRANSISTOR'
  | 'RESISTOR'
  | 'LED'
  | 'JUMPER'
  | 'BME280'
  | 'SOIL_MOISTURE'
  | 'DS18B20'
  | 'MICROSD'
  | 'ESP32CAM'
  | 'SOLAR'
  | 'MPPT'
  | 'BATTERY'
  | 'RELAY'
  | 'PUMP'
  | 'SOLENOID';

export interface EspPartDetail {
  designator: string;
  name: string;
  spec: string;
  role: string;
  pins: string;
}

export const ESP32_PARTS: Record<EspPartKey, EspPartDetail> = {
  U1: {
    designator: 'U1',
    name: 'Modul ESP-WROOM-32 (RF Shield)',
    spec: 'Xtensa LX6 Dual-Core 240MHz · 4MB Flash · Wi-Fi/BLE',
    role: 'Menjalankan Risk Engine VPD, Dew-Point Depression, Leaf Wetness Duration (LWD), serta logika kontrol siram.',
    pins: 'Terhubung internal ke bus I2C, ADC1, SPI, UART2, dan GPIO relay.',
  },
  ANT1: {
    designator: 'ANT1',
    name: 'Antena PCB 2.4 GHz (Meander Trace)',
    spec: '50Ω PCB Inverted-F Antenna',
    role: 'Mengirim telemetri ke dashboard 3D/cloud & sinkronisasi ESP-NOW antar-node klaster Poktan.',
    pins: 'Keepout zone bebas tembaga di ujung papan.',
  },
  U2: {
    designator: 'U2',
    name: 'Bridge USB-to-UART (CP2102)',
    spec: 'Silicon Labs CP2102 QFN-28',
    role: 'Menjembatani komunikasi serial komputer dengan ESP32 saat flashing firmware dan monitoring log.',
    pins: 'D+ / D- USB ↔ TXD0 (GPIO1) / RXD0 (GPIO3).',
  },
  U3: {
    designator: 'U3',
    name: 'Regulator LDO AMS1117-3.3V',
    spec: 'SOT-223 · Input 5V → Output 3.3V (800mA)',
    role: 'Menurunkan suplai rel 5V menjadi 3.3V stabil untuk ESP32, BME280, Capacitive Soil, dan DS18B20.',
    pins: 'VIN (5V) · VOUT (3V3) · GND Tab.',
  },
  SW1: {
    designator: 'SW1',
    name: 'Tombol BOOT (IO0)',
    spec: 'Tactile Switch SMD 4-Pin',
    role: 'Menarik GPIO0 ke GND untuk masuk ke mode bootloader saat upload kode baru.',
    pins: 'GPIO0 ↔ GND.',
  },
  SW2: {
    designator: 'SW2',
    name: 'Tombol EN / RESET',
    spec: 'Tactile Switch SMD 4-Pin',
    role: 'Me-reset mikrokontroler secara manual di lapangan tanpa mencabut baterai.',
    pins: 'EN (CHIP_PU) ↔ GND.',
  },
  RGB: {
    designator: 'RGB',
    name: 'LED Status Sistem & Siram',
    spec: 'SMD 5050 Status Indicator',
    role: 'Menunjukkan status AIoT Node: hijau saat menyiram, biru saat standby/monitoring, oranye saat tunda malam.',
    pins: 'GPIO2 (Built-in Status) + Power Indicator.',
  },
  J1: {
    designator: 'J1',
    name: 'Port USB-C / UART',
    spec: 'USB Type-C Receptacle (5V Data & Power)',
    role: 'Port pemrograman, serial monitor, dan suplai uji coba di meja kerja.',
    pins: 'VBUS (5V) · D+ · D- · GND.',
  },
  H1: {
    designator: 'H1',
    name: 'Header Pin Kiri (Power & Sensor)',
    spec: '15-Pin 2.54mm Gold Header',
    role: 'Jalur masuk sensor mikroiklim kanopi & tanah: 3V3, GND, GPIO21 (SDA BME280), GPIO22 (SCL BME280), GPIO34 (Soil ADC1), GPIO4 (DS18B20).',
    pins: '3V3 · EN · VP · VN · 34 · 35 · 32 · 33 · 25 · 26 · 27 · 14 · 12 · GND · VIN',
  },
  H2: {
    designator: 'H2',
    name: 'Header Pin Kanan (SD, CAM & Relay)',
    spec: '15-Pin 2.54mm Gold Header',
    role: 'Jalur keluar menuju MicroSD SPI (GPIO5/18/23/19), ESP32-CAM UART2 (GPIO16/17 + GPIO25), dan kontrol Relay 2-Channel (GPIO26/27).',
    pins: '3V3 · GND · 15 · 2 · 4 · 16 · 17 · 5 · 18 · 19 · 21 · RX0 · TX0 · 22 · 23',
  },
  RC: {
    designator: 'RC',
    name: 'Komponen Pasif SMD (R/C)',
    spec: 'Resistor Pull-Up 10kΩ & Kapasitor Decoupling 100nF/10µF',
    role: 'Menstabilkan pin EN, jalur I2C/UART, serta menyaring noise catu daya.',
    pins: 'Tersebar di sekitar U2, U3, dan SW1/SW2.',
  },
  LM2596: {
    designator: 'REG1',
    name: 'Modul Regulator DC-DC (LM2596)',
    spec: 'Step-Down/Regulator 3A · Induktor 330µH · Trimpot · Voltmeter',
    role: 'Menjaga tegangan rel 5V stabil dan mencegah brownout pada ESP32 saat aktuator pembibitan aktif.',
    pins: 'IN+ / IN- (Screw Terminal) → OUT+ / OUT- (5V Stabil).',
  },
  TRANSISTOR: {
    designator: 'Q1',
    name: 'Modul Saklar Transistor + Dioda Flyback',
    spec: 'Driver Transistor + Dioda 1N4007 + Resistor Basis + Terminal',
    role: 'Mengubah sinyal logika kecil ESP32 (3.3V) menjadi saklar daya dan meredam lonjakan balik induktif dari solenoid/pompa 12V.',
    pins: 'LOGIC IN (GPIO) · POWER IN (12V/GND) · LOAD OUT.',
  },
  RESISTOR: {
    designator: 'R1–R3',
    name: 'Modul LED + Resistor (I = V / R)',
    spec: 'Resistor 220Ω / 1kΩ / 10kΩ · Jumper Header 2×4 · Cap 100µF · Switch',
    role: 'Menyediakan resistor pull-up & pembatas arus indikator status beserta jumper seleksi beban untuk uji jalur sensor & LED.',
    pins: '5V IN (USB-C) · TP1 / TP2 · JP1 (220 / 1K / 10K).',
  },
  LED: {
    designator: 'D1',
    name: 'LED Indikator Status 5mm',
    spec: '5mm Diffused LED (Anoda + Katoda)',
    role: 'Indikator visual status penyiraman aktif atau peringatan risiko patek pada box kontrol.',
    pins: 'Anoda (via resistor) ↔ Katoda (GND).',
  },
  JUMPER: {
    designator: 'W1–W5',
    name: 'Set Kabel Jumper DuPont (2.54mm)',
    spec: '24AWG · Housing DuPont Hitam + Pin Emas (Merah/Hitam/Kuning/Hijau/Biru)',
    role: 'Kabel penghubung antar-header pin 2.54mm (daya VCC/GND serta bus I2C, ADC, 1-Wire, SPI, dan kontrol relay).',
    pins: 'DuPont Male-to-Male & Male-to-Female (Pitch 2.54mm).',
  },
  BME280: {
    designator: 'SEN1',
    name: 'Sensor Mikroiklim Kanopi (GY-BME280)',
    spec: 'Bosch BME280 (3.3V–5V) · I2C Addr 0x76 · Suhu, RH & Tekanan',
    role: 'Mengukur suhu, kelembaban relatif (RH), dan tekanan udara di zona tajuk daun cabai untuk kalkulasi VPD, Dew-Point Depression, dan estimasi LWD.',
    pins: 'VCC · GND · SCL (GPIO22) · SDA (GPIO21)',
  },
  SOIL_MOISTURE: {
    designator: 'SEN2',
    name: 'Capacitive Soil Moisture Sensor v1.2',
    spec: 'NE555 Oscillator + 3.3V LDO · Output Analog 0–3.3V · Anti-Korosi',
    role: 'Mengukur kelembaban tanah zona akar cabai sedalam 12 cm tanpa korosi elektroda sebelum digabung dengan prediksi embun kanopi.',
    pins: 'GND · VCC (3V3) · AOUT (GPIO34 / ADC1)',
  },
  DS18B20: {
    designator: 'SEN3',
    name: 'Probe Suhu Tanah Waterproof (DS18B20)',
    spec: 'Stainless Steel Probe (-55..125°C) · Kabel Merah/Hitam/Kuning · Adapter Pull-Up',
    role: 'Memantau suhu tanah zona perakaran untuk mengkalibrasi kondisi kondensasi embun malam dan stres akar.',
    pins: 'Merah: VCC (3V3) · Hitam: GND · Kuning: DQ (GPIO4 + 4.7kΩ Pull-Up)',
  },
  MICROSD: {
    designator: 'LOG1',
    name: 'MicroSD Card Module (SPI Logger)',
    spec: 'Level Shifter 74LVC125A + LDO 3.3V · Slot Push-Push FAT32',
    role: 'Menyimpan log telemetri lokal (suhu, RH, VPD, soil, skor patek) saat sinyal seluler di lereng Lembang terputus (offline-first).',
    pins: 'CS (GPIO5) · SCK (GPIO18) · MOSI (GPIO23) · MISO (GPIO19) · VCC (5V) · GND',
  },
  ESP32CAM: {
    designator: 'CAM1',
    name: 'ESP32-CAM (OV2640 2MP)',
    spec: 'AI-Thinker ESP32-S + PSRAM 4MB · Lensa OV2640 + Flash LED',
    role: 'Confirmation Layer visual: dibangunkan dari deep-sleep saat skor risiko patek tinggi untuk menangkap citra bercak/menguning dini pada daun.',
    pins: 'Kiri: 5V, GND, IO12..IO4 · Kanan: 3V3, IO16, IO0, GND, VCC, U0R, U0T, GND',
  },
  SOLAR: {
    designator: 'PV1',
    name: 'Panel Surya 6V / 10W Polycrystalline',
    spec: '6V Nominal · 10W Peak · Bingkai Aluminium + Kotak Junction',
    role: 'Sumber energi terbarukan utama di puncak tiang node (~1.6 m) agar pengisian baterai optimal sepanjang hari.',
    pins: 'PV+ (Merah) · PV- (Hitam) → Input MPPT Charger',
  },
  MPPT: {
    designator: 'CHG1',
    name: 'CN3791 MPPT Solar Charger + 4S BMS',
    spec: 'MPPT Tracking · Induktor 4R7 · Proteksi BMS 4S LiFePO4 (14.6V)',
    role: 'Menjaga efisiensi pengisian paket baterai saat cuaca mendung/berkabut di Lembang dan melindungi sel 4S dari overcharge.',
    pins: 'PV+ / PV- (Panel) · BAT+ / BAT- (12.8V Pack) · Bus 12V',
  },
  BATTERY: {
    designator: 'BAT1',
    name: 'Paket Baterai LiFePO4 4S 12.8V 6000mAh',
    spec: '4× Sel Silinder 32650 (4S1P) + BMS · >2000 Siklus · Tahan Suhu Dingin',
    role: 'Menyuplai bus 12.8V langsung ke pompa/solenoid via Relay serta ke step-down LM2596 (12.8V → 5.0V) untuk menyalakan ESP32.',
    pins: 'B+ (12.8V ke Bus Breadboard Kolom 4) · B- (GND ke Kolom 13)',
  },
  RELAY: {
    designator: 'RLY1',
    name: 'Modul Relay 2-Channel 5V Optocoupler',
    spec: '2× SRD-05VDC-SL-C (10A) · Optoisolator PC817 · Jumper JD-VCC',
    role: 'Memisahkan logika 5V ESP32 dari arus beban 12V untuk mengendalikan pompa dan katup solenoid pembibitan komunal.',
    pins: 'Kontrol: GND, IN1 (GPIO26), IN2 (GPIO27), VCC · Output: NO1/COM1/NC1 & NO2/COM2/NC2',
  },
  PUMP: {
    designator: 'PMP1',
    name: 'Pompa Diaphragm 12V DC',
    spec: '12V DC Micro Diaphragm (2–3 L/min) · Toren Buffer 200L',
    role: 'Menyalurkan air dari toren penampung ke manifold irigasi tetes di zona pembibitan komunal Poktan.',
    pins: '12V+ (dari Relay NO1) · GND- (ke Ground Bersama)',
  },
  SOLENOID: {
    designator: 'VLV1',
    name: 'Solenoid Valve Kuningan 12V DC',
    spec: '12V DC Normally Closed (NC) 1/2" · Bodi Kuningan + Koil Elektromagnetik',
    role: 'Membuka dan mengunci aliran air irigasi secara otomatis (closed-loop) saat sistem memutuskan TUNDA malam hari.',
    pins: '12V+ (dari Relay NO2) · GND- (ke Ground Bersama)',
  },
};

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
    label: 'ESP32-CAM OV2640',
    category: 'Kontrol',
    voltage: '5V / UART',
    pins: ['5V', 'GND', 'U0R', 'U0T', 'IO12..IO16'],
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
    part: 'TRANSISTOR',
    code: 'Q1',
    label: 'Driver Transistor + Dioda',
    category: 'Aktuator',
    voltage: '3.3V → 12V',
    pins: ['LOGIC IN', 'PWR 12V', 'LOAD OUT'],
    focusOffset: [1.2, 3.0, 2.8],
    targetPos: [0.55, 0.25, 0.7],
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
    part: 'RESISTOR',
    code: 'R1–R3',
    label: 'Modul LED + Resistor',
    category: 'Kontrol',
    voltage: '5V / 3.3V',
    pins: ['5V IN', '220Ω', '1kΩ', '10kΩ'],
    focusOffset: [1.2, 3.0, 2.8],
    targetPos: [3.15, 0.2, 0.85],
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
