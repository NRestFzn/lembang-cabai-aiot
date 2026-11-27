import React from 'react';
import { LOG_TAG_LABEL } from '../../simulation/phoneHudHelpers';
import { SerialLogEntry } from '../../types/simulation';

export interface LogTabProps {
  logs: SerialLogEntry[];
  habitScore: number;
}

/** 'Log' tab: care score + serial-log timeline. */
export const LogTab: React.FC<LogTabProps> = ({ logs, habitScore }) => {
  return (
    <>
  <div className="phone-white-card">
    <div className="flex items-center justify-between gap-2 text-xs">
      <strong>Catatan Kebun</strong>
      <span className="rounded-full bg-[#fdeae0] px-2 py-[2px] text-[11px] font-extrabold text-[#d95d24]">{logs.length} catatan</span>
    </div>
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${habitScore}%` }} />
    </div>
    <div className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">
      Skor Perawatan Kebun: <strong>{habitScore}/100</strong>
    </div>
  </div>

  <div className="flex flex-col gap-[7px]">
    {logs.map((entry) => (
      <div
        key={entry.id}
        className={`phone-white-card phone-log-card ${
          entry.tag === 'NUDGE' || entry.tag === 'CAM' ? 'is-danger-card' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={`log-tag is-${entry.tag.toLowerCase()}`}>
            {LOG_TAG_LABEL[entry.tag]}
          </span>
          <span className="mt-[2px] text-[10.5px] leading-[1.38] text-[#8a847b]">
            Hari {entry.day} · {entry.simTime}
          </span>
        </div>
        <div className="text-[11.5px] font-bold leading-[1.25] text-[#1e2022]">{entry.title}</div>
        <p className="m-0 text-[11px] leading-[1.42] text-[#313336]">{entry.message}</p>
      </div>
    ))}
  </div>
    </>
  );
};
