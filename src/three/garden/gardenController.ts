import * as THREE from 'three';
import { ACCENT_SWATCHES, LEAF_CONDITION_META } from '../../data/parts';
import { evaluateCanopyLeafCondition, getNightFactor } from '../../simulation/riskEngine';
import type {
  AccentId,
  LeafCondition,
  PartId,
  SelectedLeafInfo,
  SimulationMetrics,
  WeatherMode,
} from '../../types/simulation';
import { POLE_X, POLE_Z, type BoxExplodeItem, type GardenContext, type PlantAnimRef } from './gardenContext';
import type { GardenLights } from './gardenLighting';
import type { GardenPumpParts } from './gardenPump';
import type { GardenSensorParts } from './gardenSensors';
import type { GardenSky } from './gardenSky';
import type { GardenWaterEffects } from './gardenWaterEffects';

export interface PickResult {
  partId: PartId;
  leaf?: SelectedLeafInfo;
}

export interface HotspotItem {
  key: string;
  kind: 'part' | 'leaf';
  partId: PartId;
  worldPos: [number, number, number];
  leaf?: SelectedLeafInfo;
  ringColor?: string;
}

export interface GardenSceneController {
  scene: THREE.Scene;
  cameraAnchors: Record<PartId, THREE.Vector3>;
  update: (
    dt: number,
    elapsed: number,
    metrics: SimulationMetrics,
    weather: WeatherMode,
    accent: AccentId,
    exploded: boolean,
    showFov: boolean,
    selectedPart: PartId | null,
    selectedLeaf: SelectedLeafInfo | null
  ) => void;
  pickPart: (raycaster: THREE.Raycaster) => PickResult | null;
  getHotspots: () => HotspotItem[];
  dispose: () => void;
}

/** Everything the per-frame controller needs from the section builders. */
export interface GardenSceneParts {
  lights: GardenLights;
  shadowFloorMat: THREE.ShadowMaterial;
  plantRefs: PlantAnimRef[];
  emitterPositions: GardenPumpParts['emitterPositions'];
  water: GardenWaterEffects;
  boxExplodeItems: BoxExplodeItem[];
  sensors: GardenSensorParts;
  sky: GardenSky;
}

/** Droplet scale for a live upper-terrace plant: hidden when drought only yellows the leaves, otherwise at least `minWet` while wet or infected. */
function wetDropScale(
  cond: LeafCondition,
  droughtYellowOnly: boolean,
  manualPouring: boolean,
  dropScale: number,
  minWet: number
): number {
  if (droughtYellowOnly) return 0.001;
  if (manualPouring || cond === 'wet_risk' || cond === 'patek_early' || cond === 'patek_infected') {
    return Math.max(minWet, dropScale);
  }
  return dropScale;
}

/** Patek-spot scale for a live upper-terrace plant, by condition severity. */
function conditionSpotScale(
  cond: LeafCondition,
  droughtYellowOnly: boolean,
  globalSpotScale: number,
  infected: number,
  early: number,
  yellow: number
): number {
  if (droughtYellowOnly) return 0.001;
  if (cond === 'patek_infected') return Math.max(infected, globalSpotScale);
  if (cond === 'patek_early') return Math.max(early, globalSpotScale);
  if (cond === 'yellowing') return Math.max(yellow, globalSpotScale);
  return globalSpotScale;
}

/**
 * Condition of upper-terrace plants 2-4: patek_early -> patek_infected (or
 * drought yellowing), checked in severity order with early returns.
 */
function resolveUpperTerraceCondition(
  metrics: SimulationMetrics,
  weather: WeatherMode,
  night: number,
  manualPouring: boolean,
  isDrought: boolean
): LeafCondition {
  if (metrics.symptomSeverity >= 0.72 || (metrics.patekRiskPct >= 88 && metrics.symptomSeverity >= 0.5)) {
    return 'patek_infected';
  }
  if (metrics.symptomSeverity >= 0.42 || (metrics.patekRiskPct >= 75 && metrics.symptomSeverity >= 0.25)) {
    return 'patek_early';
  }
  if (metrics.symptomSeverity >= 0.16 || metrics.patekRiskPct >= 56 || isDrought) {
    return 'yellowing';
  }
  if (
    manualPouring ||
    metrics.leafWetnessPct >= 40 ||
    weather === 'rainy' ||
    weather === 'foggy' ||
    (night > 0.5 && metrics.relativeHumidity >= 86)
  ) {
    return 'wet_risk';
  }
  return 'healthy';
}

