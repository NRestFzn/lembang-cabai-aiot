import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraPreset } from '../../types/simulation';

export const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { pos: [5.95, 4.15, 5.95], target: [-0.25, 0.72, -0.05] },
  canopy: { pos: [3.1, 2.6, 3.1], target: [0.15, 0.92, -0.55] },
  soil: { pos: [2.2, 1.35, 3.1], target: [-0.45, 0.28, -0.4] },
  node: { pos: [0.15, 2.7, 2.65], target: [-2.45, 1.55, -0.95] },
};

/**
 * Smooth camera-preset transitions: on preset change (or reset trigger)
 * records the target position / look-at; the scene loop lerps toward them
 * until `cancelPresetLerp` is called by manual camera input.
 */
export function useCameraPreset(cameraPreset: CameraPreset, resetTrigger: number) {
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Trigger smooth camera transition on preset change or reset
  useEffect(() => {
    const p = CAMERA_PRESETS[cameraPreset];
    targetCamPosRef.current = new THREE.Vector3(...p.pos);
    targetLookAtRef.current = new THREE.Vector3(...p.target);
  }, [cameraPreset, resetTrigger]);

  const cancelPresetLerp = () => {
    targetCamPosRef.current = null;
    targetLookAtRef.current = null;
  };

  return { targetCamPosRef, targetLookAtRef, cancelPresetLerp };
}
