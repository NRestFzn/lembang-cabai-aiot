import React from 'react';
import { CIRCUIT_CATALOG, CircuitModuleCategory, EspPartKey } from '../data/espParts';

interface Circuit2DViewProps {
  selectedPart: EspPartKey | null;
  onSelectPart: (part: EspPartKey) => void;
}

const CATEGORY_SECTIONS: { key: CircuitModuleCategory; title: string; badge: string }[] = [
  { key: 'Daya', title: 'Sumber Daya & Regulasi', badge: 'Solar · LiFePO4 · Buck' },
  { key: 'Sensor', title: 'Sensor Kanopi & Tanah', badge: 'I2C · ADC · 1-Wire' },
  { key: 'Kontrol', title: 'Mikrokontroler, Kamera & Log', badge: 'ESP32 · OV2640 · SPI' },
  { key: 'Aktuator', title: 'Driver, Relay & Aktuator', badge: 'GPIO → 12V Load' },
];

export const Circuit2DView: React.FC<Circuit2DViewProps> = ({ selectedPart, onSelectPart }) => {
  return (
    <div className="circuit-2d-shell" aria-label="Tampilan 2D Skema Pinout Alat">
      <div className="circuit-2d-board">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-rule pb-3.5">
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">Papan Persiapan Rangkaian (Belum Dirakit)</div>
            <h2 className="mt-0.5 text-lg font-extrabold">Peta Pinout 2D · 16 Modul AIoT Lembang</h2>
          </div>
          <span className="rounded-full border-[1.5px] border-ink bg-accent-soft px-3 py-[5px] text-xs font-bold text-[#191611]">Klik modul untuk lihat detail pin & fungsi</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3.5 max-[1040px]:grid-cols-2 max-[780px]:grid-cols-1">
          {CATEGORY_SECTIONS.map((section) => {
            const items = CIRCUIT_CATALOG.filter((item) => item.category === section.key);
            return (
              <section key={section.key} className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-rule bg-soft p-3">
                <div className="lane-head">
                  <h3 className="m-0 text-[13.5px] font-extrabold">{section.title}</h3>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted">{section.badge}</span>
                </div>
                <div className="flex flex-col gap-[9px]">
                  {items.map((item) => {
                    const isSelected = selectedPart === item.part;
                    return (
                      <button
                        key={item.part}
                        type="button"
                        className={`circuit-2d-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onSelectPart(item.part)}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="rounded-md border border-ink bg-accent px-[7px] py-0.5 font-mono text-[11px] font-extrabold text-[#191611]">{item.code}</span>
                          <span className="card-voltage">{item.voltage}</span>
                        </div>
                        <div className="mt-1.5 text-[13px] font-bold leading-[1.3]">{item.label}</div>
                        <div className="mt-[7px] flex flex-wrap gap-1">
                          {item.pins.map((pin) => (
                            <span key={pin} className="pin-chip">
                              {pin}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