export function createGardenController(ctx: GardenContext, parts: GardenSceneParts): GardenSceneController {
  const { scene, factory, geometries, disposableMaterials, textures } = ctx;
  const mats = ctx.mats;
  const { solenoidLedMat, camFlashMat } = ctx.kit.materials;
  const { pumpRotorGroup } = ctx.kit;
  const { hemiLight, sunLight, nodeGlow } = parts.lights;
  const { shadowFloorMat } = parts;
  const { plantRefs } = parts;
  const { emitterPositions } = parts;
  const {
    gemborGroup, gemborRestPos, gemborNozzleTip, gemborNozzleWorld,
    sprayDrops, sporeParticles, rainStreaks,
  } = parts.water;
  const { boxExplodeItems } = parts;
  const { fovCone, fovEdges, fovMat } = parts.sensors;
  const {
    sunMat, celestialDisc, mistMatLower, mistMatUpper, mistGroup,
    selectRing, selectRingMat, leafHighlightRing, tempLeafPos,
  } = parts.sky;
  let gemborLift = 0;
const cameraAnchors: Record<PartId, THREE.Vector3> = {
  solar: new THREE.Vector3(POLE_X, 2.55, POLE_Z),
  enclosure: new THREE.Vector3(POLE_X + 0.14, 1.68, POLE_Z),
  esp32cam: new THREE.Vector3(POLE_X + 0.34, 2.12, POLE_Z),
  dht22: new THREE.Vector3(-0.95, 1.18, POLE_Z),
  soil_probe: new THREE.Vector3(-0.92, 0.58, -0.83),
  solenoid: new THREE.Vector3(-1.98, 0.45, 0.22),
  pump: new THREE.Vector3(-2.66, 0.55, 0.58),
  terrace: new THREE.Vector3(0.4, 0.1, 0.1),
  chili_plant: new THREE.Vector3(0.45, 1.22, -1.12),
};

const CLICKABLE_TOOL_IDS: PartId[] = [
  'solar',
  'enclosure',
  'esp32cam',
  'dht22',
  'soil_probe',
  'solenoid',
  'pump',
];

// Interactive leaf hotspots: 2 live upper CAM+canopy plants (0, 1) + full lower-terrace condition showcase (5, 6, 7, 8, 9)
const FEATURED_LEAVES: Array<{ plantIndex: number; leafIndex: number }> = [
  { plantIndex: 0, leafIndex: 27 },
  { plantIndex: 1, leafIndex: 27 },
  { plantIndex: 5, leafIndex: 27 },
  { plantIndex: 6, leafIndex: 27 },
  { plantIndex: 7, leafIndex: 27 },
  { plantIndex: 8, leafIndex: 27 },
  { plantIndex: 9, leafIndex: 27 },
];

// Helper colors for smooth Day <-> Night interpolation
const daySunColor = new THREE.Color('#fff5de');
const duskSunColor = new THREE.Color('#ffae6b');
const nightMoonColor = new THREE.Color('#86a4e8');
const dayHemiSky = new THREE.Color('#fffdf6');
const nightHemiSky = new THREE.Color('#6f87c9');
const dayHemiGround = new THREE.Color('#6375ab');
const nightHemiGround = new THREE.Color('#273357');
const dayShadowColor = new THREE.Color('#41538f');
const nightShadowColor = new THREE.Color('#0b101d');
const dayOutlineColor = new THREE.Color('#231e16');
const nightOutlineColor = new THREE.Color('#101420');

let explodeLerp = 0;

const update = (
  dt: number,
  elapsed: number,
  metrics: SimulationMetrics,
  weather: WeatherMode,
  accent: AccentId,
  exploded: boolean,
  showFov: boolean,
  selectedPart: PartId | null,
  selectedLeaf: SelectedLeafInfo | null
) => {
  // 1. Apply Risograph Accent Swatch
  const swatch = ACCENT_SWATCHES.find((s) => s.id === accent) ?? ACCENT_SWATCHES[0];
  mats.accentMat.color.set(swatch.hex);
  mats.accentDarkMat.color.set(swatch.darkHex);

  // 2. Day / Dusk / Night Lighting & Celestial Arc
  const h = metrics.timeHours;
  const night = getNightFactor(h);
  const duskGlow = Math.max(0, 1 - Math.abs(h - 17.7) / 1.5) + Math.max(0, 1 - Math.abs(h - 6.0) / 1.4);
  const clampedDusk = Math.min(1, duskGlow);

  // Sun angle during 6..18, Moon angle during 18..6
  const isDayArc = h >= 6 && h <= 18;
  const arcProgress = isDayArc ? (h - 6) / 12 : ((h >= 18 ? h - 18 : h + 6) / 12);
  const theta = arcProgress * Math.PI;
  const lightX = -Math.cos(theta) * 7.5;
  const lightY = Math.max(2.2, Math.sin(theta) * 8.5);
  const lightZ = 4.2 - night * 1.4;
  sunLight.position.set(lightX, lightY, lightZ);
  celestialDisc.position.set(lightX * 0.72, lightY * 0.68 + 0.5, -3.5);
  sunMat.color.copy(isDayArc ? (clampedDusk > 0.35 ? duskSunColor : daySunColor) : nightMoonColor);

  const weatherDim = weather === 'sunny' ? 1 : weather === 'foggy' ? 0.72 : 0.58;
  sunLight.color
    .copy(daySunColor)
    .lerp(duskSunColor, clampedDusk * 0.65)
    .lerp(nightMoonColor, night);
  sunLight.intensity = THREE.MathUtils.lerp(1.75, 0.85, night) * weatherDim;

  hemiLight.color.copy(dayHemiSky).lerp(nightHemiSky, night);
  hemiLight.groundColor.copy(dayHemiGround).lerp(nightHemiGround, night);
  hemiLight.intensity = THREE.MathUtils.lerp(1.2, 0.78, night);

  shadowFloorMat.color.copy(dayShadowColor).lerp(nightShadowColor, night);
  shadowFloorMat.opacity = THREE.MathUtils.lerp(0.34, 0.48, night) * weatherDim;

  factory.outlineMaterial.color.copy(dayOutlineColor).lerp(nightOutlineColor, night);

  // Night LED glows & Active Hardware Indicators
  nodeGlow.intensity = night > 0.35 ? 1.15 * night : 0.15;
  mats.ledValveMat.color.set(metrics.isWatering ? '#4ade80' : metrics.lastDecision === 'TUNDA' ? '#fb923c' : '#facc15');
  solenoidLedMat.color.set(metrics.isWatering ? '#4ade80' : metrics.lastDecision === 'TUNDA' ? '#fb923c' : '#1e3a8a');
  mats.ledCamMat.color.set(metrics.patekRiskPct >= 65 ? '#ef4444' : '#64748b');
  camFlashMat.color.set(metrics.patekRiskPct >= 75 ? '#fef08a' : '#78716c');
  if (metrics.isWatering) {
    pumpRotorGroup.rotation.y += dt * 11;
  }

  // 3. Soil Moisture Color + Leaf Wetness + Patek Spots + Plant Sway
  const soilT = THREE.MathUtils.clamp((metrics.soilMoisturePct - 18) / 68, 0, 1);
  mats.bedSoilMat.color.copy(mats.soilDryColor).lerp(mats.soilWetColor, soilT);

  const dropScale = THREE.MathUtils.clamp(metrics.leafWetnessPct / 75, 0.001, 1.15);
  const globalSpotScale =
    metrics.symptomSeverity > 0.1 ? THREE.MathUtils.clamp(metrics.symptomSeverity * 1.4, 0.001, 1.25) : 0.001;

  const manualPouring = !metrics.aiotMode && metrics.isWatering;
  const isDrought = metrics.soilMoisturePct <= 26;
  plantRefs.forEach((pr) => {
    const sway = Math.sin(elapsed * 1.65 + pr.phase) * (weather === 'rainy' ? 0.055 : 0.025);
    const isUpperTerrace = pr.plantIndex <= 4;
    const inCamOrCanopy = pr.plantIndex === 0 || pr.plantIndex === 1;
    let cond: LeafCondition = pr.baseCondition;
    let plantDropScale = 0.001;
    let plantSpotScale = 0.001;
    let plantSevereSpotScale = 0.001;

    if (inCamOrCanopy) {
      cond = evaluateCanopyLeafCondition(pr.plantIndex as 0 | 1, metrics);
      const droughtYellowOnly = isDrought && metrics.patekRiskPct < 52 && metrics.symptomSeverity < 0.12;
      plantDropScale = wetDropScale(cond, droughtYellowOnly, manualPouring, dropScale, 0.62);
      plantSpotScale = conditionSpotScale(cond, droughtYellowOnly, globalSpotScale, 1.35, 0.9, 0.45);
      plantSevereSpotScale = !droughtYellowOnly && cond === 'patek_infected' ? 1.25 : 0.001;
    } else if (isUpperTerrace) {
      // Remaining upper terrace plants (2, 3, 4) also progress through patek_early -> patek_infected (or drought yellowing)
      cond = resolveUpperTerraceCondition(metrics, weather, night, manualPouring, isDrought);
      const droughtYellowOnly = isDrought && metrics.patekRiskPct < 56 && metrics.symptomSeverity < 0.16;
      plantDropScale = wetDropScale(cond, droughtYellowOnly, manualPouring, dropScale, 0.55);
      plantSpotScale = conditionSpotScale(cond, droughtYellowOnly, globalSpotScale, 1.3, 0.9, 0.42);
      plantSevereSpotScale = !droughtYellowOnly && cond === 'patek_infected' ? 1.2 : 0.001;
    } else {
      // Lower terrace (plants 5..9) stays as clear reference showcase for all 5 condition types
      cond = pr.baseCondition;
      plantDropScale =
        weather === 'rainy'
          ? Math.max(0.7, dropScale)
          : cond === 'wet_risk'
          ? 0.85
          : cond === 'patek_early' || cond === 'patek_infected'
          ? 0.5
          : 0.001;
      plantSpotScale =
        cond === 'patek_infected' ? 1.45 : cond === 'patek_early' ? 1.05 : cond === 'yellowing' ? 0.44 : 0.001;
      plantSevereSpotScale = cond === 'patek_infected' ? 1.25 : 0.001;
    }

    // Apply slight physical wilt droop & height sag for bone-dry drought OR active patek blight
    const blightDroop = cond === 'patek_infected' ? 0.055 : 0;
    const wiltDroop = isUpperTerrace && isDrought ? 0.08 : blightDroop;
    pr.group.rotation.z = sway + wiltDroop * 0.5;
    pr.group.rotation.x = Math.cos(elapsed * 1.2 + pr.phase) * 0.015 + wiltDroop;
    pr.group.scale.y = isUpperTerrace && isDrought ? 0.93 : cond === 'patek_infected' ? 0.96 : 1.0;

    pr.currentCondition = cond;
    const meta = LEAF_CONDITION_META[cond];
    pr.leafMat.color.set(meta.leafHex);
    pr.leafYoungMat.color.set(meta.leafYoungHex);

    pr.droplets.forEach((d) => d.scale.setScalar(plantDropScale));
    pr.patekSpots.forEach((s) => s.scale.setScalar(plantSpotScale));
    pr.severeSpots.forEach((s) => s.scale.setScalar(plantSevereSpotScale));
  });

  // 4. Animated Gembor (Manual Mode rises & sweeps back-and-forth over upper canopy!) + Watering Spray Particles
  gemborLift = THREE.MathUtils.lerp(gemborLift, manualPouring ? 1 : 0, Math.min(1, dt * 5.5));
  const sweepX = -0.55 + Math.sin(elapsed * 2.6) * 0.95; // sweeps back-and-forth over CAM + canopy plants (-1.50 .. +0.40)
  const activeGemborX = THREE.MathUtils.lerp(gemborRestPos.x, sweepX, gemborLift);
  const activeGemborY = THREE.MathUtils.lerp(gemborRestPos.y, 1.62, gemborLift) + Math.sin(elapsed * 5.2) * 0.04 * gemborLift;
  const activeGemborZ = THREE.MathUtils.lerp(gemborRestPos.z, -0.62, gemborLift);
  gemborGroup.position.set(activeGemborX, activeGemborY, activeGemborZ);
  gemborGroup.rotation.set(
    0,
    THREE.MathUtils.lerp(-0.5, Math.PI * 0.48, gemborLift),
    THREE.MathUtils.lerp(0, -1.36 - Math.sin(elapsed * 5.2) * 0.1, gemborLift)
  );
  gemborNozzleTip.getWorldPosition(gemborNozzleWorld);

  sprayDrops.forEach((sd) => {
    if (!metrics.isWatering) {
      sd.mesh.visible = false;
      return;
    }
    sd.mesh.visible = true;
    sd.phase = (sd.phase + dt * 2.15) % 1;
    const t = sd.phase;
    if (metrics.aiotMode) {
      const [ex, ey, ez] = emitterPositions[sd.emitterIdx];
      sd.mesh.position.set(
        ex + sd.spreadX * 1.9 * t,
        ey + 0.08 + Math.sin(t * Math.PI) * 0.24 - t * 0.28,
        ez + sd.spreadZ * 1.8 * t
      );
    } else {
      // Pour directly from rising/sweeping gembor brass rose nozzle onto upper chili canopy
      sd.mesh.position.set(
        gemborNozzleWorld.x + sd.spreadX * 1.45 * t,
        gemborNozzleWorld.y - t * t * 0.85,
        gemborNozzleWorld.z - 0.28 * t + sd.spreadZ * 1.2 * t
      );
    }
    sd.mesh.scale.setScalar(1 - t * 0.35);
  });

  // 4B. Spore-Dispersion Wind Particles drifting from Upper Terrace -> Lower Terrace
  const showSpores = weather === 'foggy' || weather === 'rainy' || metrics.patekRiskPct >= 55;
  sporeParticles.forEach((sp) => {
    sp.mesh.visible = showSpores;
    if (!showSpores) return;
    sp.phase = (sp.phase + dt * 0.28) % 1;
    const zDrift = -1.25 + sp.phase * 2.55;
    const ySlope = 0.85 - sp.phase * 0.42 + sp.yOff + Math.sin(sp.phase * Math.PI * 2 + elapsed) * 0.06;
    sp.mesh.position.set(sp.baseX + sp.phase * 0.42, ySlope, zDrift);
  });

  // 5. Rain Animation
  rainStreaks.forEach((rs) => {
    if (weather !== 'rainy') {
      rs.mesh.visible = false;
      return;
    }
    rs.mesh.visible = true;
    rs.phase = (rs.phase + dt * 2.6) % 1;
    rs.mesh.position.set(rs.x, 3.2 - rs.phase * 3.5, rs.z);
  });

  // 6. Unified Dynamic Highland Mist / Dew Blanket
  const mistStrength = Math.max(
    weather === 'foggy' ? 0.46 : 0,
    night > 0.45 && metrics.relativeHumidity > 82 ? (night - 0.35) * 0.46 : 0
  );
  mistGroup.visible = mistStrength > 0.02;
  if (mistGroup.visible) {
    mistMatLower.uniforms.uTime.value = elapsed;
    mistMatLower.uniforms.uOpacity.value = mistStrength;
    mistMatLower.uniforms.uColor.value.set(night > 0.5 ? '#c7daf8' : '#eef3fb');

    mistMatUpper.uniforms.uTime.value = elapsed;
    mistMatUpper.uniforms.uOpacity.value = mistStrength * 0.65;
    mistMatUpper.uniforms.uColor.value.set(night > 0.5 ? '#d8e7ff' : '#f5f8fd');
  }

  // 7. Exploded Node / See-Through Enclosure Animation
  const targetExplode = exploded ? 1 : 0;
  explodeLerp = THREE.MathUtils.lerp(explodeLerp, targetExplode, Math.min(1, dt * 8));
  boxExplodeItems.forEach((item) => {
    item.obj.position.z = item.baseZ + explodeLerp * item.offsetZ;
    item.obj.position.x = item.baseX + explodeLerp * item.offsetX;
  });
  mats.boxLidMat.opacity = 1 - explodeLerp * 0.45;

  // 8. ArduCam FOV Cone (~66 deg HFOV, IMX708 fixed-focus)
  fovCone.visible = showFov || selectedPart === 'esp32cam';
  fovEdges.visible = fovCone.visible;

  // 9. Selection Marker Ring + Leaf Highlight
  if (selectedLeaf) {
    const pr = plantRefs[selectedLeaf.plantIndex];
    const leafObj = pr?.leafMeshes[selectedLeaf.leafIndex];
    if (leafObj) {
      leafObj.getWorldPosition(tempLeafPos);
      leafHighlightRing.visible = true;
      leafHighlightRing.position.set(tempLeafPos.x, tempLeafPos.y + 0.08, tempLeafPos.z);
      leafHighlightRing.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.15);
    } else {
      leafHighlightRing.visible = false;
    }
    selectRing.visible = false;
  } else if (selectedPart) {
    leafHighlightRing.visible = false;
    const anchor = cameraAnchors[selectedPart];
    selectRing.visible = true;
    selectRing.position.set(anchor.x, anchor.y - 0.16, anchor.z);
    const pulse = 1 + Math.sin(elapsed * 4.5) * 0.12;
    selectRing.scale.setScalar(pulse);
  } else {
    selectRing.visible = false;
    leafHighlightRing.visible = false;
  }
};

