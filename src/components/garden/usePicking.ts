import * as THREE from 'three';
import { GardenSceneController, PickResult } from '../../three/buildGardenScene';

/** Pointer position as normalized device coordinates for the given canvas. */
export function pointerToNDC(e: PointerEvent, domElement: HTMLElement): THREE.Vector2 {
  const rect = domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
}

/** True when the pointer-up is a click, not a drag gesture. */
export function isClick(downX: number, downY: number, e: PointerEvent): boolean {
  return Math.hypot(e.clientX - downX, e.clientY - downY) <= 6;
}

/** Raycast-pick a garden part from a pointer event (clicks only). */
export function pickGardenPart(
  e: PointerEvent,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  garden: GardenSceneController
): PickResult | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointerToNDC(e, renderer.domElement), camera);
  return garden.pickPart(raycaster);
}
