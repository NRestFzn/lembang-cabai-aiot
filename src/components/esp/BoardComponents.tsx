import React from 'react';
import { ESP_PALETTE, IsoBox, IsoCylinder, IsoDropGuide, isoPlaneMatrix, isoProject, ptsAttr } from '../../utils/isoDraw';
import { EspPartKey } from '../../data/espParts';
import { SimulationMetrics } from '../../types/simulation';
import { CFG, cableD, explodeFactor, pcbTop } from './espBenchShared';

interface BoardComponentsProps {
  metrics: SimulationMetrics;
  exploded: boolean;
  usbPlugged: boolean;
  selectedPart: EspPartKey | null;
  onSelectPart: (key: EspPartKey) => void;
}

/** Surface-mount components: antenna, RF shield, regulator, UART bridge, LED, passives, buttons, USB-C + cable. */
export const BoardComponents: React.FC<BoardComponentsProps> = ({
  metrics,
  exploded,
  usbPlugged,
  selectedPart,
  onSelectPart,
}) => {
  const ex = explodeFactor(exploded);
  return (
    <>
      {/* 5. SURFACE-MOUNT COMPONENTS (Explode vertically along Z with drop guides) */}

      {/* ANT1 — PCB Wi-Fi Antenna Keepout & Gold Meander (at -y end) */}
      <g onClick={() => onSelectPart('ANT1')} style={{ cursor: 'pointer' }}>
        <IsoBox
          cfg={CFG}
          x={-0.66}
          y={-2.02}
          z={pcbTop + 0.002 + ex * 0.45}
          dx={1.32}
          dy={0.44}
          dz={0.02}
          shades={ESP_PALETTE.pcbDark}
          strokeWidth={1.1}
          selected={selectedPart === 'ANT1'}
        />
        {(() => {
          const antPts: Array<[number, number, number]> = [
            [-0.48, -1.66, pcbTop + 0.026 + ex * 0.45],
            [-0.48, -1.94, pcbTop + 0.026 + ex * 0.45],
            [-0.24, -1.94, pcbTop + 0.026 + ex * 0.45],
            [-0.24, -1.72, pcbTop + 0.026 + ex * 0.45],
            [0.0, -1.72, pcbTop + 0.026 + ex * 0.45],
            [0.0, -1.94, pcbTop + 0.026 + ex * 0.45],
            [0.24, -1.94, pcbTop + 0.026 + ex * 0.45],
            [0.24, -1.72, pcbTop + 0.026 + ex * 0.45],
            [0.48, -1.72, pcbTop + 0.026 + ex * 0.45],
          ];
          const d = antPts
            .map(([ax, ay, az], idx) => {
              const [px, py] = isoProject(ax, ay, az, CFG);
              return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
            })
            .join(' ');
          return <path d={d} fill="none" stroke="#e2bd56" strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" />;
        })()}
      </g>

      {/* U1 — Silver Metallic ESP-WROOM-32 RF Shield */}
      <IsoDropGuide cfg={CFG} x={0} y={-0.98} zBottom={pcbTop} zTop={pcbTop + ex * 1.15} />
      <IsoBox
        cfg={CFG}
        x={-0.66}
        y={-1.58}
        z={pcbTop + ex * 1.15}
        dx={1.32}
        dy={1.2}
        dz={0.21}
        shades={ESP_PALETTE.metalSilver}
        strokeWidth={1.6}
        rimStroke
        selected={selectedPart === 'U1'}
        onClick={() => onSelectPart('U1')}
      />
      {/* Isometric Text etched on RF Shield */}
      <g transform={isoPlaneMatrix(-0.44, -1.06, pcbTop + 0.215 + ex * 1.15, CFG)} style={{ pointerEvents: 'none' }}>
        <text x="0" y="0" fontSize="6.8" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#4e5359">
          ESP-WROOM-32
        </text>
        <text x="6" y="10" fontSize="5.2" fontWeight="600" fontFamily="ui-monospace, monospace" fill="#6b7280">
          WiFi · BLE
        </text>
      </g>

      {/* U3 — AMS1117-3.3V Voltage Regulator (left-middle) */}
      <IsoDropGuide cfg={CFG} x={-0.38} y={0.05} zBottom={pcbTop} zTop={pcbTop + ex * 0.85} />
      <g onClick={() => onSelectPart('U3')} style={{ cursor: 'pointer' }}>
        {/* SMD legs */}
        {[-0.08, 0.05, 0.18].map((ly, idx) => (
          <IsoBox
            key={`u3l-${idx}`}
            cfg={CFG}
            x={-0.22}
            y={ly - 0.02}
            z={pcbTop + ex * 0.85}
            dx={0.09}
            dy={0.04}
            dz={0.025}
            shades={ESP_PALETTE.metalSilver}
            strokeWidth={0.6}
          />
        ))}
        <IsoBox
          cfg={CFG}
          x={-0.58}
          y={-0.06}
          z={pcbTop + ex * 0.85}
          dx={0.1}
          dy={0.22}
          dz={0.04}
          shades={ESP_PALETTE.metalSilver}
          strokeWidth={0.8}
        />
        <IsoBox
          cfg={CFG}
          x={-0.5}
          y={-0.12}
          z={pcbTop + ex * 0.85}
          dx={0.28}
          dy={0.34}
          dz={0.09}
          shades={ESP_PALETTE.icDark}
          strokeWidth={1.2}
          selected={selectedPart === 'U3'}
        />
      </g>

      {/* U2 — CP2102 USB-UART QFN-28 IC (center-front) */}
      <IsoDropGuide cfg={CFG} x={0.08} y={0.88} zBottom={pcbTop} zTop={pcbTop + ex * 0.95} />
      <g onClick={() => onSelectPart('U2')} style={{ cursor: 'pointer' }}>
        {/* Fine metallic SMD pins on sides */}
        {[-0.12, -0.04, 0.04, 0.12].map((off, idx) => (
          <React.Fragment key={`u2p-${idx}`}>
            <IsoBox cfg={CFG} x={0.08 + off - 0.015} y={0.64} z={pcbTop + ex * 0.95} dx={0.03} dy={0.06} dz={0.02} shades={ESP_PALETTE.metalSilver} strokeWidth={0.5} />
            <IsoBox cfg={CFG} x={0.08 + off - 0.015} y={1.06} z={pcbTop + ex * 0.95} dx={0.03} dy={0.06} dz={0.02} shades={ESP_PALETTE.metalSilver} strokeWidth={0.5} />
          </React.Fragment>
        ))}
        <IsoBox
          cfg={CFG}
          x={-0.1}
          y={0.7}
          z={pcbTop + ex * 0.95}
          dx={0.36}
          dy={0.36}
          dz={0.075}
          shades={ESP_PALETTE.icDark}
          strokeWidth={1.25}
          selected={selectedPart === 'U2'}
        />
      </g>

      {/* RGB — Status / RGB LED */}
      <IsoDropGuide cfg={CFG} x={0.3} y={0.28} zBottom={pcbTop} zTop={pcbTop + ex * 0.9} />
      <g onClick={() => onSelectPart('RGB')} style={{ cursor: 'pointer' }}>
        <IsoBox
          cfg={CFG}
          x={0.18}
          y={0.16}
          z={pcbTop + ex * 0.9}
          dx={0.24}
          dy={0.24}
          dz={0.06}
          shades={ESP_PALETTE.metalSilver}
          strokeWidth={1.1}
          selected={selectedPart === 'RGB'}
        />
        <IsoCylinder
          cfg={CFG}
          cx={0.3}
          cy={0.28}
          z={pcbTop + 0.055 + ex * 0.9}
          r={0.075}
          h={0.025}
          shades={metrics.isWatering || metrics.patekRiskPct >= 65 ? ESP_PALETTE.ledGlow : ESP_PALETTE.ledIdle}
          strokeWidth={0.85}
        />
      </g>

      {/* RC — Tiny SMD Resistors & Ceramic Capacitors */}
      <g onClick={() => onSelectPart('RC')} style={{ cursor: 'pointer' }}>
        {[
          [-0.44, -0.32],
          [-0.2, -0.32],
          [0.36, -0.18],
          [-0.48, 0.56],
          [0.44, 0.85],
          [0.44, 1.05],
        ].map(([rx, ry], idx) => (
          <IsoBox
            key={`rc-${idx}`}
            cfg={CFG}
            x={rx}
            y={ry}
            z={pcbTop + ex * 0.65}
            dx={0.11}
            dy={0.065}
            dz={0.04}
            shades={idx % 2 === 0 ? ESP_PALETTE.icDark : ESP_PALETTE.gold}
            strokeWidth={0.75}
            selected={selectedPart === 'RC'}
          />
        ))}
      </g>

      {/* SW1 (BOOT) & SW2 (RST/EN) Tactile Buttons */}
      {(
        [
          { key: 'SW1' as EspPartKey, x: -0.48, y: 1.15 },
          { key: 'SW2' as EspPartKey, x: 0.44, y: 1.38 },
        ] as const
      ).map((btn) => (
        <g key={btn.key} onClick={() => onSelectPart(btn.key)} style={{ cursor: 'pointer' }}>
          <IsoDropGuide cfg={CFG} x={btn.x} y={btn.y} zBottom={pcbTop} zTop={pcbTop + ex * 1.05} />
          <IsoBox
            cfg={CFG}
            x={btn.x - 0.14}
            y={btn.y - 0.14}
            z={pcbTop + ex * 1.05}
            dx={0.28}
            dy={0.28}
            dz={0.07}
            shades={ESP_PALETTE.metalSilver}
            strokeWidth={1.15}
            selected={selectedPart === btn.key}
          />
          <IsoCylinder
            cfg={CFG}
            cx={btn.x}
            cy={btn.y}
            z={pcbTop + 0.07 + ex * 1.05}
            r={0.08}
            h={0.055}
            shades={ESP_PALETTE.icDark}
            strokeWidth={1.0}
          />
        </g>
      ))}

      {/* J1 — USB Type-C Port Shell at front-left (+y end) */}
      <IsoDropGuide cfg={CFG} x={0} y={1.92} zBottom={pcbTop} zTop={pcbTop + ex * 0.85} />
      <g onClick={() => onSelectPart('J1')} style={{ cursor: 'pointer' }}>
        <IsoBox
          cfg={CFG}
          x={-0.28}
          y={1.68}
          z={pcbTop + ex * 0.85}
          dx={0.56}
          dy={0.44}
          dz={0.18}
          shades={ESP_PALETTE.metalSilver}
          strokeWidth={1.5}
          rimStroke
          selected={selectedPart === 'J1'}
        />
        {/* Dark USB cavity opening on front +y face */}
        {(() => {
          const z0 = pcbTop + 0.04 + ex * 0.85;
          const z1 = pcbTop + 0.14 + ex * 0.85;
          const p0 = isoProject(-0.2, 2.122, z1, CFG);
          const p1 = isoProject(0.2, 2.122, z1, CFG);
          const p2 = isoProject(0.2, 2.122, z0, CFG);
          const p3 = isoProject(-0.2, 2.122, z0, CFG);
          return <polygon points={ptsAttr([p0, p1, p2, p3])} fill="#1f1d1a" stroke="#231e16" strokeWidth={0.9} />;
        })()}
      </g>

      {/* Plugged USB Cable (only when plugged & not exploded) */}
      {usbPlugged && !exploded && (
        <g>
          <path d={cableD} fill="none" stroke="#231e16" strokeWidth={11} strokeLinecap="round" />
          <path d={cableD} fill="none" stroke="#55504a" strokeWidth={7.5} strokeLinecap="round" />
          <IsoBox
            cfg={CFG}
            x={-0.25}
            y={2.08}
            z={pcbTop - 0.02}
            dx={0.5}
            dy={0.44}
            dz={0.24}
            shades={ESP_PALETTE.plugHousing}
            strokeWidth={1.6}
          />
        </g>
      )}
    </>
  );
};
