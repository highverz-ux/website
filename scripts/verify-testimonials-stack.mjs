import fs from 'node:fs';

const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

for (const token of ['testimonials-stack', 'testimonials-active-index', 'testimonials-nav', 'data-card-role', 'setTimeout', 'visibilitychange']) {
  if (!main.includes(token) && !css.includes(token)) {
    throw new Error(`Review stack is missing: ${token}`);
  }
}

if (!css.includes('grid-area: 1 / 1') || !css.includes('transform-style: preserve-3d')) {
  throw new Error('Review cards are not configured as a layered composition');
}

if (!css.includes('blur(') || !css.includes('testimonials-nav-button')) {
  throw new Error('Review stack is missing the softened side-card treatment or controls');
}

if (!main.includes('prefers-reduced-motion')) {
  throw new Error('Review stack is missing reduced-motion handling');
}

if (!main.includes('stack.clientWidth') || !main.includes('sideOffset')) {
  throw new Error('Review carousel does not position its side cards responsively');
}

for (const token of ['setPointerCapture', 'pointerdown', 'dragThreshold', 'pointermove']) {
  if (!main.includes(token)) {
    throw new Error(`Review carousel is missing pointer interaction: ${token}`);
  }
}

if (!css.includes('cursor: grab') || !css.includes('touch-action: pan-y')) {
  throw new Error('Review carousel is missing drag affordance');
}

console.log('Testimonials stack check passed.');
