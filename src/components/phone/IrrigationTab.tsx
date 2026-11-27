import React from 'react';
import { getFarmerDecisionHint, getSoilState } from '../../simulation/phoneHudHelpers';
import { SimulationMetrics, WeatherMode } from '../../types/simulation';

export interface IrrigationTabProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  soilPct: number;
  soilState: ReturnType<typeof getSoilState>;
  isAutoWateringNow: boolean;
  isValveLocked: boolean;
  simTime: string;
  onTriggerAutoWater: () => void;
  onToggleAutoGuard: () => void;
}

/** 'Irigasi' tab: soil bar, dew-guard switch, watering advice, water CTA. */
export const IrrigationTab: React.FC<IrrigationTabProps> = ({
  metrics,
  weather,
  soilPct,
  soilState,
  isAutoWateringNow,
  isValveLocked,
  simTime,
  onTriggerAutoWater,
  onToggleAutoGuard,
}) => {
  return (
    <>
  <div className="phone-white-card">
    <div className="flex items-center justify-between gap-2 text-xs">
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
    <p className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">{soilState.hint}</p>
  </div>

  <div className="phone-white-card">
    <div className="flex items-center justify-between gap-2 text-xs">
      <div>
        <strong>Proteksi Embun Malam</strong>
        <div className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">
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
    <div className="flex items-center justify-between gap-2 text-xs">
      <strong>Saran Penyiraman</strong>
      <span
        className={`cam-state-pill ${
          isAutoWateringNow ? 'is-active' : isValveLocked ? 'is-alert' : ''
        }`}
      >
        {isAutoWateringNow ? 'MENYIRAM' : isValveLocked ? 'DITUNDA' : 'SIAP'}
      </span>
    </div>
    <p className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">{getFarmerDecisionHint(metrics, weather, soilPct, simTime)}</p>
  </div>

  <button type="button" className="w-full cursor-pointer rounded-[14px] border-0 bg-[#1e2022] px-3.5 py-2.5 text-xs font-bold text-white" onClick={onTriggerAutoWater}>
    {isAutoWateringNow ? 'Stop Menyiram' : 'Siram Sekarang'}
  </button>
    </>
  );
};
