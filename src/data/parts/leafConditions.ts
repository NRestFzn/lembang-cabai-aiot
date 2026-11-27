// Leaf-condition metadata: label, colours and AIoT action per condition.
import { LeafCondition } from '../../types/simulation';

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
      'Stres kelembaban mikroiklim berkepanjangan atau fase awal infeksi yang mulai terbaca sebagai anomali warna oleh kamera ArduCam Camera Module 3.',
    aiotAction:
      'ArduCam Camera Module 3 mengambil konfirmasi visual dan menaikkan bobot risiko patek 12–36 jam pada petak ini.',
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

