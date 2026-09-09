/**
 * HIGHVERZ — MINIMAL PREMIUM LOADING INTRO (DARK THEME & ENLARGED)
 * Pure SVG + GSAP + CSS Choreography
 * Apple / Aesop / Linear / High-End Studio Restraint
 * 
 * Sequence:
 *   0.00s – 0.50s : Static Highverz logo in crisp off-white on dark (#050708)
 *   0.50s – 0.65s : Subtle rocket anticipation (lifts 3-4px upward)
 *   0.65s – 1.15s : Complete rocket unit (fuselage + dual flame boost) launches upward with sleek cyan trail
 *   1.05s – 1.30s : Electric cyan dot fades in on top of the "i" stem, completing the wordmark
 *   1.20s – 1.55s : Logo gently scales down (1 -> 0.98) and fades out
 *   1.55s – 2.00s : Seamless overlay fade revealing the Highverz homepage hero
 * 
 * Total duration: ~2.00s. Zero loading bar, zero three.js, pure graphic precision.
 */

import gsap from 'gsap';
import layeredLogoSvgRaw from '../../assets/highverz-layered.svg?raw';

function devLog(...args) {
  if (import.meta.env && import.meta.env.DEV) {
    console.log('[HIGHVERZ INTRO]', ...args);
  }
}

// Global singleton instance
let activeIntroInstance = null;

export class HighverzIntro {
  constructor(options = {}) {
    this.onComplete = options.onComplete || (() => {});
    
    this.container = null;
    this.logoWrap = null;
    this.rocketEl = null;
    this.trailEl = null;
    this.iDotEl = null;
    this.wordmarkEl = null;
    
    this.isDestroyed = false;
    this.isCompleted = false;
    this.timeline = null;
  }

  createDOM() {
    let container = document.getElementById('highverz-intro');
    const contentHTML = `
      <div class="hv-intro-bg"></div>
      <div class="hv-content-wrap">
        <div class="hv-logo-wrap" id="hv-logo-wrap">
          ${layeredLogoSvgRaw}
        </div>
        <div class="hv-loader-block" id="hv-loader-block">
          <div class="hv-progress-track">
            <div class="hv-progress-bar" id="hv-progress-bar"></div>
          </div>
          <div class="hv-counter-meta">
            <span class="hv-counter-status" id="hv-counter-status">LOADING</span>
            <span class="hv-counter-val" id="hv-counter-val">1%</span>
          </div>
        </div>
      </div>
    `;

    if (!container) {
      container = document.createElement('div');
      container.id = 'highverz-intro';
      container.className = 'hv-intro-container';
      container.setAttribute('aria-label', 'Highverz Loading Intro');
      container.innerHTML = contentHTML;
      document.body.prepend(container);
    } else {
      // Reuse existing container; ensure clean SVG markup and loader inside
      container.classList.remove('hv-intro-exit');
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.innerHTML = contentHTML;
    }

    this.container = container;
    this.contentWrap = container.querySelector('.hv-content-wrap');
    this.logoWrap = container.querySelector('.hv-logo-wrap');
    this.loaderBlock = container.querySelector('#hv-loader-block');
    this.progressBarEl = container.querySelector('#hv-progress-bar');
    this.counterValEl = container.querySelector('#hv-counter-val');
    this.counterStatusEl = container.querySelector('#hv-counter-status');
    this.rocketEl = container.querySelector('#highverz-rocket');
    this.trailEl = container.querySelector('#highverz-rocket-trail');
    this.iDotEl = container.querySelector('#highverz-i-dot');
    this.wordmarkEl = container.querySelector('#highverz-wordmark');
    this.innerFlameEl = container.querySelector('#rocket-inner-flame');
    this.outerFlameEl = container.querySelector('#rocket-outer-flame');
  }

  init() {
    this.createDOM();
    document.body.classList.add('intro-active');
    devLog('initialized');

    this.startTimeline();
  }

