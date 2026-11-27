import React from 'react';
import { CircuitTourStep } from '../../data/circuitTour';
import { TOUR_HOTSPOT_STEPS } from './tourHotspots';

interface CircuitComponentsListProps {
  clickedStep: CircuitTourStep | null;
  // Same setter type as CircuitHotspots, so a row click behaves exactly
  // like tapping the matching hotspot (tap again to deselect).
  onSelectStep: React.Dispatch<React.SetStateAction<CircuitTourStep | null>>;
}

/**
 * Right-side Components list for the Rangkaian (circuit) tab.
 *
 * Shown ONLY when nothing is selected and the cinematic tour is not
 * playing (`!isAnimating && clickedStep == null`) — the exact opposite
 * of CircuitInfoModal, which occupies this same top-right spot
 * (`.info-modal` geometry: top 96px, right 20px, 340px wide). Tapping a
 * component swaps this list for the info modal; closing the modal brings
 * the list back. Hidden during Play mode.
 *
 * Rows are TOUR_HOTSPOT_STEPS (the 12 clickable tour steps) — the
 * 'overview' step is not a component and has no hotspot, so it is not
 * listed. Each row shows the step's accent dot + stage, title, and flow
 * summary, and reads its text from the tour data at runtime, so the
 * ArduCam Camera Module 3 row follows the rename automatically.
 *
 * Hidden below 780px: on a phone-width viewport the list would cover
 * the 3D view; the hotspots remain the way to pick a component there.
 */
export const CircuitComponentsList: React.FC<CircuitComponentsListProps> = ({
  clickedStep,
  onSelectStep,
}) => {
  return (
    <aside
      aria-label="Daftar Komponen Rangkaian"
      className="absolute top-[96px] right-5 z-20 flex w-[340px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border-[1.5px] border-ink bg-panel text-ink shadow-[5px_5px_0_var(--ink)] max-h-[calc(100vh-196px)] max-[780px]:hidden"
    >
      <div className="flex items-center justify-between gap-2 border-b border-rule px-4 pt-3 pb-2.5">
        <h2 className="text-base leading-[1.25] font-bold">Components</h2>
        <span className="font-mono text-[11px] font-bold text-muted">
          {TOUR_HOTSPOT_STEPS.length} komponen
        </span>
      </div>

      <nav aria-label="Komponen Rangkaian Sentinel Node" className="flex flex-col gap-2 overflow-y-auto p-3">
        {TOUR_HOTSPOT_STEPS.map((step) => {
          const isSelected = clickedStep?.id === step.id;
          return (
            <button
              key={step.id}
              type="button"
              aria-current={isSelected}
              onClick={() =>
                onSelectStep((prev) => (prev?.id === step.id ? null : step))
              }
              className={`w-full cursor-pointer rounded-xl border-[1.5px] px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                isSelected ? 'border-ink bg-accent-soft' : 'border-rule bg-soft hover:border-ink'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-ink"
                  style={{ backgroundColor: step.accentColor }}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate font-mono text-[11px] font-bold text-muted">
                  {step.stage}
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-tight font-bold">{step.title}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-muted" title={step.flowSummary}>
                {step.flowSummary}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
