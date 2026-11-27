import React from 'react';
import { Plus, Square, Droplets, Thermometer, Zap } from 'lucide-react';
import { ARC_SEGMENTS, PhoneTab, getCanopyStatus, getSoilState } from '../../simulation/phoneHudHelpers';
import { SimulationMetrics } from '../../types/simulation';

export interface MonitorTabProps {
  metrics: SimulationMetrics;
  soilPct: number;
  soilState: ReturnType<typeof getSoilState>;
  canopyStatus: ReturnType<typeof getCanopyStatus>;
  isAutoWateringNow: boolean;
  isValveLocked: boolean;
  isHighRisk: boolean;
  filledSegments: number;
  arcFillColor: string;
  onTriggerAutoWater: () => void;
  onSelectTab: (tab: PhoneTab) => void;
}

/** 'Pantau' tab: risk gauge, quick water button, soil + canopy cards. */
export const MonitorTab: React.FC<MonitorTabProps> = ({
  metrics,
  soilPct,
  soilState,
  canopyStatus,
  isAutoWateringNow,
  isValveLocked,
  isHighRisk,
  filledSegments,
  arcFillColor,
  onTriggerAutoWater,
  onSelectTab,
}) => {
  return (
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
    <span className="inline-flex items-center justify-center text-[#f58b54]" aria-hidden="true">
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
    onClick={() => onSelectTab('irigasi')}
    role="button"
    tabIndex={0}
  >
    <div className="flex items-center gap-[9px]">
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
    onClick={() => onSelectTab('kamera')}
    role="button"
    tabIndex={0}
  >
    <div className="flex items-center gap-[9px]">
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
  );
};
