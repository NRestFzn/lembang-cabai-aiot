import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildGardenScene, GardenSceneController, PickResult } from '../../three/buildGardenScene';
import {
  AccentId,
  CameraPreset,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../../types/simulation';
import { CAMERA_PRESETS, useCameraPreset } from './useGardenCamera';
import { ProjectedHotspot, ProjectedLabel, projectHotspots, projectLabels } from './useLabelProjection';
import { isClick, pickGardenPart } from './usePicking';

export interface UseGardenSceneProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  accent: AccentId;
  exploded: boolean;
  showFov: boolean;
  showLabels: boolean;
  showHighlights: boolean;
  cameraPreset: CameraPreset;
  resetTrigger: number;
  selectedPart: PartId | null;
  selectedLeaf: SelectedLeafInfo | null;
  onSelectPart: (part: PartId) => void;
  onSelectLeaf: (leaf: SelectedLeafInfo | null) => void;
}

/**
 * Owns the garden 3D scene: renderer / camera / OrbitControls setup, WASD
 * camera movement, pointer picking, resize handling, and the render loop
 * (including ~20fps label / hotspot projection). The viewport component
 * only renders the projected overlays returned here.
 */
export function useGardenScene(props: UseGardenSceneProps) {
  const {
    metrics,
    weather,
    accent,
    exploded,
    showFov,
    showLabels,
    showHighlights,
    cameraPreset,
    resetTrigger,
    selectedPart,
    selectedLeaf,
    onSelectPart,
    onSelectLeaf,
  } = props;

  const { targetCamPosRef, targetLookAtRef, cancelPresetLerp } = useCameraPreset(
    cameraPreset,
    resetTrigger
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<GardenSceneController | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const stateRef = useRef({
    metrics,
    weather,
    accent,
    exploded,
    showFov,
    showLabels,
    showHighlights,
    selectedPart,
    selectedLeaf,
  });
  stateRef.current = {
    metrics,
    weather,
    accent,
    exploded,
    showFov,
    showLabels,
    showHighlights,
    selectedPart,
    selectedLeaf,
  };

  const onSelectRef = useRef(onSelectPart);
  onSelectRef.current = onSelectPart;
  const onSelectLeafRef = useRef(onSelectLeaf);
  onSelectLeafRef.current = onSelectLeaf;

  const [labels, setLabels] = useState<ProjectedLabel[]>([]);
  const [hotspots, setHotspots] = useState<ProjectedHotspot[]>([]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.03, 70);
    camera.position.set(...CAMERA_PRESETS.iso.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.iso.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.zoomSpeed = 1.25;
    controls.minDistance = 0.45;
    controls.maxDistance = 15.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minPolarAngle = 0.1;
    controlsRef.current = controls;

    controls.addEventListener('start', cancelPresetLerp);

    // WASD + Arrow + Q/E smooth movement
    const keysDown = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
      const code = e.code;
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'KeyQ' ||
        code === 'KeyE' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        keysDown.add(code);
        cancelPresetLerp();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };
    const handleWindowBlur = () => {
      keysDown.clear();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    const garden = buildGardenScene();
    controllerRef.current = garden;

    // Click picking (ignore drag gestures)
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isClick(downX, downY, e)) return;
      const hit: PickResult | null = pickGardenPart(e, renderer, camera, garden);
      if (hit) {
        onSelectRef.current(hit.partId);
        if (hit.leaf) {
          onSelectLeafRef.current(hit.leaf);
        } else {
          onSelectLeafRef.current(null);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // ResizeObserver for responsive container
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let animId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let labelTick = 0.05;
    const tempVec = new THREE.Vector3();
    const forwardVec = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    const moveVec = new THREE.Vector3();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      if (targetCamPosRef.current && targetLookAtRef.current) {
        camera.position.lerp(targetCamPosRef.current, Math.min(1, dt * 5));
        controls.target.lerp(targetLookAtRef.current, Math.min(1, dt * 5));
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.03) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      } else if (keysDown.size > 0) {
        camera.getWorldDirection(forwardVec);
        forwardVec.y = 0;
        if (forwardVec.lengthSq() > 0.0001) forwardVec.normalize();
        rightVec.crossVectors(forwardVec, camera.up).normalize();

        moveVec.set(0, 0, 0);
        if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveVec.add(forwardVec);
        if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveVec.sub(forwardVec);
        if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveVec.add(rightVec);
        if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveVec.sub(rightVec);
        if (keysDown.has('KeyE')) moveVec.y += 0.7;
        if (keysDown.has('KeyQ')) moveVec.y -= 0.7;

        if (moveVec.lengthSq() > 0) {
          const distScale = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.65, 1.4, 4.5);
          moveVec.normalize().multiplyScalar(distScale * dt);

          const nextTargetX = THREE.MathUtils.clamp(controls.target.x + moveVec.x, -4.8, 4.8);
          const nextTargetY = THREE.MathUtils.clamp(controls.target.y + moveVec.y, -0.25, 3.2);
          const nextTargetZ = THREE.MathUtils.clamp(controls.target.z + moveVec.z, -4.0, 4.0);

          const dx = nextTargetX - controls.target.x;
          const dy = nextTargetY - controls.target.y;
          const dz = nextTargetZ - controls.target.z;

          controls.target.set(nextTargetX, nextTargetY, nextTargetZ);
          camera.position.x += dx;
          camera.position.y = Math.max(0.05, camera.position.y + dy);
          camera.position.z += dz;
        }
      }

      controls.update();

      const s = stateRef.current;
      garden.update(
        dt,
        elapsed,
        s.metrics,
        s.weather,
        s.accent,
        s.exploded,
        s.showFov,
        s.selectedPart,
        s.selectedLeaf
      );
      renderer.render(garden.scene, camera);

      // Update projected 2D labels & circular hotspots ~20fps to keep React light
      labelTick += dt;
      if ((s.showLabels || s.showHighlights) && labelTick >= 0.05) {
        labelTick = 0;
        const w = container.clientWidth;
        const h = container.clientHeight;

        if (s.showLabels) {
          setLabels(projectLabels(camera, w, h, tempVec));
        }

        if (s.showHighlights) {
          setHotspots(projectHotspots(garden, camera, w, h, tempVec));
        }
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', cancelPresetLerp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      garden.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return { containerRef, labels, hotspots };
}
