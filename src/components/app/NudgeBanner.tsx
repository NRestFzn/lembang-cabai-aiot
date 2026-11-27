import React from 'react';
import { NudgeBanner as NudgeBannerData } from '../../types/simulation';

interface NudgeBannerProps {
  nudge: NudgeBannerData;
  onDismiss: () => void;
}

/** Watering / behaviour nudge toast. */
export const NudgeBanner: React.FC<NudgeBannerProps> = ({ nudge, onDismiss }) => {
  return (
    <div className={`nudge-toast tone-${nudge.tone}`}>
      <div>
        <div className="text-[12.5px] font-bold">{nudge.title}</div>
        <div className="mt-[3px] text-[13px] leading-[1.45]">{nudge.detail}</div>
      </div>
      <button type="button" className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border border-rule bg-soft text-sm font-bold text-ink" onClick={onDismiss}>
        ✕
      </button>
    </div>
  );
};
