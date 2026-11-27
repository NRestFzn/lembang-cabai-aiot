import React, { useState } from 'react';
import { Bell, Camera, Droplet, FileText, Home, Minus } from 'lucide-react';
import { evaluateCanopyLeafCondition, formatSimTime } from '../simulation/riskEngine';
import {
  ARC_SEGMENTS,
  PhoneTab,
  getCanopyStatus,
  getSoilState,
} from '../simulation/phoneHudHelpers';
import { SerialLogEntry, SimulationMetrics, WeatherMode } from '../types/simulation';
import { CameraTab } from './phone/CameraTab';
import { IrrigationTab } from './phone/IrrigationTab';
import { LogTab } from './phone/LogTab';
import { MonitorTab } from './phone/MonitorTab';

interface PhoneMonitorHudProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  logs: SerialLogEntry[];
  onTriggerAutoWater: () => void;
  onToggleAutoGuard: () => void;
  onMinimize: () => void;
}

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
      <div className="flex items-center justify-between px-4 pb-1 pt-2 text-[10px] font-bold text-[#3f3d39]">
        <span className="phone-clock">{simTime}</span>
        <span className="phone-island" aria-hidden="true" />
        <span className="phone-net">
          {weatherLabel} · {metrics.batteryPct}%
        </span>
      </div>

      {/* Modern Header */}
      <div className="flex items-center justify-between px-3.5 pb-2 pt-1.5">
        <div className="phone-icon-squircle" title="Kebun Terhubung">
          <span className="mode-dot is-auto" />
        </div>
        <div className="text-center">
          <div className="text-[13.5px] font-bold leading-[1.15] text-[#1e2022]">{screenTitle}</div>
          <div className="text-[10px] font-semibold text-[#8a847b]">Hari ke-{metrics.dayCount} · Lahan Atas</div>
        </div>
        <div className="flex items-center gap-[5px]">
          <button
            type="button"
            className="phone-icon-squircle"
            title="Lihat Catatan & Peringatan"
            onClick={() => setActiveTab('log')}
          >
            <Bell size={14} strokeWidth={2.2} aria-hidden="true" />
            {(isHighRisk || isRiskyTime) && <span className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-[#ef5b3c]" />}
          </button>
          <button
            type="button"
            className="h-[30px] w-6 cursor-pointer rounded-[10px] border-0 bg-[#efece6] font-bold text-[#6b665e]"
            title="Tutup Layar HP"
            aria-label="Tutup Layar HP"
            onClick={onMinimize}
          >
            <Minus size={14} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrollable Screen Body */}
      <div className="flex flex-1 flex-col gap-[9px] overflow-y-auto px-[13px] pb-3 pt-[2px]">
        {activeTab === 'pantau' && (
          <MonitorTab
            metrics={metrics}
            soilPct={soilPct}
            soilState={soilState}
            canopyStatus={canopyStatus}
            isAutoWateringNow={isAutoWateringNow}
            isValveLocked={isValveLocked}
            isHighRisk={isHighRisk}
            filledSegments={filledSegments}
            arcFillColor={arcFillColor}
            onTriggerAutoWater={onTriggerAutoWater}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'irigasi' && (
          <IrrigationTab
            metrics={metrics}
            weather={weather}
            soilPct={soilPct}
            soilState={soilState}
            isAutoWateringNow={isAutoWateringNow}
            isValveLocked={isValveLocked}
            simTime={simTime}
            onTriggerAutoWater={onTriggerAutoWater}
            onToggleAutoGuard={onToggleAutoGuard}
          />
        )}

        {activeTab === 'kamera' && (
          <CameraTab metrics={metrics} isHighRisk={isHighRisk} p1Cond={p1Cond} p2Cond={p2Cond} />
        )}

        {activeTab === 'log' && <LogTab logs={logs} habitScore={habitScore} />}
      </div>

      {/* Clean 4-Tab Charcoal Bottom Navigation */}
      <nav className="grid grid-cols-4 gap-[2px] rounded-t-[18px] bg-[#1e2022] px-2 pb-[9px] pt-[7px]" aria-label="Navigasi Aplikasi HP">
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
