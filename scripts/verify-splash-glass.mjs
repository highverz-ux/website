import fs from 'node:fs';

const intro = fs.readFileSync(new URL('../src/intro/HighverzIntro.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/intro/intro.css', import.meta.url), 'utf8');

if (!intro.includes('highverz-hv-logo.svg')) {
  throw new Error('Splash is not using the verified Highverz logo asset');
}

for (const layer of ['hv-reveal-glass', 'hv-reveal-edge', 'hv-reveal-sheen']) {
  if (!intro.includes(layer) || !css.includes(`.${layer}`)) {
    throw new Error(`Splash is missing the logo glass layer: ${layer}`);
  }
}

if (intro.includes('hv-reveal-mark-frame')) {
  throw new Error('Splash still wraps the logo in a glass UI card');
}

if (!css.includes('mask-image') || !css.includes('backdrop-filter')) {
  throw new Error('Splash glass treatment is not shape-bound');
}

console.log('Splash glass logo check passed.');
