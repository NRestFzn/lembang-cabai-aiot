import * as THREE from 'three';

/**
 * Stepped 3-band toon gradient map so meshes render with flat Colorfigures-like cel shading.
 */
export function createSteppedGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([
    158, 158, 158, 255,
    218, 218, 218, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export interface StylizedFactory {
  gradientMap: THREE.DataTexture;
  outlineMaterial: THREE.MeshBasicMaterial;
  createToon: (color: THREE.ColorRepresentation, extra?: Partial<THREE.MeshToonMaterialParameters>) => THREE.MeshToonMaterial;
  createOutlinedMesh: (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    outlineScale?: number,
    castShadow?: boolean,
    receiveShadow?: boolean
  ) => THREE.Group;
  dispose: () => void;
}

export function createStylizedFactory(): StylizedFactory {
  const gradientMap = createSteppedGradientMap();
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#231e16'),
    side: THREE.BackSide,
  });

  const trackedMaterials: THREE.Material[] = [outlineMaterial];

  const createToon = (
    color: THREE.ColorRepresentation,
    extra: Partial<THREE.MeshToonMaterialParameters> = {}
  ) => {
    const mat = new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap,
      ...extra,
    });
    trackedMaterials.push(mat);
    return mat;
  };

  const createOutlinedMesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    outlineScale = 1.045,
    castShadow = true,
    receiveShadow = true
  ) => {
    const group = new THREE.Group();
    const main = new THREE.Mesh(geometry, material);
    main.castShadow = castShadow;
    main.receiveShadow = receiveShadow;

    const outline = new THREE.Mesh(geometry, outlineMaterial);
    outline.scale.setScalar(outlineScale);
    outline.castShadow = false;
    outline.receiveShadow = false;
    // Slight polygon offset avoids z-fighting on thin shapes
    outline.renderOrder = -1;

    group.add(main);
    group.add(outline);
    return group;
  };

  const dispose = () => {
    gradientMap.dispose();
    trackedMaterials.forEach((m) => m.dispose());
  };

  return {
    gradientMap,
    outlineMaterial,
    createToon,
    createOutlinedMesh,
    dispose,
  };
}
