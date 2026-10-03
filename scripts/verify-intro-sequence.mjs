import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 900 }
});

try {
  const page = await browser.newPage();
  await page.goto(process.env.INTRO_TEST_URL || 'http://localhost:5173/?intro=force', {
    waitUntil: 'networkidle0'
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => typeof window.__HV_SEEK__ === 'function', { timeout: 10000 });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });

  const readFrame = async (time) => page.evaluate((timestamp) => {
    window.__HV_SEEK__(timestamp);
    const mark = document.querySelector('#hv-reachify-mark');
    const letters = [...document.querySelectorAll('.hv-letter')];
    const rocket = document.querySelector('#highverz-rocket');
    const top = document.querySelector('#hv-panel-top');
    const bottom = document.querySelector('#hv-panel-bottom');
    const wordReveal = document.querySelector('#hv-word-reveal');
    const badge = document.querySelector('.hv-reachify-mark-squircle');
    const progress = document.querySelector('#hv-intro-progress-fill');
    const markBounds = mark.getBoundingClientRect();
    const wordBounds = wordReveal.getBoundingClientRect();
    return {
      mark: Number(getComputedStyle(mark).opacity),
      letters: letters.map((letter) => Number(getComputedStyle(letter).opacity)),
      letterFilters: letters.map((letter) => getComputedStyle(letter).filter),
      rocketTransform: rocket?.style.transform || '',
      topTransform: top?.style.transform || '',
      bottomTransform: bottom?.style.transform || '',
      wordRevealClip: wordReveal?.style.clipPath || '',
      markZIndex: Number(getComputedStyle(mark).zIndex),
      wordRevealZIndex: Number(getComputedStyle(wordReveal).zIndex),
      verticalOffset: Math.abs(
        (markBounds.top + markBounds.height / 2) -
        (wordBounds.top + wordBounds.height / 2)
      ),
      wordStartOffset: wordBounds.left - markBounds.left,
      badgeBackground: getComputedStyle(badge).backgroundColor,
      skipHintPresent: Boolean(document.querySelector('#hv-reachify-skip')),
      progressTransform: progress?.style.transform || '',
      progressOpacity: Number(getComputedStyle(progress).opacity),
      lockupCenter: (Math.min(markBounds.left, wordBounds.left) + Math.max(markBounds.right, wordBounds.right)) / 2,
      viewportCenter: window.innerWidth / 2,
      gridVisible: getComputedStyle(document.querySelector('.hv-reachify-grid-pattern')).display !== 'none'
    };
  }, time);

  const markOnly = await readFrame(850);
  assert(markOnly.mark > 0.9, 'the logo mark should be visible first');
  assert(markOnly.letters.every((opacity) => opacity >= 0.68 && opacity <= 0.72), 'wordmark must remain visibly blurred while the mark settles');
  assert(markOnly.letterFilters.every((filter) => filter === 'blur(28px)'), 'wordmark must remain fully defocused with a 28px blur before its focus sequence begins');
  assert.equal(markOnly.wordRevealClip, 'inset(0px 100% 0px 0px)', 'wordmark must stay clipped inside the logo before its reveal begins');
  assert.equal(markOnly.gridVisible, false, 'loader background must not render a centre grid seam');
  assert.equal(markOnly.skipHintPresent, false, 'loader must not render a click-or-space skip prompt');
  assert.equal(markOnly.progressTransform, 'scaleX(0.2951)', 'bottom loading bar must reflect elapsed loader progress');

  const blurStart = await readFrame(999);
  assert.equal(blurStart.letterFilters[0], 'blur(28px)', 'the wordmark must begin with a clearly visible 28px focus blur');
  assert(blurStart.letters.every((opacity) => opacity >= 0.68 && opacity <= 0.72), 'all wordmark letters must be visibly blurred before the focus sequence begins');

  const secondCharacter = await readFrame(1320);
  const secondCharacterBlur = Number.parseFloat(secondCharacter.letterFilters[1].match(/[\d.]+/)?.[0]);
  assert(secondCharacterBlur > 0 && secondCharacterBlur < 28, 'the second character must begin sharpening after the longer blurred hold');
  assert.notEqual(secondCharacter.wordRevealClip, 'inset(0px 100% 0px 0px)', 'wordmark mask must expand outward from the logo during the character focus sequence');

  const firstLetterHold = await readFrame(1170);
  assert.equal(firstLetterHold.letterFilters[0], 'blur(28px)', 'the first letter must hold its stronger visible blur before sharpening');

  const wordOrigin = await readFrame(1000);
  assert(wordOrigin.wordRevealZIndex < wordOrigin.markZIndex, 'wordmark reveal lane must sit behind the logo mark');
  assert(wordOrigin.verticalOffset < 1, 'wordmark reveal lane must stay vertically centered with the logo mark');
  assert(Math.abs(wordOrigin.wordStartOffset) < 2, 'wordmark must begin at the logo mark\'s left edge so it emerges fully from behind the badge');
  assert.equal(wordOrigin.badgeBackground, 'rgb(6, 17, 22)', 'logo badge must have an opaque surface so the wordmark cannot show through it');

  const wordmark = await readFrame(2000);
  assert(Math.abs(wordmark.lockupCenter - wordmark.viewportCenter) < 36, 'the completed mark and wordmark lockup must be centered as one unit');
  assert(wordmark.letters.every((opacity) => opacity > 0.9), 'the wordmark should complete before launch');
  assert.match(wordmark.rocketTransform, /translate3d\(0(?:px)?, 0(?:px)?, 0(?:px)?\) scale\(1\)/, 'rocket must wait until the wordmark completes');

  const launch = await readFrame(2500);
  assert.doesNotMatch(launch.rocketTransform, /translate3d\(0(?:px)?, 0(?:px)?, 0(?:px)?\) scale\(1\)/, 'rocket should animate before the split');
  assert.equal(launch.topTransform, 'translateY(0%)', 'top panel must stay closed during rocket launch');
  assert.equal(launch.bottomTransform, 'translateY(0%)', 'bottom panel must stay closed during rocket launch');

  const split = await readFrame(3200);
  assert.notEqual(split.topTransform, 'translateY(0%)', 'split starts only after rocket launch');
  assert.notEqual(split.bottomTransform, 'translateY(0%)', 'split starts only after rocket launch');
  assert(split.progressOpacity < 1, 'bottom loading bar must fade as the loader splits open');
} finally {
  await browser.close();
}

console.log('Intro sequence verified.');
