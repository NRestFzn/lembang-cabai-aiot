import React from 'react';
import {
  CinematicCaption,
  CircuitHotspots,
  CircuitInfoModal,
  PlayTourControls,
} from './circuit/CircuitOverlays';
import { useCircuitScene } from './circuit/useCircuitScene';
import { SimulationMetrics } from '../types/simulation';

interface CircuitPageProps {
  metrics: SimulationMetrics;
  onAnimationChange?: (animating: boolean) => void;
}

export const CircuitPage: React.FC<CircuitPageProps> = ({ metrics, onAnimationChange }) => {
  const scene = useCircuitScene(metrics, onAnimationChange);
  const { isAnimating, showHighlights, activeStep } = scene;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Top-Down 2D Interactive / Cinematic Viewport */}
      <div
        ref={scene.containerRef}
        className="viewport-shell"
        aria-label="Rangkaian 2D/3D Node AIoT"
      />

      {/* Interactive Hotspot Rings (same style as Diorama 3D, when NOT animating) */}
      {!isAnimating && showHighlights && (
        <CircuitHotspots
          hotspots={scene.hotspots}
          clickedStep={scene.clickedStep}
          onSelectStep={scene.setClickedStep}
        />
      )}

      {/* Bottom Center Borderless Caption (ONLY during Cinematic Play Mode) */}
      {isAnimating && activeStep && (
        <CinematicCaption activeStep={activeStep} tourProgress={scene.tourProgress} />
      )}

      {/* Top-Right Corner Info Card (when NOT in Play Mode & a component is clicked) */}
      {!isAnimating && scene.clickedStep && (
        <CircuitInfoModal
          clickedStep={scene.clickedStep}
          onClose={() => scene.setClickedStep(null)}
        />
      )}

      {/* Play & Highlight Controls (only shown when NOT animating) */}
      {!isAnimating && (
        <PlayTourControls
          showHighlights={showHighlights}
          onToggleHighlights={() => scene.setShowHighlights((v) => !v)}
          onPlayAnimation={scene.handlePlayAnimation}
        />
      )}
    </div>
  );
};
