import React from 'react';
import { useGardenScene } from './garden/useGardenScene';
import {
  AccentId,
  CameraPreset,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../types/simulation';

interface GardenViewportProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  accent: AccentId;
  exploded: boolean;
  showFov: boolean;
  showLabels: boolean;
  showHighlights: boolean;
  cameraPreset: CameraPreset;
  resetTrigger: number;
  selectedPart: PartId | null;
  selectedLeaf: SelectedLeafInfo | null;
  onSelectPart: (part: PartId) => void;
  onSelectLeaf: (leaf: SelectedLeafInfo | null) => void;
  wobbleAmount: number;
}

export const GardenViewport: React.FC<GardenViewportProps> = ({
  metrics,
  weather,
  accent,
  exploded,
  showFov,
  showLabels,
  showHighlights,
  cameraPreset,
  resetTrigger,
  selectedPart,
  selectedLeaf,
  onSelectPart,
  onSelectLeaf,
  wobbleAmount,
}) => {
  const { containerRef, labels, hotspots } = useGardenScene({
    metrics,
    weather,
    accent,
    exploded,
    showFov,
    showLabels,
    showHighlights,
    cameraPreset,
    resetTrigger,
    selectedPart,
    selectedLeaf,
    onSelectPart,
    onSelectLeaf,
  });

  return (
    <div className="viewport-shell" ref={containerRef}>
      {/* Optional subtle SVG hand-drawn wobble filter on stage borders */}
      <svg className="svg-defs" aria-hidden="true">
        <defs>
          <filter id="risowobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={wobbleAmount} />
          </filter>
        </defs>
      </svg>

      {showHighlights && (
        <div className="hotspots-layer">
          {hotspots.map((hs) => {
            if (!hs.visible) return null;
            const isSelected =
              hs.kind === 'leaf'
                ? selectedLeaf?.plantIndex === hs.leaf?.plantIndex
                : !selectedLeaf && selectedPart === hs.partId;
            return (
              <button
                key={hs.key}
                type="button"
                title={hs.title}
                aria-label={hs.title}
                className={`hotspot-ring ${hs.kind === 'leaf' ? 'is-leaf' : 'is-part'} ${
                  isSelected ? 'is-selected' : ''
                }`}
                style={{ left: `${hs.x}px`, top: `${hs.y}px` }}
                onClick={() => {
                  onSelectPart(hs.partId);
                  onSelectLeaf(hs.leaf ?? null);
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" style={{ backgroundColor: hs.ringColor }} />
              </button>
            );
          })}
        </div>
      )}

      {showLabels && (
        <div className="labels-layer" style={{ filter: wobbleAmount > 0 ? 'url(#risowobble)' : undefined }}>
          {labels.map(
            (lb) =>
              lb.visible && (
                <button
                  key={lb.id}
                  type="button"
                  className={`pin-label ${selectedPart === lb.id ? 'is-selected' : ''}`}
                  style={{ left: `${lb.x}px`, top: `${lb.y}px` }}
                  onClick={() => onSelectPart(lb.id)}
                >
                  <span className="text-[10px] opacity-65">{lb.code}</span>
                  <span>{lb.label}</span>
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
};
