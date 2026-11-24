import * as THREE from 'three';
import { EspPartKey } from '../data/espParts';
import { StylizedFactory } from './stylizedMaterial';

export function tagEspPart(obj: THREE.Object3D, part: EspPartKey) {
  obj.traverse((child) => {
    child.userData.espPart = part;
  });
}

export function createRoundedBoxGeo(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2 - r;
  const hd = d / 2 - r;
  shape.moveTo(-hw, -d / 2);
  shape.lineTo(hw, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -hd);
  shape.lineTo(w / 2, hd);
  shape.quadraticCurveTo(w / 2, d / 2, hw, d / 2);
  shape.lineTo(-hw, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, hd);
  shape.lineTo(-w / 2, -hd);
  shape.quadraticCurveTo(-w / 2, -d / 2, -hw, -d / 2);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function createTextDecalTexture(
  lines: Array<{ text: string; font: string; y: number; color?: string }>
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const line of lines) {
      ctx.font = line.font;
      ctx.fillStyle = line.color ?? '#231e16';
      ctx.fillText(line.text, 256, line.y);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createCanvasDecal(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createHalfCylinderGeo(r: number, h: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI, false);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 14 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function createTaperedBladeGeo(
  totalLen: number,
  h: number,
  width: number,
  tipLen: number
): THREE.BufferGeometry {
  const hw = width / 2;
  const xLeft = -totalLen / 2;
  const xRight = totalLen / 2;
  const xShoulder = xLeft + tipLen;

  const shape = new THREE.Shape();
  shape.moveTo(xLeft, 0);
  shape.lineTo(xShoulder, -hw);
  shape.lineTo(xRight - 0.06, -hw);
  shape.quadraticCurveTo(xRight, -hw, xRight, -hw + 0.06);
  shape.lineTo(xRight, hw - 0.06);
  shape.quadraticCurveTo(xRight, hw, xRight - 0.06, hw);
  shape.lineTo(xShoulder, hw);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 4 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, h, 0);
  return geo;
}

export interface ExplodableItem {
  group: THREE.Group;
  baseY: number;
  liftY: number;
  guideLine: THREE.Line;
}

export interface HardwareKitContext {
  factory: StylizedFactory;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  textures: THREE.Texture[];
}

export interface HardwareModulesKit {
  modules: {
    espGroup: THREE.Group;
    lmGroup: THREE.Group;
    trGroup: THREE.Group;
    ledBoardGroup: THREE.Group;
    bmeGroup: THREE.Group;
    soilGroup: THREE.Group;
    dsGroup: THREE.Group;
    sdGroup: THREE.Group;
    camGroup: THREE.Group;
    relayGroup: THREE.Group;
    pumpGroup: THREE.Group;
    solGroup: THREE.Group;
    solarGroup: THREE.Group;
    mpptGroup: THREE.Group;
    batGroup: THREE.Group;
  };
  materials: {
    pcbMat: THREE.Material;
    pcbDarkMat: THREE.Material;
    metalSilverMat: THREE.Material;
    icDarkMat: THREE.Material;
    goldMat: THREE.Material;
    usbHoleMat: THREE.Material;
    ledMat: THREE.MeshBasicMaterial;
    greenLedMat: THREE.MeshBasicMaterial;
    relayLedMat: THREE.MeshBasicMaterial;
    solenoidLedMat: THREE.MeshBasicMaterial;
    camFlashMat: THREE.MeshBasicMaterial;
  };
  pumpRotorGroup: THREE.Group;
  explodables: ExplodableItem[];
}

export function createHardwareModulesKit(ctx: HardwareKitContext): HardwareModulesKit {
  const { factory, trackGeo, trackMat, textures } = ctx;

  // --- Shared Stylized Materials ---
  const pcbMat = factory.createToon('#2d3036');
  const pcbDarkMat = factory.createToon('#1c1e22');
  const metalSilverMat = factory.createToon('#eef0f0');
  const icDarkMat = factory.createToon('#292623');
  const goldMat = factory.createToon('#e2bd56');
  const usbHoleMat = trackMat(new THREE.MeshBasicMaterial({ color: '#181614' }));
  const ledMat = trackMat(new THREE.MeshBasicMaterial({ color: '#eef0f0' }));

  const bluePcbMat = factory.createToon('#415fa8');
  const blueTermMat = factory.createToon('#3874d6');
  const capSleeveMat = factory.createToon('#456594');
  const mintPcbMat = factory.createToon('#64b58f');
  const greenTermMat = factory.createToon('#2eb366');
  const tanBodyMat = factory.createToon('#dfc496');
  const brownBandMat = factory.createToon('#7c4a21');
  const blackBandMat = factory.createToon('#1f1d1a');
  const orangeBandMat = factory.createToon('#ea580c');
  const redBandMat = factory.createToon('#d9463b');
  const greenLedMat = trackMat(new THREE.MeshBasicMaterial({ color: '#4ade80' }));
  const smdRedLedMat = trackMat(new THREE.MeshBasicMaterial({ color: '#ef4444' }));

  const explodables: ExplodableItem[] = [];

  const registerExplodable = (
    part: EspPartKey,
    gx: number,
    gz: number,
    liftY: number,
    parent: THREE.Group,
    baseY: number
  ): THREE.Group => {
    const grp = new THREE.Group();
    grp.position.set(gx, baseY, gz);
    parent.add(grp);

    const lineGeo = trackGeo(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(gx, baseY, gz),
        new THREE.Vector3(gx, baseY + liftY, gz),
      ])
    );
    const lineMat = trackMat(
      new THREE.LineDashedMaterial({
        color: '#231e16',
        dashSize: 0.05,
        gapSize: 0.04,
        transparent: true,
        opacity: 0.45,
      })
    );
    const guideLine = new THREE.Line(lineGeo, lineMat);
    guideLine.computeLineDistances();
    guideLine.visible = false;
    parent.add(guideLine);

    explodables.push({ group: grp, baseY, liftY, guideLine });
    tagEspPart(grp, part);
    return grp;
  };

  const addDecalPlane = (
    parent: THREE.Group,
    w: number,
    d: number,
    y: number,
    tex: THREE.CanvasTexture
  ) => {
    textures.push(tex);
    const m = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(w, d)),
      trackMat(new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    parent.add(m);
  };

  const spacerGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.07, 0.11));
  const pinShaftGeo = trackGeo(new THREE.BoxGeometry(0.048, 0.3, 0.048));
  const ringGeo = trackGeo(new THREE.CylinderGeometry(0.056, 0.056, 0.02, 10));

  const addGoldPads = (parent: THREE.Group, y: number, coords: Array<[number, number]>) => {
    coords.forEach(([px, pz]) => {
      const r = factory.createOutlinedMesh(ringGeo, goldMat, 1.08);
      r.position.set(px, y, pz);
      parent.add(r);
    });
  };

  const addScrewTerminal = (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    bodyMat: THREE.Material,
    facing: 'left' | 'right' | 'front'
  ) => {
    const grp = registerExplodable(part, x, z, 0.38, parent, baseY);
    const rotY = facing === 'front' ? Math.PI / 2 : 0;
    const inner = new THREE.Group();
    inner.rotation.y = rotY;
    grp.add(inner);

    const blk = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.34, 0.34, 0.68)),
      bodyMat,
      1.05
    );
    blk.position.y = 0.17;
    inner.add(blk);

    const sideSign = facing === 'left' ? -1 : 1;
    [-0.16, 0.16].forEach((sz) => {
      const screw = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.04, 12)),
        metalSilverMat,
        1.07
      );
      screw.position.set(0, 0.345, sz);
      inner.add(screw);

      const slot = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.13, 0.014, 0.025)),
        icDarkMat
      );
      slot.position.set(0, 0.368, sz);
      inner.add(slot);

      const hole = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.02, 0.14, 0.14)),
        usbHoleMat
      );
      hole.position.set(sideSign * 0.172, 0.14, sz);
      inner.add(hole);
    });
  };

  const addElectrolyticCap = (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    radius = 0.19,
    height = 0.46
  ) => {
    const cap = registerExplodable(part, x, z, 0.56, parent, baseY);
    const sleeve = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(radius, radius, height, 16)),
      capSleeveMat,
      1.05
    );
    sleeve.position.y = height / 2;
    cap.add(sleeve);

    const stripe = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.05, height * 0.92, 0.04)),
      metalSilverMat
    );
    stripe.position.set(0, height / 2, radius * 0.92);
    cap.add(stripe);

    const topTex = createCanvasDecal(128, 128, (c) => {
      c.fillStyle = '#e2e6ea';
      c.beginPath();
      c.arc(64, 64, 60, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#7d8286';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(28, 28);
      c.lineTo(100, 100);
      c.moveTo(100, 28);
      c.lineTo(28, 100);
      c.stroke();
    });
    textures.push(topTex);
    const capTop = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(radius * 0.92, 16)),
      trackMat(new THREE.MeshBasicMaterial({ map: topTex }))
    );
    capTop.rotation.x = -Math.PI / 2;
    capTop.position.y = height + 0.004;
    cap.add(capTop);
  };

  const addAxialResistor = (
    part: EspPartKey,
    parent: THREE.Group,
    x: number,
    z: number,
    baseY: number,
    bandMats: THREE.Material[],
    rotY = 0
  ) => {
    const grp = registerExplodable(part, x, z, 0.45, parent, baseY);
    const inner = new THREE.Group();
    inner.rotation.y = rotY;
    grp.add(inner);

    const body = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.072, 0.072, 0.34, 12)),
      tanBodyMat,
      1.06
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.095;
    inner.add(body);

    [-0.1, -0.035, 0.03, 0.105].forEach((bx, idx) => {
      const b = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.076, 0.076, 0.032, 12)),
        bandMats[idx] ?? goldMat
      );
      b.rotation.z = Math.PI / 2;
      b.position.set(bx, 0.095, 0);
      inner.add(b);
    });

    [-0.22, 0.22].forEach((lx) => {
      const wire = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6)),
        metalSilverMat,
        1.1
      );
      wire.rotation.z = Math.PI / 2;
      wire.position.set(lx, 0.095, 0);
      inner.add(wire);

      const leg = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.11, 6)),
        metalSilverMat,
        1.1
      );
      leg.position.set(lx > 0 ? 0.28 : -0.28, 0.045, 0);
      inner.add(leg);
    });
  };

  // =========================================================================
  // 1. STANDALONE ESP32-WROOM-32 MODULE
  // =========================================================================
  const espGroup = new THREE.Group();

  const pcbW = 2.08;
  const pcbD = 4.1;
  const pcbZ = 0.28;
  const pcbH = 0.085;
  const pcbTop = pcbZ + pcbH;

  const pinRows = Array.from({ length: 15 }, (_, i) => -1.54 + i * 0.22);

  const h1Group = new THREE.Group();
  const h2Group = new THREE.Group();
  espGroup.add(h1Group, h2Group);

  pinRows.forEach((pz) => {
    const buildPin = (grp: THREE.Group, xPos: number) => {
      const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
      sp.position.set(xPos, pcbZ - 0.035, pz);
      grp.add(sp);

      const shaft = factory.createOutlinedMesh(pinShaftGeo, goldMat, 1.1);
      shaft.position.set(xPos, pcbZ - 0.11, pz);
      grp.add(shaft);

      const ring = factory.createOutlinedMesh(ringGeo, goldMat, 1.08);
      ring.position.set(xPos, pcbTop + 0.008, pz);
      grp.add(ring);
    };
    buildPin(h1Group, -0.88);
    buildPin(h2Group, 0.88);
  });
  tagEspPart(h1Group, 'H1');
  tagEspPart(h2Group, 'H2');

  const pcbMesh = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(pcbW, pcbH, pcbD, 0.09)),
    pcbMat,
    1.022
  );
  pcbMesh.position.y = pcbZ;
  tagEspPart(pcbMesh, 'U1');
  espGroup.add(pcbMesh);

  const leftPins = ['EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', '13', 'GND', 'VIN'];
  const rightPins = ['23', '22', 'TX0', 'RX0', '21', '19', '18', '5', '17', '16', '4', '2', '15', 'GND', '3V3'];
  const espSilkTex = createCanvasDecal(512, 1024, (c) => {
    c.fillStyle = '#eef0f0';
    c.textBaseline = 'middle';
    c.font = 'bold 21px ui-monospace, monospace';

    pinRows.forEach((pz, i) => {
      const py = ((pz + pcbD / 2) / pcbD) * 1024;
      c.textAlign = 'left';
      c.fillText(leftPins[i], 60, py);
      c.textAlign = 'right';
      c.fillText(rightPins[i], 452, py);
    });

    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('ESP32-DevKit', 256, 632);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillStyle = '#b7c2d6';
    c.fillText('LEMBANG AIoT', 256, 666);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillStyle = '#fde047';
    c.fillText('USB-C', 256, 868);
  });
  textures.push(espSilkTex);
  const pcbDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(pcbW - 0.04, pcbD - 0.04)),
    trackMat(new THREE.MeshBasicMaterial({ map: espSilkTex, transparent: true }))
  );
  pcbDecal.rotation.x = -Math.PI / 2;
  pcbDecal.position.set(0, pcbTop + 0.003, 0);
  tagEspPart(pcbDecal, 'U1');
  espGroup.add(pcbDecal);

  // ANT1
  const antGroup = registerExplodable('ANT1', 0, -1.8, 0.25, espGroup, pcbTop);
  const antBase = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(1.04, 0.02, 0.44)),
    pcbDarkMat,
    1.04
  );
  antBase.position.y = 0.01;
  antGroup.add(antBase);

  const meanderPts = [
    new THREE.Vector3(-0.38, 0.025, 0.14),
    new THREE.Vector3(-0.38, 0.025, -0.14),
    new THREE.Vector3(-0.19, 0.025, -0.14),
    new THREE.Vector3(-0.19, 0.025, 0.1),
    new THREE.Vector3(0.0, 0.025, 0.1),
    new THREE.Vector3(0.0, 0.025, -0.14),
    new THREE.Vector3(0.19, 0.025, -0.14),
    new THREE.Vector3(0.19, 0.025, 0.1),
    new THREE.Vector3(0.38, 0.025, 0.1),
  ];
  const meanderMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(meanderPts, false, 'catmullrom', 0.05), 36, 0.02, 6, false)),
    goldMat
  );
  antGroup.add(meanderMesh);
  tagEspPart(antGroup, 'ANT1');

  // U1 RF Shield
  const u1Group = registerExplodable('U1', 0, -0.98, 0.72, espGroup, pcbTop);
  const rfShield = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(1.04, 0.21, 1.2)),
    metalSilverMat,
    1.035
  );
  rfShield.position.y = 0.105;
  u1Group.add(rfShield);

  const rfDecalTex = createTextDecalTexture([
    { text: 'ESP-WROOM-32', font: 'bold 46px ui-monospace, monospace', y: 225, color: '#3b4046' },
    { text: 'Wi-Fi · BLE · 240MHz', font: 'bold 28px ui-monospace, monospace', y: 285, color: '#6b7280' },
  ]);
  textures.push(rfDecalTex);
  const rfDecal = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.96, 1.05)),
    trackMat(new THREE.MeshBasicMaterial({ map: rfDecalTex, transparent: true }))
  );
  rfDecal.rotation.x = -Math.PI / 2;
  rfDecal.position.y = 0.214;
  u1Group.add(rfDecal);
  tagEspPart(u1Group, 'U1');

  // U3 AMS1117
  const u3Group = registerExplodable('U3', -0.36, 0.05, 0.52, espGroup, pcbTop);
  const u3Body = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.09, 0.34)),
    icDarkMat,
    1.07
  );
  u3Body.position.y = 0.045;
  u3Group.add(u3Body);
  const u3Tab = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.1, 0.04, 0.22)),
    metalSilverMat,
    1.08
  );
  u3Tab.position.set(-0.16, 0.02, 0);
  u3Group.add(u3Tab);
  [-0.11, 0, 0.11].forEach((lz) => {
    const leg = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.08, 0.025, 0.04)),
      metalSilverMat,
      1.1
    );
    leg.position.set(0.17, 0.015, lz);
    u3Group.add(leg);
  });
  tagEspPart(u3Group, 'U3');

  // U2 CP2102
  const u2Group = registerExplodable('U2', 0.08, 0.88, 0.58, espGroup, pcbTop);
  const u2Body = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.36, 0.075, 0.36)),
    icDarkMat,
    1.07
  );
  u2Body.position.y = 0.038;
  u2Group.add(u2Body);
  [-0.12, -0.04, 0.04, 0.12].forEach((off) => {
    [-0.2, 0.2].forEach((side) => {
      const p = factory.createOutlinedMesh(
        trackGeo(new THREE.BoxGeometry(0.03, 0.02, 0.05)),
        metalSilverMat,
        1.1
      );
      p.position.set(off, 0.01, side);
      u2Group.add(p);
    });
  });
  tagEspPart(u2Group, 'U2');

  // RGB LED
  const rgbGroup = registerExplodable('RGB', 0.3, 0.28, 0.56, espGroup, pcbTop);
  const rgbBase = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.22, 0.055, 0.22)),
    metalSilverMat,
    1.07
  );
  rgbBase.position.y = 0.028;
  rgbGroup.add(rgbBase);
  const rgbDome = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.072, 0.072, 0.025, 14)),
    ledMat
  );
  rgbDome.position.y = 0.065;
  rgbGroup.add(rgbDome);
  tagEspPart(rgbGroup, 'RGB');

  // RC SMD Passives
  const rcGroup = registerExplodable('RC', 0, 0.4, 0.38, espGroup, pcbTop);
  [
    [-0.38, -0.7],
    [-0.16, -0.7],
    [0.36, -0.58],
    [-0.42, 0.16],
    [0.44, 0.45],
    [0.44, 0.65],
  ].forEach(([rx, rz], idx) => {
    const smd = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.11, 0.04, 0.065)),
      idx % 2 === 0 ? icDarkMat : goldMat,
      1.09
    );
    smd.position.set(rx, 0.02, rz);
    rcGroup.add(smd);
  });
  tagEspPart(rcGroup, 'RC');

  // SW1 & SW2
  const buildButton = (key: EspPartKey, bx: number, bz: number) => {
    const grp = registerExplodable(key, bx, bz, 0.65, espGroup, pcbTop);
    const housing = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.28, 0.07, 0.28)),
      metalSilverMat,
      1.06
    );
    housing.position.y = 0.035;
    grp.add(housing);
    const plunger = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12)),
      icDarkMat,
      1.08
    );
    plunger.position.y = 0.095;
    grp.add(plunger);
    tagEspPart(grp, key);
  };
  buildButton('SW1', -0.46, 1.15);
  buildButton('SW2', 0.44, 1.38);

  // J1 USB-C Receptacle
  const j1Group = registerExplodable('J1', 0, 1.9, 0.54, espGroup, pcbTop);
  const usbShell = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.58, 0.19, 0.46, 0.04)),
    metalSilverMat,
    1.045
  );
  usbShell.position.y = 0.0;
  j1Group.add(usbShell);
  const usbCollar = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.46, 0.14, 0.08, 0.025)),
    icDarkMat,
    1.04
  );
  usbCollar.position.set(0, 0.025, 0.22);
  j1Group.add(usbCollar);
  const usbCavity = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.38, 0.095, 0.04)),
    usbHoleMat
  );
  usbCavity.position.set(0, 0.095, 0.245);
  j1Group.add(usbCavity);
  const usbTongue = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.025, 0.05)),
    goldMat
  );
  usbTongue.position.set(0, 0.095, 0.248);
  j1Group.add(usbTongue);
  const usbTopTex = createCanvasDecal(160, 128, (c) => {
    c.fillStyle = '#1e293b';
    c.fillRect(16, 16, 128, 96);
    c.strokeStyle = '#64748b';
    c.lineWidth = 4;
    c.strokeRect(18, 18, 124, 92);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('USB-C', 80, 52);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('5V / DATA', 80, 86);
  });
  addDecalPlane(j1Group, 0.44, 0.34, 0.194, usbTopTex);
  tagEspPart(j1Group, 'J1');

  // =========================================================================
  // 2. LM2596 DC-DC REGULATOR MODULE
  // =========================================================================
  const lmGroup = new THREE.Group();
  const lmZ = 0.06;
  const lmH = 0.085;
  const lmTop = lmZ + lmH;
  const lmPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.58, lmH, 1.54, 0.08)),
    bluePcbMat,
    1.022
  );
  lmPcb.position.y = lmZ;
  lmGroup.add(lmPcb);

  const lmSilkTex = createCanvasDecal(512, 320, (c) => {
    c.strokeStyle = 'rgba(130, 175, 245, 0.35)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(65, 110);
    c.lineTo(135, 110);
    c.lineTo(190, 210);
    c.moveTo(270, 110);
    c.lineTo(395, 110);
    c.lineTo(445, 150);
    c.stroke();

    c.strokeStyle = 'rgba(241, 242, 239, 0.78)';
    c.lineWidth = 2.5;
    c.setLineDash([7, 5]);
    c.strokeRect(182, 182, 90, 96);
    c.strokeRect(272, 200, 130, 74);
    c.setLineDash([]);

    c.fillStyle = '#eef0f0';
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillText('LM2596 DC-DC', 175, 36);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('IN', 64, 72);
    c.fillText('+', 64, 130);
    c.fillText('-', 64, 198);
    c.fillText('OUT', 428, 72);
    c.fillText('+', 432, 130);
    c.fillText('-', 432, 198);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('ADJ', 385, 175);
    c.fillText('+', 108, 60);
    c.fillText('+', 350, 60);
  });
  addDecalPlane(lmGroup, 2.46, 1.44, lmTop + 0.003, lmSilkTex);

  addGoldPads(lmGroup, lmTop + 0.006, [
    [-1.14, -0.62],
    [1.14, -0.62],
    [-1.14, 0.62],
    [1.14, 0.62],
  ]);

  addScrewTerminal('LM2596', lmGroup, -1.06, 0.02, lmTop, blueTermMat, 'left');
  addScrewTerminal('LM2596', lmGroup, 1.06, 0.02, lmTop, blueTermMat, 'right');
  addElectrolyticCap('LM2596', lmGroup, -0.58, -0.34, lmTop, 0.19, 0.46);
  addElectrolyticCap('LM2596', lmGroup, 0.58, -0.34, lmTop, 0.19, 0.46);

  const indGrp = registerExplodable('LM2596', 0.0, -0.34, 0.64, lmGroup, lmTop);
  const indBody = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 18)),
    icDarkMat,
    1.04
  );
  indBody.position.y = 0.2;
  indGrp.add(indBody);
  const indDecal = createCanvasDecal(128, 128, (c) => {
    c.strokeStyle = '#9aa4b2';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(64, 64, 42, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#eef0f0';
    c.font = 'bold 34px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('330', 64, 65);
  });
  textures.push(indDecal);
  const indTopDisk = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.25, 16)),
    trackMat(new THREE.MeshBasicMaterial({ map: indDecal, transparent: true }))
  );
  indTopDisk.rotation.x = -Math.PI / 2;
  indTopDisk.position.y = 0.405;
  indGrp.add(indTopDisk);

  const lmIcGrp = registerExplodable('LM2596', -0.26, 0.32, 0.52, lmGroup, lmTop);
  const lmIcBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.44, 0.16, 0.42)),
    icDarkMat,
    1.05
  );
  lmIcBody.position.y = 0.08;
  lmIcGrp.add(lmIcBody);
  const lmIcDecal = createCanvasDecal(128, 128, (c) => {
    c.fillStyle = '#d1d5db';
    c.font = 'bold 20px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('LM2596S', 64, 52);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillText('-ADJ', 64, 80);
  });
  addDecalPlane(lmIcGrp, 0.4, 0.38, 0.164, lmIcDecal);

  const lmTab = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.05, 0.14)),
    metalSilverMat,
    1.07
  );
  lmTab.position.set(0, 0.025, -0.25);
  lmIcGrp.add(lmTab);
  [-0.14, -0.07, 0, 0.07, 0.14].forEach((px) => {
    const leg = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.032, 0.03, 0.12)),
      metalSilverMat,
      1.09
    );
    leg.position.set(px, 0.018, 0.24);
    lmIcGrp.add(leg);
  });

  const ss34Grp = registerExplodable('LM2596', -0.68, 0.42, 0.48, lmGroup, lmTop);
  const ssBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.11, 0.18)),
    icDarkMat,
    1.06
  );
  ssBody.position.y = 0.055;
  ss34Grp.add(ssBody);
  const ssDecal = createCanvasDecal(128, 96, (c) => {
    c.fillStyle = '#e5e7eb';
    c.fillRect(10, 12, 16, 72);
    c.font = 'bold 26px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('SS34', 76, 56);
  });
  addDecalPlane(ss34Grp, 0.26, 0.16, 0.114, ssDecal);

  const trimGrp = registerExplodable('LM2596', 0.64, 0.08, 0.48, lmGroup, lmTop);
  const trimBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.32, 0.26, 0.24)),
    blueTermMat,
    1.06
  );
  trimBody.position.y = 0.13;
  trimGrp.add(trimBody);
  const trimDecal = createCanvasDecal(128, 96, (c) => {
    c.fillStyle = '#eef0f0';
    c.font = 'bold 26px ui-monospace, monospace';
    c.fillText('103', 18, 56);
  });
  addDecalPlane(trimGrp, 0.28, 0.2, 0.264, trimDecal);
  const brassScrew = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 10)),
    goldMat,
    1.08
  );
  brassScrew.position.set(0.09, 0.28, 0);
  trimGrp.add(brassScrew);

  const voltGrp = registerExplodable('LM2596', 0.36, 0.44, 0.46, lmGroup, lmTop);
  const voltCase = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.68, 0.14, 0.34)),
    icDarkMat,
    1.05
  );
  voltCase.position.y = 0.07;
  voltGrp.add(voltCase);
  const voltDecal = createCanvasDecal(256, 128, (c) => {
    c.fillStyle = '#181614';
    c.fillRect(10, 12, 236, 104);
    c.fillStyle = '#ef4444';
    c.font = 'bold 64px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('5.00 V', 128, 66);
  });
  addDecalPlane(voltGrp, 0.62, 0.28, 0.144, voltDecal);

  const lmLed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.04, 0.06)), smdRedLedMat);
  lmLed.position.set(-0.62, lmTop + 0.02, 0.12);
  lmGroup.add(lmLed);
  tagEspPart(lmGroup, 'LM2596');

  // =========================================================================
  // 3. NPN TRANSISTOR + FLYBACK SWITCH MODULE
  // =========================================================================
  const trGroup = new THREE.Group();
  const trZ = 0.06;
  const trH = 0.085;
  const trTop = trZ + trH;
  const trPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.44, trH, 1.54, 0.08)),
    mintPcbMat,
    1.022
  );
  trPcb.position.y = trZ;
  trGroup.add(trPcb);

  const trSilkTex = createCanvasDecal(512, 320, (c) => {
    c.strokeStyle = 'rgba(155, 224, 190, 0.45)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(80, 180);
    c.lineTo(175, 180);
    c.lineTo(295, 180);
    c.lineTo(395, 180);
    c.moveTo(190, 270);
    c.lineTo(190, 180);
    c.stroke();

    c.strokeStyle = 'rgba(241, 242, 239, 0.8)';
    c.lineWidth = 2.4;
    c.setLineDash([6, 4]);
    c.strokeRect(138, 66, 118, 44);
    c.strokeRect(138, 148, 118, 42);
    c.setLineDash([]);

    c.fillStyle = '#fbf8f0';
    c.font = 'bold 21px ui-monospace, monospace';
    c.fillText('NPN SWITCH', 180, 34);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('MOTOR', 48, 92);
    c.fillText('+', 44, 140);
    c.fillText('-', 44, 212);
    c.fillText('BATT', 415, 92);
    c.fillText('+', 450, 140);
    c.fillText('-', 450, 212);
    c.fillText('1N4007', 165, 58);
    c.fillText('1K', 184, 138);
    c.fillText('2N2222', 292, 132);
    c.fillText('GND 5V IN', 185, 298);
  });
  addDecalPlane(trGroup, 2.34, 1.44, trTop + 0.003, trSilkTex);

  addGoldPads(trGroup, trTop + 0.006, [
    [-1.06, -0.62],
    [1.06, -0.62],
    [-1.06, 0.62],
    [1.06, 0.62],
    [-0.58, -0.34],
    [0.0, -0.34],
    [-0.58, 0.04],
    [0.0, 0.04],
    [0.24, 0.04],
    [0.34, 0.04],
    [0.44, 0.04],
  ]);

  addScrewTerminal('TRANSISTOR', trGroup, -0.96, 0.16, trTop, blueTermMat, 'left');
  addScrewTerminal('TRANSISTOR', trGroup, 0.96, 0.16, trTop, greenTermMat, 'right');
  addElectrolyticCap('TRANSISTOR', trGroup, 0.58, -0.38, trTop, 0.14, 0.34);

  const q1Grp = registerExplodable('TRANSISTOR', 0.34, 0.04, 0.58, trGroup, trTop);
  [-0.08, 0, 0.08].forEach((px) => {
    const leg = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 6)),
      metalSilverMat,
      1.1
    );
    leg.position.set(px, 0.11, 0);
    q1Grp.add(leg);
  });
  const q1Body = factory.createOutlinedMesh(
    trackGeo(createHalfCylinderGeo(0.14, 0.28)),
    icDarkMat,
    1.05
  );
  q1Body.position.y = 0.21;
  q1Grp.add(q1Body);

  const flyGrp = registerExplodable('TRANSISTOR', -0.29, -0.34, 0.54, trGroup, trTop);
  const flyBody = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 0.36, 12)),
    icDarkMat,
    1.06
  );
  flyBody.rotation.z = Math.PI / 2;
  flyBody.position.y = 0.11;
  flyGrp.add(flyBody);
  const flyBand = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.085, 0.065, 12)),
    metalSilverMat
  );
  flyBand.rotation.z = Math.PI / 2;
  flyBand.position.set(-0.11, 0.11, 0);
  flyGrp.add(flyBand);
  [-0.24, 0.24].forEach((lx) => {
    const wire = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6)),
      metalSilverMat,
      1.1
    );
    wire.rotation.z = Math.PI / 2;
    wire.position.set(lx, 0.11, 0);
    flyGrp.add(wire);
    const drop = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6)),
      metalSilverMat,
      1.1
    );
    drop.position.set(lx > 0 ? 0.29 : -0.29, 0.05, 0);
    flyGrp.add(drop);
  });

  addAxialResistor('TRANSISTOR', trGroup, -0.29, 0.04, trTop, [brownBandMat, blackBandMat, redBandMat, goldMat]);
  addAxialResistor('TRANSISTOR', trGroup, -0.29, 0.34, trTop, [brownBandMat, blackBandMat, redBandMat, goldMat]);

  const trLedGrp = registerExplodable('TRANSISTOR', 0.12, -0.52, 0.56, trGroup, trTop);
  const trLedCyl = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 14)),
    greenLedMat,
    1.06
  );
  trLedCyl.position.y = 0.09;
  trLedGrp.add(trLedCyl);
  const trLedDome = factory.createOutlinedMesh(
    trackGeo(new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)),
    greenLedMat,
    1.06
  );
  trLedDome.position.y = 0.18;
  trLedGrp.add(trLedDome);

  const logicHdr = registerExplodable('TRANSISTOR', 0, 0.58, 0.38, trGroup, trTop);
  [-0.14, 0, 0.14].forEach((hx) => {
    const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
    sp.position.set(hx, 0.035, 0);
    logicHdr.add(sp);
    const pin = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.04, 0.18, 0.04)),
      goldMat,
      1.1
    );
    pin.position.set(hx, 0.11, 0);
    logicHdr.add(pin);
  });
  tagEspPart(trGroup, 'TRANSISTOR');

  // =========================================================================
  // 4. LED + RESISTOR TRAINER MODULE
  // =========================================================================
  const ledBoardGroup = new THREE.Group();
  const lbZ = 0.06;
  const lbH = 0.085;
  const lbTop = lbZ + lbH;
  const lbPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.72, lbH, 2.58, 0.08)),
    mintPcbMat,
    1.022
  );
  lbPcb.position.y = lbZ;
  ledBoardGroup.add(lbPcb);

  const lbSilkTex = createCanvasDecal(360, 512, (c) => {
    c.strokeStyle = 'rgba(155, 224, 190, 0.45)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(110, 440);
    c.lineTo(110, 260);
    c.lineTo(260, 260);
    c.lineTo(260, 120);
    c.stroke();

    c.fillStyle = '#fbf8f0';
    c.font = 'bold 24px ui-monospace, monospace';
    c.fillText('LED TRAINER', 28, 38);
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('I = V / R', 200, 468);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('220', 84, 178);
    c.fillText('1K', 84, 240);
    c.fillText('10K', 84, 302);
    c.fillText('D1', 274, 108);
    c.fillText('ON', 64, 380);
    c.fillText('5V IN', 165, 488);
  });
  addDecalPlane(ledBoardGroup, 1.62, 2.46, lbTop + 0.003, lbSilkTex);

  addGoldPads(ledBoardGroup, lbTop + 0.006, [
    [-0.74, -1.16],
    [0.74, -1.16],
    [-0.74, 1.16],
    [0.74, 1.16],
    [-0.58, -0.38],
    [0.0, -0.38],
    [-0.58, -0.06],
    [0.0, -0.06],
    [-0.58, 0.26],
    [0.0, 0.26],
  ]);

  const lbUsb = registerExplodable('RESISTOR', 0, 1.12, 0.48, ledBoardGroup, lbTop);
  const lbUsbShell = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.46, 0.16, 0.36)),
    metalSilverMat,
    1.05
  );
  lbUsbShell.position.y = 0.08;
  lbUsb.add(lbUsbShell);
  const lbUsbHole = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.3, 0.07, 0.02)),
    usbHoleMat
  );
  lbUsbHole.position.set(0, 0.08, 0.182);
  lbUsb.add(lbUsbHole);

  addElectrolyticCap('RESISTOR', ledBoardGroup, -0.46, 0.86, lbTop, 0.14, 0.36);

  const sw1Grp = registerExplodable('RESISTOR', -0.4, 0.56, 0.44, ledBoardGroup, lbTop);
  const sw1Base = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.12, 0.16)),
    metalSilverMat,
    1.06
  );
  sw1Base.position.y = 0.06;
  sw1Grp.add(sw1Base);
  const sw1Knob = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.08, 0.1)),
    icDarkMat,
    1.08
  );
  sw1Knob.position.set(0.05, 0.15, 0);
  sw1Grp.add(sw1Knob);

  addAxialResistor('RESISTOR', ledBoardGroup, -0.29, -0.38, lbTop, [redBandMat, redBandMat, brownBandMat, goldMat]);
  addAxialResistor('RESISTOR', ledBoardGroup, -0.29, -0.06, lbTop, [brownBandMat, blackBandMat, redBandMat, goldMat]);
  addAxialResistor('RESISTOR', ledBoardGroup, -0.29, 0.26, lbTop, [brownBandMat, blackBandMat, orangeBandMat, goldMat]);

  const jpGrp = registerExplodable('RESISTOR', 0.36, -0.08, 0.46, ledBoardGroup, lbTop);
  [-0.08, 0.08].forEach((jx) => {
    [-0.24, -0.08, 0.08, 0.24].forEach((jz) => {
      const sp = factory.createOutlinedMesh(
        trackGeo(new THREE.BoxGeometry(0.09, 0.06, 0.09)),
        icDarkMat,
        1.08
      );
      sp.position.set(jx, 0.03, jz);
      jpGrp.add(sp);
      const pin = factory.createOutlinedMesh(
        trackGeo(new THREE.BoxGeometry(0.036, 0.2, 0.036)),
        goldMat,
        1.1
      );
      pin.position.set(jx, 0.12, jz);
      jpGrp.add(pin);
    });
  });
  const jumperCap = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.15, 0.12)),
    icDarkMat,
    1.06
  );
  jumperCap.position.set(0, 0.14, -0.24);
  jpGrp.add(jumperCap);
  tagEspPart(ledBoardGroup, 'RESISTOR');

  const d1Grp = registerExplodable('LED', 0.36, -0.78, 0.56, ledBoardGroup, lbTop);
  const d1Rim = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16)),
    ledMat,
    1.05
  );
  d1Rim.position.y = 0.03;
  d1Grp.add(d1Rim);
  const d1Cyl = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 16)),
    ledMat,
    1.05
  );
  d1Cyl.position.y = 0.18;
  d1Grp.add(d1Cyl);
  const d1Dome = factory.createOutlinedMesh(
    trackGeo(new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    ledMat,
    1.05
  );
  d1Dome.position.y = 0.31;
  d1Grp.add(d1Dome);
  tagEspPart(d1Grp, 'LED');

  // =========================================================================
  // 5. GY-BME280 CANOPY MICROCLIMATE SENSOR
  // =========================================================================
  const purplePcbMat = factory.createToon('#6e3ea3');
  const tealPcbMat = factory.createToon('#1f6f5b');
  const whiteJstMat = factory.createToon('#f3efe4');

  const bmeGroup = new THREE.Group();
  const bmeZ = 0.06;
  const bmeH = 0.075;
  const bmeTop = bmeZ + bmeH;
  const bmePcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.32, bmeH, 1.06, 0.07)),
    purplePcbMat,
    1.025
  );
  bmePcb.position.y = bmeZ;
  bmeGroup.add(bmePcb);

  const bmeSilkTex = createCanvasDecal(280, 224, (c) => {
    c.strokeStyle = 'rgba(192, 148, 240, 0.45)';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(95, 112);
    c.lineTo(225, 112);
    c.moveTo(150, 55);
    c.lineTo(225, 55);
    c.moveTo(150, 165);
    c.lineTo(225, 165);
    c.stroke();

    c.fillStyle = '#f8f5ff';
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('GY-BME280', 18, 204);
    c.font = 'bold 16px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText('VCC', 206, 46);
    c.fillText('GND', 206, 92);
    c.fillText('SCL', 206, 138);
    c.fillText('SDA', 206, 184);
  });
  addDecalPlane(bmeGroup, 1.24, 0.98, bmeTop + 0.003, bmeSilkTex);

  addGoldPads(bmeGroup, bmeTop + 0.006, [
    [-0.46, -0.34],
    [0.52, -0.33],
    [0.52, -0.11],
    [0.52, 0.11],
    [0.52, 0.33],
  ]);

  const boschGrp = registerExplodable('BME280', -0.22, 0.04, 0.52, bmeGroup, bmeTop);
  const boschCap = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.32, 0.11, 0.32)),
    metalSilverMat,
    1.06
  );
  boschCap.position.y = 0.055;
  boschGrp.add(boschCap);
  const boschPort = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 10)),
    icDarkMat
  );
  boschPort.position.set(0.06, 0.112, -0.05);
  boschGrp.add(boschPort);

  [-0.22, -0.04, 0.14].forEach((rz, idx) => {
    const smd = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.14, 0.045, 0.075)),
      idx < 2 ? icDarkMat : goldMat,
      1.09
    );
    smd.position.set(0.12, bmeTop + 0.022, rz);
    bmeGroup.add(smd);
  });

  const bmeHdr = registerExplodable('BME280', 0.52, 0, 0.38, bmeGroup, 0);
  [-0.33, -0.11, 0.11, 0.33].forEach((pz) => {
    const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
    sp.position.set(0, bmeZ - 0.035, pz);
    bmeHdr.add(sp);
    const pin = factory.createOutlinedMesh(pinShaftGeo, goldMat, 1.1);
    pin.position.set(0, bmeZ - 0.11, pz);
    bmeHdr.add(pin);
    const ring = factory.createOutlinedMesh(ringGeo, goldMat, 1.08);
    ring.position.set(0, bmeTop + 0.008, pz);
    bmeHdr.add(ring);
  });
  tagEspPart(bmeGroup, 'BME280');

  // =========================================================================
  // 6. CAPACITIVE SOIL MOISTURE SENSOR v1.2
  // =========================================================================
  const soilGroup = new THREE.Group();
  const soilZ = 0.06;
  const soilH = 0.07;
  const soilTop = soilZ + soilH;
  const soilBlade = factory.createOutlinedMesh(
    trackGeo(createTaperedBladeGeo(2.38, soilH, 0.88, 0.55)),
    pcbMat,
    1.022
  );
  soilBlade.position.y = soilZ;
  soilGroup.add(soilBlade);

  const soilSilkTex = createCanvasDecal(512, 192, (c) => {
    c.strokeStyle = '#e2bd56';
    c.lineWidth = 10;
    c.strokeRect(108, 22, 190, 148);
    c.fillStyle = '#d4aa3c';
    c.fillRect(130, 56, 148, 80);

    c.fillStyle = '#f3efe4';
    c.fillRect(302, 12, 9, 168);

    c.fillStyle = '#eef0f0';
    c.font = 'bold 16px ui-monospace, monospace';
    c.fillText('Capacitive Soil v1.2', 318, 26);
    c.font = 'bold 15px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText('GND', 432, 62);
    c.fillText('VCC', 432, 102);
    c.fillText('AOUT', 432, 142);
  });
  addDecalPlane(soilGroup, 2.26, 0.82, soilTop + 0.003, soilSilkTex);

  const ne555Grp = registerExplodable('SOIL_MOISTURE', 0.36, -0.02, 0.48, soilGroup, soilTop);
  const neBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.07, 0.22)),
    icDarkMat,
    1.07
  );
  neBody.position.y = 0.035;
  ne555Grp.add(neBody);
  [-0.08, -0.025, 0.03, 0.085].forEach((lx) => {
    [-0.13, 0.13].forEach((side) => {
      const leg = factory.createOutlinedMesh(
        trackGeo(new THREE.BoxGeometry(0.024, 0.02, 0.05)),
        metalSilverMat,
        1.1
      );
      leg.position.set(lx, 0.012, side);
      ne555Grp.add(leg);
    });
  });

  const ldoSoil = registerExplodable('SOIL_MOISTURE', 0.36, 0.26, 0.44, soilGroup, soilTop);
  const ldoBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.06, 0.14)),
    icDarkMat,
    1.08
  );
  ldoBody.position.y = 0.03;
  ldoSoil.add(ldoBody);

  const jstGrp = registerExplodable('SOIL_MOISTURE', 1.0, 0, 0.4, soilGroup, soilTop);
  const jstShell = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.16, 0.46)),
    whiteJstMat,
    1.05
  );
  jstShell.position.y = 0.08;
  jstGrp.add(jstShell);
  [-0.14, 0, 0.14].forEach((pz) => {
    const pin = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.1, 0.035, 0.035)),
      metalSilverMat,
      1.1
    );
    pin.position.set(0.13, 0.08, pz);
    jstGrp.add(pin);
  });
  tagEspPart(soilGroup, 'SOIL_MOISTURE');

  // =========================================================================
  // 7. DS18B20 WATERPROOF SOIL TEMP PROBE + PULL-UP ADAPTER
  // =========================================================================
  const dsGroup = new THREE.Group();
  const probeGrp = registerExplodable('DS18B20', -0.62, 0, 0.42, dsGroup, 0.14);
  const steelTip = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.08, 16)),
    metalSilverMat,
    1.04
  );
  steelTip.rotation.z = Math.PI / 2;
  probeGrp.add(steelTip);

  const heatShrink = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.155, 0.155, 0.24, 14)),
    icDarkMat,
    1.05
  );
  heatShrink.rotation.z = Math.PI / 2;
  heatShrink.position.x = 0.6;
  probeGrp.add(heatShrink);

  const dsCableDefs: Array<{ zEnd: number; color: string }> = [
    { zEnd: -0.18, color: '#e2483d' },
    { zEnd: 0, color: '#e2bd56' },
    { zEnd: 0.18, color: '#292623' },
  ];
  dsCableDefs.forEach(({ zEnd, color }) => {
    const cMat = factory.createToon(color);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 0.14, 0),
      new THREE.Vector3(0.28, 0.18, zEnd * 0.55),
      new THREE.Vector3(0.5, 0.18, zEnd),
    ]);
    const cMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 16, 0.026, 7, false)),
      cMat
    );
    cMesh.castShadow = true;
    dsGroup.add(cMesh);
  });

  const dsZ = 0.06;
  const dsH = 0.075;
  const dsTop = dsZ + dsH;
  const dsPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.95, dsH, 0.86, 0.06)),
    tealPcbMat,
    1.025
  );
  dsPcb.position.set(0.78, dsZ, 0);
  dsGroup.add(dsPcb);

  const dsSilkTex = createCanvasDecal(220, 200, (c) => {
    c.fillStyle = '#ecfdf5';
    c.font = 'bold 19px ui-monospace, monospace';
    c.fillText('DS18B20', 84, 24);
    c.font = 'bold 15px ui-monospace, monospace';
    c.fillText('4.7kΩ', 76, 178);
    c.textAlign = 'right';
    c.fillText('VCC', 178, 54);
    c.fillText('DQ', 178, 102);
    c.fillText('GND', 178, 152);
  });
  const dsDecalM = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.88, 0.78)),
    trackMat(new THREE.MeshBasicMaterial({ map: dsSilkTex, transparent: true }))
  );
  textures.push(dsSilkTex);
  dsDecalM.rotation.x = -Math.PI / 2;
  dsDecalM.position.set(0.78, dsTop + 0.003, 0);
  dsGroup.add(dsDecalM);

  const dsTerm = registerExplodable('DS18B20', 0.48, 0, 0.4, dsGroup, dsTop);
  const dsTermBlk = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.24, 0.56)),
    greenTermMat,
    1.05
  );
  dsTermBlk.position.y = 0.12;
  dsTerm.add(dsTermBlk);
  [-0.18, 0, 0.18].forEach((sz) => {
    const scr = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10)),
      metalSilverMat,
      1.07
    );
    scr.position.set(0, 0.25, sz);
    dsTerm.add(scr);
  });

  const dsRes = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.16, 0.05, 0.08)),
    tanBodyMat,
    1.08
  );
  dsRes.position.set(0.72, dsTop + 0.025, 0.14);
  dsGroup.add(dsRes);

  const dsHdr = registerExplodable('DS18B20', 1.14, 0, 0.36, dsGroup, dsTop);
  [-0.18, 0, 0.18].forEach((pz) => {
    const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
    sp.position.set(0, 0.035, pz);
    dsHdr.add(sp);
    const pin = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.04, 0.2, 0.04)),
      goldMat,
      1.1
    );
    pin.position.set(0, 0.12, pz);
    dsHdr.add(pin);
  });
  tagEspPart(dsGroup, 'DS18B20');

  // =========================================================================
  // 8. MICROSD LOGGER MODULE
  // =========================================================================
  const sdGroup = new THREE.Group();
  const sdZ = 0.06;
  const sdH = 0.08;
  const sdTop = sdZ + sdH;
  const sdPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.62, sdH, 1.44, 0.07)),
    bluePcbMat,
    1.022
  );
  sdPcb.position.y = sdZ;
  sdGroup.add(sdPcb);

  addGoldPads(sdGroup, sdTop + 0.005, [
    [-0.72, -0.62],
    [0.72, -0.62],
    [-0.72, 0.62],
    [0.72, 0.62],
  ]);

  const sdPinNames = ['CS', 'SCK', 'MOSI', 'MISO', 'VCC', 'GND'];
  const sdPinZs = [-0.55, -0.33, -0.11, 0.11, 0.33, 0.55];
  const sdSilkTex = createCanvasDecal(320, 280, (c) => {
    c.fillStyle = '#eef6ff';
    c.textBaseline = 'middle';
    c.font = 'bold 16px ui-monospace, monospace';
    c.textAlign = 'left';
    sdPinZs.forEach((pz, i) => {
      const py = ((pz + 0.72) / 1.44) * 280;
      c.fillText(sdPinNames[i], 46, py);
    });
    c.textAlign = 'center';
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('MicroSD', 232, 26);
    c.font = 'bold 13px ui-monospace, monospace';
    c.fillStyle = '#bfdbfe';
    c.fillText('SPI · 3.3V/5V', 175, 252);
  });
  addDecalPlane(sdGroup, 1.54, 1.36, sdTop + 0.003, sdSilkTex);

  const sdHdr = registerExplodable('MICROSD', -0.68, 0, 0.42, sdGroup, 0);
  sdPinZs.forEach((pz) => {
    const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
    sp.position.set(0, sdZ - 0.035, pz);
    sdHdr.add(sp);
    const pin = factory.createOutlinedMesh(pinShaftGeo, goldMat, 1.1);
    pin.position.set(0, sdZ - 0.11, pz);
    sdHdr.add(pin);
    const ring = factory.createOutlinedMesh(ringGeo, goldMat, 1.08);
    ring.position.set(0, sdTop + 0.008, pz);
    sdHdr.add(ring);
  });

  const sdLdo = registerExplodable('MICROSD', -0.1, -0.28, 0.48, sdGroup, sdTop);
  const sdLdoBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.24, 0.08, 0.28)),
    icDarkMat,
    1.07
  );
  sdLdoBody.position.y = 0.04;
  sdLdo.add(sdLdoBody);
  const sdLdoTab = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.16, 0.03, 0.08)),
    metalSilverMat,
    1.09
  );
  sdLdoTab.position.set(0, 0.015, -0.16);
  sdLdo.add(sdLdoTab);

  const sdBuf = registerExplodable('MICROSD', -0.1, 0.22, 0.52, sdGroup, sdTop);
  const sdBufBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.26, 0.075, 0.34)),
    icDarkMat,
    1.06
  );
  sdBufBody.position.y = 0.038;
  sdBuf.add(sdBufBody);
  [-0.12, -0.04, 0.04, 0.12].forEach((lz) => {
    [-0.16, 0.16].forEach((lx) => {
      const leg = factory.createOutlinedMesh(
        trackGeo(new THREE.BoxGeometry(0.05, 0.02, 0.03)),
        metalSilverMat,
        1.1
      );
      leg.position.set(lx, 0.01, lz);
      sdBuf.add(leg);
    });
  });

  const sdSlotGrp = registerExplodable('MICROSD', 0.36, 0, 0.58, sdGroup, sdTop);
  const sdCage = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.68, 0.14, 0.72)),
    metalSilverMat,
    1.04
  );
  sdCage.position.y = 0.07;
  sdSlotGrp.add(sdCage);
  const sdSlotHole = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.04, 0.08, 0.54)),
    usbHoleMat
  );
  sdSlotHole.position.set(0.34, 0.07, 0);
  sdSlotGrp.add(sdSlotHole);

  const sdCardBody = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.042, 0.48)),
    icDarkMat,
    1.06
  );
  sdCardBody.position.set(0.46, 0.07, 0);
  sdSlotGrp.add(sdCardBody);
  const sdCardTex = createCanvasDecal(128, 128, (c) => {
    c.fillStyle = '#1f2937';
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#f59e0b';
    c.fillRect(10, 16, 44, 96);
    c.fillStyle = '#fef3c7';
    c.font = 'bold 24px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('32GB', 92, 54);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillText('uSD', 92, 86);
  });
  addDecalPlane(sdSlotGrp, 0.38, 0.44, 0.095, sdCardTex);
  tagEspPart(sdGroup, 'MICROSD');

  // =========================================================================
  // 9. ESP32-CAM OV2640 MODULE
  // =========================================================================
  const camGroup = new THREE.Group();
  const camZ = 0.22;
  const camH = 0.085;
  const camTop = camZ + camH;
  const camPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.62, camH, 2.28, 0.08)),
    pcbMat,
    1.022
  );
  camPcb.position.y = camZ;
  camGroup.add(camPcb);

  const camPinRows = Array.from({ length: 8 }, (_, i) => -0.77 + i * 0.22);
  const camLeftPins = ['5V', 'GND', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'];
  const camRightPins = ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'];

  const camHdrGrp = registerExplodable('ESP32CAM', 0, 0, 0.32, camGroup, 0);
  camPinRows.forEach((pz) => {
    [-0.66, 0.66].forEach((px) => {
      const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
      sp.position.set(px, camZ - 0.035, pz);
      camHdrGrp.add(sp);
      const shaft = factory.createOutlinedMesh(pinShaftGeo, goldMat, 1.1);
      shaft.position.set(px, camZ - 0.11, pz);
      camHdrGrp.add(shaft);
      const ring = factory.createOutlinedMesh(ringGeo, goldMat, 1.08);
      ring.position.set(px, camTop + 0.008, pz);
      camHdrGrp.add(ring);
    });
  });

  const camSilkTex = createCanvasDecal(384, 540, (c) => {
    c.fillStyle = '#eef0f0';
    c.textBaseline = 'middle';
    c.font = 'bold 17px ui-monospace, monospace';
    camPinRows.forEach((pz, i) => {
      const py = ((pz + 1.14) / 2.28) * 540;
      c.textAlign = 'left';
      c.fillText(camLeftPins[i], 46, py);
      c.textAlign = 'right';
      c.fillText(camRightPins[i], 338, py);
    });
    c.textAlign = 'center';
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillText('ESP32-CAM', 192, 488);
    c.font = 'bold 15px ui-monospace, monospace';
    c.fillStyle = '#9ca3af';
    c.fillText('AI-Thinker · OV2640', 192, 514);
  });
  addDecalPlane(camGroup, 1.56, 2.22, camTop + 0.003, camSilkTex);

  const camSdSlot = registerExplodable('ESP32CAM', 0, -0.66, 0.55, camGroup, camTop);
  const camSdMetal = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.74, 0.12, 0.64)),
    metalSilverMat,
    1.04
  );
  camSdMetal.position.y = 0.06;
  camSdSlot.add(camSdMetal);

  const ovGrp = registerExplodable('ESP32CAM', 0, 0.25, 0.72, camGroup, camTop);
  const zifConn = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.48, 0.08, 0.14)),
    icDarkMat,
    1.06
  );
  zifConn.position.set(0, 0.04, -0.44);
  ovGrp.add(zifConn);

  const fpcMat = factory.createToon('#d97706');
  const fpcRibbon = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.32, 0.025, 0.36)),
    fpcMat,
    1.05
  );
  fpcRibbon.position.set(0, 0.03, -0.22);
  ovGrp.add(fpcRibbon);

  const camBaseBox = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.56, 0.18, 0.56)),
    icDarkMat,
    1.05
  );
  camBaseBox.position.y = 0.09;
  ovGrp.add(camBaseBox);

  const camBarrel = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.21, 0.23, 0.24, 18)),
    icDarkMat,
    1.05
  );
  camBarrel.position.y = 0.28;
  ovGrp.add(camBarrel);

  const lensRingMat = factory.createToon('#38bdf8');
  const lensRim = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.11, 0.16, 18)),
    lensRingMat
  );
  lensRim.rotation.x = -Math.PI / 2;
  lensRim.position.y = 0.404;
  ovGrp.add(lensRim);

  const lensGlassMat = trackMat(new THREE.MeshBasicMaterial({ color: '#0f172a' }));
  const lensGlass = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.11, 18)),
    lensGlassMat
  );
  lensGlass.rotation.x = -Math.PI / 2;
  lensGlass.position.y = 0.406;
  ovGrp.add(lensGlass);

  const camFlashMat = trackMat(new THREE.MeshBasicMaterial({ color: '#fef08a' }));
  const flashGrp = registerExplodable('ESP32CAM', -0.36, 0.72, 0.48, camGroup, camTop);
  const flashHousing = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.22, 0.08, 0.22)),
    metalSilverMat,
    1.06
  );
  flashHousing.position.y = 0.04;
  flashGrp.add(flashHousing);
  const flashLens = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 14)),
    camFlashMat
  );
  flashLens.position.y = 0.085;
  flashGrp.add(flashLens);
  tagEspPart(camGroup, 'ESP32CAM');

  // =========================================================================
  // 10. 2-CHANNEL 5V OPTOCOUPLER RELAY MODULE
  // =========================================================================
  const relayGroup = new THREE.Group();
  const redPcbMat = factory.createToon('#b91c1c');
  const relayBlueCubeMat = factory.createToon('#2563eb');
  const relayLedMat = trackMat(new THREE.MeshBasicMaterial({ color: '#7f1d1d' }));

  const rlyZ = 0.08;
  const rlyH = 0.085;
  const rlyTop = rlyZ + rlyH;
  const rlyPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.26, rlyH, 1.88, 0.07)),
    redPcbMat,
    1.022
  );
  rlyPcb.position.y = rlyZ;
  relayGroup.add(rlyPcb);

  addGoldPads(relayGroup, rlyTop + 0.005, [
    [-1.02, -0.82],
    [1.02, -0.82],
    [-1.02, 0.82],
    [1.02, 0.82],
  ]);

  const rlySilkTex = createCanvasDecal(512, 420, (c) => {
    c.fillStyle = '#fef2f2';
    c.textBaseline = 'middle';
    c.font = 'bold 18px ui-monospace, monospace';
    c.textAlign = 'left';
    ['GND', 'IN1', 'IN2', 'VCC'].forEach((lbl, i) => {
      c.fillText(lbl, 46, 84 + i * 44);
    });
    c.font = 'bold 14px ui-monospace, monospace';
    c.fillText('JD-VCC', 30, 318);
    c.textAlign = 'center';
    c.font = 'bold 19px ui-monospace, monospace';
    c.fillText('2CH 5V RELAY', 256, 30);
    c.textAlign = 'right';
    c.font = 'bold 13px ui-monospace, monospace';
    c.fillText('NO1 COM1 NC1', 418, 128);
    c.fillText('NO2 COM2 NC2', 418, 294);
  });
  addDecalPlane(relayGroup, 2.18, 1.8, rlyTop + 0.003, rlySilkTex);

  [-0.36, 0.38].forEach((rz) => {
    const rlyCubeGrp = registerExplodable('RELAY', -0.02, rz, 0.72, relayGroup, rlyTop);
    const rlyCube = factory.createOutlinedMesh(
      trackGeo(createRoundedBoxGeo(0.74, 0.56, 0.62, 0.03)),
      relayBlueCubeMat,
      1.035
    );
    rlyCube.position.y = 0.28;
    rlyCubeGrp.add(rlyCube);
    const rlyCapTex = createCanvasDecal(180, 140, (c) => {
      c.fillStyle = '#eff6ff';
      c.textAlign = 'center';
      c.font = 'bold 22px ui-monospace, monospace';
      c.fillText('SONGLE', 90, 34);
      c.font = 'bold 15px ui-monospace, monospace';
      c.fillText('SRD-05VDC', 90, 72);
      c.fillText('SL-C · 10A', 90, 104);
    });
    addDecalPlane(rlyCubeGrp, 0.66, 0.52, 0.566, rlyCapTex);
  });

  [-0.36, 0.38].forEach((rz) => {
    const tBlkGrp = registerExplodable('RELAY', 0.88, rz, 0.55, relayGroup, rlyTop);
    const tBlk = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.32, 0.28, 0.62)),
      greenTermMat,
      1.045
    );
    tBlk.position.y = 0.14;
    tBlkGrp.add(tBlk);
    [-0.19, 0, 0.19].forEach((sz) => {
      const scr = factory.createOutlinedMesh(
        trackGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.035, 10)),
        metalSilverMat,
        1.07
      );
      scr.position.set(0, 0.29, sz);
      tBlkGrp.add(scr);
      const hole = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.05, 0.11, 0.11)),
        usbHoleMat
      );
      hole.position.set(0.15, 0.1, sz);
      tBlkGrp.add(hole);
    });
  });

  const rlyCtrlHdr = registerExplodable('RELAY', -0.92, -0.18, 0.44, relayGroup, rlyTop);
  [-0.33, -0.11, 0.11, 0.33].forEach((pz) => {
    const sp = factory.createOutlinedMesh(spacerGeo, icDarkMat, 1.08);
    sp.position.set(0, 0.035, pz);
    rlyCtrlHdr.add(sp);
    const pin = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.04, 0.2, 0.04)),
      goldMat,
      1.1
    );
    pin.position.set(0, 0.12, pz);
    rlyCtrlHdr.add(pin);
  });

  const optoGrp = registerExplodable('RELAY', -0.58, -0.1, 0.5, relayGroup, rlyTop);
  [-0.24, 0.24].forEach((oz) => {
    const opto = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.09, 0.18)),
      icDarkMat,
      1.07
    );
    opto.position.set(0, 0.045, oz);
    optoGrp.add(opto);
    const led = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.09, 0.04, 0.06)),
      relayLedMat
    );
    led.position.set(0.02, 0.02, oz + 0.17);
    optoGrp.add(led);
  });

  const jdGrp = registerExplodable('RELAY', -0.82, 0.56, 0.48, relayGroup, rlyTop);
  const jdCap = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.18, 0.16, 0.26)),
    goldMat,
    1.06
  );
  jdCap.position.y = 0.08;
  jdGrp.add(jdCap);
  tagEspPart(relayGroup, 'RELAY');

  // =========================================================================
  // 11. 12V DIAPHRAGM WATER PUMP
  // =========================================================================
  const pumpGroup = new THREE.Group();
  const pumpBodyDarkMat = factory.createToon('#1f2937');
  const pumpBracket = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.75, 0.08, 0.92, 0.06)),
    icDarkMat,
    1.03
  );
  pumpBracket.position.y = 0.04;
  pumpGroup.add(pumpBracket);

  const motorGrp = registerExplodable('PUMP', -0.25, 0, 0.55, pumpGroup, 0.08);
  const motorCan = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.94, 20)),
    metalSilverMat,
    1.035
  );
  motorCan.rotation.z = Math.PI / 2;
  motorCan.position.y = 0.36;
  motorGrp.add(motorCan);

  const motorEndCap = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.14, 18)),
    pumpBodyDarkMat,
    1.04
  );
  motorEndCap.rotation.z = Math.PI / 2;
  motorEndCap.position.set(-0.5, 0.36, 0);
  motorGrp.add(motorEndCap);

  const pumpLblTex = createCanvasDecal(256, 128, (c) => {
    c.fillStyle = '#1e293b';
    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('12V PUMP', 128, 52);
    c.font = 'bold 18px ui-monospace, monospace';
    c.fillStyle = '#475569';
    c.fillText('DIAPHRAGM · 3L/m', 128, 92);
  });
  addDecalPlane(motorGrp, 0.68, 0.34, 0.725, pumpLblTex);

  [
    { z: -0.14, mat: factory.createToon('#dc2626') },
    { z: 0.14, mat: icDarkMat },
  ].forEach((tab) => {
    const wire = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.24, 8)),
      tab.mat,
      1.08
    );
    wire.rotation.z = Math.PI / 2;
    wire.position.set(-0.68, 0.36, tab.z);
    motorGrp.add(wire);
  });

  const headGrp = registerExplodable('PUMP', 0.48, 0, 0.68, pumpGroup, 0.08);
  const headBlock = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.56, 0.66, 0.74, 0.08)),
    pumpBodyDarkMat,
    1.035
  );
  headBlock.position.y = 0.36;
  headGrp.add(headBlock);

  const sightGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16)),
    factory.createToon('#0284c7')
  );
  sightGlass.position.y = 0.695;
  headGrp.add(sightGlass);

  const pumpRotorGroup = new THREE.Group();
  pumpRotorGroup.position.y = 0.715;
  headGrp.add(pumpRotorGroup);
  const blade1 = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.018, 0.045)),
    metalSilverMat
  );
  const blade2 = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.045, 0.018, 0.28)),
    metalSilverMat
  );
  pumpRotorGroup.add(blade1, blade2);

  [-0.22, 0.22].forEach((nz) => {
    const nozzle = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.085, 0.11, 0.34, 14)),
      metalSilverMat,
      1.05
    );
    nozzle.rotation.z = -Math.PI / 2;
    nozzle.position.set(0.42, 0.38, nz);
    headGrp.add(nozzle);
    const bore = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(0.055, 12)),
      usbHoleMat
    );
    bore.rotation.y = Math.PI / 2;
    bore.position.set(0.595, 0.38, nz);
    headGrp.add(bore);
  });
  tagEspPart(pumpGroup, 'PUMP');

  // =========================================================================
  // 12. 12V BRASS SOLENOID VALVE
  // =========================================================================
  const solGroup = new THREE.Group();
  const brassMat = factory.createToon('#d4a338');
  const coilBlueMat = factory.createToon('#1d4ed8');
  const solenoidLedMat = trackMat(new THREE.MeshBasicMaterial({ color: '#1e3a8a' }));

  const valveBody = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 1.38, 14)),
    brassMat,
    1.035
  );
  valveBody.rotation.z = Math.PI / 2;
  valveBody.position.y = 0.26;
  solGroup.add(valveBody);

  [-0.68, 0.68].forEach((hx) => {
    const hexPort = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 6)),
      brassMat,
      1.045
    );
    hexPort.rotation.z = Math.PI / 2;
    hexPort.position.set(hx, 0.26, 0);
    solGroup.add(hexPort);

    const bore = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(0.14, 14)),
      usbHoleMat
    );
    bore.rotation.y = hx < 0 ? -Math.PI / 2 : Math.PI / 2;
    bore.position.set(hx + (hx < 0 ? -0.125 : 0.125), 0.26, 0);
    solGroup.add(bore);
  });

  const coilGrp = registerExplodable('SOLENOID', 0, 0, 0.65, solGroup, 0.44);
  const coilBox = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.76, 0.6, 0.72, 0.05)),
    coilBlueMat,
    1.035
  );
  coilBox.position.y = 0.3;
  coilGrp.add(coilBox);

  const coilNut = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 6)),
    brassMat,
    1.06
  );
  coilNut.position.y = 0.64;
  coilGrp.add(coilNut);

  const coilLed = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12)),
    solenoidLedMat
  );
  coilLed.position.set(0.24, 0.61, 0.22);
  coilGrp.add(coilLed);

  const solDecalTex = createCanvasDecal(180, 180, (c) => {
    c.fillStyle = '#eff6ff';
    c.textAlign = 'center';
    c.font = 'bold 20px ui-monospace, monospace';
    c.fillText('SOLENOID', 90, 42);
    c.font = 'bold 17px ui-monospace, monospace';
    c.fillText('12V DC · NC', 90, 138);
  });
  addDecalPlane(coilGrp, 0.68, 0.64, 0.606, solDecalTex);
  tagEspPart(solGroup, 'SOLENOID');

  // =========================================================================
  // 13. PANEL SURYA 6V / 10W
  // =========================================================================
  const solarGroup = new THREE.Group();
  const pvZ = 0.07;
  const pvH = 0.12;
  const pvTop = pvZ + pvH;
  const pvFrame = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.42, pvH, 1.94, 0.04)),
    metalSilverMat,
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
  addDecalPlane(solarGroup, 2.24, 1.76, pvTop + 0.004, pvCellTex);

  const pvJbox = registerExplodable('SOLAR', 0.92, 0, 0.42, solarGroup, pvTop);
  const pvBoxMesh = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.28, 0.12, 0.54, 0.03)),
    icDarkMat,
    1.05
  );
  pvBoxMesh.position.y = 0.06;
  pvJbox.add(pvBoxMesh);
  tagEspPart(solarGroup, 'SOLAR');

  // =========================================================================
  // 14. CN3791 MPPT SOLAR CHARGER + BMS
  // =========================================================================
  const mpptGroup = new THREE.Group();
  const mpptZ = 0.06;
  const mpptH = 0.085;
  const mpptTop = mpptZ + mpptH;
  const mpptPcb = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.08, mpptH, 1.38, 0.07)),
    bluePcbMat,
    1.022
  );
  mpptPcb.position.y = mpptZ;
  mpptGroup.add(mpptPcb);

  addGoldPads(mpptGroup, mpptTop + 0.005, [
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
  addDecalPlane(mpptGroup, 2.0, 1.32, mpptTop + 0.003, mpptSilkTex);

  addScrewTerminal('MPPT', mpptGroup, -0.84, 0.02, mpptTop, blueTermMat, 'left');
  addScrewTerminal('MPPT', mpptGroup, 0.84, 0.02, mpptTop, blueTermMat, 'right');

  const mpptIndGrp = registerExplodable('MPPT', 0.06, -0.18, 0.6, mpptGroup, mpptTop);
  const mpptInd = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.46, 0.24, 0.46, 0.04)),
    icDarkMat,
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
  addDecalPlane(mpptIndGrp, 0.4, 0.4, 0.245, mppt4r7);

  const mpptIcGrp = registerExplodable('MPPT', -0.26, 0.24, 0.48, mpptGroup, mpptTop);
  const mpptIc = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.075, 0.24)),
    icDarkMat,
    1.07
  );
  mpptIc.position.y = 0.038;
  mpptIcGrp.add(mpptIc);

  const mpptChgLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.1, 0.04, 0.06)),
    factory.createToon('#f59e0b')
  );
  mpptChgLed.position.set(0.32, mpptTop + 0.02, 0.26);
  mpptGroup.add(mpptChgLed);
  tagEspPart(mpptGroup, 'MPPT');

  // =========================================================================
  // 15. PAKET BATERAI LiFePO4 4S 12.8V 6000mAh
  // =========================================================================
  const batGroup = new THREE.Group();
  const batCradle = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(2.24, 0.14, 0.98, 0.07)),
    icDarkMat,
    1.03
  );
  batCradle.position.y = 0.0;
  batGroup.add(batCradle);

  [-0.96, 0.96].forEach((cx) => {
    const clip = factory.createOutlinedMesh(
      trackGeo(new THREE.BoxGeometry(0.1, 0.48, 0.44)),
      metalSilverMat,
      1.05
    );
    clip.position.set(cx, 0.32, 0);
    batGroup.add(clip);
  });

  const cellGrp = registerExplodable('BATTERY', 0, 0, 0.62, batGroup, 0.14);
  const cellSleeveMat = factory.createToon('#0284c7');
  const packBody = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(1.76, 0.48, 0.78, 0.08)),
    cellSleeveMat,
    1.03
  );
  packBody.position.y = 0.02;
  cellGrp.add(packBody);

  [-0.27, -0.09, 0.09, 0.27].forEach((rz) => {
    const cellRib = factory.createOutlinedMesh(
      trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 1.72, 12)),
      cellSleeveMat,
      1.02
    );
    cellRib.rotation.z = Math.PI / 2;
    cellRib.position.set(0, 0.47, rz);
    cellGrp.add(cellRib);
  });

  const posNub = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16)),
    metalSilverMat,
    1.06
  );
  posNub.rotation.z = Math.PI / 2;
  posNub.position.set(-0.9, 0.3, 0);
  cellGrp.add(posNub);

  const batLabelTex = createCanvasDecal(440, 180, (c) => {
    c.fillStyle = '#0369a1';
    c.fillRect(0, 0, 440, 180);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 4;
    c.strokeRect(8, 8, 424, 164);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.font = 'bold 28px ui-monospace, monospace';
    c.fillText('LiFePO4 4S PACK', 220, 52);
    c.font = 'bold 22px ui-monospace, monospace';
    c.fillStyle = '#bae6fd';
    c.fillText('12.8V · 6000mAh · 76.8Wh', 220, 98);
    c.fillStyle = '#fde047';
    c.font = 'bold 25px ui-monospace, monospace';
    c.fillText('+ (12V)             - (GND)', 220, 142);
  });
  addDecalPlane(cellGrp, 1.56, 0.62, 0.562, batLabelTex);
  tagEspPart(batGroup, 'BATTERY');

  return {
    modules: {
      espGroup,
      lmGroup,
      trGroup,
      ledBoardGroup,
      bmeGroup,
      soilGroup,
      dsGroup,
      sdGroup,
      camGroup,
      relayGroup,
      pumpGroup,
      solGroup,
      solarGroup,
      mpptGroup,
      batGroup,
    },
    materials: {
      pcbMat,
      pcbDarkMat,
      metalSilverMat,
      icDarkMat,
      goldMat,
      usbHoleMat,
      ledMat,
      greenLedMat,
      relayLedMat,
      solenoidLedMat,
      camFlashMat,
    },
    pumpRotorGroup,
    explodables,
  };
}
