import * as THREE from 'three';
import { createRoundedBoxGeo, tagEspPart } from '../hardwareModules';
import { PhysicalContext } from './context';
import { PhysicalMaterials } from './lighting';
import { RegisterMove } from './modules';

/** ESP32-CAM weatherproof visor arm (original section 4). */
export function buildCameraArm(
  ctx: PhysicalContext,
  materials: PhysicalMaterials,
  camGroup: THREE.Group,
  mastX: number,
  mastZ: number,
  registerMove: RegisterMove
): { camArmGroup: THREE.Group } {
  const { scene, factory, trackGeo } = ctx;
  const { aluMat, darkMetalMat, smokedWindowMat } = materials;
  // =========================================================================
  // 4. ESP32-CAM WEATHERPROOF VISOR ARM (CLEAN SIDE-FRONT CLEAR OF BOX & SOLAR)
  // =========================================================================
  const camArmGroup = new THREE.Group();
  camArmGroup.position.set(mastX + 2.15, 4.18, mastZ + 0.15);
  scene.add(camArmGroup);

  // Horizontal aluminum arm from mast (x = -2.15 local) out to camera mount (x = 0 local)
  const camBoomX = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 2.18, 10)),
    aluMat,
    1.05
  );
  camBoomX.rotation.z = Math.PI / 2;
  camBoomX.position.set(-1.08, 0, 0);
  camArmGroup.add(camBoomX);

  // Forward projection arm into open air in front-right of box (+Z)
  const camBoomZ = factory.createOutlinedMesh(
    trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.72, 10)),
    aluMat,
    1.05
  );
  camBoomZ.rotation.x = Math.PI / 2;
  camBoomZ.position.set(0, 0, 0.34);
  camArmGroup.add(camBoomZ);

  const camTiltHead = new THREE.Group();
  camTiltHead.position.set(0, -0.05, 0.72);
  camTiltHead.rotation.set(0.32, 0, 0);
  camArmGroup.add(camTiltHead);

  // Real ESP32-CAM OV2640 oriented facing outward (+Z)
  camGroup.position.set(0, 0, 0);
  camGroup.rotation.set(Math.PI / 2, 0, 0);
  camGroup.scale.setScalar(0.42);
  camTiltHead.add(camGroup);

  // Sleek Weatherproof Camera Visor Hood (framed cleanly around camera without oversized box collision)
  const camHood = new THREE.Group();
  camHood.position.set(0, 0.02, 0.08);
  camTiltHead.add(camHood);

  const hoodTopVisor = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.76, 0.1, 0.56, 0.04)),
    darkMetalMat,
    1.04
  );
  hoodTopVisor.position.set(0, 0.44, 0.04);
  const hoodBotPlate = factory.createOutlinedMesh(
    trackGeo(createRoundedBoxGeo(0.76, 0.08, 0.46, 0.04)),
    darkMetalMat,
    1.04
  );
  hoodBotPlate.position.set(0, -0.48, 0);
  const hoodLeftWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.07, 0.94, 0.44)),
    darkMetalMat,
    1.04
  );
  hoodLeftWall.position.set(-0.35, -0.02, 0);
  const hoodRightWall = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.07, 0.94, 0.44)),
    darkMetalMat,
    1.04
  );
  hoodRightWall.position.set(0.35, -0.02, 0);
  const hoodBackPlate = factory.createOutlinedMesh(
    trackGeo(new THREE.BoxGeometry(0.74, 0.94, 0.06)),
    darkMetalMat,
    1.04
  );
  hoodBackPlate.position.set(0, -0.02, -0.2);
  const hoodFrontGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.64, 0.84, 0.025)),
    smokedWindowMat
  );
  hoodFrontGlass.position.set(0, -0.02, 0.22);
  camHood.add(
    hoodTopVisor,
    hoodBotPlate,
    hoodLeftWall,
    hoodRightWall,
    hoodBackPlate,
    hoodFrontGlass
  );
  tagEspPart(camHood, 'ESP32CAM');
  registerMove(camHood, [0, 0.55, 0.85], true);
  return { camArmGroup };
}
