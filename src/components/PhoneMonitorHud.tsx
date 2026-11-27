import React, { useState } from 'react';
import {
  Bell,
  Camera,
  Droplet,
  Droplets,
  FileText,
  Home,
  Minus,
  Plus,
  Square,
  Thermometer,
  Zap,
} from 'lucide-react';
import { LEAF_CONDITION_META } from '../data/parts';
import { evaluateCanopyLeafCondition, formatSimTime } from '../simulation/riskEngine';
import { SerialLogEntry, SimulationMetrics, WeatherMode } from '../types/simulation';

interface PhoneMonitorHudProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  logs: SerialLogEntry[];
  onTriggerAutoWater: () => void;
  onToggleAutoGuard: () => void;
  onMinimize: () => void;
}

type PhoneTab = 'pantau' | 'irigasi' | 'kamera' | 'log';

const ARC_SEGMENTS = 10;

function getSoilState(pct: number): { label: string; badge: 'is-dry' | 'is-ok' | 'is-wet'; hint: string } {
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

function getCanopyStatus(
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

function getFarmerDecisionHint(
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

const LEAF_FARMER_COPY: Record<
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

const LOG_TAG_LABEL: Record<SerialLogEntry['tag'], string> = {
  SENS: 'Tanah & Cuaca',
  RISK: 'Kondisi',
  VALVE: 'Siram',
  NUDGE: 'Peringatan',
  CAM: 'Kamera',
  SYNC: 'Kebun',
};

export const PhoneMonitorHud: React.FC<PhoneMonitorHudProps> = ({
  metrics,
  weather,
  logs,
  onTriggerAutoWater,
  onToggleAutoGuard,
  onMinimize,
}) => {
  const [activeTab, setActiveTab] = useState<PhoneTab>('pantau');
  const simTime = formatSimTime(metrics.timeHours);

  const isHighRisk = metrics.patekRiskPct >= 65;
  const isRiskyTime =
    metrics.timeHours >= 16.0 ||
    metrics.timeHours < 5.5 ||
    weather === 'rainy' ||
    metrics.vpdKpa < 0.45;

  const isAutoWateringNow = metrics.isWatering && metrics.aiotMode;
  const isValveLocked = metrics.autoGuardNight && metrics.lastDecision === 'TUNDA';
  const soilPct = Math.round(metrics.soilMoisturePct);
  const soilState = getSoilState(soilPct);
  const canopyStatus = getCanopyStatus(metrics, weather);
  const weatherLabel = weather === 'sunny' ? 'Cerah' : weather === 'foggy' ? 'Berkabut' : 'Hujan';

  const filledSegments = Math.max(
    1,
    Math.min(ARC_SEGMENTS, Math.round((metrics.patekRiskPct / 100) * ARC_SEGMENTS))
  );
  const arcFillColor =
    metrics.patekRiskPct >= 65 ? '#ef5b3c' : metrics.patekRiskPct <= 30 ? '#34b882' : '#f58b54';

  const habitScore = Math.max(42, 95 - Math.round(metrics.symptomSeverity * 30 + (isHighRisk ? 12 : 0)));

  const p1Cond = evaluateCanopyLeafCondition(0, metrics);
  const p2Cond = evaluateCanopyLeafCondition(1, metrics);

  const screenTitle =
    activeTab === 'pantau'
      ? 'Kebun Cabai'
      : activeTab === 'irigasi'
      ? 'Penyiraman'
      : activeTab === 'kamera'
      ? 'Pantau Daun'
      : 'Catatan Kebun';

  return (
    <aside className="phone-hud" aria-label="Aplikasi Pemantauan Kebun Cabai">
      {/* Top Bezel Bar + Dynamic Island */}
      <div className="phone-statusbar">
        <span className="phone-clock">{simTime}</span>
        <span className="phone-island" aria-hidden="true" />
        <span className="phone-net">
          {weatherLabel} · {metrics.batteryPct}%
        </span>
      </div>

      {/* Modern Header */}
      <div className="phone-app-header">
        <div className="phone-icon-squircle" title="Kebun Terhubung">
          <span className="mode-dot is-auto" />
        </div>
        <div className="phone-header-center">
          <div className="phone-app-title">{screenTitle}</div>
          <div className="phone-app-kicker">Hari ke-{metrics.dayCount} · Lahan Atas</div>
        </div>
        <div className="phone-header-right">
          <button
            type="button"
            className="phone-icon-squircle"
            title="Lihat Catatan & Peringatan"
            onClick={() => setActiveTab('log')}
          >
            <Bell size={14} strokeWidth={2.2} aria-hidden="true" />
            {(isHighRisk || isRiskyTime) && <span className="bell-dot" />}
          </button>
          <button
            type="button"
            className="phone-min-btn"
            title="Tutup Layar HP"
            aria-label="Tutup Layar HP"
            onClick={onMinimize}
          >
            <Minus size={14} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable Screen Body */}
      <div className="phone-screen-body">
        {activeTab === 'pantau' && (
          <>
            {/* Hero 10-Segment Semicircle Gauge */}
            <div className="phone-gauge-wrap">
              <svg viewBox="0 0 220 124" className="phone-arc-svg" aria-hidden="true">
                {Array.from({ length: ARC_SEGMENTS }).map((_, idx) => {
                  const totalSpan = Math.PI;
                  const gap = 0.055;
                  const segAngle = (totalSpan - gap * (ARC_SEGMENTS - 1)) / ARC_SEGMENTS;
                  const a0 = Math.PI - idx * (segAngle + gap);
                  const a1 = a0 - segAngle;
                  const rOuter = 96;
                  const rInner = 68;
                  const cx = 110;
                  const cy = 108;

                  const x1o = cx + rOuter * Math.cos(a0);
                  const y1o = cy - rOuter * Math.sin(a0);
                  const x2o = cx + rOuter * Math.cos(a1);
                  const y2o = cy - rOuter * Math.sin(a1);
                  const x2i = cx + rInner * Math.cos(a1);
                  const y2i = cy - rInner * Math.sin(a1);
                  const x1i = cx + rInner * Math.cos(a0);
                  const y1i = cy - rInner * Math.sin(a0);

                  const active = idx < filledSegments;
                  const d = [
                    `M ${x1o.toFixed(1)} ${y1o.toFixed(1)}`,
                    `A ${rOuter} ${rOuter} 0 0 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)}`,
                    `L ${x2i.toFixed(1)} ${y2i.toFixed(1)}`,
                    `A ${rInner} ${rInner} 0 0 0 ${x1i.toFixed(1)} ${y1i.toFixed(1)}`,
                    'Z',
                  ].join(' ');

                  return <path key={idx} d={d} fill={active ? arcFillColor : '#e6e1d8'} />;
                })}
              </svg>
              <div className="phone-gauge-readout">
                <span className="phone-gauge-bolt" style={{ color: arcFillColor }}>
                  <Zap size={13} fill="currentColor" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="phone-gauge-sub">Risiko Patek</span>
                <strong className="phone-gauge-val">{metrics.patekRiskPct}%</strong>
                <span className="phone-gauge-goal">
                  {isAutoWateringNow
                    ? 'Sedang menyiram tanaman'
                    : isValveLocked
                    ? 'Siram ditahan (rawan embun)'
                    : isHighRisk
                    ? 'Waspada · Cek kondisi daun'
                    : metrics.patekRiskPct <= 30
                    ? 'Aman · Daun dalam kondisi kering'
                    : 'Cukup aman · Pantau cuaca'}
                </span>
              </div>
            </div>

            {/* Warm Pill Action Button */}
            <button type="button" className="phone-plus-bar" onClick={onTriggerAutoWater}>
              <span className="plus-symbol" aria-hidden="true">
                {isAutoWateringNow ? (
                  <Square size={12} fill="currentColor" strokeWidth={2} />
                ) : (
                  <Plus size={14} strokeWidth={2.6} />
                )}
              </span>
              <span>{isAutoWateringNow ? 'Stop Menyiram' : 'Siram Sekarang'}</span>
            </button>

            {/* White Card 1: Root Soil Status */}
            <div
              className="phone-white-card"
              onClick={() => setActiveTab('irigasi')}
              role="button"
              tabIndex={0}
            >
              <div className="pwc-top">
                <div className="pwc-icon is-mint" aria-hidden="true">
                  <Droplets size={17} strokeWidth={2.2} />
                </div>
                <div className="pwc-meta">
                  <strong>Kondisi Tanah</strong>
                  <span>{soilState.hint}</span>
                </div>
                <div className="pwc-value">
                  <span className={`soil-pill ${soilState.badge}`}>{soilState.label}</span>
                </div>
              </div>
              <div className="pwc-stats">
                <div>
                  <span>Air Tanah</span>
                  <strong>{soilPct}%</strong>
                </div>
                <div>
                  <span>Lama Basah</span>
                  <strong>{metrics.leafWetnessHours} jam</strong>
                </div>
                <div>
                  <span>Cepat Kering</span>
                  <strong>~{metrics.estimatedDryMinutes} mnt</strong>
                </div>
              </div>
            </div>

            {/* White Card 2: Canopy Air / Microclimate Status */}
            <div
              className="phone-white-card"
              onClick={() => setActiveTab('kamera')}
              role="button"
              tabIndex={0}
            >
              <div className="pwc-top">
                <div className="pwc-icon is-coral" aria-hidden="true">
                  <Thermometer size={17} strokeWidth={2.2} />
                </div>
                <div className="pwc-meta">
                  <strong>Udara Sekitar Daun</strong>
                  <span>{canopyStatus.summary}</span>
                </div>
                <div className="pwc-value">
                  <strong>{metrics.ambientTempC}°C</strong>
                  <span>{canopyStatus.tag}</span>
                </div>
              </div>
              <div className="pwc-stats">
                <div>
                  <span>Kelembaban</span>
                  <strong>{metrics.relativeHumidity}%</strong>
                </div>
                <div>
                  <span>Embun</span>
                  <strong>{canopyStatus.dewLabel}</strong>
                </div>
                <div>
                  <span>Pengeringan</span>
                  <strong>{canopyStatus.drySpeed}</strong>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'irigasi' && (
          <>
            <div className="phone-white-card">
              <div className="pwc-head-row">
                <strong>Kadar Air Tanah</strong>
                <span className={`soil-pill ${soilState.badge}`}>
                  {soilState.label} · {soilPct}%
                </span>
              </div>
              <div className="soil-bar-track">
                <div
                  className={`soil-bar-fill ${soilState.badge}`}
                  style={{ width: `${Math.min(100, Math.max(6, soilPct))}%` }}
                />
              </div>
              <p className="pwc-subtext">{soilState.hint}</p>
            </div>

            <div className="phone-white-card">
              <div className="pwc-head-row">
                <div>
                  <strong>Proteksi Embun Malam</strong>
                  <div className="pwc-subtext">
                    {metrics.autoGuardNight
                      ? 'Menahan penyiraman otomatis saat malam (16.00–05.30), hujan, atau berembun agar tidak kena patek.'
                      : 'Dimatikan — penyiraman tetap berjalan meski malam, hujan, atau berembun.'}
                  </div>
                </div>
                <button
                  type="button"
                  className={`modern-switch ${metrics.autoGuardNight ? 'is-on' : ''}`}
                  aria-pressed={metrics.autoGuardNight}
                  onClick={onToggleAutoGuard}
                >
                  <span className="switch-knob" />
                </button>
              </div>
            </div>

            <div className="phone-white-card">
              <div className="pwc-head-row">
                <strong>Saran Penyiraman</strong>
                <span
                  className={`cam-state-pill ${
                    isAutoWateringNow ? 'is-active' : isValveLocked ? 'is-alert' : ''
                  }`}
                >
                  {isAutoWateringNow ? 'MENYIRAM' : isValveLocked ? 'DITUNDA' : 'SIAP'}
                </span>
              </div>
              <p className="pwc-subtext">{getFarmerDecisionHint(metrics, weather, soilPct, simTime)}</p>
            </div>

            <button type="button" className="phone-dark-cta" onClick={onTriggerAutoWater}>
              {isAutoWateringNow ? 'Stop Menyiram' : 'Siram Sekarang'}
            </button>
          </>
        )}

        {activeTab === 'kamera' && (
          <>
            <div className={`phone-white-card ${isHighRisk ? 'is-danger-card' : ''}`}>
              <div className="pwc-head-row">
                <div>
                  <strong>Kamera Kebun</strong>
                  <div className="pwc-subtext">Memantau bercak patek di bagian atas daun</div>
                </div>
                <span className={`cam-state-pill ${isHighRisk ? 'is-alert' : 'is-standby'}`}>
                  {isHighRisk ? 'PERLU CEK' : 'AMAN'}
                </span>
              </div>
              <div className="pwc-stats">
                <div>
                  <span>Lampu</span>
                  <strong>{metrics.patekRiskPct >= 75 ? 'Nyala' : 'Mati'}</strong>
                </div>
                <div>
                  <span>Daun Basah</span>
                  <strong>{metrics.leafWetnessPct}%</strong>
                </div>
                <div>
                  <span>Bercak</span>
                  <strong>{Math.round(metrics.symptomSeverity * 100)}%</strong>
                </div>
              </div>
            </div>

            {[
              { title: 'Tanaman #1 · Kiri', cond: p1Cond },
              { title: 'Tanaman #2 · Kanan', cond: p2Cond },
            ].map((item) => {
              const meta = LEAF_CONDITION_META[item.cond];
              const farmerCopy = LEAF_FARMER_COPY[item.cond];
              return (
                <div key={item.title} className="phone-white-card">
                  <div className="pwc-top">
                    <div
                      className="cam-leaf-swatch"
                      style={{ backgroundColor: meta.leafHex }}
                      aria-hidden="true"
                    />
                    <div className="pwc-meta">
                      <strong>{item.title}</strong>
                      <span>{farmerCopy.label}</span>
                    </div>
                    <span className="cam-badge-dot" style={{ backgroundColor: meta.badgeColor }} />
                  </div>
                  <p className="pwc-subtext">{farmerCopy.summary}</p>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'log' && (
          <>
            <div className="phone-white-card">
              <div className="pwc-head-row">
                <strong>Catatan Kebun</strong>
                <span className="coral-pill">{logs.length} catatan</span>
              </div>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${habitScore}%` }} />
              </div>
              <div className="pwc-subtext">
                Skor Perawatan Kebun: <strong>{habitScore}/100</strong>
              </div>
            </div>

            <div className="phone-log-timeline">
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={`phone-white-card phone-log-card ${
                    entry.tag === 'NUDGE' || entry.tag === 'CAM' ? 'is-danger-card' : ''
                  }`}
                >
                  <div className="pwc-head-row">
                    <span className={`log-tag is-${entry.tag.toLowerCase()}`}>
                      {LOG_TAG_LABEL[entry.tag]}
                    </span>
                    <span className="pwc-subtext">
                      Hari {entry.day} · {entry.simTime}
                    </span>
                  </div>
                  <div className="log-card-title">{entry.title}</div>
                  <p className="wa-body-text">{entry.message}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Clean 4-Tab Charcoal Bottom Navigation */}
      <nav className="phone-dark-dock phone-dock-4" aria-label="Navigasi Aplikasi HP">
        <button
          type="button"
          className={`pdd-tab-btn ${activeTab === 'pantau' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pantau')}
        >
          <Home size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Pantau</span>
        </button>
        <button
          type="button"
          className={`pdd-tab-btn ${activeTab === 'irigasi' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('irigasi')}
        >
          <Droplet size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Irigasi</span>
        </button>
        <button
          type="button"
          className={`pdd-tab-btn ${activeTab === 'kamera' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('kamera')}
        >
          <Camera size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Kamera</span>
        </button>
        <button
          type="button"
          className={`pdd-tab-btn ${activeTab === 'log' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <FileText size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Log{isHighRisk || isRiskyTime ? ' •' : ''}</span>
        </button>
      </nav>
    </aside>
  );
};
