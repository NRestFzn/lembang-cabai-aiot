import { AccentId, LeafCondition, PartId, PartInfo } from '../types/simulation';

export interface AccentSwatch {
  id: AccentId;
  label: string;
  hex: string;
  darkHex: string;
  softHex: string;
}

export const ACCENT_SWATCHES: AccentSwatch[] = [
  { id: 'mint', label: 'Mint', hex: '#6cc29f', darkHex: '#439675', softHex: '#d9efe5' },
  { id: 'tomato', label: 'Tomato', hex: '#ef6a4c', darkHex: '#c64b30', softHex: '#fbe0d9' },
  { id: 'cobalt', label: 'Cobalt', hex: '#41538f', darkHex: '#2c3b6d', softHex: '#dce2f5' },
  { id: 'mustard', label: 'Mustard', hex: '#e6b83a', darkHex: '#be911d', softHex: '#f9efd0' },
  { id: 'blush', label: 'Blush', hex: '#e59eb5', darkHex: '#bc7089', softHex: '#f9e5ec' },
];

export const PARTS_INFO: Record<PartId, PartInfo> = {
  solar: {
    id: 'solar',
    code: 'PV1',
    name: 'Panel Surya 10W + Charger',
    placement: 'Puncak tiang AIoT Node (tinggi ~1.6 m, menghadap ke utara/atas).',
    whyHere:
      'Mendapat paparan matahari maksimal tanpa terhalang kanopi cabai yang rimbun agar baterai LiFePO4 terisi penuh untuk siklus malam.',
    spec: '6V/10W Polycrystalline + MPPT Solar Charger + LiFePO4 3.2V',
    anchorLocal: [-2.85, 2.72, -1.25],
  },
  enclosure: {
    id: 'enclosure',
    code: 'U1',
    name: 'Box Kontrol AIoT (ESP32 + Relay + SD)',
    placement: 'Tengah tiang utama di tepi bedengan teras atas, terlindung dari cipratan air.',
    whyHere:
      'Menyatukan mikrokontroler ESP32, penyimpanan SD offline-first, dan relay pompa di posisi ergonomis & aman dari kelembaban tanah.',
    spec: 'ESP32-WROOM, MicroSD Offline Logger, 5V Relay, IP65 Enclosure',
    anchorLocal: [-2.78, 1.38, -1.22],
  },
  esp32cam: {
    id: 'esp32cam',
    code: 'CAM1',
    name: 'ESP32-CAM (Confirmation Layer)',
    placement: 'Lengan miring 35° menghadap kanopi tanaman cabai di teras atas.',
    whyHere:
      'Mengambil foto daun secara terarah saat skor risiko patek tinggi untuk konfirmasi bercak/menguning dini—bukan pengganti sensor mikroiklim.',
    spec: 'OV2640 2MP + Low-Power Deep Sleep Triggered by Risk Engine',
    anchorLocal: [-2.12, 1.98, -0.78],
  },
  dht22: {
    id: 'dht22',
    code: 'SEN1',
    name: 'Sensor Suhu & RH Kanopi (BME280/DHT22)',
    placement: 'Dalam pelindung radiasi berventilasi tepat di ketinggian kanopi daun.',
    whyHere:
      'Mikroiklim di sela daun jauh lebih lembab daripada udara terbuka. Data ini dipakai menghitung VPD, titik embun, dan estimasi lama daun basah (LWD).',
    spec: 'BME280 / DHT22 + 3-Plate Radiation Shield (Canopy Level)',
    anchorLocal: [-1.15, 1.16, -0.85],
  },
  soil_probe: {
    id: 'soil_probe',
    code: 'SEN2',
    name: 'Soil Moisture Probe (Kapasitif)',
    placement: 'Tertancap 12 cm ke dalam bedengan tanah dekat zona perakaran cabai.',
    whyHere:
      'Mengukur kelembaban akar secara akurat tanpa korosi. Menjadi sinyal pemicu awal sebelum dikombinasikan dengan prediksi LWD kanopi.',
    spec: 'Capacitive Soil Sensor v1.2 (Anti-Corrosion Waterproof Coated)',
    anchorLocal: [-0.25, 0.45, -0.45],
  },
  solenoid: {
    id: 'solenoid',
    code: 'VLV1',
    name: 'Solenoid Valve + Pipa Irigasi',
    placement: 'Pada percabangan pipa utama menuju bedengan teras atas dan bawah.',
    whyHere:
      'Memungkinkan node menutup/membuka aliran air secara otomatis (closed-loop) saat memutuskan TUNDA atau KURANGI VOLUME menjelang malam.',
    spec: '12V DC Brass/Nylon Solenoid Valve + Micro-Drip Manifold',
    anchorLocal: [-2.05, 0.56, 0.2],
  },
  pump: {
    id: 'pump',
    code: 'PMP1',
    name: 'Toren & Pompa Irigasi Mikro',
    placement: 'Di sisi atas terasering agar terbantu gravitasi ke petak bawah.',
    whyHere:
      'Memudahkan distribusi tekanan air ke lahan cabai berteras Lembang sekaligus menghemat daya baterai pompa.',
    spec: '12V Diaphragm Pump + 200L Field Buffer Drum',
    anchorLocal: [-3.25, 0.95, 0.4],
  },
  terrace: {
    id: 'terrace',
    code: 'TER1',
    name: 'Lahan Terasering Cabai Lembang',
    placement: '2 undakan bedengan mulsa dengan penahan tanah batu/kayu.',
    whyHere:
      'Lahan miring dataran tinggi rawan aliran spora antraknosa dari petak atas ke bawah saat kelembaban & cipratan air berlebih di malam hari.',
    spec: 'Terasering 2 Undakan + Mulsa Perak-Hitam + Drainase Kerikil',
    anchorLocal: [1.5, 0.25, 0.9],
  },
  chili_plant: {
    id: 'chili_plant',
    code: 'PLT1',
    name: 'Tanaman Cabai Rawit / Keriting',
    placement: 'Berbaris di atas bedengan mulsa dengan jarak tanam teratur.',
    whyHere:
      'Kerapatan kanopi memengaruhi sirkulasi udara, laju pengeringan daun (LWD), dan kerentanan terhadap serangan patek (Colletotrichum spp.).',
    spec: 'Cabai Merah / Rawit Dataran Tinggi (~1.200 mdpl)',
    anchorLocal: [0.85, 1.32, -0.75],
  },
};

