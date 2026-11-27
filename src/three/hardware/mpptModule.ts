import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// 14. CN3791 MPPT SOLAR CHARGER + BMS — moved from hardwareModules.ts (createHardwareModulesKit).
export function buildMpptModule(kit: KitBuilderContext): THREE.Group {
  const mpptGroup = new THREE.Group();
  const mpptZ = 0.06;
  const mpptH = 0.085;
  const mpptTop = mpptZ + mpptH;
  const mpptPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(2.08, mpptH, 1.38, 0.07)),
    kit.materials.bluePcbMat,
    1.022
  );
  mpptPcb.position.y = mpptZ;
  mpptGroup.add(mpptPcb);

  kit.addGoldPads(mpptGroup, mpptTop + 0.005, [
    [-0.92, -0.58],
    [0.92, -0.58],
    [-0.92, 0.58],
    [0.92, 0.58],
  ]);

  const mpptSilkTex = createCanvasDecal(480, 320, (c) => {
    c.fillStyle = '#eff6ff';
    c.textBaseline = 'middle';
    c.font = 'bold 19px ui-monospace, monospace';
    c.textAlign = 'left';
    c.fillText('PV+', 68, 128);
    c.fillText('PV-', 68, 198);
    c.textAlign = 'right';
    c.fillText('BAT+', 412, 128);
    c.fillText('BAT-', 412, 198);
    c.textAlign = 'center';
    c.font = 'bold 21px ui-monospace, monospace';
    c.fillText('CN3791 MPPT', 240, 34);
    c.font = 'bold 14px ui-monospace, monospace';
    c.fillStyle = '#bfdbfe';
    c.fillText('SOLAR CHARGER', 240, 290);
  });
  kit.addDecalPlane(mpptGroup, 2.0, 1.32, mpptTop + 0.003, mpptSilkTex);

  kit.addScrewTerminal('MPPT', mpptGroup, -0.84, 0.02, mpptTop, kit.materials.blueTermMat, 'left');
  kit.addScrewTerminal('MPPT', mpptGroup, 0.84, 0.02, mpptTop, kit.materials.blueTermMat, 'right');

  const mpptIndGrp = kit.registerExplodable('MPPT', 0.06, -0.18, 0.6, mpptGroup, mpptTop);
  const mpptInd = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.46, 0.24, 0.46, 0.04)),
    kit.materials.icDarkMat,
    1.045
  );
  mpptInd.position.y = 0.12;
  mpptIndGrp.add(mpptInd);
  const mppt4r7 = createCanvasDecal(128, 128, (c) => {
    c.fillStyle = '#e5e7eb';
    c.font = 'bold 38px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('4R7', 64, 66);
  });
  kit.addDecalPlane(mpptIndGrp, 0.4, 0.4, 0.245, mppt4r7);

  const mpptIcGrp = kit.registerExplodable('MPPT', -0.26, 0.24, 0.48, mpptGroup, mpptTop);
  const mpptIc = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.28, 0.075, 0.24)),
    kit.materials.icDarkMat,
    1.07
  );
  mpptIc.position.y = 0.038;
  mpptIcGrp.add(mpptIc);

  const mpptChgLed = new THREE.Mesh(
    kit.trackGeo(new THREE.BoxGeometry(0.1, 0.04, 0.06)),
    kit.factory.createToon('#f59e0b')
  );
  mpptChgLed.position.set(0.32, mpptTop + 0.02, 0.26);
  mpptGroup.add(mpptChgLed);
  tagEspPart(mpptGroup, 'MPPT');
  return mpptGroup;
}
