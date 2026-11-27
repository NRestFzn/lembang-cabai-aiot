import * as THREE from 'three';
import { EspPartKey } from '../../data/espParts';
import { tagEspPart } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';
import { PhysicalKit, RegisterMove } from './modules';

/** Bottom soil probes, hydraulic pump/solenoid + external routing cables (original section 6). */
export function buildProbesAndCables(
  ctx: PhysicalContext,
  materials: PhysicalMaterials,
  kit: PhysicalKit,
  mastX: number,
  mastZ: number,
  boxW: number,
  camGlandY: number,
  glandHoleX: number,
  registerMove: RegisterMove,
  backPlateShell: THREE.Object3D,
  mastPole: THREE.Object3D,
  mastFlange: THREE.Object3D
): { probeRack: THREE.Group; hydroGroup: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  const { pipeBlueMat } = materials;
  const {
    modules: { soilGroup, dsGroup, pumpGroup, solGroup },
  } = kit;
  // =========================================================================
  // 6. BOTTOM SOIL PROBES (ON STUDIO STAND, NO DIRT) + HYDRAULIC PUMP/SOLENOID
  // =========================================================================
  const probeRack = new THREE.Group();
  probeRack.position.set(0.35, 0.08, 0.92);
  scene.add(probeRack);

  soilGroup.position.set(-0.20, 0.02, 0.45);
  soilGroup.scale.setScalar(0.62);
  probeRack.add(soilGroup);
  registerMove(soilGroup, [0, 0.38, 0.18], true);

  dsGroup.position.set(0.0, 0.02, -0.30);
  dsGroup.scale.setScalar(0.62);
  probeRack.add(dsGroup);
  registerMove(dsGroup, [0, 0.38, -0.18], true);

  // Hydraulic Manifold Base (12V Pump + Brass Solenoid Valve + Blue Water Tubing)
  const hydroGroup = new THREE.Group();
  hydroGroup.position.set(3.05, 0.08, -0.10);
  scene.add(hydroGroup);

  pumpGroup.position.set(-0.08, 0.0, -0.82);
  pumpGroup.scale.setScalar(0.8);
  hydroGroup.add(pumpGroup);
  registerMove(pumpGroup, [0, 0.45, -0.15], true);

  solGroup.position.set(0.05, 0.04, 0.88);
  solGroup.scale.setScalar(0.82);
  hydroGroup.add(solGroup);
  registerMove(solGroup, [0, 0.42, 0.15], true);

  // Clear blue PVC irrigation manifold pipe linking Pump Outlet -> Solenoid Valve Inlet
  const hydroPipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.64, 0.32, -0.64),
    new THREE.Vector3(1.05, 0.32, -0.64),
    new THREE.Vector3(1.05, 0.25, 0.88),
    new THREE.Vector3(0.65, 0.25, 0.88),
  ]);
  const hydroPipe = factory.createOutlinedMesh(
    trackGeo(new THREE.TubeGeometry(hydroPipeCurve, 22, 0.055, 10, false)),
    pipeBlueMat,
    1.04
  );
  hydroGroup.add(hydroPipe);
  tagEspPart(hydroPipe, 'SOLENOID');

  // --- External Routing Cables (Solar -> Mast -> Box Glands -> Probes & Hydro) ---
  const addExternalCable = (pts: [number, number, number][], color: string, part: EspPartKey) => {
    const cMat = factory.createToon(color);
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 24, 0.022, 7, false)),
      cMat
    );
    mesh.castShadow = true;
    tagEspPart(mesh, part);
    scene.add(mesh);
  };

  // Solar -> through open Top Cable Gland hole -> straight into CN3791 MPPT PV+ (Red) & PV- (Black)
  addExternalCable(
    [
      [mastX + 0.78, 4.86, mastZ],
      [mastX + 0.22, 4.62, mastZ + 0.22],
      [mastX + glandHoleX - 0.03, 4.35, 0.02],
      [mastX + glandHoleX - 0.03, 4.02, 0.02],
      [mastX + glandHoleX - 0.03, 3.64, -0.02],
      [mastX - 1.1, 3.59, -0.06],
    ],
    '#dc2626',
    'SOLAR'
  );
  addExternalCable(
    [
      [mastX + 0.78, 4.84, mastZ + 0.12],
      [mastX + 0.24, 4.58, mastZ + 0.28],
      [mastX + glandHoleX + 0.04, 4.35, 0.05],
      [mastX + glandHoleX + 0.04, 4.02, 0.05],
      [mastX + glandHoleX + 0.04, 3.54, -0.02],
      [mastX - 1.1, 3.49, -0.06],
    ],
    '#1f2937',
    'SOLAR'
  );
  // ESP32-CAM -> along aluminum boom -> through hollow Right Side Gland -> straight into ESP32 UART/5V inside box
  addExternalCable(
    [
      [mastX + 2.15, 4.05, mastZ + 0.72],
      [mastX + 2.15, 4.18, mastZ + 0.22],
      [mastX + 1.85, 3.65, 0.08],
      [mastX + boxW / 2 + 0.14, 2.48 + camGlandY, 0.08],
      [mastX + boxW / 2 - 0.05, 2.48 + camGlandY, 0.04],
      [mastX + 0.64, 2.82, -0.02],
    ],
    '#a855f7',
    'ESP32CAM'
  );
  // BME280 Canopy Shield -> along front boom -> straight THROUGH Bottom Gland 1 -> straight into ESP32 I2C inside box
  addExternalCable(
    [
      [mastX + 0.65, 1.28, 1.72],
      [mastX + 0.34, 0.88, 1.68],
      [mastX + 0.34, 0.74, 0.22],
      [mastX - 0.96, 0.74, 0.14],
      [mastX - 0.96, 0.98, 0.14],
      [mastX - 0.96, 1.86, -0.04],
      [mastX + 0.44, 2.38, -0.04],
    ],
    '#7c3aed',
    'BME280'
  );
  // Soil Moisture Probe -> straight THROUGH Bottom Gland 2 -> straight into ESP32 GPIO34 inside box
  addExternalCable(
    [
      [mastX + 0.48, 2.28, -0.04],
      [mastX - 0.32, 1.98, -0.04],
      [mastX - 0.32, 0.98, 0.14],
      [mastX - 0.32, 0.24, 0.85],
      [-0.10, 0.16, 1.37],
      [0.77, 0.16, 1.37],
    ],
    '#eab308',
    'SOIL_MOISTURE'
  );
  // DS18B20 Probe Adapter -> straight THROUGH Bottom Gland 3 -> straight into ESP32 GPIO4 inside box
  addExternalCable(
    [
      [mastX + 0.54, 2.18, -0.04],
      [mastX + 0.32, 1.82, -0.02],
      [mastX + 0.32, 0.98, 0.14],
      [mastX + 0.32, 0.3, 0.62],
      [1.12, 0.18, 0.62],
    ],
    '#292623',
    'DS18B20'
  );
  // 12V Pump & Solenoid -> straight THROUGH Bottom Gland 4 -> straight into Relay 2CH NO1/NO2 inside box
  addExternalCable(
    [
      [mastX + 0.96, 1.46, -0.04],
      [mastX + 0.96, 0.98, 0.14],
      [mastX + 0.96, 0.22, -0.42],
      [1.95, 0.24, -0.92],
      [2.35, 0.34, -0.92],
    ],
    '#dc2626',
    'PUMP'
  );
  addExternalCable(
    [
      [mastX + 0.92, 1.38, -0.04],
      [mastX + 0.96, 0.98, 0.14],
      [0.15, 0.42, 0.12],
      [2.82, 0.74, 0.68],
      [3.08, 0.74, 0.78],
    ],
    '#2563eb',
    'SOLENOID'
  );

  // Mark remaining physical enclosure shells
  tagEspPart(backPlateShell, 'U1');
  tagEspPart(mastPole, 'U1');
  tagEspPart(mastFlange, 'U1');
  return { probeRack, hydroGroup };
}
