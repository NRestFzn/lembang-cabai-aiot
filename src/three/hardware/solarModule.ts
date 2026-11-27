import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 13. PANEL SURYA 6V / 10W — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildSolarModule(kit: KitBuilderContext): THREE.Group {
  const solarGroup = new THREE.Group();
  const pvZ = 0.07;
  const pvH = 0.12;
  const pvTop = pvZ + pvH;
  const pvFrame = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(2.42, pvH, 1.94, 0.04)),
    kit.materials.metalSilverMat,
    1.022
  );
  pvFrame.position.y = pvZ;
  solarGroup.add(pvFrame);

  const pvCellTex = createCanvasDecal(512, 420, (c) => {
    c.fillStyle = '#172554';
    c.fillRect(0, 0, 512, 420);
    const cols = 6;
    const rows = 4;
    const pad = 12;
    const cw = (512 - pad * (cols + 1)) / cols;
    const ch = (420 - pad * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let colIdx = 0; colIdx < cols; colIdx++) {
        const x = pad + colIdx * (cw + pad);
        const y = pad + r * (ch + pad);
        c.fillStyle = '#1e3a8a';
        c.fillRect(x, y, cw, ch);
        c.fillStyle = '#cbd5e1';
        c.fillRect(x + cw * 0.28, y, 2, ch);
        c.fillRect(x + cw * 0.72, y, 2, ch);
      }
    }
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.font = 'bold 18px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText('PV 6V · 10W', 498, 404);
  });
  kit.addDecalPlane(solarGroup, 2.24, 1.76, pvTop + 0.004, pvCellTex);

  const pvJbox = kit.registerExplodable('SOLAR', 0.92, 0, 0.42, solarGroup, pvTop);
  const pvBoxMesh = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.28, 0.12, 0.54, 0.03)),
    kit.materials.icDarkMat,
    1.05
  );
  pvBoxMesh.position.y = 0.06;
  pvJbox.add(pvBoxMesh);
  tagEspPart(solarGroup, 'SOLAR');
  return solarGroup;
}
