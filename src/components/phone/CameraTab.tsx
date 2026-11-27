import React from 'react';
import { LEAF_CONDITION_META } from '../../data/parts';
import { LEAF_FARMER_COPY } from '../../simulation/phoneHudHelpers';
import { LeafCondition, SimulationMetrics } from '../../types/simulation';

export interface CameraTabProps {
  metrics: SimulationMetrics;
  isHighRisk: boolean;
  p1Cond: LeafCondition;
  p2Cond: LeafCondition;
}

/** 'Kamera' tab: camera status card + per-plant leaf condition cards. */
export const CameraTab: React.FC<CameraTabProps> = ({ metrics, isHighRisk, p1Cond, p2Cond }) => {
  return (
    <>
  <div className={`phone-white-card ${isHighRisk ? 'is-danger-card' : ''}`}>
    <div className="flex items-center justify-between gap-2 text-xs">
      <div>
        <strong>Kamera Kebun</strong>
        <div className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">Memantau bercak patek di bagian atas daun</div>
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
        <div className="flex items-center gap-[9px]">
          <div
            className="cam-leaf-swatch"
            style={{ backgroundColor: meta.leafHex }}
            aria-hidden="true"
          />
          <div className="pwc-meta">
            <strong>{item.title}</strong>
            <span>{farmerCopy.label}</span>
          </div>
          <span className="size-[9px] shrink-0 rounded-full" style={{ backgroundColor: meta.badgeColor }} />
        </div>
        <p className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">{farmerCopy.summary}</p>
      </div>
    );
  })}
    </>
  );
};
