import React from 'react';
import { ESP_PALETTE, IsoBox } from '../../utils/isoDraw';
import { EspPartKey } from '../../data/espParts';
import { CFG, bbTop, pinIndices, pinY } from './espBenchShared';

/** Header pins H1/H2 inserted into the breadboard + gold pin tips above the PCB. */
export const HeaderPins: React.FC<{ onSelectPart: (key: EspPartKey) => void }> = ({ onSelectPart }) => {
  return (
    <>
      {/* 3. HEADER PINS H1 (left, x = -0.76) & H2 (right, x = +0.76) inserted into breadboard */}
      {pinIndices.map((i) => {
        const py = pinY(i);
        return (
          <React.Fragment key={`hdr-${i}`}>
            {/* Back-left row H1 */}
            <IsoBox
              cfg={CFG}
              x={-0.8}
              y={py - 0.055}
              z={bbTop}
              dx={0.11}
              dy={0.11}
              dz={0.07}
              shades={ESP_PALETTE.icDark}
              strokeWidth={0.9}
              onClick={() => onSelectPart('H1')}
            />
            <IsoBox
              cfg={CFG}
              x={-0.775}
              y={py - 0.025}
              z={bbTop + 0.07}
              dx={0.055}
              dy={0.055}
              dz={0.16}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.8}
              onClick={() => onSelectPart('H1')}
            />

            {/* Front-right row H2 */}
            <IsoBox
              cfg={CFG}
              x={0.7}
              y={py - 0.055}
              z={bbTop}
              dx={0.11}
              dy={0.11}
              dz={0.07}
              shades={ESP_PALETTE.icDark}
              strokeWidth={0.9}
              onClick={() => onSelectPart('H2')}
            />
            <IsoBox
              cfg={CFG}
              x={0.725}
              y={py - 0.025}
              z={bbTop + 0.07}
              dx={0.055}
              dy={0.055}
              dz={0.16}
              shades={ESP_PALETTE.gold}
              strokeWidth={0.8}
              onClick={() => onSelectPart('H2')}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
