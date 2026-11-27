import React, { useState } from 'react';
import { CircuitPage } from './components/CircuitPage';
import { GardenViewport } from './components/GardenViewport';
import { PhoneMonitorHud } from './components/PhoneMonitorHud';
import { PhysicalNodePage } from './components/PhysicalNodePage';
import { AppHeader } from './components/app/AppHeader';
import { BottomDock } from './components/app/BottomDock';
import { LeafModal, PartModal } from './components/app/InfoModals';
import { NudgeBanner } from './components/app/NudgeBanner';
import { LEAF_CONDITION_META, PARTS_INFO } from './data/parts';
import { useSimulation } from './hooks/useSimulation';
import {
  CameraPreset,
  PartId,
  SelectedLeafInfo,
} from './types/simulation';

export type AppPage = 'diorama' | 'circuit' | 'unit';

const getInitialPage = (): AppPage => {
  if (typeof window !== 'undefined') {
    if (window.location.hash === '#rangkaian') return 'circuit';
    if (window.location.hash === '#alat') return 'unit';
  }
  return 'diorama';
};

export const App: React.FC = () => {
  const sim = useSimulation();
  const { metrics, weather, logs, nudge, setNudge, themeVars, isNight, dayPhase, weatherLabel } = sim;

  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);
  const [isCircuitAnimating, setIsCircuitAnimating] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showPhoneHud, setShowPhoneHud] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [selectedPart, setSelectedPart] = useState<PartId | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<SelectedLeafInfo | null>(null);

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
    if (page !== 'circuit') setIsCircuitAnimating(false);
    setActivePage(page);
    if (typeof window !== 'undefined') {
      const nextHash = page === 'circuit' ? '#rangkaian' : page === 'unit' ? '#alat' : '#diorama';
      window.history.replaceState(null, '', nextHash);
    }
  };

  const leafMeta = selectedLeaf ? LEAF_CONDITION_META[selectedLeaf.condition] : null;
  const partMeta = !selectedLeaf && selectedPart ? PARTS_INFO[selectedPart] : null;

  const handleTogglePhoneHud = () => {
    if (selectedLeaf || partMeta) {
      setSelectedLeaf(null);
      setSelectedPart(null);
      setShowPhoneHud(true);
    } else {
      setShowPhoneHud((v) => !v);
    }
  };

  const hideTopChrome = activePage === 'circuit' && isCircuitAnimating;

  return (
    <div style={themeVars} className="theme-root" data-night={isNight ? 'true' : 'false'}>
      <div className="paper-grain" />

      <main className="relative h-full w-full">
        {!hideTopChrome && (
          <AppHeader
            metrics={metrics}
            dayPhase={dayPhase}
            weatherLabel={weatherLabel}
            activePage={activePage}
            onSwitchPage={handleSwitchPage}
          />
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

            {/* Smartphone Companion App HUD (pantauan tanah & tombol Siram Otomatis lewat HP) */}
            {showPhoneHud && !selectedLeaf && !partMeta && (
              <PhoneMonitorHud
                metrics={metrics}
                weather={weather}
                logs={logs}
                onTriggerAutoWater={sim.handleAutoWater}
                onToggleAutoGuard={sim.handleToggleAutoGuard}
                onMinimize={() => setShowPhoneHud(false)}
              />
            )}

            {/* Right-Side Modal: Leaf Diagnosis OR Clicked Sensor/Part Info */}
            {selectedLeaf && leafMeta && (
              <LeafModal
                leaf={selectedLeaf}
                leafMeta={leafMeta}
                metrics={metrics}
                onClose={() => {
                  setSelectedLeaf(null);
                  setSelectedPart(null);
                }}
              />
            )}

            {partMeta && (
              <PartModal partMeta={partMeta} onClose={() => setSelectedPart(null)} />
            )}

            {/* Simple Bottom Control Dock */}
            <BottomDock
              metrics={metrics}
              weatherLabel={weatherLabel}
              exploded={exploded}
              showLabels={showLabels}
              showHighlights={showHighlights}
              isPhoneHudVisible={showPhoneHud && !selectedLeaf && !partMeta}
              onAutoWater={sim.handleAutoWater}
              onManualWater={sim.handleManualWater}
              onTimeChange={sim.handleTimeChange}
              onSkipDay={sim.handleSkipDay}
              onResetDay={sim.handleResetDay}
              onCycleWeather={sim.handleCycleWeather}
              onToggleExploded={() => setExploded((v) => !v)}
              onToggleHighlights={() => setShowHighlights((v) => !v)}
              onToggleLabels={() => setShowLabels((v) => !v)}
              onTogglePhoneHud={handleTogglePhoneHud}
              onResetView={handleResetView}
            />
          </>
        )}

        {/* Watering / Behavior Nudge Toast */}
        {nudge && <NudgeBanner nudge={nudge} onDismiss={() => setNudge(null)} />}
      </main>
    </div>
  );
};

export default App;
