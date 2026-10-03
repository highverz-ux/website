import fs from 'node:fs';

const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const fluidUrl = new URL('../src/hero/HeroFluidBackground.js', import.meta.url);
if (!fs.existsSync(fluidUrl)) {
  throw new Error('Hero fluid background module is missing');
}
const fluid = fs.readFileSync(fluidUrl, 'utf8');

for (const token of ['initHeroFluidBackground', 'hero-fluid-canvas', 'IntersectionObserver', 'prefers-reduced-motion']) {
  if (!fluid.includes(token) && !main.includes(token) && !css.includes(token)) {
    throw new Error(`Hero fluid background is missing: ${token}`);
  }
}

if (!main.includes("initHeroFluidBackground()")) {
  throw new Error('Hero fluid background is not initialized during boot');
}

if (!css.includes('#hero .hero-fluid-canvas') || !css.includes('overflow: hidden')) {
  throw new Error('Hero fluid canvas is not safely clipped behind hero content');
}

if (!css.includes('background: #000000')) {
  throw new Error('Hero fluid background is not pitch black');
}

for (const token of ['float core', 'float body', 'float softEdge']) {
  if (!fluid.includes(token)) {
    throw new Error(`Hero fluid is missing a defined ribbon layer: ${token}`);
  }
}

if (!fluid.includes('upperRibbon')) {
  throw new Error('Hero fluid is missing the restrained upper ribbon');
}

if (!fluid.includes('upperThickness = thickness')) {
  throw new Error('Upper ribbon does not reuse the bottom ribbon material thickness');
}

if (!fluid.includes('float upperBody') || !fluid.includes('upperSoftEdge * 0.08 + upperBody * 0.22 + upperCore * 0.32 + upperGleam * 0.14')) {
  throw new Error('Upper ribbon does not match the lower ribbon layer treatment');
}

for (const token of ['lowerVisibility', 'upperVisibility', 'vec3 electricBlue = vec3(0.0, 0.55, 1.0)', 'vec3 cyan = vec3(0.0, 0.85, 1.0)']) {
  if (!fluid.includes(token)) {
    throw new Error(`Hero fluid is missing the controlled blue accent treatment: ${token}`);
  }
}

if (!fluid.includes('float sharedFlow')) {
  throw new Error('Hero ribbons are not connected by a shared fluid rhythm');
}

if (!fluid.includes('float heroSPath')) {
  throw new Error('Hero fluid is missing the unified S-path flow');
}

if (fluid.includes('vec3 warm') || fluid.includes('float amber')) {
  throw new Error('Hero fluid still contains a non-blue warm accent');
}

console.log('Hero fluid background check passed.');
