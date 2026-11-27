import React from 'react';
import { ESP_PALETTE, IsoBox, IsoChamferSlab, IsoCylinder, isoPlaneMatrix } from '../../utils/isoDraw';
import { EspPartKey } from '../../data/espParts';
import { CFG, pcbD, pcbH, pcbTop, pcbW, pcbZ, pinIndices, pinY } from './espBenchShared';

/** Matte black ESP32-WROOM-32 PCB slab + gold pin tips + silkscreen markings. */
export const PcbBoard: React.FC<{ onSelectPart: (key: EspPartKey) => void }> = ({ onSelectPart }) => {
  return (
    <>
      {/* 4. ESP32-WROOM-32 MATTE BLACK PCB */}
      <IsoChamferSlab
        cfg={CFG}
        x={-pcbW / 2}
        y={-pcbD / 2}
        z={pcbZ}
        dx={pcbW}
        dy={pcbD}
        dz={pcbH}
        chamfer={0.09}
        shades={ESP_PALETTE.pcbBoard}
        strokeWidth={2.0}
      />

      {/* Gold Solder Rings + Pin Tips protruding above PCB */}
      {pinIndices.map((i) => {
        const py = pinY(i);
        return (
          <React.Fragment key={`top-pins-${i}`}>
            <IsoCylinder
              cfg={CFG}
              cx={-0.745}
              cy={py}
              z={pcbTop}
              r={0.052}
              h={0.018}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.75}
              onClick={() => onSelectPart('H1')}
            />
            <IsoBox
              cfg={CFG}
              x={-0.77}
              y={py - 0.022}
              z={pcbTop + 0.015}
              dx={0.05}
              dy={0.05}
              dz={0.055}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.7}
              onClick={() => onSelectPart('H1')}
            />

            <IsoCylinder
              cfg={CFG}
              cx={0.755}
              cy={py}
              z={pcbTop}
              r={0.052}
              h={0.018}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.75}
              onClick={() => onSelectPart('H2')}
            />
            <IsoBox
              cfg={CFG}
              x={0.73}
              y={py - 0.022}
              z={pcbTop + 0.015}
              dx={0.05}
              dy={0.05}
              dz={0.055}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.7}
              onClick={() => onSelectPart('H2')}
            />
          </React.Fragment>
        );
      })}

      {/* PCB Silkscreen Markings (Isometric Plane) */}
      <g transform={isoPlaneMatrix(-0.28, 0.62, pcbTop + 0.003, CFG)} style={{ pointerEvents: 'none' }}>
        <text x="0" y="0" fontSize="6.5" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#eef0f0" opacity="0.9">
          ESP32-DevKit
        </text>
      </g>
      <g transform={isoPlaneMatrix(0.56, -0.45, pcbTop + 0.003, CFG)} style={{ pointerEvents: 'none' }}>
        <text x="0" y="0" fontSize="4.6" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#eef0f0" opacity="0.82">
          LEMBANG AIoT
        </text>
      </g>
    </>
  );
};
