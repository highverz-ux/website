/**
 * HIGHVERZ — REVEAL PRELOADER
 *
 * Framer SiteLoader behavior, adapted to the site's vanilla DOM runtime.
 *
 * Sequence:
 *  0.1s  → Glass HV mark fades + sharpens into focus
 *  0.7s  → Logo fades/scales in
 *  2.5s  → Reveal callback fires (hero starts)
 *  2.5s  → Full-screen loader lifts upward, revealing the page below
 */

import gsap from 'gsap';

let activeIntroInstance = null;

export class HighverzIntro {
  constructor(options = {}) {
    this.onComplete    = options.onComplete    || (() => {});
    this.onStartReveal = options.onStartReveal || null;
    this.hasRevealed   = false;
    this.isDestroyed   = false;
    this.isCompleted   = false;

    this.container   = null;
    this.tl          = null;
    this.safetyTimer = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOM
  // ─────────────────────────────────────────────────────────────────────────
  createDOM() {
    let container = document.getElementById('highverz-intro');

    const html = `
      <div class="hv-reveal-center" id="hv-reveal-center">
        <div class="hv-reveal-logo" id="hv-reveal-logo">
          <div class="hv-reveal-mark" aria-hidden="true">
            <div class="hv-reveal-glass">
              <img class="hv-reveal-glass-base" src="/assets/highverz-hv-logo.svg" alt="" draggable="false" />
              <span class="hv-reveal-edge" aria-hidden="true"></span>
              <span class="hv-reveal-dispersion" aria-hidden="true"></span>
              <span class="hv-reveal-sheen" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="hv-loader-progress" aria-hidden="true">
        <div class="hv-loader-progress-track">
          <span class="hv-loader-progress-fill"></span>
        </div>
      </div>
    `;

    if (!container) {
      container = document.createElement('div');
      container.id = 'highverz-intro';
      container.setAttribute('aria-label', 'Highverz Loading');
      container.innerHTML = html;
      document.body.prepend(container);
    } else {
      container.innerHTML = html;
    }

    this.container = container;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATE
  // ─────────────────────────────────────────────────────────────────────────
  animate() {
    const logo      = this.container.querySelector('#hv-reveal-logo');
    const center    = this.container.querySelector('#hv-reveal-center');
    const progress  = this.container.querySelector('.hv-loader-progress-fill');

    // Matches the Framer SiteLoader default: fade in the complete logo as one unit.
    gsap.set(logo, { opacity: 0, scale: 0.92, y: 8 });
    gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });

    this.tl = gsap.timeline();

    // SiteLoader's default logo entrance.
    this.tl.to(logo, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0);

    // Initial progress bump while assets begin loading
    this.tl.to(progress, {
      scaleX: 0.18,
      duration: 0.4,
      ease: 'power1.out',
    }, 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REAL ASSET PRELOADING COORDINATOR
  // Actively buffers critical fonts, hero posters, and center hero reel videos
  // while the intro is displayed so the website opens with zero lag.
  // ─────────────────────────────────────────────────────────────────────────
  async startAssetPreload() {
    const progress = this.container?.querySelector('.hv-loader-progress-fill');
    let currentScale = 0.18;

    const setProgress = (val, duration = 0.35) => {
      if (this.isFinishing || this.isCompleted || !progress) return;
      currentScale = Math.max(currentScale, val);
      gsap.to(progress, {
        scaleX: currentScale,
        duration,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    // 1. Critical Typography
    const fontTask = (document.fonts && document.fonts.ready)
      ? document.fonts.ready.then(() => setProgress(0.38)).catch(() => {})
      : Promise.resolve();

    // 2. Critical Branding & Hero Reel Posters
    const criticalImages = [
      '/assets/highverz-hv-logo.svg',
      '/assets/logo-white.png',
      '/assets/creators/reels/clean/posters/reel_1.jpg',
      '/assets/creators/reels/clean/posters/reel_2.jpg',
      '/assets/creators/reels/clean/posters/reel_10.jpg',
      '/assets/creators/opt/umarpnj.jpg',
      '/assets/creators/opt/niv0ne.jpg',
    ];
    const imageTask = Promise.all(
      criticalImages.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
        if (img.decode) img.decode().then(resolve).catch(resolve);
      }))
    ).then(() => setProgress(0.68));

    // 3. Unlock and buffer the visible hero videos (center cards 0, 1, 9)
    if (typeof window.__hvUnlockHeroVideos === 'function') {
      window.__hvUnlockHeroVideos();
    }
    const centerVideos = Array.from(document.querySelectorAll(
      '.card-position[data-index="0"] .card-video, .card-position[data-index="1"] .card-video, .card-position[data-index="9"] .card-video'
    ));

    const videoTask = centerVideos.length
      ? Promise.all(centerVideos.map(video => new Promise(resolve => {
          if (video.readyState >= 2) return resolve();
          const done = () => { cleanup(); resolve(); };
          const timer = setTimeout(done, 1500); // 1.5s max wait so slow networks never hang
          const cleanup = () => {
            video.removeEventListener('loadeddata', done);
            video.removeEventListener('canplay', done);
            clearTimeout(timer);
          };
          video.addEventListener('loadeddata', done, { once: true });
          video.addEventListener('canplay', done, { once: true });
        }))).then(() => setProgress(0.92))
      : Promise.resolve();

    // 4. Polish: minimum 1.1s for branded animation, maximum 2.2s safety cap
    const minDelay = new Promise(resolve => setTimeout(resolve, 1100));
    const maxTimeout = new Promise(resolve => setTimeout(resolve, 2200));

    await Promise.race([
      Promise.all([fontTask, imageTask, videoTask, minDelay]),
      maxTimeout
    ]);

    if (!this.isCompleted && !this.isFinishing) {
      this.finishLoading();
    }
  }

  finishLoading() {
    if (this.isCompleted || this.isFinishing) return;
    this.isFinishing = true;

    if (this.tl) { this.tl.kill(); this.tl = null; }

    const center = this.container.querySelector('#hv-reveal-center');
    const progress = this.container.querySelector('.hv-loader-progress-fill');
    const finishTl = gsap.timeline({ onComplete: () => this.destroy() });

    finishTl.to(progress, {
      scaleX: 1,
      duration: 0.35,
      ease: 'power1.inOut'
    }, 0);

    finishTl.call(() => this.triggerReveal(), [], 0.35);
    
    finishTl.to(this.container, {
      yPercent: -100,
      duration: 0.85,
      ease: 'power4.inOut',
    }, 0.35);
    
    finishTl.to(center, {
      opacity: 0,
      y: -18,
      duration: 0.38,
      ease: 'power2.in',
    }, 0.35);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Safety fallback — only used if the animation runtime stalls.
  // There is intentionally no click, keyboard, or touch shortcut for leaving
  // the loading screen.
  // ─────────────────────────────────────────────────────────────────────────
  finishSafely() {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.tl) { this.tl.kill(); this.tl = null; }

    const skipTl = gsap.timeline({ onComplete: () => this.destroy() });

    this.triggerReveal();
    if (this.container) {
      const progress = this.container.querySelector('.hv-loader-progress-fill');
      if (progress) {
        skipTl.to(progress, { scaleX: 1, duration: 0.22, ease: 'power2.out' }, 0);
      }
      skipTl.to(this.container, {
        yPercent: -100,
        duration: 0.65,
        ease: 'power4.inOut',
      }, 0);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRIGGER REVEAL (once)
  // ─────────────────────────────────────────────────────────────────────────
  triggerReveal() {
    if (this.hasRevealed) return;
    this.hasRevealed = true;
    document.documentElement.classList.remove('intro-pending');
    document.body.classList.remove('intro-active');
    if (typeof this.onStartReveal === 'function') {
      this.onStartReveal();
    } else if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DESTROY
  // ─────────────────────────────────────────────────────────────────────────
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isCompleted = true;

    if (this.tl) { this.tl.kill(); this.tl = null; }
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

    this.triggerReveal();

    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      window.__HIGHVERZ_INTRO_ACTIVE__ = false;
      activeIntroInstance = null;
    }, 80);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────
  init() {
    this.createDOM();
    document.body.classList.add('intro-active');
    document.documentElement.classList.remove('skip-intro');
    document.documentElement.classList.add('intro-pending');

    this.safetyTimer = setTimeout(() => {
      if (!this.isCompleted) this.finishSafely();
    }, 4500);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animate();
        this.startAssetPreload();
      });
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────────

export function initHighverzIntro(options = {}) {
  if (window.__HIGHVERZ_INTRO_ACTIVE__) {
    if (options.force) {
      if (activeIntroInstance) {
        activeIntroInstance.destroy();
        activeIntroInstance = null;
      }
      window.__HIGHVERZ_INTRO_ACTIVE__ = false;
    } else {
      return;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isExplicitlyDisabled = urlParams.get('intro') === 'false';
  const isForceIntro = urlParams.get('intro') === 'true'
    || urlParams.get('intro') === 'force'
    || options.force === true;

  if (isExplicitlyDisabled || (window.__HV_SKIP_INTRO__ && !isForceIntro)) {
    const existing = document.getElementById('highverz-intro');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.classList.remove('intro-active');
    if (options.onComplete) options.onComplete();
    return;
  }

  window.__HIGHVERZ_INTRO_ACTIVE__ = true;
  activeIntroInstance = new HighverzIntro(options);
  activeIntroInstance.init();
}

export function replayHighverzIntro() {
  if (typeof window.prepareHeroInitialState === 'function') {
    window.prepareHeroInitialState();
  }
  document.documentElement.classList.add('intro-pending');
  document.body.classList.add('intro-active');
  initHighverzIntro({
    force: true,
    onStartReveal: () => {
      if (window.lenis) window.lenis.start();
      if (typeof window.initHeroIntro === 'function') {
        window.initHeroIntro(false);
      }
    }
  });
}

if (typeof window !== 'undefined') {
  window.replayHighverzIntro = replayHighverzIntro;
}
