import * as THREE from 'three';

// Geometry helpers moved verbatim from hardwareModules.ts.

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
