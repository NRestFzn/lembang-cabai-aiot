import React from 'react';
import { SimulationMetrics } from '../types/simulation';
// Part data lives in one place (src/data/espParts.ts): this file used to
// duplicate the 11 board-level entries verbatim. Re-exported here so
// existing importers keep working.
import { ESP32_PARTS } from '../data/espParts';
import type { EspPartDetail, EspPartKey } from '../data/espParts';
import { BoardComponents } from './esp/BoardComponents';
import { Breadboard } from './esp/Breadboard';
import { CalloutLabels } from './esp/CalloutLabels';
import { HeaderPins } from './esp/HeaderPins';
import { PcbBoard } from './esp/PcbBoard';
import { WorkbenchMat } from './esp/WorkbenchMat';

export { ESP32_PARTS };
export type { EspPartDetail, EspPartKey };

interface Esp32BenchSvgProps {
  metrics: SimulationMetrics;
  exploded: boolean;
  showLabels: boolean;
  usbPlugged: boolean;
  selectedPart: EspPartKey | null;
  onSelectPart: (key: EspPartKey) => void;
  isNight: boolean;
}

export const Esp32BenchSvg: React.FC<Esp32BenchSvgProps> = ({
  metrics,
  exploded,
  showLabels,
  usbPlugged,
  selectedPart,
  onSelectPart,
  isNight,
}) => {
  return (
    <svg
      className="h-full w-full max-h-full max-w-[960px] overflow-visible"
      viewBox="0 0 920 600"
      role="img"
      aria-label="Ilustrasi Isometrik ESP32-WROOM-32 DevKit"
    >
      <defs>
        <filter id="esp-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#231e16" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* 1. WORKBENCH MAT */}
      <WorkbenchMat isNight={isNight} />

      {/* 2. WHITE SOLDERLESS BREADBOARD */}
      <Breadboard />

      {/* 3. HEADER PINS H1 (left, x = -0.76) & H2 (right, x = +0.76) inserted into breadboard */}
      <HeaderPins onSelectPart={onSelectPart} />

      {/* 4. ESP32-WROOM-32 MATTE BLACK PCB */}
      <PcbBoard onSelectPart={onSelectPart} />

      {/* 5. SURFACE-MOUNT COMPONENTS (Explode vertically along Z with drop guides) */}
      <BoardComponents
        metrics={metrics}
        exploded={exploded}
        usbPlugged={usbPlugged}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
      />

      {/* 6. CREAM CALLOUT PILLS & LEADER LINES */}
      {showLabels && (
        <CalloutLabels
          exploded={exploded}
          selectedPart={selectedPart}
          onSelectPart={onSelectPart}
        />
      )}
    </svg>
  );
};
