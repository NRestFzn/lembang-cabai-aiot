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
    name: 'Panel Surya 6V / 10W + MPPT',
    role: 'Menghasilkan daya listrik mandiri dari matahari via CN3791 MPPT charger ke paket baterai LiFePO4 4S agar node AIoT hidup 24 jam tanpa PLN.',
    placement: 'Puncak tiang Sentinel Node (tinggi ~1.6 m, menghadap ke atas).',
    whyHere:
      'Mendapat paparan matahari maksimal tanpa terhalang kanopi cabai yang rimbun agar baterai LiFePO4 4S terisi penuh untuk siklus embun malam.',
    spec: '6V/10W Polycrystalline + CN3791 MPPT Charger + LiFePO4 4S 12.8V 6000mAh',
    anchorLocal: [-2.75, 2.72, -1.12],
  },
  enclosure: {
    id: 'enclosure',
    code: 'U1',
    name: 'Box Kontrol AIoT IP65 (ESP32 + SD + Relay)',
    role: 'Otak sistem yang membaca sensor kanopi & akar, menghitung VPD, Dew-Point Depression, serta risiko patek, menyimpan log offline ke MicroSD, dan mengontrol aktuator pembibitan.',
    placement: 'Tengah tiang utama di tepi bedengan teras atas, terlindung dari cipratan air.',
    whyHere:
      'Menyatukan mikrokontroler ESP32, MicroSD SPI offline-first, LM2596 5V, baterai LiFePO4, dan Relay 2-Channel 5V di enclosure IP65 yang aman dari hujan & embun.',
    spec: 'ESP32-DevKit, MicroSD Offline Logger, LM2596 5V, Relay 2-Channel 5V, Box IP65',
    anchorLocal: [-2.61, 1.66, -1.12],
  },
  esp32cam: {
    id: 'esp32cam',
    code: 'CAM1',
    name: 'ESP32-CAM (Confirmation Layer)',
    role: 'Memotret daun cabai saat skor risiko tinggi untuk konfirmasi dini gejala visual (bercak, menguning, awal patek) sebelum menyebar antar-petak.',
    placement: 'Lengan lurus menghadap 2 pohon kanopi cabai di teras atas.',
    whyHere:
      'Menjadi sensor fusion confirmation layer saat risiko mikroiklim tinggi untuk konfirmasi bercak/menguning dini—bukan pengganti logika VPD & LWD.',
    spec: 'AI-Thinker OV2640 2MP + Flash LED + Low-Power Deep Sleep',
    anchorLocal: [-2.43, 2.12, -1.12],
  },
  dht22: {
    id: 'dht22',
    code: 'SEN1',
    name: 'Sensor Mikroiklim Kanopi (GY-BME280)',
    role: 'Mengukur suhu, kelembaban relatif (RH), dan tekanan udara tepat di sela tajuk daun untuk menghitung VPD, Dew-Point Depression, serta estimasi lama daun basah (LWD).',
    placement: 'Dalam pelindung radiasi berventilasi 4 lapis tepat di tengah sela kanopi daun teras atas.',
    whyHere:
      'Mikroiklim di sela tajuk daun jauh lebih lembab daripada udara terbuka. Data ini dipakai menghitung VPD, selisih titik embun (ΔTd), dan LWD.',
    spec: 'Bosch GY-BME280 (I2C) + 4-Plate Ventilated Radiation Shield (Canopy)',
    anchorLocal: [-0.95, 1.2, -1.12],
  },
  soil_probe: {
    id: 'soil_probe',
    code: 'SEN2',
    name: 'Sensor Zona Akar (Capacitive Soil + DS18B20)',
    role: 'Memantau kadar air tanah (Capacitive v1.2) dan suhu zona perakaran (DS18B20 4.7kΩ) agar sistem tahu kapan tanaman butuh air dan mengkalibrasi kondisi embun.',
    placement: 'Tertancap ke bedengan tanah dekat zona perakaran cabai dengan kabel rapi masuk gland box.',
    whyHere:
      'Mengukur kelembaban dan suhu akar secara akurat tanpa korosi. Menjadi sinyal pemicu sebelum digabungkan dengan prediksi embun & LWD kanopi.',
    spec: 'Capacitive Soil v1.2 (GPIO34) + Waterproof DS18B20 (1-Wire GPIO4)',
    anchorLocal: [-0.97, 0.58, -0.83],
  },
  solenoid: {
    id: 'solenoid',
    code: 'VLV1',
    name: 'Solenoid Valve (Katup Otomatis)',
    role: 'Katup elektrik otomatis yang membuka aliran irigasi ke pipa teras atas & bawah saat Mode Otomatis aman, serta mengunci aliran saat keputusan TUNDA malam/hujan agar daun tidak basah semalaman.',
    placement: 'Di titik percabangan pipa utama setelah pompa, menuju bedengan teras atas dan teras bawah.',
    whyHere:
      'Menjadi gerbang kontrol closed-loop sebelum air terpecah ke dua teras sehingga penyiraman otomatis bisa diatur & dipantau langsung dari Aplikasi HP.',
    spec: '12V DC Brass Solenoid Valve (NC 1/2") + T-Splitter Manifold',
    anchorLocal: [-1.98, 0.48, 0.22],
  },
  pump: {
    id: 'pump',
    code: 'PMP1',
    name: 'Toren & Pompa Irigasi Mikro',
    role: 'Toren menyimpan cadangan air, sedangkan pompa diafragma 12V menyalurkan air bertekanan ke pipa irigasi bedengan saat Mode Otomatis berjalan.',
    placement: 'Di atas rangka penyangga sisi kiri teras bawah agar kokoh, dekat sumber pipa utama.',
    whyHere:
      'Penyangga menjaga toren & pompa stabil di lahan miring, sementara pompa memastikan tekanan aliran cukup naik ke bedengan teras atas.',
    spec: '12V Diaphragm Pump + Toren Buffer + Rangka Penyangga',
    anchorLocal: [-2.66, 0.55, 0.58],
  },
  terrace: {
    id: 'terrace',
    code: 'TER1',
    name: 'Lahan Terasering Cabai Lembang',
    role: 'Lahan terasering 2 undakan yang mendukung 2 mode siram: Mode Otomatis (pipa drip AIoT terpantau HP) dan Mode Manual (gembor siram tangan) untuk perbandingan dampak risiko patek.',
    placement: '2 undakan bedengan mulsa dengan penahan tanah batu/kayu.',
    whyHere:
      'Lahan miring dataran tinggi rawan sebaran spora antraknosa dari petak atas ke bawah terbawa percikan air & angin lembab malam hari.',
    spec: 'Terasering 2 Undakan + 2 Mode Irigasi (Otomatis AIoT & Manual Gembor)',
    anchorLocal: [1.5, 0.25, 0.9],
  },
  chili_plant: {
    id: 'chili_plant',
    code: 'PLT1',
    name: 'Tanaman Cabai Keriting + Ajir Bambu',
    role: 'Tanaman utama yang dipantau kesehatannya; ajir bambu & ring pengikat menopang cabang agar tetap tegak.',
    placement: 'Berbaris di atas bedengan mulsa, ditopang 4 ajir bambu & 3 ring pengikat.',
    whyHere:
      'Ajir bambu menahan cabang cabai keriting tetap tegak sehingga sirkulasi udara di kanopi terjaga dan buah tidak menyentuh mulsa basah.',
    spec: 'Cabai Keriting Dataran Tinggi (~1.200 mdpl) + Penyangga Ajir Bambu',
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
  patek_infected: {
    condition: 'patek_infected',
    label: 'Sudah Patek (Antraknosa)',
    badgeColor: '#b91c1c',
    leafHex: '#5c4a24',
    leafYoungHex: '#735b2c',
    summary: 'Infeksi antraknosa aktif dengan lesi nekrotik gelap pada daun dan buah cabai.',
    cause:
      'Daun basah berkepanjangan dan kelembaban tinggi tanpa jeda pengeringan memungkinkan spora Colletotrichum menembus jaringan daun hingga membusukkan buah.',
    aiotAction:
      'Hentikan seluruh siraman atas kanopi, pangkas buah/daun berlesi parah agar spora tidak menyebar, dan alihkan irigasi hanya saat VPD siang aman.',
  },
};

