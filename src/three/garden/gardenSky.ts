import * as THREE from 'three';
import type { GardenContext } from './gardenContext';

export interface GardenSky {
  sunMat: THREE.MeshBasicMaterial;
  celestialDisc: THREE.Mesh;
  mistMatLower: THREE.ShaderMaterial;
  mistMatUpper: THREE.ShaderMaterial;
  mistGroup: THREE.Group;
  selectRing: THREE.Mesh;
  selectRingMat: THREE.MeshBasicMaterial;
  leafHighlightRing: THREE.Mesh;
  tempLeafPos: THREE.Vector3;
}

/** Section 5: celestial sun/moon disc, highland mist + selection markers. */
export function buildGardenSky(ctx: GardenContext): GardenSky {
  const { scene, trackGeo } = ctx;
// =========================================================================
// 5. CELESTIAL SUN/MOON DISC & HIGHLAND NIGHT DEW/MIST
// =========================================================================
const sunMat = new THREE.MeshBasicMaterial({ color: '#e6b83a' });
const celestialDisc = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 14, 14)), sunMat);
celestialDisc.position.set(4, 6, -4);
scene.add(celestialDisc);

// Unified dynamic highland dew/mist blanket spanning both terraces (soft rounded-rect + flowing wisps)
const mistGeo = trackGeo(new THREE.PlaneGeometry(7.0, 4.3, 48, 28));
mistGeo.rotateX(-Math.PI / 2);

const createMistShaderMat = (layerOffset: number) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uLayer: { value: layerOffset },
      uColor: { value: new THREE.Color('#dce8fc') },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uLayer;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // Follow 2-tier terrace height smoothly from back upper terrace (z < 0) to front lower terrace (z > 0)
        float terraceLift = smoothstep(0.45, -0.45, pos.z) * 0.42;
        float wave1 = sin(pos.x * 1.15 + uTime * 0.75 + uLayer * 2.1) * cos(pos.z * 1.35 - uTime * 0.55);
        float wave2 = sin(pos.x * 2.3 - uTime * 0.45 + pos.z * 1.8) * 0.45;
        pos.y += terraceLift + (wave1 + wave2) * 0.04;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uLayer;
      uniform vec3 uColor;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        v += 0.55 * noise2(p);
        v += 0.30 * noise2(p * 2.07 + vec2(3.1, 1.7));
        v += 0.15 * noise2(p * 4.13 - vec2(1.9, 4.2));
        return v;
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float t = uTime * (0.28 + uLayer * 0.08);
        // Organic wavy rounded-rectangle SDF so edges look soft & non-boxy
        float warp = sin(p.y * 4.8 + t * 1.4 + uLayer) * 0.055 + cos(p.x * 4.2 - t * 1.1) * 0.055;
        vec2 boxHalf = vec2(0.72, 0.68);
        vec2 q = abs(p) - boxHalf;
        float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.14 + warp;
        float edgeMask = 1.0 - smoothstep(-0.14, 0.14, sdf);

        vec2 flowA = vUv * vec2(4.4, 2.8) + vec2(t * 0.16, -t * 0.08);
        vec2 flowB = vUv * vec2(3.1, 2.2) + vec2(-t * 0.11, t * 0.09) + uLayer * 2.3;
        float wisp = fbm(flowA) * 0.6 + fbm(flowB) * 0.4;
        float density = 0.34 + 0.66 * smoothstep(0.24, 0.82, wisp);

        float alpha = edgeMask * density * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

const mistMatLower = createMistShaderMat(0);
const mistMatUpper = createMistShaderMat(1.4);
const mistGroup = new THREE.Group();
mistGroup.position.set(0.35, 0.44, 0.0);
scene.add(mistGroup);

const mistLayerLower = new THREE.Mesh(mistGeo, mistMatLower);
mistGroup.add(mistLayerLower);

const mistLayerUpper = new THREE.Mesh(mistGeo, mistMatUpper);
mistLayerUpper.position.y = 0.22;
mistGroup.add(mistLayerUpper);

// Selection indicator ring + leaf marker sphere
const selectRingGeo = trackGeo(new THREE.RingGeometry(0.26, 0.34, 24));
const selectRingMat = new THREE.MeshBasicMaterial({
  color: '#ef6a4c',
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9,
});
const selectRing = new THREE.Mesh(selectRingGeo, selectRingMat);
selectRing.rotation.x = -Math.PI / 2;
selectRing.visible = false;
scene.add(selectRing);

const leafHighlightGeo = trackGeo(new THREE.RingGeometry(0.075, 0.11, 18));
const leafHighlightRing = new THREE.Mesh(leafHighlightGeo, selectRingMat);
leafHighlightRing.rotation.x = -Math.PI / 2;
leafHighlightRing.visible = false;
scene.add(leafHighlightRing);
const tempLeafPos = new THREE.Vector3();
  return {
    sunMat, celestialDisc, mistMatLower, mistMatUpper, mistGroup,
    selectRing, selectRingMat, leafHighlightRing, tempLeafPos,
  };
}
