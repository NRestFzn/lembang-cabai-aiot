import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ESP32_PARTS, EspPartKey } from '../data/espParts';
import {
  buildPhysicalNodeScene,
  PhysicalNodeSceneController,
} from '../three/buildPhysicalNodeScene';
import { SimulationMetrics } from '../types/simulation';

interface PhysicalNodePageProps {
  metrics: SimulationMetrics;
}

const DEFAULT_CAM_POS: [number, number, number] = [4.0, 3.8, 7.8];
const DEFAULT_CAM_TARGET: [number, number, number] = [0.25, 2.2, 0.15];

export const PhysicalNodePage: React.FC<PhysicalNodePageProps> = ({ metrics }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PhysicalNodeSceneController | null>(null);

  const [explodePct, setExplodePct] = useState(0);
  const [selectedPart, setSelectedPart] = useState<EspPartKey | null>(null);
  const resettingRef = useRef(false);

  const stateRef = useRef({
    metrics,
    explodePct,
  });
  stateRef.current = {
    metrics,
    explodePct,
  };

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

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 60);
    camera.position.set(...DEFAULT_CAM_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...DEFAULT_CAM_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.zoomSpeed = 1.15;
    controls.minDistance = 1.4;
    controls.maxDistance = 18.0;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.update();

    const nodeScene = buildPhysicalNodeScene();
    controllerRef.current = nodeScene;

    const defaultPos = new THREE.Vector3(...DEFAULT_CAM_POS);
    const defaultTarget = new THREE.Vector3(...DEFAULT_CAM_TARGET);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons > 0 && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
        resettingRef.current = false;
      }
    };

    const handleWheel = () => {
      resettingRef.current = false;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = nodeScene.pickPart(raycaster);
      setSelectedPart((prev) => (!hit ? null : prev === hit ? null : hit));
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });

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

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.max(0, Math.min(0.05, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      if (resettingRef.current) {
        const k = 1 - Math.exp(-5.0 * dt);
        camera.position.lerp(defaultPos, k);
        controls.target.lerp(defaultTarget, k);
        if (
          camera.position.distanceTo(defaultPos) < 0.04 &&
          controls.target.distanceTo(defaultTarget) < 0.04
        ) {
          camera.position.copy(defaultPos);
          controls.target.copy(defaultTarget);
          resettingRef.current = false;
        }
      }

      controls.update();

      const s = stateRef.current;
      nodeScene.update(dt, elapsed, s.metrics, s.explodePct / 100);
      renderer.render(nodeScene.scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      controls.dispose();
      nodeScene.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const isExploded = explodePct >= 50;
  const partInfo = selectedPart ? ESP32_PARTS[selectedPart] : null;

  return (
    <div className="circuit-stage">
      {/* Free-Orbit 3D Hardware Unit Viewport (No Soil / No Terrace) */}
      <div
        ref={containerRef}
        className="viewport-shell"
        aria-label="Unit Fisik Purwarupa Alat AIoT (Bisa Dibongkar)"
      />

      {/* Top-Right Detail Modal when clicking exterior or internal module */}
      {partInfo && (
        <aside className="info-modal" role="dialog" aria-label="Informasi Komponen Alat Asli">
          <div className="modal-head">
            <div>
              <div className="modal-eyebrow">Bagian {partInfo.designator} · Purwarupa Alat</div>
              <h2 className="modal-title">{partInfo.name}</h2>
            </div>
            <button
              type="button"
              className="close-btn"
              aria-label="Tutup modal"
              onClick={() => setSelectedPart(null)}
            >
              ✕
            </button>
          </div>

          <div className="modal-block">
            <span className="modal-block-label">Spesifikasi</span>
            {partInfo.spec}
          </div>

          <div className="modal-block">
            <span className="modal-block-label">Fungsi di Sentinel Node</span>
            {partInfo.role}
          </div>

          <div className="modal-block">
            <span className="modal-block-label">Koneksi Pin</span>
            {partInfo.pins}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="dock-btn is-active"
              onClick={() => setSelectedPart(null)}
            >
              Tutup
            </button>
          </div>
        </aside>
      )}

      {/* Compact Bottom Dock: Disassemble Toggle, Slider & Reset Camera */}
      <nav className="bottom-dock" aria-label="Kontrol Bongkar Alat Asli">
        <button
          type="button"
          className={`dock-btn ${isExploded ? 'is-active' : 'is-primary'}`}
          onClick={() => setExplodePct(isExploded ? 0 : 100)}
        >
          {isExploded ? 'Rakit Rapat' : 'Bongkar Alat'}
        </button>

        <div className="dock-divider" />

        <div className="time-control">
          <span className="time-text">Bongkar {explodePct}%</span>
          <input
            type="range"
            className="time-slider"
            aria-label="Persentase bongkar alat"
            min={0}
            max={100}
            step={1}
            value={explodePct}
            onChange={(e) => setExplodePct(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="dock-divider" />

        <button
          type="button"
          className="dock-btn"
          onClick={() => {
            resettingRef.current = true;
          }}
        >
          Reset Kamera
        </button>
      </nav>
    </div>
  );
};
