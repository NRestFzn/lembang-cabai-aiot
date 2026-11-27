import * as THREE from 'three';
import { createCanvasDecal, createRoundedBoxGeo } from '../hardwareModules';
import { CircuitContext } from './context';

export interface BreadboardLayout {
  bbCol: (idx: number) => number;
  bbW: number;
  bbD: number;
  bbTop: number;
}

/** The 69-column solderless breadboard (original section 0). */
export function buildBreadboard(ctx: CircuitContext): BreadboardLayout {
  const { scene, factory, trackGeo, trackMat, textures } = ctx;
  // =========================================================================
  // 0. ONE GIANT HORIZONTAL SOLDERLESS BREADBOARD (69 Columns x 10 + 4 Rails)
  // =========================================================================
  const bbCols = 69;
  const bbCol = (idx: number) => -7.48 + idx * 0.22; // idx 0..68 -> -7.48 .. +7.48
  const bbW = 15.64;
  const bbD = 4.54;
  const bbTop = 0.22;

  const bbGroup = new THREE.Group();
  bbGroup.position.set(0, 0, 0);
  scene.add(bbGroup);

  const bbBodyMat = factory.createToon('#f6f3eb');
  const bbSkirtMat = factory.createToon('#e5dfd3');
  const bbTrenchMat = factory.createToon('#dad3c5');
  const bbRailRedMat = factory.createToon('#ef4444');
  const bbRailOrangeMat = factory.createToon('#f97316');
  const bbRailBlueMat = factory.createToon('#2563eb');
  const bbSocketRimMat = factory.createToon('#e2dcd0');
  const bbHoleMat = factory.createToon('#a39c90');
  const bbSocketGeo = trackGeo(new THREE.BoxGeometry(0.095, 0.016, 0.095));
  const bbSocketRimGeo = trackGeo(new THREE.BoxGeometry(0.128, 0.008, 0.128));

  // Stepped bottom mounting flange (y: 0 -> 0.05) — light tones, no heavy black outline
  const bbSkirt = new THREE.Mesh(
    trackGeo(createRoundedBoxGeo(bbW + 0.16, 0.05, bbD + 0.16, 0.09)),
    bbSkirtMat
  );
  bbSkirt.position.y = 0;
  bbSkirt.receiveShadow = true;
  bbSkirt.castShadow = true;
  bbGroup.add(bbSkirt);

  // Lower core body with recessed horizontal DIP trench floor (y: 0.04 -> 0.16)
  const bbCore = new THREE.Mesh(
    trackGeo(createRoundedBoxGeo(bbW, 0.12, bbD, 0.06)),
    bbTrenchMat
  );
  bbCore.position.y = 0.04;
  bbCore.receiveShadow = true;
  bbGroup.add(bbCore);

  // 4 horizontal raised strips (y: 0.15 -> 0.22) forming soft grey-white DIP trench & rail grooves
  [
    { z: -1.87, d: 0.56 }, // Top Power Rail (-GND, +5V)
    { z: -0.88, d: 1.1 },  // Upper terminal strip (a..e)
    { z: 0.88, d: 1.1 },   // Lower terminal strip (f..j)
    { z: 1.87, d: 0.56 },  // Bottom Power Rail (+3V3, -GND)
  ].forEach(({ z, d }) => {
    const strip = new THREE.Mesh(
      trackGeo(createRoundedBoxGeo(bbW - 0.14, 0.07, d, 0.04)),
      bbBodyMat
    );
    strip.position.set(0, 0.15, z);
    strip.receiveShadow = true;
    strip.castShadow = true;
    bbGroup.add(strip);
  });

  // Crisp 3D horizontal rail stripes along the full breadboard width
  const railStripeGeo = trackGeo(new THREE.BoxGeometry(bbW - 0.44, 0.008, 0.036));
  [
    { z: -2.1, mat: bbRailBlueMat },    // Top -GND
    { z: -1.64, mat: bbRailRedMat },    // Top +5V
    { z: 1.64, mat: bbRailOrangeMat },  // Bottom +3V3
    { z: 2.1, mat: bbRailBlueMat },     // Bottom -GND
  ].forEach(({ z, mat }) => {
    const s = new THREE.Mesh(railStripeGeo, mat);
    s.position.set(0, bbTop + 0.003, z);
    bbGroup.add(s);
  });

  // Top silkscreen: +, -, 5V, 3V3, GND, row letters a..j, column numbers
  const bbTex = createCanvasDecal(1536, 460, (ctx) => {
    const toPx = (lx: number) => ((lx + bbW / 2) / bbW) * 1536;
    const toPy = (lz: number) => ((lz + bbD / 2) / bbD) * 460;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('GND -', toPx(-7.62) + 28, toPy(-1.98));
    ctx.fillText('- GND', toPx(7.62) - 28, toPy(-1.98));
    ctx.fillText('GND -', toPx(-7.62) + 28, toPy(1.98));
    ctx.fillText('- GND', toPx(7.62) - 28, toPy(1.98));

    ctx.fillStyle = '#ef4444';
    ctx.fillText('5V +', toPx(-7.62) + 26, toPy(-1.76));
    ctx.fillText('+ 5V', toPx(7.62) - 26, toPy(-1.76));

    ctx.fillStyle = '#ea580c';
    ctx.fillText('3V3 +', toPx(-7.62) + 28, toPy(1.76));
    ctx.fillText('+ 3V3', toPx(7.62) - 28, toPy(1.76));

    ctx.fillStyle = '#5c5549';
    ctx.font = 'bold 13px ui-monospace, monospace';
    [
      { lbl: 'a', z: -1.32 },
      { lbl: 'b', z: -1.1 },
      { lbl: 'c', z: -0.88 },
      { lbl: 'd', z: -0.66 },
      { lbl: 'e', z: -0.44 },
      { lbl: 'f', z: 0.44 },
      { lbl: 'g', z: 0.66 },
      { lbl: 'h', z: 0.88 },
      { lbl: 'i', z: 1.1 },
      { lbl: 'j', z: 1.32 },
    ].forEach(({ lbl, z }) => {
      ctx.fillText(lbl, 18, toPy(z));
      ctx.fillText(lbl, 1518, toPy(z));
    });

    [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65].forEach((cNum) => {
      const px = toPx(bbCol(cNum - 1));
      ctx.fillText(String(cNum), px, toPy(-1.49));
      ctx.fillText(String(cNum), px, toPy(1.49));
    });
  });
  textures.push(bbTex);
  const bbDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(bbW - 0.04, bbD - 0.04)),
    trackMat(new THREE.MeshBasicMaterial({ map: bbTex, transparent: true }))
  );
  bbDecal.rotation.x = -Math.PI / 2;
  bbDecal.position.y = bbTop + 0.004;
  bbGroup.add(bbDecal);

  // Instanced tie-point socket rims + dark wells across all 69 columns & 4 continuous rails
  const holeCoords: Array<[number, number]> = [];
  for (let c = 0; c < bbCols; c++) {
    const px = bbCol(c);
    [-1.32, -1.1, -0.88, -0.66, -0.44, 0.44, 0.66, 0.88, 1.1, 1.32].forEach((pz) => {
      holeCoords.push([px, pz]);
    });
    if (c >= 2 && c <= bbCols - 3) {
      [-1.98, -1.76, 1.76, 1.98].forEach((rz) => {
        holeCoords.push([px, rz]);
      });
    }
  }
  const bbRimInst = new THREE.InstancedMesh(bbSocketRimGeo, bbSocketRimMat, holeCoords.length);
  const bbHoleInst = new THREE.InstancedMesh(bbSocketGeo, bbHoleMat, holeCoords.length);
  const bbDummy = new THREE.Object3D();
  holeCoords.forEach(([hx, hz], idx) => {
    bbDummy.position.set(hx, bbTop + 0.002, hz);
    bbDummy.updateMatrix();
    bbRimInst.setMatrixAt(idx, bbDummy.matrix);

    bbDummy.position.set(hx, bbTop + 0.006, hz);
    bbDummy.updateMatrix();
    bbHoleInst.setMatrixAt(idx, bbDummy.matrix);
  });
  bbRimInst.instanceMatrix.needsUpdate = true;
  bbHoleInst.instanceMatrix.needsUpdate = true;
  bbHoleInst.name = 'MEGA_BREADBOARD';
  bbGroup.add(bbRimInst, bbHoleInst);
  return { bbCol, bbW, bbD, bbTop };
}
