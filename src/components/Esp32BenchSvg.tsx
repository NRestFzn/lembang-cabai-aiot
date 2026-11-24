import React from 'react';
import { SimulationMetrics } from '../types/simulation';
import {
  ESP_PALETTE,
  IsoBox,
  IsoChamferSlab,
  IsoConfig,
  IsoCylinder,
  IsoDropGuide,
  isoPlaneMatrix,
  isoProject,
  ptsAttr,
} from '../utils/isoDraw';

export type EspPartKey =
  | 'U1'
  | 'ANT1'
  | 'U2'
  | 'U3'
  | 'SW1'
  | 'SW2'
  | 'RGB'
  | 'J1'
  | 'H1'
  | 'H2'
  | 'RC';

export interface EspPartDetail {
  designator: EspPartKey;
  name: string;
  spec: string;
  role: string;
  pins: string;
}

export const ESP32_PARTS: Record<EspPartKey, EspPartDetail> = {
  U1: {
    designator: 'U1',
    name: 'Modul ESP-WROOM-32 (RF Shield)',
    spec: 'Xtensa LX6 Dual-Core 240MHz · 4MB Flash · Wi-Fi/BLE',
    role: 'Menjalankan Risk Engine VPD, Dew-Point Depression, Leaf Wetness Duration (LWD), serta logika kontrol siram.',
    pins: 'Terhubung internal ke bus I2C, ADC1, SPI, UART2, dan GPIO relay.',
  },
  ANT1: {
    designator: 'ANT1',
    name: 'Antena PCB 2.4 GHz (Meander Trace)',
    spec: '50Ω PCB Inverted-F Antenna',
    role: 'Mengirim telemetri ke dashboard 3D/cloud & sinkronisasi ESP-NOW antar-node klaster Poktan.',
    pins: 'Keepout zone bebas tembaga di ujung papan.',
  },
  U2: {
    designator: 'U2',
    name: 'Bridge USB-to-UART (CP2102)',
    spec: 'Silicon Labs CP2102 QFN-28',
    role: 'Menjembatani komunikasi serial komputer dengan ESP32 saat flashing firmware dan monitoring log.',
    pins: 'D+ / D- USB ↔ TXD0 (GPIO1) / RXD0 (GPIO3).',
  },
  U3: {
    designator: 'U3',
    name: 'Regulator LDO AMS1117-3.3V',
    spec: 'SOT-223 · Input 5V → Output 3.3V (800mA)',
    role: 'Menurunkan suplai rel 5V menjadi 3.3V stabil untuk ESP32, BME280, Capacitive Soil, dan DS18B20.',
    pins: 'VIN (5V) · VOUT (3V3) · GND Tab.',
  },
  SW1: {
    designator: 'SW1',
    name: 'Tombol BOOT (IO0)',
    spec: 'Tactile Switch SMD 4-Pin',
    role: 'Menarik GPIO0 ke GND untuk masuk ke mode bootloader saat upload kode baru.',
    pins: 'GPIO0 ↔ GND.',
  },
  SW2: {
    designator: 'SW2',
    name: 'Tombol EN / RESET',
    spec: 'Tactile Switch SMD 4-Pin',
    role: 'Me-reset mikrokontroler secara manual di lapangan tanpa mencabut baterai.',
    pins: 'EN (CHIP_PU) ↔ GND.',
  },
  RGB: {
    designator: 'RGB',
    name: 'LED Status Sistem & Siram',
    spec: 'SMD 5050 Status Indicator',
    role: 'Menunjukkan status AIoT Node: hijau saat menyiram, biru saat standby/monitoring, oranye saat tunda malam.',
    pins: 'GPIO2 (Built-in Status) + Power Indicator.',
  },
  J1: {
    designator: 'J1',
    name: 'Port USB-C / UART',
    spec: 'USB Type-C Receptacle (5V Data & Power)',
    role: 'Port pemrograman, serial monitor, dan suplai uji coba di meja kerja.',
    pins: 'VBUS (5V) · D+ · D- · GND.',
  },
  H1: {
    designator: 'H1',
    name: 'Header Pin Kiri (Power & Sensor)',
    spec: '15-Pin 2.54mm Gold Header',
    role: 'Jalur masuk sensor mikroiklim kanopi & tanah: 3V3, GND, GPIO21 (SDA BME280), GPIO22 (SCL BME280), GPIO34 (Soil ADC1), GPIO4 (DS18B20).',
    pins: '3V3 · EN · VP · VN · 34 · 35 · 32 · 33 · 25 · 26 · 27 · 14 · 12 · GND · VIN',
  },
  H2: {
    designator: 'H2',
    name: 'Header Pin Kanan (SD, CAM & Relay)',
    spec: '15-Pin 2.54mm Gold Header',
    role: 'Jalur keluar menuju MicroSD SPI (GPIO5/18/23/19), ESP32-CAM UART2 (GPIO16/17 + GPIO25), dan kontrol Relay 2-Channel (GPIO26/27).',
    pins: '3V3 · GND · 15 · 2 · 4 · 16 · 17 · 5 · 18 · 19 · 21 · RX0 · TX0 · 22 · 23',
  },
  RC: {
    designator: 'RC',
    name: 'Komponen Pasif SMD (R/C)',
    spec: 'Resistor Pull-Up 10kΩ & Kapasitor Decoupling 100nF/10µF',
    role: 'Menstabilkan pin EN, jalur I2C/UART, serta menyaring noise catu daya.',
    pins: 'Tersebar di sekitar U2, U3, dan SW1/SW2.',
  },
};

