import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const origin = process.env.TEST_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  for (const width of [1440, 375]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    const errors = [];
    let catalogueRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    // Exercise the real loader/cache/rendering without depending on TMDB uptime.
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/api/movies') {
        catalogueRequests++;
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          success: true, page: 1, total_pages: 1, total_results: 1,
          results: [{ id: 872585, title: 'Route regression fixture', vote_average: 8,
            release_date: '2023-07-21', genre_ids: [18], poster_path: null }],
        }) });
      }
      return request.continue();
    });
    await page.goto(`${origin}/team.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__hvInitPageScripts === 'function');
    await new Promise(resolve => setTimeout(resolve, 1800));
    for (const route of ['index', 'why-us', 'campaigns', 'team', 'campaigns', 'index', 'campaigns', 'index']) {
      console.log(`Checking ${width}px -> ${route}`);
      await page.evaluate(route => {
        document.querySelector(`.nav-link[href="/${route}.html"]`).click();
      }, route);
      await page.waitForFunction(route => location.pathname === `/${route}.html`
        && !document.querySelector('#page-transition-shell')
        && !document.body.classList.contains('page-is-transitioning'), {}, route);
      // Entrance animations may outlast the shell; layout and loader must already exist.
      if (route === 'index') {
        const result = await page.evaluate(() => ({
          initialized: typeof window.__hvHeroReelCleanup === 'function',
          positions: [...document.querySelectorAll('.card-position')].map(card => card.style.transform),
          visiblePositions: [...document.querySelectorAll('.card-position')]
            .filter(card => getComputedStyle(card).display !== 'none').map(card => card.style.transform),
          wrongClass: document.body.matches('.page-team, .page-why-us, .page-campaigns'),
        }));
        assert.equal(result.initialized, true, `Home initializer missing at ${width}px`);
        assert.equal(result.wrongClass, false);
        assert.equal(result.positions.length, 10);
        assert.ok(result.visiblePositions.every(Boolean));
        assert.ok(new Set(result.visiblePositions).size >= 3, 'Visible reels must occupy distinct positions');
      }
      if (route === 'campaigns') {
        await page.waitForSelector('#campaign-grid .campaign-movie-card');
        assert.equal(await page.$('#campaign-grid .campaign-skeleton'), null);
      }
      // Allow the engine's final RAF unlock before the next click.
      await page.evaluate(() => new Promise(resolve => {
        let frames = 0;
        const next = () => ++frames >= 8 ? resolve() : requestAnimationFrame(next);
        requestAnimationFrame(next);
      }));
    }
    assert.equal(catalogueRequests, 1, 'Repeat Campaigns visits must reuse the browser cache');
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: repeated route swaps, distinct visible reels, campaign cards, one catalogue request`);
    await page.close();
  }
} finally {
  await browser.close();
}
