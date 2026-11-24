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
        <div className="circuit-2d-header">
          <div>
            <div className="circuit-2d-eyebrow">Papan Persiapan Rangkaian (Belum Dirakit)</div>
            <h2 className="circuit-2d-title">Peta Pinout 2D · 16 Modul AIoT Lembang</h2>
          </div>
          <span className="circuit-2d-badge">Klik modul untuk lihat detail pin & fungsi</span>
        </div>

        <div className="circuit-2d-columns">
          {CATEGORY_SECTIONS.map((section) => {
            const items = CIRCUIT_CATALOG.filter((item) => item.category === section.key);
            return (
              <section key={section.key} className="circuit-2d-lane">
                <div className="lane-head">
                  <h3>{section.title}</h3>
                  <span>{section.badge}</span>
                </div>
                <div className="lane-cards">
                  {items.map((item) => {
                    const isSelected = selectedPart === item.part;
                    return (
                      <button
                        key={item.part}
                        type="button"
                        className={`circuit-2d-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onSelectPart(item.part)}
                      >
                        <div className="card-top-row">
                          <span className="card-code">{item.code}</span>
                          <span className="card-voltage">{item.voltage}</span>
                        </div>
                        <div className="card-name">{item.label}</div>
                        <div className="card-pins">
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