export const PART_ORDER: PartId[] = [
  'solar',
  'enclosure',
  'esp32cam',
  'dht22',
  'soil_probe',
  'solenoid',
  'pump',
  'chili_plant',
  'terrace',
];

export interface LeafConditionMeta {
  condition: LeafCondition;
  label: string;
  badgeColor: string;
  leafHex: string;
  leafYoungHex: string;
  summary: string;
  cause: string;
  aiotAction: string;
}

export const LEAF_CONDITION_META: Record<LeafCondition, LeafConditionMeta> = {
  healthy: {
    condition: 'healthy',
    label: 'Sehat · Hijau Segar',
    badgeColor: '#6cc29f',
    leafHex: '#4f8f3f',
    leafYoungHex: '#6eab49',
    summary: 'Permukaan daun kering dan fotosintesis berjalan optimal.',
    cause:
      'Defisit tekanan uap (VPD) dan sirkulasi udara kanopi cukup baik sehingga daun tidak basah berlarut-larut; spora patek sulit berkecambah.',
    aiotAction:
      'Irigasi boleh jalan normal di pagi/siang hari saat kelembaban tanah turun di bawah ambang.',
  },
  wet_risk: {
    condition: 'wet_risk',
    label: 'Basah / Lembab Berisiko',
    badgeColor: '#569ec4',
    leafHex: '#2f6b58',
    leafYoungHex: '#3f846d',
    summary: 'Daun menahan embun atau sisa air siraman terlalu lama (LWD tinggi).',
    cause:
      'Kelembaban kanopi tinggi atau penyiraman dekat sore/malam membuat Leaf Wetness Duration (LWD) memanjang—kondisi mikroiklim ideal untuk inkubasi patek.',
    aiotAction:
      'Node otomatis menunda/mengurangi irigasi sore agar daun sempat mengering sebelum malam.',
  },
  yellowing: {
    condition: 'yellowing',
    label: 'Menguning Awal (Stres)',
    badgeColor: '#e6b83a',
    leafHex: '#a3ad36',
    leafYoungHex: '#c2c74b',
    summary: 'Terlihat klorosis/menguning ringan pada helaian daun kanopi.',
    cause:
      'Stres kelembaban mikroiklim berkepanjangan atau fase awal infeksi yang mulai terbaca sebagai anomali warna oleh kamera ESP32-CAM.',
    aiotAction:
      'ESP32-CAM mengambil konfirmasi visual dan menaikkan bobot risiko patek 12–36 jam pada petak ini.',
  },
  patek_early: {
    condition: 'patek_early',
    label: 'Gejala Awal Patek (Bercak)',
    badgeColor: '#ef6a4c',
    leafHex: '#7a7a33',
    leafYoungHex: '#968d3a',
    summary: 'Muncul bercak gelap awal disertai perubahan warna daun kusam kekuningan.',
    cause:
      'Akumulasi LWD panjang (daun basah semalaman) di lahan terasering dataran tinggi Lembang memicu perkecambahan spora antraknosa dan potensi sebaran antar-petak.',
    aiotAction:
      'Confirmation Layer aktif mengirim peringatan ke petani untuk cek fisik petak terkait & menghentikan penyiraman malam.',
  },
};

