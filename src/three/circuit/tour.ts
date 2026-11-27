import * as THREE from 'three';
import { CircuitContext } from './context';

/** Mutable tour-frame state, grouped so the controller can move it through this object. */
export interface TourFrameState {
  pos: THREE.Vector3;
  w: number;
  d: number;
  initialized: boolean;
}

export interface TourOverlayState {
  bracketMat: THREE.MeshBasicMaterial;
  edgeMat: THREE.MeshBasicMaterial;
  focusFrameHolder: THREE.Group;
  cornerMeshes: Array<{ sx: number; sz: number; hBar: THREE.Mesh; vBar: THREE.Mesh }>;
  edgeTop: THREE.Mesh;
  edgeBot: THREE.Mesh;
  edgeLeft: THREE.Mesh;
  edgeRight: THREE.Mesh;
  orbHaloMat: THREE.MeshBasicMaterial;
  flowOrbPool: THREE.Group[];
  cachedCurves: Map<string, THREE.CurvePath<THREE.Vector3>[]>;
  maxFlowOrbs: number;
  frame: TourFrameState;
}

/** Guided-tour visuals: HUD corner brackets + flow orbs (original section 11). */
export function buildTourOverlay(ctx: CircuitContext): TourOverlayState {
  const { scene, trackGeo, trackMat } = ctx;
  // =========================================================================
  // 11. GUIDED TOUR VISUALS (RECTANGULAR HUD CORNER BRACKETS & FLOW ORBS)
  // =========================================================================
  const tourOverlayGroup = new THREE.Group();
  scene.add(tourOverlayGroup);

  const bracketMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.94,
    })
  );
  const edgeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.34,
    })
  );
  const unitBarGeo = trackGeo(new THREE.BoxGeometry(1, 0.022, 1));
  const focusFrameHolder = new THREE.Group();
  focusFrameHolder.visible = false;
  tourOverlayGroup.add(focusFrameHolder);

  const cornerMeshes: Array<{
    sx: number;
    sz: number;
    hBar: THREE.Mesh;
    vBar: THREE.Mesh;
  }> = [];
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const hBar = new THREE.Mesh(unitBarGeo, bracketMat);
      const vBar = new THREE.Mesh(unitBarGeo, bracketMat);
      focusFrameHolder.add(hBar, vBar);
      cornerMeshes.push({ sx, sz, hBar, vBar });
    });
  });

  const edgeTop = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeBot = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeLeft = new THREE.Mesh(unitBarGeo, edgeMat);
  const edgeRight = new THREE.Mesh(unitBarGeo, edgeMat);
  focusFrameHolder.add(edgeTop, edgeBot, edgeLeft, edgeRight);

  const orbCoreGeo = trackGeo(new THREE.SphereGeometry(0.068, 12, 12));
  const orbHaloGeo = trackGeo(new THREE.SphereGeometry(0.115, 12, 12));
  const orbCoreMat = trackMat(new THREE.MeshBasicMaterial({ color: '#fef08a' }));
  const orbHaloMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.42 })
  );

  const MAX_FLOW_ORBS = 8;
  const flowOrbPool = Array.from({ length: MAX_FLOW_ORBS }, () => {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(orbCoreGeo, orbCoreMat), new THREE.Mesh(orbHaloGeo, orbHaloMat));
    grp.visible = false;
    tourOverlayGroup.add(grp);
    return grp;
  });

  const cachedCurves = new Map<string, THREE.CurvePath<THREE.Vector3>[]>();
  const frame = {
    pos: new THREE.Vector3(0, 0.25, 0),
    w: 2.0,
    d: 2.0,
    initialized: false,
  };
  return {
    bracketMat,
    edgeMat,
    focusFrameHolder,
    cornerMeshes,
    edgeTop,
    edgeBot,
    edgeLeft,
    edgeRight,
    orbHaloMat,
    flowOrbPool,
    cachedCurves,
    maxFlowOrbs: MAX_FLOW_ORBS,
    frame,
  };
}
