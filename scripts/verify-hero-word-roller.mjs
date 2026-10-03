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
  await page.goto(process.env.HERO_TEST_URL || 'http://localhost:5173/?intro=false', {
    waitUntil: 'networkidle0'
  });
  await page.waitForSelector('#hero-word-roller');

  const roller = await page.$eval('#hero-word-roller', (element) => {
    const style = getComputedStyle(element);
    return { overflow: style.overflow, height: style.height, verticalAlign: style.verticalAlign, marginLeft: style.marginLeft };
  });

  assert.equal(roller.overflow, 'hidden', 'keyword roller must clip words to one line while they roll');
  assert.notEqual(roller.height, '0px', 'keyword roller must retain a stable line-height during transitions');
  assert.equal(roller.verticalAlign, 'baseline', 'keyword roller must align with the headline baseline');
  assert(Number.parseFloat(roller.marginLeft) < 0, 'keyword roller must close the extra whitespace before the changing word');
} finally {
  await browser.close();
}

console.log('Hero word roller verified.');
