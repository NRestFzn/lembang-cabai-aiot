import { LEAF_CONDITION_META } from '../data/parts';
import { SerialLogEntry, SimulationMetrics, WeatherMode } from '../types/simulation';

export type PhoneTab = 'pantau' | 'irigasi' | 'kamera' | 'log';

export const ARC_SEGMENTS = 10;

export function getSoilState(pct: number): { label: string; badge: 'is-dry' | 'is-ok' | 'is-wet'; hint: string } {
  if (pct < 38) {
    return {
      label: 'Kering',
      badge: 'is-dry',
      hint: 'Segera siram agar tanaman tidak layu',
    };
  }
  if (pct <= 65) {
    return {
      label: 'Ideal',
      badge: 'is-ok',
      hint: 'Air akar cukup · Belum perlu disiram',
    };
  }
  return {
    label: 'Basah',
    badge: 'is-wet',
    hint: 'Terlalu lembab · Tunda siraman dulu',
  };
}

export function getCanopyStatus(
  metrics: SimulationMetrics,
  weather: WeatherMode
): { summary: string; tag: string; dewLabel: string; drySpeed: string } {
  const dewLabel =
    metrics.dewPointDepressionC <= 2.0 ? 'Tinggi' : metrics.dewPointDepressionC <= 3.2 ? 'Sedang' : 'Rendah';
  const drySpeed = metrics.vpdKpa < 0.45 ? 'Lambat' : metrics.vpdKpa < 0.85 ? 'Sedang' : 'Cepat';

  if (weather === 'rainy') {
    return { summary: 'Sedang hujan · Daun sulit mengering', tag: 'Hujan', dewLabel, drySpeed };
  }
  if (metrics.vpdKpa < 0.45 || metrics.dewPointDepressionC <= 2.0) {
    return { summary: 'Lembab & berembun · Rawan jamur', tag: 'Berembun', dewLabel, drySpeed };
  }
  if (weather === 'foggy') {
    return { summary: 'Berkabut · Daun lebih lama kering', tag: 'Berkabut', dewLabel, drySpeed };
  }
  if (metrics.vpdKpa >= 0.9) {
    return { summary: 'Hangat & udara kering · Cepat pulih', tag: 'Hangat', dewLabel, drySpeed };
  }
  return { summary: 'Sejuk & aman bagi daun cabai', tag: 'Normal', dewLabel, drySpeed };
}

export function getFarmerDecisionHint(
  metrics: SimulationMetrics,
  weather: WeatherMode,
  soilPct: number,
  simTime: string
): string {
  if (weather === 'rainy') {
    return 'Sedang hujan — tanaman tidak perlu disiram agar akar tidak tergenang.';
  }
  if (metrics.lastDecision === 'IDLE') {
    return `Air tanah masih cukup (${soilPct}%). Hemat air dan biarkan daun tetap kering.`;
  }
  if (metrics.lastDecision === 'TUNDA') {
    return `Pukul ${simTime} udara terlalu lembab dan daun lambat kering. Tunda penyiraman supaya tidak memicu patek.`;
  }
  if (metrics.lastDecision === 'KURANGI') {
    return 'Cuaca agak lembab — tetap boleh menyiram, tapi cukup setengah takaran agar daun cepat kering.';
  }
  return `Tanah mulai kering (${soilPct}%) dan udara hangat — aman untuk menyiram sekarang.`;
}

export const LEAF_FARMER_COPY: Record<
  keyof typeof LEAF_CONDITION_META,
  { label: string; summary: string }
> = {
  healthy: {
    label: 'Sehat & Segar',
    summary: 'Daun hijau normal, permukaan kering dan bebas bercak.',
  },
  wet_risk: {
    label: 'Daun Lembab',
    summary: 'Daun menahan embun atau sisa air, berisiko muncul jamur bila berlarut.',
  },
  yellowing: {
    label: 'Mulai Menguning',
    summary: 'Warna daun mulai pudar karena stres kekeringan atau terlalu lembab.',
  },
  patek_early: {
    label: 'Gejala Awal Patek',
    summary: 'Mulai terlihat bercak gelap pada daun. Hindari siram di sore/malam hari.',
  },
  patek_infected: {
    label: 'Terkena Patek',
    summary: 'Bercak hitam menyebar ke daun dan buah. Hentikan siram atas & petik bagian sakit.',
  },
};

export const LOG_TAG_LABEL: Record<SerialLogEntry['tag'], string> = {
  SENS: 'Tanah & Cuaca',
  RISK: 'Kondisi',
  VALVE: 'Siram',
  NUDGE: 'Peringatan',
  CAM: 'Kamera',
  SYNC: 'Kebun',
};