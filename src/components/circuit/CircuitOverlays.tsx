import React from 'react';
import { CircuitTourStep } from '../../data/circuitTour';
import { ESP32_PARTS } from '../../data/espParts';
import { TOUR_HOTSPOT_STEPS, CircuitHotspot } from './tourHotspots';

interface CircuitHotspotsProps {
  hotspots: CircuitHotspot[];
  clickedStep: CircuitTourStep | null;
  // The page passes its state setter itself so the functional updater is unchanged.
  onSelectStep: React.Dispatch<React.SetStateAction<CircuitTourStep | null>>;
}

/** Interactive hotspot rings projected over the 3D scene (when not animating). */
export const CircuitHotspots: React.FC<CircuitHotspotsProps> = ({
  hotspots,
  clickedStep,
  onSelectStep,
}) => {
  return (
<div className="hotspots-layer">
  {hotspots.map((hs) => {
    if (!hs.visible) return null;
    const isSelected = clickedStep?.id === hs.id;
    return (
      <button
        key={hs.id}
        type="button"
        title={hs.title}
        aria-label={hs.title}
        className={`hotspot-ring is-part ${isSelected ? 'is-selected' : ''}`}
        style={{ left: `${hs.x}px`, top: `${hs.y}px` }}
        onClick={() => {
          const matched = TOUR_HOTSPOT_STEPS.find((st) => st.id === hs.id) ?? null;
          onSelectStep((prev) => (prev?.id === hs.id ? null : matched));
        }}
      >
        <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" style={{ backgroundColor: hs.color }} />
      </button>
    );
  })}
</div>
      
  );
};

interface CinematicCaptionProps {
  activeStep: CircuitTourStep;
  tourProgress: number;
}

/** Bottom-center borderless caption shown during cinematic play mode. */
export const CinematicCaption: React.FC<CinematicCaptionProps> = ({ activeStep, tourProgress }) => {
  return (
<div key={activeStep.id} className="cinematic-caption" aria-live="polite">
  <div className="mb-[3px] flex items-center gap-[7px]">
    <span
      className="h-[7px] w-[7px] shrink-0 rounded-full"
      style={{ backgroundColor: activeStep.accentColor }}
      aria-hidden="true"
    />
    <span className="text-[11px] font-extrabold uppercase tracking-[0.05em] text-muted">{activeStep.stage}</span>
  </div>
  <h2 className="m-0 mb-1 text-[17px] font-extrabold leading-[1.25]">{activeStep.title}</h2>
  <p className="m-0 mb-1.5 text-[12.5px] leading-[1.48] text-ink opacity-90">{activeStep.description}</p>
  <div className="mb-2 text-[11.5px] font-bold text-muted">{activeStep.flowSummary}</div>
  <div className="h-0.5 w-full overflow-hidden rounded-full bg-[rgba(35,30,22,0.12)]" aria-hidden="true">
    <div
      className="h-full transition-[width_0.08s_linear]"
      style={{
        width: `${Math.round(tourProgress * 100)}%`,
        backgroundColor: activeStep.accentColor,
      }}
    />
  </div>
</div>
      
  );
};

interface CircuitInfoModalProps {
  clickedStep: CircuitTourStep;
  onClose: () => void;
}

/** Top-right info card for the clicked circuit component (when not in play mode). */
export const CircuitInfoModal: React.FC<CircuitInfoModalProps> = ({ clickedStep, onClose }) => {
  const clickedPartDetail =
    clickedStep.part !== 'OVERVIEW' ? ESP32_PARTS[clickedStep.part] : null;
  return (
<aside className="info-modal" role="dialog" aria-label="Informasi Komponen Rangkaian">
  <div className="modal-head">
    <div>
      <div className="modal-eyebrow">
        {clickedPartDetail ? `Bagian ${clickedPartDetail.designator} · ` : ''}
        {clickedStep.stage}
      </div>
      <h2 className="modal-title">{clickedStep.title}</h2>
    </div>
    <button
      type="button"
      className="close-btn"
      aria-label="Tutup modal"
      onClick={onClose}
    >
      ✕
    </button>
  </div>

  <div className="modal-block">
    <span className="modal-block-label">Alur Rangkaian</span>
    {clickedStep.flowSummary}
  </div>

  <div className="modal-block">
    <span className="modal-block-label">Fungsi di Sentinel Node</span>
    {clickedStep.description}
  </div>

  {clickedPartDetail && (
    <>
      <div className="modal-block">
        <span className="modal-block-label">Spesifikasi</span>
        {clickedPartDetail.spec}
      </div>
      <div className="modal-block">
        <span className="modal-block-label">Koneksi Pin</span>
        {clickedPartDetail.pins}
      </div>
    </>
  )}

  <div className="modal-footer">
    <button
      type="button"
      className="dock-btn is-active"
      onClick={onClose}
    >
      Tutup
    </button>
  </div>
</aside>
      
  );
};

interface PlayTourControlsProps {
  showHighlights: boolean;
  onToggleHighlights: () => void;
  onPlayAnimation: () => void;
}

/** Play-tour + highlight controls (only shown when not animating). */
export const PlayTourControls: React.FC<PlayTourControlsProps> = ({
  showHighlights,
  onToggleHighlights,
  onPlayAnimation,
}) => {
  return (
<div className="absolute bottom-5 left-1/2 z-[18] flex -translate-x-1/2 items-center gap-2.5">
  <button type="button" className="play-tour-btn" onClick={onPlayAnimation}>
    <span className="text-[11px] leading-none" aria-hidden="true">
      ▶
    </span>
    <span>Play Animasi</span>
  </button>
  <button
    type="button"
    className={`dock-btn ${showHighlights ? 'is-active' : ''}`}
    onClick={onToggleHighlights}
  >
    Highlight
  </button>
</div>
      
  );
};
