// Thin re-export: the camera board is now an ArduCam Camera Module 3
// (Sony IMX708 12MP, MIPI CSI-2) — see ./arducamModule.ts. The old
// ESP32-CAM (OV2640) board, pin headers, SD slot and flash LED are gone.
//
// The builder name `buildEsp32CamModule` is kept (re-exported here) so
// src/three/hardwareModules.ts needs no change, and the internal part key
// stays 'ESP32CAM' / garden id 'esp32cam' so selection, FOV, hotspots and
// tour flow are untouched.
export { buildArducamModule, buildArducamModule as buildEsp32CamModule } from './arducamModule';
