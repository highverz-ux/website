import fs from 'node:fs';

const intro = fs.readFileSync(new URL('../src/intro/HighverzIntro.js', import.meta.url), 'utf8');
if (intro.includes('highverz-full-wordmark.svg')) {
  throw new Error('Loader still references the broken flat wordmark asset');
}

if (intro.includes('hv-reveal-underline')) {
  throw new Error('Loader still renders the deprecated split line');
}

if (!intro.includes('highverz-hv-logo.svg') || !intro.includes('hv-reveal-mark')) {
  throw new Error('Loader is missing the standalone HV mark');
}

if (!intro.includes('hv-reveal-mark-frame')) {
  throw new Error('Loader is missing the bordered HV mark frame');
}

if (intro.includes('hv-loading-bar') || intro.includes('hv-reveal-wordmark') || intro.includes('hv-reveal-rocket')) {
  throw new Error('Loader still contains the deprecated wordmark, rocket, or progress bar');
}

if (intro.includes('hv-blind-top') || intro.includes('hv-blind-bottom')) {
  throw new Error('Loader still contains the custom split-panel animation');
}

if (!intro.includes('duration: 0.6') || !intro.includes('duration: 0.8')) {
  throw new Error('Loader does not match the Framer SiteLoader entrance/exit timing');
}

console.log('Loader logo asset check passed.');
