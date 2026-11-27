import React from 'react';
import { ESP_PALETTE, IsoChamferSlab, isoProject, ptsAttr } from '../../utils/isoDraw';
import { CFG, bbD, bbHoleColsX, bbRowsY, bbTop, bbW, bbZ } from './espBenchShared';

/** White solderless breadboard: slab, divider groove, power rails, socket holes. */
export const Breadboard: React.FC = () => {
  return (
    <>
      {/* 2. WHITE SOLDERLESS BREADBOARD */}
      <IsoChamferSlab
        cfg={CFG}
        x={-bbW / 2}
        y={-bbD / 2}
        z={bbZ}
        dx={bbW}
        dy={bbD}
        dz={bbTop}
        chamfer={0.12}
        shades={ESP_PALETTE.breadboard}
        strokeWidth={2.0}
      />

      {/* Breadboard center divider groove */}
      {(() => {
        const c0 = isoProject(-0.11, -bbD / 2 + 0.08, bbTop + 0.002, CFG);
        const c1 = isoProject(0.11, -bbD / 2 + 0.08, bbTop + 0.002, CFG);
        const c2 = isoProject(0.11, bbD / 2 - 0.08, bbTop + 0.002, CFG);
        const c3 = isoProject(-0.11, bbD / 2 - 0.08, bbTop + 0.002, CFG);
        return <polygon points={ptsAttr([c0, c1, c2, c3])} fill="#dcd7c8" stroke="#b5ae9f" strokeWidth={0.8} />;
      })()}

      {/* Red & Blue Breadboard Power Bus Lines */}
      {[-1.3, 1.24].map((rx, idx) => {
        const pA = isoProject(rx, -bbD / 2 + 0.22, bbTop + 0.003, CFG);
        const pB = isoProject(rx, bbD / 2 - 0.22, bbTop + 0.003, CFG);
        const pC = isoProject(rx + 0.06, -bbD / 2 + 0.22, bbTop + 0.003, CFG);
        const pD = isoProject(rx + 0.06, bbD / 2 - 0.22, bbTop + 0.003, CFG);
        return (
          <g key={`rail-${idx}`}>
            <line x1={pA[0]} y1={pA[1]} x2={pB[0]} y2={pB[1]} stroke="#e2483d" strokeWidth={1.5} />
            <line x1={pC[0]} y1={pC[1]} x2={pD[0]} y2={pD[1]} stroke="#3e86d9" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* 2.54mm Breadboard Socket Holes */}
      {bbRowsY.map((ry, rIdx) =>
        bbHoleColsX.map((hx, cIdx) => {
          const [sx, sy] = isoProject(hx, ry, bbTop + 0.003, CFG);
          return (
            <rect
              key={`hole-${rIdx}-${cIdx}`}
              x={sx - 1.9}
              y={sy - 1.1}
              width={3.8}
              height={2.2}
              rx={0.5}
              fill="#35312c"
            />
          );
        })
      )}
    </>
  );
};
