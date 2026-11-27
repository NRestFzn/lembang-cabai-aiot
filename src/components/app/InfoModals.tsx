import React from 'react';
import { LEAF_CONDITION_META, PARTS_INFO } from '../../data/parts';
import { PartId, SelectedLeafInfo, SimulationMetrics } from '../../types/simulation';

interface LeafModalProps {
  leaf: SelectedLeafInfo;
  leafMeta: (typeof LEAF_CONDITION_META)[SelectedLeafInfo['condition']];
  metrics: SimulationMetrics;
  onClose: () => void;
}

/** Right-side modal: leaf diagnosis for the clicked chili leaf. */
export const LeafModal: React.FC<LeafModalProps> = ({ leaf, leafMeta, metrics, onClose }) => {
  return (
    <aside className="info-modal" role="dialog" aria-label="Informasi Daun Cabai">
      <div className="flex items-start justify-between gap-2.5 border-b border-rule pb-2.5">
        <div>
          <div className="text-[11.5px] font-semibold text-muted">
            Pohon #{leaf.plantIndex + 1} · {leaf.terrace} ·{' '}
            {leaf.plantIndex < 2
              ? 'Simulasi CAM + Kanopi'
              : leaf.plantIndex < 5
              ? 'Teras Atas (Simulasi Live)'
              : 'Sampel Kondisi Teras Bawah'}
          </div>
          <h2 className="mt-0.5 text-base leading-[1.25] font-bold">Kondisi Daun #{leaf.leafIndex + 1}</h2>
        </div>
        <button
          type="button"
          className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border border-rule bg-soft text-sm font-bold text-ink"
          aria-label="Tutup modal"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink px-3 py-[5px] text-[12.5px] font-bold text-[#1e1913]" style={{ backgroundColor: leafMeta.badgeColor }}>
        <span className="h-3 w-3 shrink-0 rounded-full border-[1.5px] border-[#231e16]" style={{ backgroundColor: leaf.colorHex }} />
        <span>{leafMeta.label}</span>
      </div>

      <div className="mt-3 text-[13.5px] leading-[1.5] text-ink">
        <span className="mb-[3px] block text-[11px] font-bold tracking-[0.06em] text-muted uppercase">Kenapa daunnya begini?</span>
        {leaf.plantIndex < 5 &&
        leaf.condition === 'yellowing' &&
        metrics.soilMoisturePct <= 26 &&
        metrics.patekRiskPct < 52
          ? `Kelembaban tanah turun hingga ${Math.round(metrics.soilMoisturePct)}% (stres kekeringan karena berhari-hari tanpa siram), membuat daun mulai menguning dan layu.`
          : leafMeta.cause}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="mini-cell">
          <span>VPD / ΔTd</span>
          <strong>
            {metrics.vpdKpa} kPa · {metrics.dewPointDepressionC}°C
          </strong>
        </div>
        <div className="mini-cell">
          <span>ESP32-CAM</span>
          <strong>
            {leaf.plantIndex >= 2
              ? 'Di Luar FOV CAM'
              : leaf.condition === 'patek_infected'
              ? 'Patek Aktif'
              : leaf.condition === 'patek_early' || leaf.condition === 'yellowing'
              ? 'Anomali Visual'
              : leaf.condition === 'wet_risk'
              ? 'Daun Berembun'
              : 'Normal'}
          </strong>
        </div>
      </div>

      <div className="mt-3 text-[13.5px] leading-[1.5] text-ink">
        <span className="mb-[3px] block text-[11px] font-bold tracking-[0.06em] text-muted uppercase">Tindakan AIoT</span>
        {leaf.plantIndex < 5 &&
        leaf.condition === 'yellowing' &&
        metrics.soilMoisturePct <= 26 &&
        metrics.patekRiskPct < 52
          ? 'Sensor tanah mengirim peringatan Kering ke HP. Tekan tombol Siram Otomatis di HP saat jam VPD aman agar tanaman segera pulih tanpa memicu patek.'
          : leafMeta.aiotAction}
      </div>

      <div className="mt-3.5 flex justify-end gap-2">
        <button
          type="button"
          className="dock-btn is-active"
          onClick={onClose}
        >
          Tutup
        </button>
      </div>
    </aside>
  );
};

interface PartModalProps {
  partMeta: (typeof PARTS_INFO)[PartId];
  onClose: () => void;
}

/** Right-side modal: info for the clicked sensor / part. */
export const PartModal: React.FC<PartModalProps> = ({ partMeta, onClose }) => {
  return (
    <aside className="info-modal" role="dialog" aria-label="Informasi Komponen">
      <div className="flex items-start justify-between gap-2.5 border-b border-rule pb-2.5">
        <div>
          <div className="text-[11.5px] font-semibold text-muted">Komponen {partMeta.code}</div>
          <h2 className="mt-0.5 text-base leading-[1.25] font-bold">{partMeta.name}</h2>
        </div>
        <button
          type="button"
          className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border border-rule bg-soft text-sm font-bold text-ink"
          aria-label="Tutup modal"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="mt-3 text-[13.5px] leading-[1.5] text-ink">
        <span className="mb-[3px] block text-[11px] font-bold tracking-[0.06em] text-muted uppercase">Fungsi Alat</span>
        {partMeta.role}
      </div>

      <div className="mt-3 text-[13.5px] leading-[1.5] text-ink">
        <span className="mb-[3px] block text-[11px] font-bold tracking-[0.06em] text-muted uppercase">Lokasi Penempatan</span>
        {partMeta.placement}
      </div>

      <div className="mt-3 text-[13.5px] leading-[1.5] text-ink">
        <span className="mb-[3px] block text-[11px] font-bold tracking-[0.06em] text-muted uppercase">Alasan Penempatan</span>
        {partMeta.whyHere}
      </div>

      <div className="mt-3.5 flex justify-end gap-2">
        <button type="button" className="dock-btn is-active" onClick={onClose}>
          Tutup
        </button>
      </div>
    </aside>
  );
};
