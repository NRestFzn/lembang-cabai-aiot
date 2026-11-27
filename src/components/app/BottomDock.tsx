import React from 'react';
import { formatSimTime } from '../../simulation/riskEngine';
import { SimulationMetrics } from '../../types/simulation';

interface BottomDockProps {
  metrics: SimulationMetrics;
  weatherLabel: string;
  exploded: boolean;
  showLabels: boolean;
  showHighlights: boolean;
  isPhoneHudVisible: boolean;
  onAutoWater: () => void;
  onManualWater: () => void;
  onTimeChange: (targetHour: number) => void;
  onSkipDay: () => void;
  onResetDay: () => void;
  onCycleWeather: () => void;
  onToggleExploded: () => void;
  onToggleHighlights: () => void;
  onToggleLabels: () => void;
  onTogglePhoneHud: () => void;
  onResetView: () => void;
}

/** Bottom control dock: watering, time scrubber, weather, view toggles. */
export const BottomDock: React.FC<BottomDockProps> = ({
  metrics,
  weatherLabel,
  exploded,
  showLabels,
  showHighlights,
  isPhoneHudVisible,
  onAutoWater,
  onManualWater,
  onTimeChange,
  onSkipDay,
  onResetDay,
  onCycleWeather,
  onToggleExploded,
  onToggleHighlights,
  onToggleLabels,
  onTogglePhoneHud,
  onResetView,
}) => {
  return (
    <>
      {/* Simple Bottom Control Dock */}
      <nav className="bottom-dock" aria-label="Kontrol Simulasi">
    <button
      type="button"
      className={`dock-btn is-primary ${metrics.isWatering && metrics.aiotMode ? 'is-active' : ''}`}
      onClick={onAutoWater}
      title="Jalankan irigasi otomatis lewat pipa AIoT (dikontrol via HP)"
    >
      {metrics.isWatering && metrics.aiotMode ? 'Matikan Otomatis' : 'Siram Otomatis'}
    </button>
    <button
      type="button"
      className={`dock-btn ${metrics.isWatering && !metrics.aiotMode ? 'is-active' : ''}`}
      onClick={onManualWater}
      title="Siram manual pakai gembor ke atas kanopi Teras Atas"
    >
      {metrics.isWatering && !metrics.aiotMode ? 'Gembor Aktif...' : 'Siram Manual'}
    </button>

    <div className="h-6 w-px bg-rule max-[780px]:hidden" />

    <div className="flex items-center gap-2 px-1">
      <span className="min-w-[72px] font-mono text-[13px] font-bold whitespace-nowrap">
        H{metrics.dayCount} · {formatSimTime(metrics.timeHours)}
      </span>
      <input
        type="range"
        className="w-[120px] cursor-pointer accent-ink"
        aria-label="Waktu Siang dan Malam"
        min={0}
        max={24}
        step={0.2}
        value={metrics.timeHours}
        onChange={(e) => onTimeChange(parseFloat(e.target.value))}
      />
      <button
        type="button"
        className="dock-btn"
        onClick={onSkipDay}
        title="Percepat simulasi maju 24 jam penuh"
      >
        +1 Hari
      </button>
      <button
        type="button"
        className="dock-btn"
        onClick={onResetDay}
        title="Reset simulasi kembali ke Hari ke-1"
      >
        Reset Hari
      </button>
    </div>

    <div className="h-6 w-px bg-rule max-[780px]:hidden" />

    <button type="button" className="dock-btn" onClick={onCycleWeather}>
      {weatherLabel}
    </button>
    <button
      type="button"
      className={`dock-btn ${exploded ? 'is-active' : ''}`}
      onClick={onToggleExploded}
    >
      Buka Node
    </button>
    <button
      type="button"
      className={`dock-btn ${showHighlights ? 'is-active' : ''}`}
      onClick={onToggleHighlights}
    >
      Highlight
    </button>
    <button
      type="button"
      className={`dock-btn ${showLabels ? 'is-active' : ''}`}
      onClick={onToggleLabels}
    >
      Label
    </button>
    <button
      type="button"
      className={`dock-btn ${isPhoneHudVisible ? 'is-active' : ''}`}
      onClick={onTogglePhoneHud}
      title="Tampilkan / sembunyikan layar aplikasi HP AIoT di pojok kanan"
    >
      Pantau HP
    </button>
    <button type="button" className="dock-btn" onClick={onResetView}>
      Reset Kamera
    </button>
  </nav>
    </>
  );
};