  startTimeline() {
    // Reset initial states
    if (this.rocketEl) gsap.set(this.rocketEl, { y: 0, opacity: 1 });
    if (this.trailEl) gsap.set(this.trailEl, { opacity: 0 });
    if (this.iDotEl) gsap.set(this.iDotEl, { opacity: 0 });
    if (this.logoWrap) gsap.set(this.logoWrap, { scale: 1, opacity: 1 });
    if (this.loaderBlock) gsap.set(this.loaderBlock, { opacity: 1, y: 0 });
    if (this.progressBarEl) gsap.set(this.progressBarEl, { width: '1%' });
    if (this.counterValEl) {
      this.counterValEl.textContent = '1%';
      this.counterValEl.classList.remove('is-complete');
    }
    if (this.counterStatusEl) {
      this.counterStatusEl.textContent = 'LOADING';
      this.counterStatusEl.classList.remove('is-ready');
    }
    if (this.container) gsap.set(this.container, { opacity: 1 });

    this.safetyTimer = setTimeout(() => {
      if (!this.isCompleted) {
        devLog('safety timeout triggered');
        this.arrive();
      }
    }, 3800);

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.arrive();
      }
    });

    const tl = this.timeline;

    // 0.00s – 1.15s: High-precision 1 to 100% Loader Count & Progress Fill
    const counterState = { count: 1 };

    // Stage 1: 1% to 76% (swift smooth ramp)
    tl.to(counterState, {
      count: 76,
      duration: 0.65,
      ease: 'power1.inOut',
      onUpdate: () => {
        const val = Math.round(counterState.count);
        if (this.counterValEl) this.counterValEl.textContent = `${val}%`;
        if (this.progressBarEl) this.progressBarEl.style.width = `${val}%`;
      }
    });

    // Stage 2: 76% to 100% (smooth snap into completion)
    tl.to(counterState, {
      count: 100,
      duration: 0.50,
      ease: 'power2.out',
      onUpdate: () => {
        const val = Math.round(counterState.count);
        if (this.counterValEl) this.counterValEl.textContent = `${val}%`;
        if (this.progressBarEl) this.progressBarEl.style.width = `${val}%`;
      }
    });

    // 1.15s: 100% Locked — Status turns to READY in electric cyan
    tl.add(() => {
      if (this.counterValEl) {
        this.counterValEl.textContent = '100%';
        this.counterValEl.classList.add('is-complete');
      }
      if (this.progressBarEl) {
        this.progressBarEl.style.width = '100%';
      }
      if (this.counterStatusEl) {
        this.counterStatusEl.textContent = 'READY';
        this.counterStatusEl.classList.add('is-ready');
      }
    });

    // 1.15s – 1.30s: Rocket engine anticipation (slight lift)
    if (this.rocketEl) {
      tl.to(this.rocketEl, {
        y: -10,
        duration: 0.15,
        ease: 'power1.out',
      });

      // 1.30s – 1.80s: Complete rocket unit launches straight upward with true acceleration
      if (this.trailEl) {
        tl.to(this.trailEl, {
          opacity: 0.95,
          duration: 0.15,
          ease: 'power2.in',
        }, '<');
      }

      // Loader block gracefully dissolves downward
      if (this.loaderBlock) {
        tl.to(this.loaderBlock, {
          opacity: 0,
          y: 8,
          duration: 0.28,
          ease: 'power2.out',
        }, '<');
      }

      // Rocket accelerates upward while remaining 100% visible
      tl.to(this.rocketEl, {
        y: -950,
        duration: 0.50,
        ease: 'power2.in',
      }, '<');

      // Rocket only fades out as it exits near the top
      tl.to(this.rocketEl, {
        opacity: 0,
        duration: 0.14,
        ease: 'power1.out',
      }, '-=0.14');

      // Trail dissipates cleanly
      if (this.trailEl) {
        tl.to(this.trailEl, {
          opacity: 0,
          duration: 0.20,
          ease: 'power2.out',
        }, '-=0.20');
      }
    }

    // 1.55s – 1.80s: Dot above the "i" illuminates with delicate electric cyan
    if (this.iDotEl) {
      tl.to(this.iDotEl, {
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out',
      }, '-=0.30');
    }

    // 1.80s – 2.15s: The Highverz wordmark gently scales and fades
    if (this.logoWrap) {
      tl.to(this.logoWrap, {
        scale: 0.98,
        opacity: 0,
        duration: 0.38,
        ease: 'power2.inOut',
      }, '+=0.06');
    }

    // 2.10s – 2.55s: Seamless fade of dark overlay into homepage hero
    if (this.container) {
      tl.to(this.container, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
      }, '-=0.08');
    }
  }

  arrive() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    devLog('complete');

    document.body.classList.remove('intro-active');
    
    if (this.container) {
      this.container.classList.add('hv-intro-exit');
    }

    setTimeout(() => {
      this.onComplete();
      this.destroy();
    }, 400);
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    window.__HIGHVERZ_INTRO_ACTIVE__ = false;
    activeIntroInstance = null;
    devLog('disposed');
  }
}

