import * as THREE from 'three';
import { EspPartKey } from '../../data/espParts';
import { getNightFactor } from '../../simulation/riskEngine';
import { HardwareModulesKit } from '../hardwareModules';
import type { Esp3DSceneController } from '../buildCircuitScene';
import { CircuitContext } from './context';
import { TourOverlayState } from './tour';

export interface CircuitControllerDeps {
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  ledMat: THREE.MeshBasicMaterial;
  greenLedMat: THREE.MeshBasicMaterial;
  relayLedMat: THREE.MeshBasicMaterial;
  solenoidLedMat: THREE.MeshBasicMaterial;
  camFlashMat: THREE.MeshBasicMaterial;
  pumpRotorGroup: THREE.Group;
  explodables: HardwareModulesKit['explodables'];
  tour: TourOverlayState;
}

/**
 * Walks up from a hit object to the nearest tagged ancestor.
 * (Extracted from the original pickPart so the hit loop is a flat
 * early-return instead of a nested while loop; logic identical.)
 */
function findTaggedPart(obj: THREE.Object3D): EspPartKey | null {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr.userData.espPart) {
      return curr.userData.espPart as EspPartKey;
    }
    curr = curr.parent;
  }
  return null;
}

/** update / pickPart / dispose (original sections 10-11 tail). */
export function buildCircuitController(
  ctx: CircuitContext,
  deps: CircuitControllerDeps
): Pick<Esp3DSceneController, 'update' | 'pickPart' | 'dispose'> {
  const { scene, factory, geometries, extraMaterials, textures } = ctx;
  const {
    hemiLight,
    sunLight,
    ledMat,
    greenLedMat,
    relayLedMat,
    solenoidLedMat,
    camFlashMat,
    pumpRotorGroup,
    explodables,
    tour,
  } = deps;
  const { bracketMat, edgeMat, focusFrameHolder, cornerMeshes, edgeTop, edgeBot, edgeLeft, edgeRight, orbHaloMat, flowOrbPool, cachedCurves } = tour;
  let explodeLerp = 0;

  const update: Esp3DSceneController['update'] = (
    dt,
    elapsed,
    metrics,
    exploded,
    _selectedPart,
    tourStep = null
  ) => {
    const nightFactor = getNightFactor(metrics.timeHours);
    const isNight = nightFactor > 0.52;

    hemiLight.intensity = isNight ? 1.0 : 1.25;
    sunLight.intensity = isNight ? 1.2 : 1.7;

    // LED status color synced with simulation (or highlighted actuator tour step)
    const demoActuators = tourStep?.id === 'actuators';
    if (metrics.isWatering || demoActuators) {
      ledMat.color.set('#4ade80');
      greenLedMat.color.set('#4ade80');
      relayLedMat.color.set('#4ade80');
      solenoidLedMat.color.set('#38bdf8');
      pumpRotorGroup.rotation.y += dt * 10;
    } else if (metrics.patekRiskPct >= 65) {
      ledMat.color.set('#f59e0b');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    } else {
      ledMat.color.set('#ef4444');
      greenLedMat.color.set('#1f6f5b');
      relayLedMat.color.set('#7f1d1d');
      solenoidLedMat.color.set('#1e3a8a');
    }

    camFlashMat.color.set(
      metrics.patekRiskPct >= 65 || tourStep?.id === 'cam' ? '#fef9c3' : '#9ca3af'
    );

    // Guided Tour Rectangular HUD Focus Frame & Wire Flow Pulses
    if (tourStep) {
      const targetPos = new THREE.Vector3(...tourStep.ringPos);
      const [tgtW, tgtD] = tourStep.frameSize;
      if (!tour.frame.initialized) {
        tour.frame.pos.copy(targetPos);
        tour.frame.w = tgtW;
        tour.frame.d = tgtD;
        tour.frame.initialized = true;
      } else {
        const k = Math.min(1, dt * 6.5);
        tour.frame.pos.lerp(targetPos, k);
        tour.frame.w += (tgtW - tour.frame.w) * k;
        tour.frame.d += (tgtD - tour.frame.d) * k;
      }

      const showFrame = tgtW > 0.1 && tgtD > 0.1 && tour.frame.w > 0.15;
      focusFrameHolder.visible = showFrame;
      if (showFrame) {
        focusFrameHolder.position.copy(tour.frame.pos);
        const pad = (Math.sin(elapsed * 4.2) * 0.5 + 0.5) * 0.08;
        const w = tour.frame.w + pad * 2;
        const d = tour.frame.d + pad * 2;
        const hw = w / 2;
        const hd = d / 2;
        const arm = Math.min(0.48, Math.min(w, d) * 0.34);
        const thick = 0.085;

        cornerMeshes.forEach(({ sx, sz, hBar, vBar }) => {
          hBar.scale.set(arm, 1, thick);
          hBar.position.set(sx * (hw - arm / 2), 0.008, sz * (hd - thick / 2));
          vBar.scale.set(thick, 1, arm);
          vBar.position.set(sx * (hw - thick / 2), 0.008, sz * (hd - arm / 2));
        });

        edgeTop.scale.set(w, 0.7, 0.032);
        edgeTop.position.set(0, 0, -hd + 0.016);
        edgeBot.scale.set(w, 0.7, 0.032);
        edgeBot.position.set(0, 0, hd - 0.016);
        edgeLeft.scale.set(0.032, 0.7, d);
        edgeLeft.position.set(-hw + 0.016, 0, 0);
        edgeRight.scale.set(0.032, 0.7, d);
        edgeRight.position.set(hw - 0.016, 0, 0);

        bracketMat.color.set(tourStep.accentColor);
        edgeMat.color.set(tourStep.accentColor);
        edgeMat.opacity = 0.25 + (Math.sin(elapsed * 4.2) * 0.5 + 0.5) * 0.25;
      }
      orbHaloMat.color.set(tourStep.accentColor);

      let curves = cachedCurves.get(tourStep.id);
      if (!curves) {
        curves = tourStep.flowPaths.map((pts) => {
          const path = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 0; i < pts.length - 1; i++) {
            path.add(
              new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1]))
            );
          }
          return path;
        });
        cachedCurves.set(tourStep.id, curves);
      }

      let orbIdx = 0;
      const orbsPerPath = curves.length > 1 ? 3 : 4;
      curves.forEach((curve, pathIdx) => {
        for (let j = 0; j < orbsPerPath && orbIdx < tour.maxFlowOrbs; j++) {
          const rawT = (elapsed * 0.55 + j / orbsPerPath + pathIdx * 0.17) % 1;
          const safeT = Math.min(0.9999, Math.max(0, (rawT + 1) % 1));
          const pt = curve.getPointAt(safeT);
          if (!pt) continue;
          const orb = flowOrbPool[orbIdx++];
          orb.position.copy(pt);
          const s = 0.85 + Math.sin(elapsed * 7 + j) * 0.18;
          orb.scale.setScalar(s);
          orb.visible = true;
        }
      });
      for (let k = orbIdx; k < tour.maxFlowOrbs; k++) {
        flowOrbPool[k].visible = false;
      }
    } else {
      focusFrameHolder.visible = false;
      tour.frame.initialized = false;
      flowOrbPool.forEach((orb) => {
        orb.visible = false;
      });
    }

    // Smooth exploded animation
    const targetExp = exploded ? 1 : 0;
    explodeLerp += (targetExp - explodeLerp) * Math.min(1, dt * 8);

    explodables.forEach((item) => {
      item.group.position.y = item.baseY + item.liftY * explodeLerp;
      item.guideLine.visible = explodeLerp > 0.04;
    });
  };

  const pickPart: Esp3DSceneController['pickPart'] = (raycaster) => {
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const h of hits) {
      const part = findTaggedPart(h.object);
      if (part) return part;
    }
    return null;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    extraMaterials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    factory.dispose();
  };

  return { update, pickPart, dispose };
}
