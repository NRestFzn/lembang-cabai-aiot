import * as THREE from 'three';
import { CIRCUIT_TOUR_STEPS } from '../../data/circuitTour';

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const OVERVIEW_STEP = CIRCUIT_TOUR_STEPS[0];
export const FLY_DURATION_SEC = 1.35;

export interface CircuitHotspot {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

export const TOUR_HOTSPOT_STEPS = CIRCUIT_TOUR_STEPS.filter((s) => s.part !== 'OVERVIEW');

/**
 * Project the tour hotspots into screen space. Pure: given the camera and
 * the container size, returns one hotspot per tour step with visibility.
 */
export function projectTourHotspots(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  tempVec: THREE.Vector3
): CircuitHotspot[] {
  return TOUR_HOTSPOT_STEPS.map((step) => {
    tempVec.set(...step.ringPos);
    tempVec.project(camera);
    const visible =
      tempVec.z < 1 &&
      tempVec.x > -0.96 &&
      tempVec.x < 0.96 &&
      tempVec.y > -0.96 &&
      tempVec.y < 0.96;
    return {
      id: step.id,
      title: step.title,
      color: step.accentColor,
      x: (tempVec.x * 0.5 + 0.5) * width,
      y: (-tempVec.y * 0.5 + 0.5) * height,
      visible,
    };
  });
}
