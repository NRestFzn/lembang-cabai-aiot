import React from 'react';
import { formatSimTime } from '../../simulation/riskEngine';
import { AppPage } from '../../App';
import { SimulationMetrics } from '../../types/simulation';

interface AppHeaderProps {
  metrics: SimulationMetrics;
  dayPhase: string;
  weatherLabel: string;
  activePage: AppPage;
  onSwitchPage: (page: AppPage) => void;
}

/** Top-left brand header, page switcher, and top-right telemetry strip. */
export const AppHeader: React.FC<AppHeaderProps> = ({
  metrics,
  dayPhase,
  weatherLabel,
  activePage,
  onSwitchPage,
}) => {
  return (
    <>
      {/* Minimal Top-Left Header */}
      <header className="top-brand">
        <h1 className="m-0 text-base font-bold tracking-[-0.01em]">Lembang Cabai · AIoT Node</h1>
        <div className="mt-[2px] flex items-center gap-2 text-[12.5px] text-muted">
          <span className="inline-block rounded-full border border-ink bg-panel px-2 py-[1px] font-mono text-[11px] font-bold text-ink">Hari {metrics.dayCount}</span>
          <span>{formatSimTime(metrics.timeHours)}</span>
          <span className="inline-block rounded-full border border-ink bg-accent-soft px-2 py-[1px] font-mono text-[11px] font-bold text-[#1f1a14]">{dayPhase}</span>
          <span>{weatherLabel}</span>
          <span className="inline-block rounded-full border border-rule bg-soft px-[7px] py-[1px] font-mono text-[10.5px] font-bold text-ink" title="MicroSD Offline-First Buffer">
            SD {metrics.offlineBufferedCount} log
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 border-t border-dashed border-rule pt-1.5 text-[11.5px]">
          <span className={`decision-tag is-${metrics.lastDecision.toLowerCase()}`}>
            {metrics.aiotMode ? `AIoT: ${metrics.lastDecision}` : 'MODE MANUAL'}
          </span>
          <span className="font-medium text-muted">
            {metrics.aiotMode
              ? metrics.lastDecision === 'TUNDA'
                ? 'Katup ditahan · Nudge Siram'
                : metrics.lastDecision === 'KURANGI'
                ? 'Volume 50% · VPD rendah'
                : metrics.lastDecision === 'SIRAM'
                ? 'Siap siram otomatis'
                : 'Pantau kanopi aktif'
              : 'Mode Manual (Gembor)'}
          </span>
        </div>
      </header>

      {/* Top-Center Page Switcher */}
      <nav className="page-switch" aria-label="Navigasi Halaman">
        <button
          type="button"
          className={`page-switch-btn ${activePage === 'diorama' ? 'is-active' : ''}`}
          onClick={() => onSwitchPage('diorama')}
        >
          Diorama 3D
        </button>
        <button
          type="button"
          className={`page-switch-btn ${activePage === 'circuit' ? 'is-active' : ''}`}
          onClick={() => onSwitchPage('circuit')}
        >
          Rangkaian Prototype
        </button>
        <button
          type="button"
          className={`page-switch-btn ${activePage === 'unit' ? 'is-active' : ''}`}
          onClick={() => onSwitchPage('unit')}
        >
          Purwarupa Alat
        </button>
      </nav>

      {/* Minimal Top-Right Telemetry */}
      <div className="top-stats">
        <div className="text-right">
          <div className="stat-label">VPD</div>
          <div className="stat-value">{metrics.vpdKpa}</div>
        </div>
        <div className="text-right">
          <div className="stat-label">ΔTd Embun</div>
          <div className={`stat-value ${metrics.dewPointDepressionC <= 2.0 ? 'is-danger' : ''}`}>
            {metrics.dewPointDepressionC}°C
          </div>
        </div>
        <div className="text-right">
          <div className="stat-label">Tanah</div>
          <div className="stat-value">{Math.round(metrics.soilMoisturePct)}%</div>
        </div>
        <div className="text-right">
          <div className="stat-label">Daun Basah</div>
          <div className="stat-value">{metrics.leafWetnessPct}%</div>
        </div>
        <div className="text-right">
          <div className="stat-label">Risiko Patek</div>
          <div
            className={`stat-value ${
              metrics.patekRiskPct >= 65 ? 'is-danger' : metrics.patekRiskPct <= 30 ? 'is-ok' : ''
            }`}
          >
            {metrics.patekRiskPct}%
          </div>
        </div>
      </div>
    </>
  );
};
