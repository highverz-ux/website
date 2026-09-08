import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

const PALETTES = {
  dark: { logo: 0x1a1d24, side: 0x1a1d24, platform: 0x12151b, cyan: 0x00f2fe, frame: 0x1a242c, key: 0xf0f6ff, fill: 0x0d131f },
  light: { logo: 0xe0e4ec, side: 0xd0d5e0, platform: 0xeaeaea, cyan: 0x00d2ff, frame: 0x718e91, key: 0xffffff, fill: 0xdce2e8 },
};

const themeName = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
const damp = (a, b, speed, delta) => THREE.MathUtils.damp(a, b, speed, delta);

export function initHV3D(canvasId, containerId) {
  const container = document.getElementById(containerId) || document.getElementById('hero-sculpture-col');
  if (!container) return null;

  container.innerHTML = '';
  container.classList.add('hv-webgl-scene');
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.className = 'hv-webgl-canvas';
  canvas.setAttribute('aria-label', 'Interactive Highverz HV sculpture');
  container.appendChild(canvas);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  let disposed = false;
  RectAreaLightUniformsLib.init();

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // A compact studio environment gives the imported metal believable
  // reflections without adding a large HDR texture to the page.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const studioEnvironment = new RoomEnvironment(renderer);

  const scene = new THREE.Scene();
  let environmentTarget;
  function sceneEnvironment(activeRenderer, generator, environmentScene) {
    environmentTarget = generator.fromScene(environmentScene);
    scene.environment = environmentTarget.texture;
    environmentScene.dispose?.();
    generator.dispose();
    activeRenderer.toneMappingExposure = 1.05;
  }
  sceneEnvironment(renderer, pmremGenerator, studioEnvironment);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.15, 10.5);
  const world = new THREE.Group();
  scene.add(world);

  const environment = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.58, transparent: true, opacity: 0.14, depthWrite: false });
  // Reference: broken studio highlights around the circular architecture.
  // Shade the existing ring by position rather than adding a neon outline.
  frameMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vHVFramePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHVFramePosition = position;');
    shader.fragmentShader = 'varying vec3 vHVFramePosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat arcLight = pow(max(0.0, dot(normalize(vHVFramePosition.xy), normalize(vec2(-0.7, 0.9)))), 6.0);\ndiffuseColor.rgb *= 0.85 + arcLight * 1.4;\ndiffuseColor.a *= 0.7 + arcLight * 0.3;');
  };
  frameMaterial.customProgramCacheKey = () => 'hv-reference-arc-v1';
  const frame = new THREE.Mesh(new THREE.TorusGeometry(3.22, 0.025, 10, 128), frameMaterial);
  frame.position.set(0, 0.7, -0.65);
  environment.add(frame);
  const haloMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, depthWrite: false });
  // Feather the existing disc into the page instead of showing a hard edge.
  const atmospherePixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const radius = Math.hypot((x - 63.5) / 63.5, (y - 63.5) / 63.5);
    const fade = 1 - THREE.MathUtils.smoothstep(radius, 0.15, 1);
    atmospherePixels.set([255, 255, 255, Math.round(255 * fade * fade)], (y * 128 + x) * 4);
  }
  const atmosphereMap = new THREE.DataTexture(atmospherePixels, 128, 128, THREE.RGBAFormat);
  atmosphereMap.minFilter = atmosphereMap.magFilter = THREE.LinearFilter;
  atmosphereMap.needsUpdate = true;
  haloMaterial.map = atmosphereMap;
  const halo = new THREE.Mesh(new THREE.CircleGeometry(3.05, 96), haloMaterial);
  halo.position.set(0, 0.7, -0.7);
  environment.add(halo);
  world.add(environment);

  const platform = new THREE.Group();
  const platformMaterial = new THREE.MeshPhysicalMaterial({ metalness: 0.05, roughness: 0.85, transparent: true });
  const platformBody = new THREE.Mesh(new RoundedBoxGeometry(5.15, 0.35, 1.45, 4, 0.08), platformMaterial);
  platformBody.position.y = -1.2;
  platform.add(platformBody);
  const platformTop = new THREE.Mesh(new RoundedBoxGeometry(5, 0.045, 1.34, 3, 0.035), new THREE.MeshPhysicalMaterial({ metalness: 0.1, roughness: 0.75, transparent: true }));
  platformTop.position.y = -1.0;
  platform.add(platformTop);
  // A diffuse proximity shadow anchors the suspended logo to the same plinth.
  // Reuse the feathered texture; no additional texture download or shadow pass.
  const contactMaterial = new THREE.MeshBasicMaterial({ color: 0x071114, map: atmosphereMap, transparent: true, opacity: 0.18, depthWrite: false });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.1), contactMaterial);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, -0.974, 0.1);
  platform.add(contact);
  world.add(platform);

  const logo = new THREE.Group();
  logo.position.set(0, 0.25, 0.18);
  logo.rotation.set(0.035, -0.08, 0);
  world.add(logo);
  const logoMaterial = new THREE.MeshPhysicalMaterial({ metalness: 0.95, roughness: 0.18, clearcoat: 0.5, clearcoatRoughness: 0.1, transparent: true, opacity: 0 });
  const logoSideMaterial = new THREE.MeshPhysicalMaterial({ metalness: 0.98, roughness: 0.22, clearcoat: 0.2, clearcoatRoughness: 0.15, transparent: true, opacity: 0 });
  // Existing bevel normals select a slightly smoother finish. No vertices
  // or normals are altered; the extrusion keeps its original geometry.
  logoSideMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying float vHVBevel;\nvarying float vHVInner;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvHVBevel = abs(objectNormal.z);\nvHVInner = smoothstep(0.25, 0.75, objectNormal.x) * (1.0 - smoothstep(0.12, 0.8, abs(objectNormal.z)));');
    shader.fragmentShader = 'varying float vHVBevel;\nvarying float vHVInner;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= mix(1.0, 0.74, smoothstep(0.08, 0.65, vHVBevel));');
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.12, 0.135), vHVInner * 0.6);');
  };
  logoSideMaterial.customProgramCacheKey = () => 'hv-existing-bevel-finish-v2';
  // glTF roughness uses green, not red. Fine directional variation avoids
  // turning the metal into a mirror and keeps its silhouette untouched.
  const roughnessPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const value = Math.round(238 + 7 * Math.sin(y * 2.7) + 3 * Math.sin(x * 0.21 + y));
      roughnessPixels.set([value, value, value, 255], (y * 128 + x) * 4);
    }
  }
  const roughnessMap = new THREE.DataTexture(roughnessPixels, 128, 128, THREE.RGBAFormat);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.minFilter = roughnessMap.magFilter = THREE.LinearFilter;
  roughnessMap.needsUpdate = true;
  logoMaterial.roughnessMap = roughnessMap;
  logoSideMaterial.roughnessMap = roughnessMap;
  // Fine architectural composite grain, with object-space coordinates so
  // the pedestal's rounded-box UVs cannot stretch the finish.
  const finishComposite = material => {
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vHVStone;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHVStone = position;');
      shader.fragmentShader = 'varying vec3 vHVStone;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat stoneGrain = fract(sin(dot(floor(vHVStone * 190.0), vec3(12.9898,78.233,37.719))) * 43758.5453);\ndiffuseColor.rgb *= 0.94 + 0.12 * stoneGrain;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (stoneGrain - 0.5) * 0.06, 0.0, 1.0);');
    };
    material.customProgramCacheKey = () => 'hv-reference-stone-v1';
  };
  finishComposite(platformMaterial);
  finishComposite(platformTop.material);
  let logoLoaded = false;
  const cyanLight = new THREE.PointLight(0x00f2fe, 0.5, 6, 2);
  cyanLight.position.set(0, 0.3, 1.1);
  logo.add(cyanLight);

  const cursorLight = new THREE.PointLight(0xc6d9df, 3.5, 8, 2);
  cursorLight.position.set(-2, 2, 3);
  cursorLight.castShadow = false;
  cursorLight.shadow.mapSize.set(256, 256);
  scene.add(cursorLight);

  const softbox = new THREE.RectAreaLight(0xffffff, 10, 5, 3);
  softbox.position.set(-2.5, 2.8, 4);
  softbox.lookAt(0, 0, 0);
  scene.add(softbox);

  const particleCount = window.innerWidth <= 900 ? 8 : 24;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(6.4);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(-2.4, 3.3);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-1.2, 1.8);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: 0.018, transparent: true, opacity: 0.3, depthWrite: false }));
  particles.visible = !reducedMotion;
  particles.position.z = 0.8;
  world.add(particles);

  // These are the visible physical scene layers. Both themes share them.
  environment.visible = true;
  platform.visible = true;
  logo.visible = true;
  particles.visible = !reducedMotion;

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(-4, 5, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.radius = 3;
  const fillLight = new THREE.AmbientLight(0xffffff, 0.75);
  const rimLight = new THREE.RectAreaLight(0x00f2fe, 8, 1.4, 3.5);
  rimLight.position.set(3, 1, -0.25);
  rimLight.lookAt(0, 0.3, 0.18);
  const bounceLight = new THREE.RectAreaLight(0xb2d9db, 1.8, 4, 0.6);
  bounceLight.position.set(0, -0.7, 1.4);
  bounceLight.lookAt(0, 0.4, 0);
  platformBody.receiveShadow = true;
  platformTop.castShadow = true;
  platformTop.receiveShadow = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.add(keyLight, fillLight, rimLight, bounceLight);

  // Use the exported GLB as the physical hero artifact. The pedestal remains
  // in the live scene so it can share the exact same theme transition as the
  // rest of the hero environment.
  new GLTFLoader().load('/models/highverz-hv.glb', (gltf) => {
    if (disposed) {
      gltf.scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) [object.material].flat().forEach((material) => material.dispose());
      });
      return;
    }
    const importedModel = gltf.scene;
    importedModel.name = 'Imported_Highverz_HV_Model';
    importedModel.position.y = -0.33;
    importedModel.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.name.includes('Pedestal')) {
        object.visible = false;
        return;
      }
      const original = [object.material].flat();
      const refined = original.map((material) => /Edges|Side/i.test(material.name) ? logoSideMaterial : logoMaterial);
      object.material = Array.isArray(object.material) ? refined : refined[0];
      original.forEach((material) => material.dispose());
    });
    logo.add(importedModel);
    logoLoaded = true;
  }, undefined, (error) => {
    console.error('Unable to load the Highverz GLB model.', error);
  });

  const current = {
    logo: new THREE.Color(),
    side: new THREE.Color(),
    platform: new THREE.Color(),
    frame: new THREE.Color(),
    cyan: new THREE.Color(),
    key: new THREE.Color(),
    fill: new THREE.Color(),
    rimIntensity: 1,
    frameOpacity: 0.3,
    particleOpacity: 0.3,
    cyanIntensity: 0.25,
  };
  const target = {
    logo: new THREE.Color(),
    side: new THREE.Color(),
    platform: new THREE.Color(),
    frame: new THREE.Color(),
    cyan: new THREE.Color(),
    key: new THREE.Color(),
    fill: new THREE.Color(),
    rimIntensity: 1,
    frameOpacity: 0.3,
    particleOpacity: 0.3,
    cyanIntensity: 0.25,
  };

  const setTheme = (instant = false) => {
    const palette = PALETTES[themeName()];
    target.logo.setHex(palette.logo);
    target.side.setHex(palette.side);
    target.platform.setHex(palette.platform);
    target.frame.setHex(palette.frame);
    target.cyan.setHex(palette.cyan);
    target.key.setHex(palette.key);
    target.fill.setHex(palette.fill);
    target.rimIntensity = themeName() === 'dark' ? 9 : 4;
    target.frameOpacity = themeName() === 'dark' ? 0.72 : 0.48;
    target.particleOpacity = themeName() === 'dark' ? 0.12 : 0.04;
    target.cyanIntensity = themeName() === 'dark' ? 0.12 : 0.035;
    if (instant) {
      current.logo.copy(target.logo); current.side.copy(target.side); current.platform.copy(target.platform);
      current.frame.copy(target.frame); current.cyan.copy(target.cyan); current.key.copy(target.key); current.fill.copy(target.fill);
      current.rimIntensity = target.rimIntensity; current.frameOpacity = target.frameOpacity;
      current.particleOpacity = target.particleOpacity; current.cyanIntensity = target.cyanIntensity;
    }
  };
  setTheme(true);
  const themeObserver = new MutationObserver(() => setTheme());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const pointer = new THREE.Vector2();
  const targetCamera = new THREE.Vector2();
  const currentCamera = new THREE.Vector2();
  const targetParallax = new THREE.Vector2();
  const currentParallax = new THREE.Vector2();
  const targetCursorLight = new THREE.Vector3(-2, 2, 3);
  const currentCursorLight = new THREE.Vector3(-2, 2, 3);
  const heroRegion = container.closest('.hero-section') || container;
  let lastPointerTime = -Infinity;
  const onPointerMove = (event) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const bounds = heroRegion.getBoundingClientRect();
    if (event.clientY < bounds.top || event.clientY > bounds.bottom) { resetPointer(); return; }
    pointer.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1), THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1));
    targetCamera.set(pointer.y * -0.008, pointer.x * 0.012);
    targetParallax.set(pointer.x, -pointer.y);
    lastPointerTime = performance.now();
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  const resetPointer = () => { targetCamera.set(0, 0); targetParallax.set(0, 0); };
  document.documentElement.addEventListener('pointerleave', resetPointer);
  const onMotionChange = () => {
    reducedMotion = motionQuery.matches;
    resetPointer();
    particles.visible = !reducedMotion;
    onScroll();
  };
  motionQuery.addEventListener('change', onMotionChange);
  const serviceResponse = new THREE.Vector4();
  const serviceTarget = new THREE.Vector4();
  const serviceCleanups = [];
  document.querySelectorAll('.hero-badges-track .floating-badge-item').forEach((item, index) => {
    const enter = () => { serviceTarget.set(0, 0, 0, 0); serviceTarget.setComponent(index, 1); };
    const leave = () => serviceTarget.set(0, 0, 0, 0);
    item.addEventListener('pointerenter', enter);
    item.addEventListener('pointerleave', leave);
    item.addEventListener('focusin', enter);
    item.addEventListener('focusout', leave);
    serviceCleanups.push(() => {
      item.removeEventListener('pointerenter', enter); item.removeEventListener('pointerleave', leave);
      item.removeEventListener('focusin', enter); item.removeEventListener('focusout', leave);
    });
  });

  let targetScroll = 0;
  let currentScroll = 0;
  const onScroll = () => {
    targetScroll = reducedMotion ? 0 : THREE.MathUtils.clamp(window.scrollY / Math.max(window.innerHeight * 0.9, 1), 0, 1);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const resize = () => {
    const rect = container.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 900 ? 1.25 : 1.75));
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    const visibleWidth = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    camera.zoom = Math.min(1, visibleWidth / 6.1);
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  let isInViewport = true;
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isInViewport = entry.isIntersecting;
    resume();
  }, { threshold: 0.01 });
  visibilityObserver.observe(container);

  let lastTime = performance.now();
  const nightPlatform = new THREE.Color(PALETTES.dark.platform).r;
  const dayPlatform = new THREE.Color(PALETTES.light.platform).r;
  let introProgress = 0;
  let elapsed = 0;
  let introElapsed = 0;
  let animationFrame = 0;
  const resume = () => {
    if (!disposed && !document.hidden && isInViewport && !animationFrame) {
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(animate);
    }
  };
  document.addEventListener('visibilitychange', resume);
  let energyPulse = 0;
  const animate = (time) => {
    animationFrame = 0;
    if (disposed || document.hidden || !isInViewport) return;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (time - lastPointerTime > 650) resetPointer();
    serviceResponse.lerp(serviceTarget, 1 - Math.exp(-delta * 3));
    elapsed += delta;
    time = reducedMotion ? 0 : elapsed * 1000;
    currentCamera.x = damp(currentCamera.x, targetCamera.x, 3.2, delta);
    currentCamera.y = damp(currentCamera.y, targetCamera.y, 3.2, delta);
    currentParallax.x = damp(currentParallax.x, targetParallax.x, 2.8, delta);
    currentParallax.y = damp(currentParallax.y, targetParallax.y, 2.8, delta);
    currentScroll = damp(currentScroll, targetScroll, 3.4, delta);
    if (logoLoaded) introElapsed += delta;
    introProgress = THREE.MathUtils.smoothstep(introElapsed, 0, reducedMotion ? 0.3 : 1.4);
    for (const property of Object.keys(current)) {
      if (current[property].isColor) current[property].lerp(target[property], 1 - Math.exp(-delta * 5));
      else current[property] = damp(current[property], target[property], 5, delta);
    }
    logoMaterial.color.copy(current.logo);
    logoMaterial.emissive.copy(current.cyan);
    logoMaterial.emissiveIntensity = 0;
    logoMaterial.opacity = introProgress;
    logoSideMaterial.opacity = introProgress;
    logoSideMaterial.color.copy(current.side);
    const studioDay = THREE.MathUtils.clamp((current.platform.r - nightPlatform) / (dayPlatform - nightPlatform), 0, 1);
    logoMaterial.envMapIntensity = 1.15 + studioDay * 0.7;
    logoSideMaterial.envMapIntensity = 1.5 + studioDay * 0.5;
    softbox.color.copy(current.key);
    softbox.intensity = (10 + studioDay * 3) * (0.4 + introProgress * 0.6);
    keyLight.intensity = 2.8 + studioDay * 0.4 + serviceResponse.x * 0.2;
    fillLight.intensity = 0.6 + studioDay * 0.2;
    bounceLight.intensity = 3.2 - studioDay * 1.2;
    keyLight.position.x = -4 + currentParallax.x * 0.18;
    platformMaterial.color.copy(current.platform);
    platformTop.material.color.copy(current.platform);
    platformMaterial.opacity = 0.72 + introProgress * 0.28;
    platformTop.material.opacity = 0.72 + introProgress * 0.28;
    contactMaterial.opacity = (0.24 + studioDay * 0.12) * introProgress;
    contact.scale.setScalar(1 + Math.sin(time * 0.0009) * 0.02);
    frameMaterial.color.copy(current.frame);
    frameMaterial.emissive.copy(current.cyan);
    frameMaterial.emissiveIntensity = 0.12 * (1 - studioDay);
    haloMaterial.color.copy(current.frame);
    haloMaterial.opacity = 0.28 - studioDay * 0.08;
    particles.material.color.copy(current.cyan);
    keyLight.color.copy(current.key);
    fillLight.color.copy(current.fill);
    rimLight.color.copy(current.cyan);
    rimLight.intensity = current.rimIntensity * (1 + serviceResponse.y * 0.08);
    frameMaterial.opacity = current.frameOpacity;
    particles.material.opacity = current.particleOpacity;
    camera.rotation.x = currentCamera.x;
    camera.rotation.y = currentCamera.y;
    environment.position.set(currentParallax.x * 0.04, currentParallax.y * 0.04, 0);
    environment.rotation.z = Math.sin(time * 0.00018) * 0.012 + currentParallax.x * 0.006;
    platform.position.set(currentParallax.x * 0.055, currentParallax.y * 0.035, 0);
    logo.position.x = currentParallax.x * 0.085;
    logo.position.y = 0.25 + Math.sin(time * 0.0012) * 0.04 + currentParallax.y * 0.035 - currentScroll * 0.2 + (reducedMotion ? 0 : serviceResponse.w * 0.035);
    logo.rotation.y = -0.08 + Math.sin(time * 0.0009) * (0.017 + (reducedMotion ? 0 : serviceResponse.z * 0.004)) + currentParallax.x * 0.035;
    logo.rotation.x = 0.035 + Math.sin(time * 0.001) * 0.01 + currentParallax.y * 0.026;
    const introScale = 0.965 + introProgress * 0.035;
    const scrollScale = 1 - currentScroll * 0.07;
    logo.scale.setScalar(introScale * scrollScale);
    platform.position.y = currentParallax.y * 0.035 - currentScroll * 0.08;
    particles.position.set(currentParallax.x * 0.14, currentParallax.y * 0.1, 0.8);
    const sweepPhase = elapsed % 9;
    energyPulse = reducedMotion || sweepPhase > 1.5 ? 0 : Math.sin(sweepPhase / 1.5 * Math.PI) ** 2;
    softbox.position.x = -2.5 + currentParallax.x * 0.8;
    softbox.position.y = 2.8 + currentParallax.y * 0.4;
    softbox.lookAt(0, 0.3, 0);
    rimLight.position.y = 1 + currentParallax.y * 0.15;
    rimLight.lookAt(0, 0.3, 0.18);
    targetCursorLight.set(-2 + currentParallax.x * 0.35, 2 + currentParallax.y * 0.25, 3.2);
    currentCursorLight.lerp(targetCursorLight, 1 - Math.exp(-delta * 2.2));
    cursorLight.position.copy(currentCursorLight);
    cyanLight.intensity = energyPulse * (2.4 - studioDay * 1.4) * introProgress;
    cyanLight.position.set(-2.4 + Math.min(sweepPhase / 1.5, 1) * 4.8, 0.4, 0.9);
    if (!document.hidden && isInViewport) renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  };
  resume();
  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect(); visibilityObserver.disconnect(); themeObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', resume);
    document.documentElement.removeEventListener('pointerleave', resetPointer);
    motionQuery.removeEventListener('change', onMotionChange);
    serviceCleanups.forEach(cleanup => cleanup());
    const materials = new Set();
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (object.material) [object.material].flat().forEach((material) => materials.add(material));
      object.shadow?.dispose();
    });
    materials.forEach((material) => material.dispose());
    roughnessMap.dispose(); atmosphereMap.dispose(); environmentTarget.dispose(); renderer.dispose();
  };
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  return { scene, camera, renderer, dispose };
}
