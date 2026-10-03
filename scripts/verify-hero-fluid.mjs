import fs from 'node:fs';

const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const fluid = fs.readFileSync(new URL('../src/hero/HeroFluidBackground.js', import.meta.url), 'utf8');

for (const token of [
  'initHeroFluidBackground',
  'global-fluid-canvas',
  'IntersectionObserver',
  'prefers-reduced-motion',
  'uResolution',
  'pointerField',
  'liquidPoint',
]) {
  if (!fluid.includes(token) && !main.includes(token) && !css.includes(token)) {
    throw new Error(`Persistent fluid background is missing: ${token}`);
  }
}

if (!main.includes('initHeroFluidBackground()')) {
  throw new Error('Persistent fluid background is not initialized during boot');
}

if (!css.includes('.global-fluid-canvas') || !css.includes('position: fixed')) {
  throw new Error('Fluid canvas is not persistent across the dark-theme page');
}

if (!css.includes('background: #000000')) {
  throw new Error('Fluid environment is not pitch black');
}

for (const token of ['float largeField', 'float foldedField', 'float liquid', 'float rim', 'float highlight']) {
  if (!fluid.includes(token)) {
    throw new Error(`Fluid shader is missing its organic field layer: ${token}`);
  }
}

for (const token of [
  'vec3 deepBlue = vec3(0.0, 0.012, 0.045)',
  'vec3 electricBlue = vec3(0.0, 0.055, 0.18)',
  'vec3 cyan = vec3(0.0, 0.42, 0.58)',
  'vec3 lightCyan = vec3(0.24, 0.64, 0.72)',
]) {
  if (!fluid.includes(token)) {
    throw new Error(`Fluid shader is missing the Highverz blue/cyan palette: ${token}`);
  }
}

if (!fluid.includes('alpha *= 1.0 - uTheme')) {
  throw new Error('Fluid shader is not disabled in light theme');
}

if (fluid.includes('vec3 warm') || fluid.includes('float amber') || fluid.includes('heroSPath')) {
  throw new Error('Fluid shader still contains the previous ribbon implementation');
}

console.log('Persistent Highverz fluid background check passed.');
