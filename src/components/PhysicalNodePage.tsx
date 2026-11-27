import React from 'react';
import { ESP32_PARTS } from '../data/espParts';
import { SimulationMetrics } from '../types/simulation';
import { usePhysicalNodeScene } from './physical/usePhysicalNodeScene';

interface PhysicalNodePageProps {
  metrics: SimulationMetrics;
}

export const PhysicalNodePage: React.FC<PhysicalNodePageProps> = ({ metrics }) => {
  const scene = usePhysicalNodeScene(metrics);
  const partInfo = scene.selectedPart ? ESP32_PARTS[scene.selectedPart] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Free-Orbit 3D Hardware Unit Viewport (No Soil / No Terrace) */}
      <div
        ref={scene.containerRef}
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
              onClick={() => scene.setSelectedPart(null)}
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
              onClick={() => scene.setSelectedPart(null)}
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
          className={`dock-btn ${scene.isExploded ? 'is-active' : 'is-primary'}`}
          onClick={() => scene.setExplodePct(scene.isExploded ? 0 : 100)}
        >
          {scene.isExploded ? 'Rakit Rapat' : 'Bongkar Alat'}
        </button>

        <div className="h-6 w-px bg-rule max-[780px]:hidden" />

        <div className="flex items-center gap-2 px-1">
          <span className="min-w-[72px] font-mono text-[13px] font-bold whitespace-nowrap">Bongkar {scene.explodePct}%</span>
          <input
            type="range"
            className="w-[120px] cursor-pointer accent-ink"
            aria-label="Persentase bongkar alat"
            min={0}
            max={100}
            step={1}
            value={scene.explodePct}
            onChange={(e) => scene.setExplodePct(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="h-6 w-px bg-rule max-[780px]:hidden" />

        <button
          type="button"
          className="dock-btn"
          onClick={scene.onResetCamera}
        >
          Reset Kamera
        </button>
      </nav>
    </div>
  );
};