interface Esp32BenchSvgProps {
  metrics: SimulationMetrics;
  exploded: boolean;
  showLabels: boolean;
  usbPlugged: boolean;
  selectedPart: EspPartKey | null;
  onSelectPart: (key: EspPartKey) => void;
  isNight: boolean;
}

const CFG: IsoConfig = {
  originX: 460,
  originY: 315,
  scale: 66,
  inkColor: ESP_PALETTE.ink,
};

interface CalloutDef {
  id: string;
  text: string;
  part: EspPartKey;
  target: [number, number, number];
  offset: [number, number];
}

const CALLOUTS: CalloutDef[] = [
  { id: 'c-wifi', text: 'WIFI MODULE', part: 'U1', target: [0, -0.95, 0.72], offset: [115, -52] },
  { id: 'c-led', text: 'STATUS LED', part: 'RGB', target: [0.3, 0.3, 0.62], offset: [52, -88] },
  { id: 'c-boot', text: 'BOOT', part: 'SW1', target: [-0.46, 1.15, 0.64], offset: [-58, -76] },
  { id: 'c-uart', text: 'UART PORT', part: 'J1', target: [0, 2.02, 0.62], offset: [-122, 16] },
  { id: 'c-gpio', text: 'GPIO', part: 'H2', target: [0.76, 0.15, 0.56], offset: [78, 72] },
];

export const Esp32BenchSvg: React.FC<Esp32BenchSvgProps> = ({
  metrics,
  exploded,
  showLabels,
  usbPlugged,
  selectedPart,
  onSelectPart,
  isNight,
}) => {
  const ex = exploded ? 0.65 : 0;

  // Dimensions in world units (board runs along Y: -2.05 .. +2.05, width X: -0.92 .. +0.92)
  const matW = 4.6;
  const matD = 6.2;
  const bbW = 2.85;
  const bbD = 5.15;
  const bbZ = 0.0;
  const bbTop = 0.34;

  const pcbW = 1.82;
  const pcbD = 4.1;
  const pcbZ = bbTop + 0.16;
  const pcbH = 0.085;
  const pcbTop = pcbZ + pcbH;

  // 15 pins along each side (y from -1.54 to +1.54, step 0.22)
  const pinIndices = Array.from({ length: 15 }, (_, i) => i);
  const pinY = (i: number) => -1.54 + i * 0.22;

  // Breadboard 2.54mm socket holes (columns left & right of center channel)
  const bbHoleColsX = [-1.05, -0.86, -0.67, -0.48, -0.29, 0.29, 0.48, 0.67, 0.86, 1.05];
  const bbRowsY = Array.from({ length: 19 }, (_, i) => -1.98 + i * 0.22);

  // USB Cable Path when plugged
  const cablePts: Array<[number, number, number]> = [
    [0, 2.48, pcbTop + 0.06],
    [0, 2.75, pcbTop - 0.02],
    [0.05, 3.05, 0.05],
    [0.18, 3.38, -0.26],
    [0.42, 3.72, -0.58],
  ];
  const cableProj = cablePts.map(([x, y, z]) => isoProject(x, y, z, CFG));
  const cableD = `M ${cableProj[0][0]} ${cableProj[0][1]} C ${cableProj[1][0]} ${cableProj[1][1]}, ${cableProj[2][0]} ${cableProj[2][1]}, ${cableProj[3][0]} ${cableProj[3][1]} L ${cableProj[4][0]} ${cableProj[4][1]}`;

  return (
    <svg
      className="esp-bench-svg"
      viewBox="0 0 920 600"
      role="img"
      aria-label="Ilustrasi Isometrik ESP32-WROOM-32 DevKit"
    >
      <defs>
        <filter id="esp-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#231e16" floodOpacity="0.12" />
        </filter>
      </defs>

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

      {/* 6. CREAM CALLOUT PILLS & LEADER LINES */}
      {showLabels &&
        CALLOUTS.map((c) => {
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
    </svg>
  );
};
