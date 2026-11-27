import { EspPartKey } from '../espParts';

export interface CircuitTourStep {
  id: string;
  part: EspPartKey | 'OVERVIEW';
  stage: string;
  title: string;
  description: string;
  flowSummary: string;
  accentColor: string;
  target: [number, number, number];
  camPos: [number, number, number];
  ringPos: [number, number, number];
  frameSize: [number, number];
  flowPaths: Array<[number, number, number][]>;
  durationSec: number;
}
