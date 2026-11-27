import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

// Smooth ovate-lanceolate chili leaf in local +Z outward space (top surface = +Y)
export function createChiliLeafGeo(ctx: GardenContext): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.064, 0.042, 0.068, 0.135, 0, 0.225);
  shape.bezierCurveTo(-0.068, 0.135, -0.064, 0.042, 0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.008,
    bevelEnabled: false,
    curveSegments: 8,
  });
  // Rotate so leaf starts at (0,0,0), grows along +Z, thickness in Y
  geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    const lz = pos.getZ(i);
    const t = THREE.MathUtils.clamp(lz / 0.225, 0, 1);
    // Natural gentle downward droop toward tip + subtle V-cupping along midrib
    const droop = -Math.pow(t, 1.8) * 0.048;
    const midribCup = Math.abs(lx) * 0.16;
    pos.setY(i, ly + droop + midribCup);
  }
  geo.computeVertexNormals();
  return ctx.trackGeo(geo);
}

// Smooth curved hanging cabai keriting pod geometry (starts at calyx 0, curves down to -0.24)
export function createCurlyChiliGeo(ctx: GardenContext): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.008, -0.06, 0.004),
    new THREE.Vector3(0.022, -0.13, 0.01),
    new THREE.Vector3(0.044, -0.195, 0.014),
    new THREE.Vector3(0.072, -0.232, 0.012),
  ]);
  const tubularSegments = 12;
  const radialSegments = 8;
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    // Taper smoothly from calyx top (0.017) down to sharp tip (0.002)
    const r = t === 0 ? 0.002 : 0.017 * Math.pow(1 - t * 0.88, 0.72);
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);
      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;
      normals.push(nx, ny, nz);
      positions.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return ctx.trackGeo(geo);
}
