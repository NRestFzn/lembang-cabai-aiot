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
  camPcb.position.y = pcbH / 2;
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

  // Sensor flex: thin black strip under the lens housing running to the
  // CSI connector, with tiny gold contacts at its far end.
  const sensorFlex = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.3, 0.02, 0.22)),
    kit.materials.icDarkMat,
    1.05
  );
  sensorFlex.position.set(0, pcbTop + 0.01, -0.32);
  camGroup.add(sensorFlex);
  [-0.09, 0, 0.09].forEach((px) => {
    const contact = kit.factory.createOutlinedMesh(
      kit.trackGeo(new THREE.BoxGeometry(0.05, 0.012, 0.05)),
      kit.materials.goldMat,
      1.08
    );
    contact.position.set(px, pcbTop + 0.026, -0.4);
    camGroup.add(contact);
  });

  // Square metal lens housing in the centre + round black lens.
  const lensGrp = kit.registerExplodable('ESP32CAM', 0, 0, 0.5, camGroup, pcbTop);
  const housing = kit.factory.createOutlinedMesh(
    kit.trackGeo(createRoundedBoxGeo(0.48, 0.16, 0.48, 0.03)),
    kit.materials.metalSilverMat,
    1.05
  );
  housing.position.y = 0.08;
  lensGrp.add(housing);

  const barrel = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.CylinderGeometry(0.17, 0.19, 0.09, 18)),
    kit.materials.icDarkMat,
    1.05
  );
  barrel.position.y = 0.2;
  lensGrp.add(barrel);

  const lensRim = new THREE.Mesh(
    kit.trackGeo(new THREE.RingGeometry(0.1, 0.15, 18)),
    kit.materials.metalSilverMat
  );
  lensRim.rotation.x = -Math.PI / 2;
  lensRim.position.y = 0.247;
  lensGrp.add(lensRim);

  const lensGlassMat = kit.trackMat(new THREE.MeshBasicMaterial({ color: '#0b1526' }));
  const lensGlass = new THREE.Mesh(
    kit.trackGeo(new THREE.CircleGeometry(0.1, 18)),
    lensGlassMat
  );
  lensGlass.rotation.x = -Math.PI / 2;
  lensGlass.position.y = 0.249;
  lensGrp.add(lensGlass);

  // Orange CSI FPC ribbon cable off the top (-Z) edge, slightly bent/angled,
  // with fine trace lines. Group origin sits at the board edge (z = -0.44)
  // so the flat run overlaps the edge and runs outward from the board.
  const ribbonGrp = kit.registerExplodable('ESP32CAM', 0, -0.44, 0.35, camGroup, pcbTop);
  const fpcMat = kit.factory.createToon('#d97706');
  const fpcTraceMat = kit.factory.createToon('#92400e');
  const ribbonFlat = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.34, 0.02, 0.3)),
    fpcMat,
    1.05
  );
  ribbonFlat.position.set(0, 0.03, -0.13);
  ribbonGrp.add(ribbonFlat);
  // Bent rising segment at the far end.
  const ribbonBent = kit.factory.createOutlinedMesh(
    kit.trackGeo(new THREE.BoxGeometry(0.34, 0.02, 0.3)),
    fpcMat,
    1.05
  );
  ribbonBent.position.set(0, 0.09, -0.34);
  ribbonBent.rotation.x = -0.42;
  ribbonGrp.add(ribbonBent);
  // Fine trace lines along the flat run.
  [-0.11, 0, 0.11].forEach((px) => {
    const trace = new THREE.Mesh(
      kit.trackGeo(new THREE.BoxGeometry(0.02, 0.006, 0.28)),
      fpcTraceMat
    );
    trace.position.set(px, 0.043, -0.13);
    ribbonGrp.add(trace);
  });

  tagEspPart(camGroup, 'ESP32CAM');
  return camGroup;
}