/**
 * Accessibility: prefers-reduced-motion
 * Shows logo for ~500ms, then gently fades into homepage with NO rocket animation.
 */
function playReducedMotionIntro(options = {}) {
  devLog('reduced-motion intro');
  window.__HIGHVERZ_INTRO_ACTIVE__ = true;
  document.body.classList.add('intro-active');

  let container = document.getElementById('highverz-intro');
  if (!container) {
    container = document.createElement('div');
    container.id = 'highverz-intro';
    container.className = 'hv-intro-container';
    container.innerHTML = `
      <div class="hv-intro-bg"></div>
      <div class="hv-logo-wrap">${layeredLogoSvgRaw}</div>
    `;
    document.body.prepend(container);
  }

  const wrap = container.querySelector('.hv-logo-wrap');
  gsap.to({}, {
    duration: 0.5,
    onComplete: () => {
      if (wrap) gsap.to(wrap, { opacity: 0, duration: 0.35, ease: 'power2.out' });
      gsap.to(container, {
        opacity: 0,
        duration: 0.4,
        delay: 0.1,
        ease: 'power2.out',
        onComplete: () => {
          document.body.classList.remove('intro-active');
          if (container.parentNode) container.parentNode.removeChild(container);
          window.__HIGHVERZ_INTRO_ACTIVE__ = false;
          if (options.onComplete) options.onComplete();
          devLog('reduced-motion complete');
        }
      });
    }
  });
}

/**
 * Main entrance function: initHighverzIntro
 * Initializes on every full page load, browser refresh, or forced replay.
 */
export function initHighverzIntro(options = {}) {
  // Concurrency guard
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
  const isForceIntro = urlParams.get('intro') === 'true' || options.force === true;

  // Intro is exclusively for the homepage entrance, not the work or case study pages
  const isWorkPage = window.location.pathname.includes('work') || !!document.querySelector('.work-hero-section');
  const isCaseStudyPage = window.location.pathname.includes('creator-') || !!document.querySelector('.ig-profile-shell');
  if ((isWorkPage || isCaseStudyPage) && !isForceIntro) {
    const existing = document.getElementById('highverz-intro');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.classList.remove('intro-active');
    if (options.onComplete) options.onComplete();
    return;
  }

  if (isExplicitlyDisabled) {
    const existing = document.getElementById('highverz-intro');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.classList.remove('intro-active');
    if (options.onComplete) options.onComplete();
    return;
  }

  // Accessibility: prefers-reduced-motion
  if (!isForceIntro && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    playReducedMotionIntro(options);
    return;
  }

  window.__HIGHVERZ_INTRO_ACTIVE__ = true;
  activeIntroInstance = new HighverzIntro(options);
  activeIntroInstance.init();
}

/**
 * Replay function for Shift + I and window.replayHighverzIntro()
 */
export function replayHighverzIntro() {
  devLog('replay');
  initHighverzIntro({ 
    force: true,
    onComplete: () => {
      if (window.lenis) window.lenis.start();
      if (typeof window.initHeroIntro === 'function') {
        window.initHeroIntro(false);
      }
    }
  });
}

// Dev console access
if (typeof window !== 'undefined') {
  window.replayHighverzIntro = replayHighverzIntro;
}
