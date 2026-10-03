import * as THREE from 'three';

let activeFluidBackground = null;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uTheme;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(9.2, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.075;
    vec2 flow = vec2(t * 0.55, -t * 0.32);
    float largeNoise = fbm(uv * 2.1 + flow);
    float fineNoise = fbm(uv * 5.0 - flow * 1.6);
    float sharedFlow = sin(t * 0.92 + largeNoise * 3.0 + fineNoise * 1.4);
    float heroSPath = sin(uv.x * 4.2 + t * 1.25 + largeNoise * 2.2 + sharedFlow * 0.65);
    float pointerInfluence = exp(-9.0 * distance(uv, uPointer));

    float arc = 0.18
      + heroSPath * 0.15
      + sin(uv.x * 7.4 - t * 0.68 + fineNoise * 1.5) * 0.038
      + sharedFlow * 0.018
      + (uPointer.y - 0.5) * pointerInfluence * 0.045;
    float thickness = 0.026 + largeNoise * 0.024 + sin(t + uv.x * 5.0) * 0.006;
    float distanceToFlow = abs(uv.y - arc);
    float softEdge = 1.0 - smoothstep(thickness * 1.15, thickness * 2.45, distanceToFlow);
    float body = 1.0 - smoothstep(thickness * 0.42, thickness * 1.38, distanceToFlow);
    float core = 1.0 - smoothstep(thickness * 0.06, thickness * 0.55, distanceToFlow);
    float gleam = pow(max(0.0, sin(uv.x * 7.1 - t * 1.6 + fineNoise * 3.5)), 10.0) * core;
    float lowerVisibility = smoothstep(0.30, 0.48, uv.x) * (1.0 - smoothstep(0.88, 0.98, uv.x));
    softEdge *= lowerVisibility;
    body *= lowerVisibility;
    core *= lowerVisibility;
    gleam *= lowerVisibility;
    float upperArc = 0.76
      - heroSPath * 0.15
      + sin(uv.x * 7.4 + t * 0.68 + fineNoise * 1.5 + 1.1) * 0.038
      + sharedFlow * 0.018;
    float upperThickness = thickness;
    float upperDistance = abs(uv.y - upperArc);
    float upperSoftEdge = 1.0 - smoothstep(upperThickness * 1.15, upperThickness * 2.45, upperDistance);
    float upperBody = 1.0 - smoothstep(upperThickness * 0.42, upperThickness * 1.38, upperDistance);
    float upperCore = 1.0 - smoothstep(upperThickness * 0.08, upperThickness * 0.58, upperDistance);
    float upperGleam = pow(max(0.0, sin(uv.x * 7.1 + t * 1.6 + fineNoise * 3.5 + 1.6)), 10.0) * upperCore;
    float upperVisibility = smoothstep(0.04, 0.16, uv.x) * (1.0 - smoothstep(0.68, 0.85, uv.x));
    upperSoftEdge *= upperVisibility;
    upperBody *= upperVisibility;
    upperCore *= upperVisibility;
    upperGleam *= upperVisibility;

    float connectorProgress = smoothstep(0.58, 0.94, uv.x);
    float connectorArc = mix(upperArc, arc, connectorProgress);
    float connectorThickness = thickness * 0.74;
    float connectorVisibility = smoothstep(0.54, 0.66, uv.x) * (1.0 - smoothstep(0.92, 0.99, uv.x));
    float rightConnector = (1.0 - smoothstep(connectorThickness * 0.46, connectorThickness * 1.48, abs(uv.y - connectorArc))) * connectorVisibility;
    upperSoftEdge += rightConnector * 0.34;
    upperBody += rightConnector * 0.72;
    upperCore += rightConnector * 0.46;
    upperGleam += rightConnector * 0.16;
    float upperRibbon = upperBody;

    vec3 deepBlue = vec3(0.0, 0.34, 1.0);
    vec3 electricBlue = vec3(0.0, 0.55, 1.0);
    vec3 cyan = vec3(0.0, 0.85, 1.0);
    vec3 whiteCyan = vec3(0.49, 0.92, 1.0);
    vec3 baseRibbonColor = mix(electricBlue, cyan, smoothstep(0.15, 0.78, largeNoise));
    vec3 fluid = mix(deepBlue, baseRibbonColor, smoothstep(0.08, 0.72, largeNoise));
    fluid = mix(fluid, cyan, body * 0.72 + core * 0.22);
    fluid = mix(fluid, whiteCyan, core * 0.32 + gleam * 0.76);
    vec3 upperFluid = mix(deepBlue, baseRibbonColor, smoothstep(0.08, 0.72, largeNoise));
    upperFluid = mix(upperFluid, cyan, upperBody * 0.72 + upperCore * 0.22);
    upperFluid = mix(upperFluid, whiteCyan, upperCore * 0.32 + upperGleam * 0.76);
    fluid += upperFluid * upperRibbon;

    float alpha = softEdge * 0.08 + body * 0.22 + core * 0.32 + gleam * 0.14
      + upperSoftEdge * 0.08 + upperBody * 0.22 + upperCore * 0.32 + upperGleam * 0.14;
    vec3 lightFluid = mix(vec3(0.26, 0.72, 0.80), whiteCyan, core * 0.38);
    vec3 color = mix(fluid, lightFluid, uTheme);
    alpha *= mix(1.0, 0.42, uTheme);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function initHeroFluidBackground() {
  const hero = document.getElementById('hero');
  if (!hero || hero.dataset.fluidBackgroundReady === 'true') return activeFluidBackground;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-fluid-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (_) {
    canvas.remove();
    return null;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uTheme: { value: document.documentElement.dataset.theme === 'light' ? 1 : 0 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  let frameId = null;
  let isVisible = true;
  let isDestroyed = false;
  const pointer = new THREE.Vector2(0.5, 0.5);
  const targetPointer = new THREE.Vector2(0.5, 0.5);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.15 : 1.5));
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  };

  const render = (now = 0) => {
    if (isDestroyed || !isVisible) return;
    pointer.lerp(targetPointer, 0.045);
    material.uniforms.uPointer.value.copy(pointer);
    material.uniforms.uTime.value = reducedMotion ? 0 : now * 0.001;
    renderer.render(scene, camera);
    if (!reducedMotion) frameId = requestAnimationFrame(render);
  };

  const start = () => {
    if (!isVisible || isDestroyed) return;
    cancelAnimationFrame(frameId);
    render(performance.now());
  };

  const onPointerMove = (event) => {
    const rect = hero.getBoundingClientRect();
    targetPointer.set(
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height)),
    );
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) start();
    else cancelAnimationFrame(frameId);
  }, { threshold: 0.01 });
  visibilityObserver.observe(hero);
  const themeObserver = new MutationObserver(() => {
    material.uniforms.uTheme.value = document.documentElement.dataset.theme === 'light' ? 1 : 0;
    if (reducedMotion) render(performance.now());
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  hero.addEventListener('pointermove', onPointerMove, { passive: true });

  resize();
  start();
  hero.dataset.fluidBackgroundReady = 'true';

  activeFluidBackground = {
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      hero.removeEventListener('pointermove', onPointerMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
      delete hero.dataset.fluidBackgroundReady;
      activeFluidBackground = null;
    },
  };

  return activeFluidBackground;
}
