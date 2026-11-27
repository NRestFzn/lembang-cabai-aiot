import * as THREE from 'three';
import { createRoundedBoxGeo } from './geometry';
import { createCanvasDecal } from './decals';
import { tagEspPart } from './tagging';
import type { KitBuilderContext } from './kitHelpers';

// ArduCam Camera Module 3 — Sony IMX708, 12MP (4608x2592), MIPI CSI-2,
// fixed-focus ~66 deg HFOV, 25x24mm green PCB. Replaces the old ESP32-CAM
// (OV2640) board; the internal part key stays 'ESP32CAM' and the garden part
// id stays 'esp32cam' so selection, FOV toggle, hotspots, tour and explode
// behaviour are unchanged.
//
// Local units: 1 unit ~= 25mm, so the board is 1.0 x 0.96 (25x24mm). The PCB
// lies flat in the XZ plane with the lens pointing +Y, the orange CSI FPC
// ribbon leaving the top (-Z) edge — the same origin/orientation convention
// as the old module, so the garden (0.09) and physical (0.42) mount scales
// and rotations still apply unchanged.
export function buildArducamModule(kit: KitBuilderContext): THREE.Group {
  const camGroup = new THREE.Group();
  const pcbH = 0.06;
  const pcbTop = pcbH; // PCB base sits at y = 0, top at y = 0.06

  // Green 25x24mm PCB.
  const greenPcbMat = kit.factory.createToon('#1e7a46');
  const camPcb = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(1.0, pcbH, 0.96, 0.04)),
    greenPcbMat,
    1.022
  );
  camPcb.position.y = 0;
  camGroup.add(camPcb);

  // 4 mounting holes in the corners: gold ring + dark hole.
  const holePositions: Array<[number, number]> = [
    [-0.42, -0.4],
    [0.42, -0.4],
    [-0.42, 0.4],
    [0.42, 0.4],
  ];
  holePositions.forEach(([px, pz]) => {
    const ring = kit.factory.createOutlinedMesh(kit.geos.ringGeo, kit.materials.goldMat, 1.08);
    ring.position.set(px, pcbTop + 0.008, pz);
    camGroup.add(ring);
    const hole = new THREE.Mesh(
      kit.trackGeo(new THREE.CylinderGeometry(0.032, 0.032, pcbH + 0.01, 10)),
      kit.materials.usbHoleMat
    );
    hole.position.set(px, pcbH / 2, pz);
    camGroup.add(hole);
  });

  // Small 'ArduCam IMX708' silkscreen decal along the bottom (+Z) edge.
  // (Placed manually rather than via kit.addDecalPlane so it can sit off-centre.)
  const silkTex = createCanvasDecal(512, 96, (c) => {
    c.fillStyle = '#eef0f0';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold 44px ui-monospace, monospace';
    c.fillText('ArduCam IMX708', 256, 48);
  });
  kit.textures.push(silkTex);
  const silkPlane = new THREE.Mesh(
    kit.trackGeo(new THREE.PlaneGeometry(0.62, 0.12)),
    kit.trackMat(new THREE.MeshBasicMaterial({ map: silkTex, transparent: true }))
  );
  silkPlane.rotation.x = -Math.PI / 2;
  silkPlane.position.set(0, pcbTop + 0.003, 0.38);
  camGroup.add(silkPlane);

  // Compact copper-trace MIPI CSI flex from the lens housing to the slim ZIF latch
  // along the -Z (header/wire) edge.
  const ribbonGrp = kit.registerExplodable('ESP32CAM', 0, -0.25, 0.35, camGroup, pcbTop);
  const fpcMat = kit.factory.createToon('#d97706');
  const fpcTraceMat = kit.factory.createToon('#92400e');
  const ribbonFlat = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.2, 0.014, 0.1)),
    fpcMat,
    1.05
  );
  ribbonFlat.position.set(0, 0.012, 0);
  ribbonGrp.add(ribbonFlat);
  [-0.06, 0, 0.06].forEach((px) => {
    const trace = new THREE.Mesh(
      kit.trackGeo(new THREE.BoxGeometry(0.016, 0.006, 0.09)),
      fpcTraceMat
    );
    trace.position.set(px, 0.022, 0);
    ribbonGrp.add(trace);
  });
  const zifLatch = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.24, 0.036, 0.045)),
    kit.materials.icDarkMat,
    1.06
  );
  zifLatch.position.set(0, 0.02, -0.05);
  ribbonGrp.add(zifLatch);

  // Square metal lens housing in the centre + round black lens.
  const lensGrp = kit.registerExplodable('ESP32CAM', 0, 0, 0.5, camGroup, pcbTop);
  const housing = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.42, 0.15, 0.42, 0.03)),
    kit.materials.metalSilverMat,
    1.05
  );
  housing.position.y = 0.075;
  lensGrp.add(housing);

  const barrel = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.15, 0.17, 0.085, 18)),
    kit.materials.icDarkMat,
    1.05
  );
  barrel.position.y = 0.19;
  lensGrp.add(barrel);

  const lensRim = new THREE.Mesh(
    kit.trackGeo(new THREE.RingGeometry(0.09, 0.135, 18)),
    kit.materials.metalSilverMat
  );
  lensRim.rotation.x = -Math.PI / 2;
  lensRim.position.y = 0.235;
  lensGrp.add(lensRim);

  const lensGlassMat = kit.trackMat(new THREE.MeshBasicMaterial({ color: '#0b1526' }));
  const lensGlass = new THREE.Mesh(
    kit.trackGeo(new THREE.CircleGeometry(0.09, 18)),
    lensGlassMat
  );
  lensGlass.rotation.x = -Math.PI / 2;
  lensGlass.position.y = 0.237;
  lensGrp.add(lensGlass);

  tagEspPart(camGroup, 'ESP32CAM');
  return camGroup;
}
