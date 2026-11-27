import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CIRCUIT_TOUR_STEPS,
  CircuitTourStep,
  getTourStepForPart,
} from '../data/circuitTour';
import { ESP32_PARTS } from '../data/espParts';
import { buildCircuitScene, Esp3DSceneController } from '../three/buildCircuitScene';
import { SimulationMetrics } from '../types/simulation';

interface CircuitPageProps {
  metrics: SimulationMetrics;
  onAnimationChange?: (animating: boolean) => void;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const OVERVIEW_STEP = CIRCUIT_TOUR_STEPS[0];
const FLY_DURATION_SEC = 1.35;

interface CircuitHotspot {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

const TOUR_HOTSPOT_STEPS = CIRCUIT_TOUR_STEPS.filter((s) => s.part !== 'OVERVIEW');

export const CircuitPage: React.FC<CircuitPageProps> = ({ metrics, onAnimationChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<Esp3DSceneController | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [hotspots, setHotspots] = useState<CircuitHotspot[]>([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourProgress, setTourProgress] = useState(0);
  const [clickedStep, setClickedStep] = useState<CircuitTourStep | null>(null);

  const camAutoRef = useRef(false);
  const returningOverviewRef = useRef(false);
  const stepElapsedRef = useRef(0);
  const flyElapsedRef = useRef(0);
  const fromPosRef = useRef(new THREE.Vector3(...OVERVIEW_STEP.camPos));
  const fromTargetRef = useRef(new THREE.Vector3(...OVERVIEW_STEP.target));

  const activeStep: CircuitTourStep | null = isAnimating
    ? CIRCUIT_TOUR_STEPS[tourIndex]
    : clickedStep;

  const stateRef = useRef({
    metrics,
    isAnimating,
    showHighlights,
    tourIndex,
    activeStep,
    onAnimationChange,
  });
  stateRef.current = {
    metrics,
    isAnimating,
    showHighlights,
    tourIndex,
    activeStep,
    onAnimationChange,
  };

  useEffect(() => {
    onAnimationChange?.(isAnimating);
  }, [isAnimating, onAnimationChange]);

  useEffect(() => {
    return () => {
      onAnimationChange?.(false);
    };
  }, [onAnimationChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

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

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.05, 80);
    camera.position.set(...OVERVIEW_STEP.camPos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...OVERVIEW_STEP.target);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.zoomSpeed = 1.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 42.0;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.update();

    const circuitScene = buildCircuitScene();
    controllerRef.current = circuitScene;

    const toPos = new THREE.Vector3(...OVERVIEW_STEP.camPos);
    const toTarget = new THREE.Vector3(...OVERVIEW_STEP.target);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const stopAnimationToManual = (returnToOverview: boolean) => {
      camAutoRef.current = false;
      stepElapsedRef.current = 0;
      setTourProgress(0);
      setIsAnimating(false);
      if (returnToOverview) {
        fromPosRef.current.copy(camera.position);
        fromTargetRef.current.copy(controls.target);
        flyElapsedRef.current = 0;
        returningOverviewRef.current = true;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons > 0 && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
        returningOverviewRef.current = false;
        if (stateRef.current.isAnimating) {
          stopAnimationToManual(false);
        }
      }
    };

    const handleWheel = () => {
      returningOverviewRef.current = false;
      if (stateRef.current.isAnimating) {
        stopAnimationToManual(false);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;

      if (stateRef.current.isAnimating) {
        stopAnimationToManual(true);
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = circuitScene.pickPart(raycaster);
      if (!hit) {
        setClickedStep(null);
        return;
      }
      const mapped = getTourStepForPart(hit);
      if (!mapped) {
        setClickedStep(null);
        return;
      }
      setClickedStep((prev) => (prev?.id === mapped.id ? null : mapped));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.isAnimating) return;
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        stopAnimationToManual(true);
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        const delta = e.code === 'ArrowRight' ? 1 : -1;
        fromPosRef.current.copy(camera.position);
        fromTargetRef.current.copy(controls.target);
        flyElapsedRef.current = 0;
        stepElapsedRef.current = 0;
        setTourProgress(0);
        setTourIndex(
          (prev) => (prev + delta + CIRCUIT_TOUR_STEPS.length) % CIRCUIT_TOUR_STEPS.length
        );
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

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
    let uiProgressTick = 0;
    let hotspotTick = 0.05;
    const tempVec = new THREE.Vector3();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      const s = stateRef.current;

      if (s.isAnimating && s.activeStep) {
        const step = s.activeStep;
        stepElapsedRef.current += dt;
        const pct = Math.min(1, stepElapsedRef.current / step.durationSec);
        uiProgressTick += dt;
        if (uiProgressTick >= 0.06) {
          uiProgressTick = 0;
          setTourProgress(pct);
        }

        if (stepElapsedRef.current >= step.durationSec) {
          fromPosRef.current.copy(camera.position);
          fromTargetRef.current.copy(controls.target);
          flyElapsedRef.current = 0;
          stepElapsedRef.current = 0;
          setTourProgress(0);

          if (s.tourIndex >= CIRCUIT_TOUR_STEPS.length - 1) {
            camAutoRef.current = false;
            returningOverviewRef.current = true;
            setIsAnimating(false);
          } else {
            camAutoRef.current = true;
            setTourIndex((prev) => prev + 1);
          }
        } else if (camAutoRef.current) {
          flyElapsedRef.current = Math.min(FLY_DURATION_SEC, flyElapsedRef.current + dt);
          const flyT = easeInOutCubic(flyElapsedRef.current / FLY_DURATION_SEC);
          const dwellPush =
            Math.min(1, stepElapsedRef.current / step.durationSec) *
            (step.id === 'overview' ? 1.1 : 0.65);

          toPos.set(step.camPos[0], step.camPos[1] - dwellPush, step.camPos[2]);
          toTarget.set(...step.target);

          camera.position.lerpVectors(fromPosRef.current, toPos, flyT);
          controls.target.lerpVectors(fromTargetRef.current, toTarget, flyT);
        }
      } else if (returningOverviewRef.current) {
        flyElapsedRef.current = Math.min(FLY_DURATION_SEC, flyElapsedRef.current + dt);
        const flyT = easeInOutCubic(flyElapsedRef.current / FLY_DURATION_SEC);
        toPos.set(...OVERVIEW_STEP.camPos);
        toTarget.set(...OVERVIEW_STEP.target);

        camera.position.lerpVectors(fromPosRef.current, toPos, flyT);
        controls.target.lerpVectors(fromTargetRef.current, toTarget, flyT);

        if (flyT >= 1) {
          returningOverviewRef.current = false;
        }
      }

      controls.update();

      circuitScene.update(dt, elapsed, s.metrics, false, null, s.activeStep);
      renderer.render(circuitScene.scene, camera);

      // Project interactive circular hotspots ~20fps when NOT animating
      hotspotTick += dt;
      if (!s.isAnimating && s.showHighlights && hotspotTick >= 0.05) {
        hotspotTick = 0;
        const w = container.clientWidth;
        const h = container.clientHeight;
        const nextHotspots: CircuitHotspot[] = TOUR_HOTSPOT_STEPS.map((step) => {
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
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible,
          };
        });
        setHotspots(nextHotspots);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      controls.dispose();
      circuitScene.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handlePlayAnimation = () => {
    setClickedStep(null);
    stepElapsedRef.current = 0;
    flyElapsedRef.current = 0;
    setTourProgress(0);
    setTourIndex(1);
    if (cameraRef.current && controlsRef.current) {
      fromPosRef.current.copy(cameraRef.current.position);
      fromTargetRef.current.copy(controlsRef.current.target);
    } else {
      fromPosRef.current.set(...OVERVIEW_STEP.camPos);
      fromTargetRef.current.set(...OVERVIEW_STEP.target);
    }
    returningOverviewRef.current = false;
    camAutoRef.current = true;
    setIsAnimating(true);
  };

  const clickedPartDetail =
    clickedStep && clickedStep.part !== 'OVERVIEW' ? ESP32_PARTS[clickedStep.part] : null;

  return (
    <div className="circuit-stage">
      {/* Top-Down 2D Interactive / Cinematic Viewport */}
      <div
        ref={containerRef}
        className="viewport-shell"
        aria-label="Rangkaian 2D/3D Node AIoT"
      />

      {/* Interactive Hotspot Rings (same style as Diorama 3D, when NOT animating) */}
      {!isAnimating && showHighlights && (
        <div className="hotspots-layer">
          {hotspots.map((hs) => {
            if (!hs.visible) return null;
            const isSelected = clickedStep?.id === hs.id;
            return (
              <button
                key={hs.id}
                type="button"
                title={hs.title}
                aria-label={hs.title}
                className={`hotspot-ring is-part ${isSelected ? 'is-selected' : ''}`}
                style={{ left: `${hs.x}px`, top: `${hs.y}px` }}
                onClick={() => {
                  const matched = TOUR_HOTSPOT_STEPS.find((st) => st.id === hs.id) ?? null;
                  setClickedStep((prev) => (prev?.id === hs.id ? null : matched));
                }}
              >
                <span className="hotspot-dot" style={{ backgroundColor: hs.color }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Center Borderless Caption (ONLY during Cinematic Play Mode) */}
      {isAnimating && activeStep && (
        <div key={activeStep.id} className="cinematic-caption" aria-live="polite">
          <div className="cinematic-meta">
            <span
              className="cinematic-dot"
              style={{ backgroundColor: activeStep.accentColor }}
              aria-hidden="true"
            />
            <span className="cinematic-stage">{activeStep.stage}</span>
          </div>
          <h2 className="cinematic-title">{activeStep.title}</h2>
          <p className="cinematic-desc">{activeStep.description}</p>
          <div className="cinematic-flow">{activeStep.flowSummary}</div>
          <div className="cinematic-progress-track" aria-hidden="true">
            <div
              className="cinematic-progress-fill"
              style={{
                width: `${Math.round(tourProgress * 100)}%`,
                backgroundColor: activeStep.accentColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Top-Right Corner Info Card (when NOT in Play Mode & a component is clicked) */}
      {!isAnimating && clickedStep && (
        <aside className="info-modal" role="dialog" aria-label="Informasi Komponen Rangkaian">
          <div className="modal-head">
            <div>
              <div className="modal-eyebrow">
                {clickedPartDetail ? `Bagian ${clickedPartDetail.designator} · ` : ''}
                {clickedStep.stage}
              </div>
              <h2 className="modal-title">{clickedStep.title}</h2>
            </div>
            <button
              type="button"
              className="close-btn"
              aria-label="Tutup modal"
              onClick={() => setClickedStep(null)}
            >
              ✕
            </button>
          </div>

          <div className="modal-block">
            <span className="modal-block-label">Alur Rangkaian</span>
            {clickedStep.flowSummary}
          </div>

          <div className="modal-block">
            <span className="modal-block-label">Fungsi di Sentinel Node</span>
            {clickedStep.description}
          </div>

          {clickedPartDetail && (
            <>
              <div className="modal-block">
                <span className="modal-block-label">Spesifikasi</span>
                {clickedPartDetail.spec}
              </div>
              <div className="modal-block">
                <span className="modal-block-label">Koneksi Pin</span>
                {clickedPartDetail.pins}
              </div>
            </>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="dock-btn is-active"
              onClick={() => setClickedStep(null)}
            >
              Tutup
            </button>
          </div>
        </aside>
      )}

      {/* Play & Highlight Controls (only shown when NOT animating) */}
      {!isAnimating && (
        <div className="play-tour-wrap">
          <button type="button" className="play-tour-btn" onClick={handlePlayAnimation}>
            <span className="play-tour-icon" aria-hidden="true">
              ▶
            </span>
            <span>Play Animasi</span>
          </button>
          <button
            type="button"
            className={`dock-btn ${showHighlights ? 'is-active' : ''}`}
            onClick={() => setShowHighlights((v) => !v)}
          >
            Highlight
          </button>
        </div>
      )}
    </div>
  );
};
