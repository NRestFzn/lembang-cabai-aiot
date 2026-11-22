import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PART_ORDER, PARTS_INFO } from '../data/parts';
import { buildGardenScene, GardenSceneController, PickResult } from '../three/buildGardenScene';
import {
  AccentId,
  CameraPreset,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../types/simulation';

interface ProjectedLabel {
  id: PartId;
  code: string;
  label: string;
  x: number;
  y: number;
  visible: boolean;
}

interface GardenViewportProps {
  metrics: SimulationMetrics;
  weather: WeatherMode;
  accent: AccentId;
  exploded: boolean;
  showFov: boolean;
  showLabels: boolean;
  cameraPreset: CameraPreset;
  resetTrigger: number;
  selectedPart: PartId | null;
  selectedLeaf: SelectedLeafInfo | null;
  onSelectPart: (part: PartId) => void;
  onSelectLeaf: (leaf: SelectedLeafInfo | null) => void;
  wobbleAmount: number;
}

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { pos: [5.95, 4.15, 5.95], target: [-0.25, 0.72, -0.05] },
  canopy: { pos: [3.1, 2.6, 3.1], target: [0.15, 0.92, -0.55] },
  soil: { pos: [2.2, 1.35, 3.1], target: [-0.45, 0.28, -0.4] },
  node: { pos: [0.15, 2.7, 2.65], target: [-2.45, 1.55, -0.95] },
};

const SHORT_LABEL: Record<PartId, string> = {
  solar: 'SOLAR 10W',
  enclosure: 'ESP32 BOX',
  esp32cam: 'ESP32-CAM',
  dht22: 'DHT22 KANOPI',
  soil_probe: 'SOIL PROBE',
  solenoid: 'SOLENOID',
  pump: 'POMPA',
  chili_plant: 'CABAI',
  terrace: 'TERASERING',
};

export const GardenViewport: React.FC<GardenViewportProps> = ({
  metrics,
  weather,
  accent,
  exploded,
  showFov,
  showLabels,
  cameraPreset,
  resetTrigger,
  selectedPart,
  selectedLeaf,
  onSelectPart,
  onSelectLeaf,
  wobbleAmount,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<GardenSceneController | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  const stateRef = useRef({
    metrics,
    weather,
    accent,
    exploded,
    showFov,
    showLabels,
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
    selectedPart,
    selectedLeaf,
  };

  const onSelectRef = useRef(onSelectPart);
  onSelectRef.current = onSelectPart;
  const onSelectLeafRef = useRef(onSelectLeaf);
  onSelectLeafRef.current = onSelectLeaf;

  const [labels, setLabels] = useState<ProjectedLabel[]>([]);

  // Trigger smooth camera transition on preset change or reset
  useEffect(() => {
    const p = CAMERA_PRESETS[cameraPreset];
    targetCamPosRef.current = new THREE.Vector3(...p.pos);
    targetLookAtRef.current = new THREE.Vector3(...p.target);
  }, [cameraPreset, resetTrigger]);

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

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.iso.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.iso.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.2;
    controls.maxDistance = 14.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minPolarAngle = 0.25;
    controlsRef.current = controls;

    // Cancel preset lerp when user grabs camera manually
    const cancelPresetLerp = () => {
      targetCamPosRef.current = null;
      targetLookAtRef.current = null;
    };
    controls.addEventListener('start', cancelPresetLerp);

    const garden = buildGardenScene();
    controllerRef.current = garden;

    // Click picking (ignore drag gestures)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit: PickResult | null = garden.pickPart(raycaster);
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

      // Update projected 2D labels ~20fps to keep React light
      labelTick += dt;
      if (s.showLabels && labelTick >= 0.05) {
        labelTick = 0;
        const w = container.clientWidth;
        const h = container.clientHeight;
        const nextLabels: ProjectedLabel[] = PART_ORDER.map((id) => {
          const info = PARTS_INFO[id];
          tempVec.set(...info.anchorLocal);
          tempVec.project(camera);
          const visible = tempVec.z < 1 && tempVec.x > -0.95 && tempVec.x < 0.95 && tempVec.y > -0.95 && tempVec.y < 0.95;
          return {
            id,
            code: info.code,
            label: SHORT_LABEL[id],
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible,
          };
        });
        setLabels(nextLabels);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', cancelPresetLerp);
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

  return (
    <div className="viewport-shell" ref={containerRef}>
      {/* Optional subtle SVG hand-drawn wobble filter on stage borders */}
      <svg className="svg-defs" aria-hidden="true">
        <defs>
          <filter id="risowobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={wobbleAmount} />
          </filter>
        </defs>
      </svg>

      {showLabels && (
        <div className="labels-layer" style={{ filter: wobbleAmount > 0 ? 'url(#risowobble)' : undefined }}>
          {labels.map(
            (lb) =>
              lb.visible && (
                <button
                  key={lb.id}
                  type="button"
                  className={`pin-label ${selectedPart === lb.id ? 'is-selected' : ''}`}
                  style={{ left: `${lb.x}px`, top: `${lb.y}px` }}
                  onClick={() => onSelectPart(lb.id)}
                >
                  <span className="pin-code">{lb.code}</span>
                  <span>{lb.label}</span>
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
};
