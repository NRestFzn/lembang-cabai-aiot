import React, { useEffect, useMemo, useState } from 'react';
import { CircuitPage } from './components/CircuitPage';
import { GardenViewport } from './components/GardenViewport';
import { PhysicalNodePage } from './components/PhysicalNodePage';
import { LEAF_CONDITION_META, PARTS_INFO } from './data/parts';
import {
  computeMicroclimate,
  formatSimTime,
  getDayPhaseLabel,
  getNightFactor,
  stepSimulation,
} from './simulation/riskEngine';
import {
  CameraPreset,
  NudgeBanner,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from './types/simulation';

const INITIAL_CLIMATE = computeMicroclimate(10.5, 'sunny');

const INITIAL_METRICS: SimulationMetrics = {
  timeHours: 10.5,
  dayCount: 1,
  ambientTempC: INITIAL_CLIMATE.tempC,
  relativeHumidity: INITIAL_CLIMATE.rh,
  vpdKpa: INITIAL_CLIMATE.vpdKpa,
  soilMoisturePct: 48,
  leafWetnessPct: 10,
  leafWetnessHours: 0.4,
  estimatedDryMinutes: 15,
  patekRiskPct: 18,
  symptomSeverity: 0,
  batteryPct: 86,
  isWatering: false,
  wateringRemainingSec: 0,
  aiotMode: true,
  lastDecision: 'IDLE',
  decisionReason: 'Kelembaban tanah masih cukup. Pemantauan mikroiklim kanopi aktif.',
  offlineBufferedCount: 12,
};

export type AppPage = 'diorama' | 'circuit' | 'unit';

const getInitialPage = (): AppPage => {
  if (typeof window !== 'undefined') {
    if (window.location.hash === '#rangkaian') return 'circuit';
    if (window.location.hash === '#alat') return 'unit';
  }
  return 'diorama';
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);
  const [isCircuitAnimating, setIsCircuitAnimating] = useState(false);
  const [metrics, setMetrics] = useState<SimulationMetrics>(INITIAL_METRICS);
  const [weather, setWeather] = useState<WeatherMode>('sunny');
  const [exploded, setExploded] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [selectedPart, setSelectedPart] = useState<PartId | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<SelectedLeafInfo | null>(null);
  const [nudge, setNudge] = useState<NudgeBanner | null>(null);

  // Physics & watering tick
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMetrics((prev) => {
        const dtRealSec = 0.25;
        const deltaSimHours = prev.isWatering ? 0.04 : 0.004;

        let nextWatering = prev.isWatering;
        let nextRem = prev.wateringRemainingSec;
        if (prev.isWatering) {
          nextRem = Math.max(0, prev.wateringRemainingSec - dtRealSec);
          if (nextRem <= 0) nextWatering = false;
        }

        return stepSimulation(
          { ...prev, isWatering: nextWatering, wateringRemainingSec: nextRem },
          deltaSimHours,
          weather
        );
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [weather]);

  // Day/Night Risograph theme variables
  const nightFactor = getNightFactor(metrics.timeHours);
  const isNight = nightFactor > 0.52;

  const themeVars = useMemo(() => {
    return {
      '--paper': isNight ? '#1b2234' : nightFactor > 0.15 ? '#ece2cf' : '#f2efe7',
      '--panel': isNight ? '#222b40' : '#fbf8f0',
      '--soft': isNight ? '#2c3650' : '#ebe6da',
      '--ink': isNight ? '#ece6da' : '#231e16',
      '--muted': isNight ? '#aeb8d2' : '#665f53',
      '--rule': isNight ? '#384463' : '#dcd4c4',
      '--stage-bg': isNight ? '#161c2c' : nightFactor > 0.15 ? '#e9dcc6' : '#f4f0e6',
      '--accent': '#6cc29f',
      '--accent-soft': '#d9efe5',
    } as React.CSSProperties;
  }, [isNight, nightFactor]);

  const handleWater = () => {
    const simTime = formatSimTime(metrics.timeHours);
    const h = metrics.timeHours;
    const isRiskyEvening = h >= 16.0 || h < 5.5 || weather === 'rainy';

    setMetrics((prev) => ({
      ...prev,
      isWatering: true,
      wateringRemainingSec: 5.5,
    }));

    if (isRiskyEvening) {
      setNudge({
        id: Date.now(),
        tone: 'warn',
        title: 'Peringatan Penyiraman Malam',
        detail: `Menyiram pukul ${simTime} membuat daun basah semalaman sehingga risiko patek meningkat.`,
      });
    } else {
      setNudge({
        id: Date.now(),
        tone: 'good',
        title: 'Penyiraman Aman',
        detail: `VPD ${metrics.vpdKpa} kPa cukup baik untuk mengeringkan daun sebelum malam.`,
      });
    }
  };

  const handleTimeChange = (targetHour: number) => {
    if (Math.abs(targetHour - metrics.timeHours) > 1.0) {
      setNudge(null);
    }
    const climate = computeMicroclimate(targetHour, weather);
    setMetrics((prev) => ({
      ...prev,
      timeHours: targetHour,
      ambientTempC: climate.tempC,
      relativeHumidity: climate.rh,
      vpdKpa: climate.vpdKpa,
    }));
  };

  const handleToggleDayNight = () => {
    handleTimeChange(isNight ? 11.5 : 21.5);
  };

  const handleCycleWeather = () => {
    const order: WeatherMode[] = ['sunny', 'foggy', 'rainy'];
    setWeather(order[(order.indexOf(weather) + 1) % order.length]);
  };

  const handleSelectPart = (part: PartId) => {
    setSelectedPart(part);
  };

  const handleSelectLeaf = (leaf: SelectedLeafInfo | null) => {
    setSelectedLeaf(leaf);
    if (!leaf && selectedPart === 'chili_plant') {
      setSelectedPart(null);
    }
  };

  const handleResetView = () => {
    setCameraPreset('iso');
    setResetTrigger((n) => n + 1);
  };

  const handleSwitchPage = (page: AppPage) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      const nextHash = page === 'circuit' ? '#rangkaian' : page === 'unit' ? '#alat' : '#diorama';
      window.history.replaceState(null, '', nextHash);
    }
  };

  const leafMeta = selectedLeaf ? LEAF_CONDITION_META[selectedLeaf.condition] : null;
  const partMeta = !selectedLeaf && selectedPart ? PARTS_INFO[selectedPart] : null;
  const dayPhase = getDayPhaseLabel(metrics.timeHours);
  const weatherLabel = weather === 'sunny' ? 'Cerah' : weather === 'foggy' ? 'Kabut' : 'Hujan';

  const hideTopChrome = activePage === 'circuit' && isCircuitAnimating;

  return (
    <div style={themeVars} className="theme-root" data-night={isNight ? 'true' : 'false'}>
      <div className="paper-grain" />

      <main className="full-stage">
        {!hideTopChrome && (
          <>
            {/* Minimal Top-Left Header */}
            <header className="top-brand">
              <h1 className="brand-title">Lembang Cabai · AIoT Node</h1>
              <div className="brand-sub">
                <span>{formatSimTime(metrics.timeHours)}</span>
                <span className="phase-dot">{dayPhase}</span>
                <span>{weatherLabel}</span>
              </div>
            </header>

            {/* Top-Center Page Switcher */}
            <nav className="page-switch" aria-label="Navigasi Halaman">
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'diorama' ? 'is-active' : ''}`}
                onClick={() => {
                  setIsCircuitAnimating(false);
                  handleSwitchPage('diorama');
                }}
              >
                Diorama 3D
              </button>
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'circuit' ? 'is-active' : ''}`}
                onClick={() => handleSwitchPage('circuit')}
              >
                Rangkaian Prototype
              </button>
              <button
                type="button"
                className={`page-switch-btn ${activePage === 'unit' ? 'is-active' : ''}`}
                onClick={() => {
                  setIsCircuitAnimating(false);
                  handleSwitchPage('unit');
                }}
              >
                Alat Asli
              </button>
            </nav>

            {/* Minimal Top-Right Telemetry */}
            <div className="top-stats">
              <div className="stat-item">
                <div className="stat-label">Tanah</div>
                <div className="stat-value">{Math.round(metrics.soilMoisturePct)}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Daun Basah</div>
                <div className="stat-value">{metrics.leafWetnessPct}%</div>
              </div>
              <div className="stat-item">
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
        )}

        {activePage === 'circuit' ? (
          <CircuitPage metrics={metrics} onAnimationChange={setIsCircuitAnimating} />
        ) : activePage === 'unit' ? (
          <PhysicalNodePage metrics={metrics} />
        ) : (
          <>
            {/* Fullscreen 3D Scene */}
            <GardenViewport
              metrics={metrics}
              weather={weather}
              accent="mint"
              exploded={exploded}
              showFov={selectedPart === 'esp32cam'}
              showLabels={showLabels}
              showHighlights={showHighlights}
              cameraPreset={cameraPreset}
              resetTrigger={resetTrigger}
              selectedPart={selectedPart}
              selectedLeaf={selectedLeaf}
              onSelectPart={handleSelectPart}
              onSelectLeaf={handleSelectLeaf}
              wobbleAmount={1}
            />

        {/* Right-Side Modal: Leaf Diagnosis OR Clicked Sensor/Part Info */}
        {selectedLeaf && leafMeta && (
          <aside className="info-modal" role="dialog" aria-label="Informasi Daun Cabai">
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">
                  Pohon #{selectedLeaf.plantIndex + 1} · {selectedLeaf.terrace} ·{' '}
                  {selectedLeaf.plantIndex < 2 ? 'Pantauan CAM' : 'Sampel Non-CAM'}
                </div>
                <h2 className="modal-title">Kondisi Daun #{selectedLeaf.leafIndex + 1}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Tutup modal"
                onClick={() => {
                  setSelectedLeaf(null);
                  setSelectedPart(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="condition-pill" style={{ backgroundColor: leafMeta.badgeColor }}>
              <span className="swatch-circle" style={{ backgroundColor: selectedLeaf.colorHex }} />
              <span>{leafMeta.label}</span>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Kenapa daunnya begini?</span>
              {leafMeta.cause}
            </div>

            <div className="modal-mini-grid">
              <div className="mini-cell">
                <span>VPD Kanopi</span>
                <strong>{metrics.vpdKpa} kPa</strong>
              </div>
              <div className="mini-cell">
                <span>ESP32-CAM</span>
                <strong>
                  {selectedLeaf.plantIndex >= 2
                    ? 'Di Luar FOV CAM'
                    : selectedLeaf.condition === 'patek_early' || selectedLeaf.condition === 'yellowing'
                    ? 'Anomali Visual'
                    : selectedLeaf.condition === 'wet_risk'
                    ? 'Daun Berembun'
                    : 'Normal'}
                </strong>
              </div>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Tindakan AIoT</span>
              {leafMeta.aiotAction}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="dock-btn is-active"
                onClick={() => {
                  setSelectedLeaf(null);
                  setSelectedPart(null);
                }}
              >
                Tutup
              </button>
            </div>
          </aside>
        )}

        {partMeta && (
          <aside className="info-modal" role="dialog" aria-label="Informasi Komponen">
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">Komponen {partMeta.code}</div>
                <h2 className="modal-title">{partMeta.name}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Tutup modal"
                onClick={() => setSelectedPart(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Fungsi Alat</span>
              {partMeta.role}
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Lokasi Penempatan</span>
              {partMeta.placement}
            </div>

            <div className="modal-block">
              <span className="modal-block-label">Alasan Penempatan</span>
              {partMeta.whyHere}
            </div>

            <div className="modal-footer">
              <button type="button" className="dock-btn is-active" onClick={() => setSelectedPart(null)}>
                Tutup
              </button>
            </div>
          </aside>
        )}

        {/* Simple Bottom Control Dock */}
        <nav className="bottom-dock" aria-label="Kontrol Simulasi">
          <button type="button" className="dock-btn is-primary" onClick={handleWater}>
            {metrics.isWatering ? 'Menyiram...' : 'Siram Cabai'}
          </button>

          <div className="dock-divider" />

          <div className="time-control">
            <span className="time-text">{formatSimTime(metrics.timeHours)}</span>
            <input
              type="range"
              className="time-slider"
              aria-label="Waktu Siang dan Malam"
              min={0}
              max={23.9}
              step={0.2}
              value={metrics.timeHours}
              onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
            />
            <button
              type="button"
              className={`dock-btn ${isNight ? 'is-active' : ''}`}
              onClick={handleToggleDayNight}
            >
              {isNight ? 'Mode Siang' : 'Mode Malam'}
            </button>
          </div>

          <div className="dock-divider" />

          <button type="button" className="dock-btn" onClick={handleCycleWeather}>
            {weatherLabel}
          </button>
          <button
            type="button"
            className={`dock-btn ${exploded ? 'is-active' : ''}`}
            onClick={() => setExploded((v) => !v)}
          >
            Buka Node
          </button>
          <button
            type="button"
            className={`dock-btn ${showHighlights ? 'is-active' : ''}`}
            onClick={() => setShowHighlights((v) => !v)}
          >
            Highlight
          </button>
          <button
            type="button"
            className={`dock-btn ${showLabels ? 'is-active' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
          >
            Label
          </button>
          <button type="button" className="dock-btn" onClick={handleResetView}>
            Reset Kamera
          </button>
        </nav>
          </>
        )}

        {/* Watering / Behavior Nudge Toast */}
        {nudge && (
          <div className={`nudge-toast tone-${nudge.tone}`}>
            <div>
              <div className="nudge-title">{nudge.title}</div>
              <div className="nudge-detail">{nudge.detail}</div>
            </div>
            <button type="button" className="close-btn" onClick={() => setNudge(null)}>
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
