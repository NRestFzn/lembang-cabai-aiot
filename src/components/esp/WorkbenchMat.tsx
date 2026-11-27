import React from 'react';
import { ESP_PALETTE, IsoChamferSlab, isoProject } from '../../utils/isoDraw';
import { CFG, matD, matW } from './espBenchShared';

/** Workbench mat slab + subtle grid. */
export const WorkbenchMat: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  return (
    <>
      {/* 1. WORKBENCH MAT */}
      <g filter="url(#esp-soft-shadow)">
        <IsoChamferSlab
          cfg={CFG}
          x={-matW / 2}
          y={-matD / 2}
          z={-0.22}
          dx={matW}
          dy={matD}
          dz={0.22}
          chamfer={0.28}
          shades={
            isNight
              ? { top: '#2b344d', left: '#20273b', right: '#171d2c', rim: '#424e70' }
              : ESP_PALETTE.mat
          }
          strokeWidth={2.2}
        />
      </g>

      {/* Subtle grid on workbench mat */}
      {Array.from({ length: 7 }).map((_, i) => {
        const gx = -matW / 2 + ((i + 1) * matW) / 8;
        const p1 = isoProject(gx, -matD / 2 + 0.2, 0.002, CFG);
        const p2 = isoProject(gx, matD / 2 - 0.2, 0.002, CFG);
        return <line key={`mx-${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="rgba(35,30,22,0.06)" strokeWidth={1} />;
      })}
      {Array.from({ length: 9 }).map((_, i) => {
        const gy = -matD / 2 + ((i + 1) * matD) / 10;
        const p1 = isoProject(-matW / 2 + 0.2, gy, 0.002, CFG);
        const p2 = isoProject(matW / 2 - 0.2, gy, 0.002, CFG);
        return <line key={`my-${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="rgba(35,30,22,0.06)" strokeWidth={1} />;
      })}
    </>
  );
};
