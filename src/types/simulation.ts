export type AccentId = 'mint' | 'tomato' | 'cobalt' | 'mustard' | 'blush';

export type WeatherMode = 'sunny' | 'foggy' | 'rainy';

export type CameraPreset = 'iso' | 'canopy' | 'soil' | 'node';

export type PartId =
  | 'solar'
  | 'enclosure'
  | 'esp32cam'
  | 'dht22'
  | 'soil_probe'
  | 'solenoid'
  | 'pump'
  | 'terrace'
  | 'chili_plant';

export type AiotDecision = 'IDLE' | 'SIRAM' | 'TUNDA' | 'KURANGI';

export type LeafCondition = 'healthy' | 'wet_risk' | 'yellowing' | 'patek_early';

export interface SelectedLeafInfo {
  plantIndex: number;
  leafIndex: number;
  terrace: 'Teras Atas' | 'Teras Bawah';
  condition: LeafCondition;
  colorHex: string;
}

export interface PartInfo {
  id: PartId;
  code: string;
  name: string;
  placement: string;
  whyHere: string;
  spec: string;
  anchorLocal: [number, number, number];
}

export interface SimulationMetrics {
  timeHours: number; // 0..24
  dayCount: number;
  ambientTempC: number;
  relativeHumidity: number;
  vpdKpa: number;
  soilMoisturePct: number; // 0..100
  leafWetnessPct: number; // 0..100
  leafWetnessHours: number; // continuous wet hours
  estimatedDryMinutes: number;
  patekRiskPct: number; // 0..100 (12-36h forecast)
  symptomSeverity: number; // 0..1 visual spotting
  batteryPct: number; // 0..100
  isWatering: boolean;
  wateringRemainingSec: number;
  aiotMode: boolean;
  lastDecision: AiotDecision;
  decisionReason: string;
  offlineBufferedCount: number;
}

export interface NudgeBanner {
  id: number;
  tone: 'warn' | 'good' | 'info';
  title: string;
  detail: string;
}

export interface SerialLogEntry {
  id: number;
  simTime: string;
  tag: 'SENS' | 'RISK' | 'VALVE' | 'NUDGE' | 'CAM' | 'SYNC';
  message: string;
}