const pickPart = (raycaster: THREE.Raycaster): PickResult | null => {
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    if (!hit.object.visible) continue;
    if (hit.object.userData?.isLeaf) {
      const plantIndex = hit.object.userData.plantIndex as number;
      const leafIndex = hit.object.userData.leafIndex as number;
      const isFeatured = FEATURED_LEAVES.some(
        (f) => f.plantIndex === plantIndex && leafIndex >= 26
      );
      if (!isFeatured) return null;
      const pr = plantRefs[plantIndex];
      const condition = pr?.currentCondition ?? 'healthy';
      return {
        partId: 'chili_plant',
        leaf: {
          plantIndex,
          leafIndex: 27,
          terrace: pr?.terrace ?? 'Teras Atas',
          condition,
          colorHex: LEAF_CONDITION_META[condition].leafHex,
        },
      };
    }
    const partId = hit.object.userData?.partId as PartId | undefined;
    if (partId && CLICKABLE_TOOL_IDS.includes(partId)) {
      return { partId };
    }
    if (partId) return null;
  }
  return null;
};

const getHotspots = (): HotspotItem[] => {
  const items: HotspotItem[] = CLICKABLE_TOOL_IDS.map((partId) => {
    const p = cameraAnchors[partId];
    return {
      key: `part-${partId}`,
      kind: 'part',
      partId,
      worldPos: [p.x, p.y, p.z],
    };
  });

  FEATURED_LEAVES.forEach(({ plantIndex, leafIndex }) => {
    const pr = plantRefs[plantIndex];
    const leafObj = pr?.leafMeshes[leafIndex];
    if (!pr || !leafObj) return;
    leafObj.getWorldPosition(tempLeafPos);
    const condition = pr.currentCondition;
    items.push({
      key: `leaf-${plantIndex}-${leafIndex}`,
      kind: 'leaf',
      partId: 'chili_plant',
      worldPos: [tempLeafPos.x, tempLeafPos.y + 0.04, tempLeafPos.z],
      ringColor: LEAF_CONDITION_META[condition].badgeColor,
      leaf: {
        plantIndex,
        leafIndex,
        terrace: pr.terrace,
        condition,
        colorHex: LEAF_CONDITION_META[condition].leafHex,
      },
    });
  });

  return items;
};

const dispose = () => {
  geometries.forEach((g) => g.dispose());
  disposableMaterials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
  mats.patekSpotMat.dispose();
  mats.severeSpotMat.dispose();
  mats.ledOnMat.dispose();
  mats.ledValveMat.dispose();
  mats.ledCamMat.dispose();
  sunMat.dispose();
  mistMatLower.dispose();
  mistMatUpper.dispose();
  fovMat.dispose();
  selectRingMat.dispose();
  shadowFloorMat.dispose();
  factory.dispose();
};

  return {
    scene,
    cameraAnchors,
    update,
    pickPart,
    getHotspots,
    dispose,
  };
}
