import React from 'react';
import { isoProject } from '../../utils/isoDraw';
import { EspPartKey } from '../../data/espParts';
import { CALLOUTS, CFG, explodeFactor } from './espBenchShared';

interface CalloutLabelsProps {
  exploded: boolean;
  selectedPart: EspPartKey | null;
  onSelectPart: (key: EspPartKey) => void;
}

/** Cream callout pills + leader lines pointing at board parts. */
export const CalloutLabels: React.FC<CalloutLabelsProps> = ({ exploded, selectedPart, onSelectPart }) => {
  const ex = explodeFactor(exploded);
  return (
    <>
      {CALLOUTS.map((c) => {
        const [tx, ty] = isoProject(c.target[0], c.target[1], c.target[2] + ex * 0.7, CFG);
        const lx = tx + c.offset[0];
        const ly = ty + c.offset[1];
        const pw = Math.max(66, c.text.length * 7.2 + 20);
        const isSel = selectedPart === c.part;

        return (
          <g
            key={c.id}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectPart(c.part)}
          >
            <line x1={tx} y1={ty} x2={lx} y2={ly} stroke="#231e16" strokeWidth={1.35} />
            <circle cx={tx} cy={ty} r={3.2} fill="#fbf8f0" stroke="#231e16" strokeWidth={1.35} />
            <rect
              x={lx - pw / 2}
              y={ly - 12}
              width={pw}
              height={24}
              rx={12}
              fill={isSel ? '#231e16' : '#fbf8f0'}
              stroke="#231e16"
              strokeWidth={1.45}
            />
            <text
              x={lx}
              y={ly + 3.8}
              textAnchor="middle"
              fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
              fontSize="10.5"
              fontWeight="700"
              letterSpacing="0.04em"
              fill={isSel ? '#fbf8f0' : '#231e16'}
            >
              {c.text}
            </text>
          </g>
        );
      })}
    </>
  );
};
