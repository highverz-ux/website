/**
 * HIGHVERZ — CINEMATIC LOADING INTRO (REACHIFY MOTION)
 * Recreating the exact loading animation behavior of Reachify:
 * 
 * Flow:
 *   1. Fullscreen obsidian curtain with subtle ambient radial glow.
 *   2. Logo Mark appears in the exact center (scale 0.85 -> 1.0, fade in).
 *   3. Short hold on centered mark.
 *   4. Wordmark ("Highverz") smoothly expands / reveals outward from behind the logo mark:
 *      - Mask width expands from 0 to full width.
 *      - Text slides out from the mark (x: -30px -> 0px, blur: 8px -> 0px, opacity: 0 -> 1).
 *      - Flex lockup maintains center alignment (mark translates slightly left as wordmark expands right).
 *   5. Short hold on the complete, balanced lockup.
 *   6. Curtain transitions away: The loader screen slides cleanly 100% off to the right
 *      (power4.inOut ease, exactly as in Reachify Dev Inspect Screenshot 2), revealing the site!
 */

import gsap from 'gsap';
import { segmentedLogoSvg } from './segmentedLogo.js';

function devLog(...args) {
  if (import.meta.env && import.meta.env.DEV) {
    console.log('[HIGHVERZ INTRO]', ...args);
  }
}

let activeIntroInstance = null;

const HV_MARK_SVG = `
<svg viewBox="0 0 893 436" fill="currentColor" class="hv-mark-icon" aria-hidden="true">
  <path d="M 0 13 L 0 20 L 3 28 L 101 186 L 101 188 L 242 417 L 252 429 L 266 435 L 441 435 L 445 433 L 450 427 L 450 418 L 337 231 L 337 217 L 343 211 L 350 209 L 407 210 L 422 215 L 440 229 L 458 255 L 558 425 L 566 431 L 576 434 L 713 434 L 722 431 L 733 422 L 745 404 L 745 402 L 777 353 L 777 351 L 892 167 L 892 159 L 889 153 L 885 149 L 878 147 L 663 147 L 658 148 L 650 156 L 649 162 L 652 172 L 737 304 L 737 311 L 706 357 L 695 376 L 692 379 L 689 379 L 685 375 L 647 311 L 602 240 L 598 231 L 579 202 L 562 172 L 551 159 L 537 150 L 526 147 L 302 147 L 295 144 L 287 136 L 218 22 L 207 10 L 193 2 L 185 0 L 17 0 L 7 4 Z"/>
</svg>
`;

export class HighverzIntro {
  constructor(options = {}) {
    this.onComplete = options.onComplete || (() => {});
    this.onStartReveal = options.onStartReveal || null;
    this.hasRevealed = false;
    
    this.container = null;
    this.curtainTop = null;
    this.curtainBottom = null;
    this.bgEl = null;
    this.ambientGlowEl = null;
    this.gridPatternEl = null;
    this.stageEl = null;
    this.lockupEl = null;
    this.markEl = null;
    this.wordmarkMaskEl = null;
    this.wordmarkEl = null;
    this.skipHintEl = null;
    
    this.isDestroyed = false;
    this.isCompleted = false;
    this.timeline = null;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleScreenClick = this.handleScreenClick.bind(this);
  }

  createDOM() {
    let container = document.getElementById('highverz-intro');

    const contentHTML = `
      <!-- Split-Shutter Curtains -->
      <div class="hv-curtain hv-curtain-top" id="hv-curtain-top"></div>
      <div class="hv-curtain hv-curtain-bottom" id="hv-curtain-bottom"></div>

      <!-- Atmosphere Glow & Grid Pattern -->
      <div class="hv-reachify-ambient-glow"></div>
      <div class="hv-reachify-grid-pattern"></div>

      <!-- Center Stage: Logo Lockup -->
      <div class="hv-reachify-stage" id="hv-reachify-stage">
        <div class="hv-reachify-lockup" id="hv-reachify-lockup">
          <!-- Logo Mark (Starts Centered) -->
          <div class="hv-reachify-mark" id="hv-reachify-mark" aria-label="Highverz Mark">
            <div class="hv-reachify-mark-squircle">
              ${HV_MARK_SVG}
            </div>
          </div>

          <!-- Wordmark Mask (Expands smoothly out from the mark) -->
          <div class="hv-reachify-wordmark-mask" id="hv-reachify-wordmark-mask">
            <div class="hv-reachify-wordmark" id="hv-reachify-wordmark">
              ${segmentedLogoSvg}
            </div>
          </div>
        </div>
      </div>

      <!-- Subtle Minimal Skip Hint -->
      <div class="hv-reachify-skip" id="hv-reachify-skip">
        <span>CLICK OR SPACE TO SKIP ↗</span>
      </div>
    `;

    if (!container) {
      container = document.createElement('div');
      container.id = 'highverz-intro';
      container.className = 'hv-reachify-container';
      container.setAttribute('aria-label', 'Highverz Loading Intro');
      container.innerHTML = contentHTML;
      document.body.prepend(container);
    } else {
      container.className = 'hv-reachify-container';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.transform = 'none';
      container.innerHTML = contentHTML;
    }

    this.container = container;
    this.curtainTop = container.querySelector('#hv-curtain-top');
    this.curtainBottom = container.querySelector('#hv-curtain-bottom');
    this.ambientGlowEl = container.querySelector('.hv-reachify-ambient-glow');
    this.gridPatternEl = container.querySelector('.hv-reachify-grid-pattern');
    this.stageEl = container.querySelector('#hv-reachify-stage');
    this.lockupEl = container.querySelector('#hv-reachify-lockup');
    this.markEl = container.querySelector('#hv-reachify-mark');
    this.wordmarkMaskEl = container.querySelector('#hv-reachify-wordmark-mask');
    this.wordmarkEl = container.querySelector('#hv-reachify-wordmark');
    this.skipHintEl = container.querySelector('#hv-reachify-skip');
  }

  init() {
    this.createDOM();
    document.body.classList.add('intro-active');
    document.documentElement.classList.add('intro-pending');

    window.addEventListener('keydown', this.handleKeydown);
    if (this.container) {
      this.container.addEventListener('click', this.handleScreenClick);
    }

    // Safety timeout in case of unexpected freeze
    this.safetyTimer = setTimeout(() => {
      if (!this.isCompleted) {
        devLog('safety fallback triggered');
        this.arrive();
      }
    }, 6500);

    requestAnimationFrame(() => {
      this.buildTimeline();
    });
  }

  handleKeydown(e) {
    if (e.code === 'Space' || e.key === ' ' || e.code === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      this.arrive();
    }
  }

  handleScreenClick() {
    this.arrive();
  }

  buildTimeline() {
    if (!this.container || !this.markEl || !this.wordmarkMaskEl || !this.wordmarkEl) return;

    // Reset initial states
    gsap.set(this.container, { xPercent: 0, opacity: 1, visibility: 'visible' });

    const rocketEl = this.container.querySelector('#highverz-rocket');
    const trailEl = this.container.querySelector('#highverz-rocket-trail');
    const dotEl = this.container.querySelector('#highverz-i-dot');
    const outerFlameEl = this.container.querySelector('#rocket-outer-flame');
    const innerFlameEl = this.container.querySelector('#rocket-inner-flame');
    const letterEls = this.container.querySelectorAll('.hv-letter');
    
    // Accurately measure the wordmark width: temporarily remove clip to get true dimensions
    gsap.set(this.wordmarkMaskEl, { clipPath: 'none', opacity: 1, overflow: 'visible' });
    const svgEl = this.wordmarkEl.querySelector('svg');
    const svgRect = svgEl ? svgEl.getBoundingClientRect() : null;
    const maskRect = this.wordmarkMaskEl.getBoundingClientRect();
    // Use SVG rect, mask rect, or viewBox aspect ratio as fallback
    const renderedH = svgRect ? svgRect.height : 84;
    const aspectWidth = Math.ceil(renderedH * (2415 / 900));
    const wordmarkWidth = Math.max(
      Math.ceil(svgRect ? svgRect.width : 0),
      Math.ceil(maskRect.width),
      aspectWidth,
      300
    );
    // Mark starts at center of screen when lockup is shifted right by wordmarkWidth / 2
    const startXOffset = Math.round(wordmarkWidth / 2);

    // Initial Curtain & backdrop states
    if (this.curtainTop) gsap.set(this.curtainTop, { yPercent: 0 });
    if (this.curtainBottom) gsap.set(this.curtainBottom, { yPercent: 0 });
    if (this.bgEl) gsap.set(this.bgEl, { opacity: 1 });
    if (this.ambientGlowEl) gsap.set(this.ambientGlowEl, { opacity: 1 });

    // 1. Initial GPU-accelerated setup:
    // Mark starts centered because lockup has x: startXOffset
    gsap.set(this.lockupEl, { x: startXOffset, opacity: 1 });
    // Wordmark mask is completely clipped horizontally (no layout reflow)
    gsap.set(this.wordmarkMaskEl, { 
      clipPath: 'inset(0% 100% 0% 0%)',
      opacity: 1,
      overflow: 'hidden'
    });
    // Wordmark begins offset and with atmospheric blur for cinematic reveal
    gsap.set(this.wordmarkEl, { x: -24, opacity: 0, filter: 'blur(16px)' });
    
    // 2. Mark starts slightly scaled down and hidden
    gsap.set(this.markEl, { opacity: 0, scale: 0.84, transformOrigin: 'center center' });
    gsap.set(this.skipHintEl, { opacity: 0, y: 8 });

    // 3. Reset rocket states
    if (dotEl) gsap.set(dotEl, { opacity: 0, scale: 0, transformOrigin: '489px 358px' });
    if (trailEl) gsap.set(trailEl, { opacity: 0 });
    if (rocketEl) gsap.set(rocketEl, { y: 0 });
    if (letterEls.length) gsap.set(letterEls, { opacity: 1, y: 0 });

    const tl = gsap.timeline({
      paused: false,
      onComplete: () => {
        this.destroy();
      }
    });
    this.timeline = tl;

    // ======================================================================
    // REACHIFY MOTION + INTEGRATED ROCKET LAUNCH CHOREOGRAPHY:
    // Stage 1: Mark appears centered (0.0s -> 0.7s)
    // Stage 2: Deliberate center hold on emblem (0.7s -> 1.55s - 850ms)
    // Stage 3: Reachify wordmark unrolls with ethereal blur-to-sharp reveal (1.55s -> 2.95s - 1.4s)
    // Stage 4: Full lockup settled hold (2.95s -> 3.6s - 650ms)
    // Stage 5: Rocket ignition & blast-off sequence into space (3.6s -> 4.95s)
    // Stage 6: Cyan dot settles luminous (4.95s -> 5.5s)
    // Stage 7: Split-Shutter Curtains open from the middle (5.5s -> 6.2s)
    // ======================================================================

    // STAGE 1: Centered Mark Entrance (0.0s -> 0.7s)
    tl.to(this.markEl, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power2.out'
    });

    // Subtle skip hint fades in discreetly
    tl.to(this.skipHintEl, {
      opacity: 0.5,
      y: 0,
      duration: 0.45,
      ease: 'power2.out'
    }, '-=0.35');

    // STAGE 2: Generous Center Hold on the Emblem (0.7s -> 1.55s - 850ms)
    // Allows user to clearly see and appreciate the centered Highverz logo
    tl.to({}, { duration: 0.85 });

    // STAGE 3: Reachify Wordmark Blur-Based Reveal / Expansion (1.55s -> 2.95s - 1.4s)
    // GPU-accelerated: lockup glides left while mask unrolls right and text de-blurs to razor sharpness
    tl.to(this.lockupEl, {
      x: 0,
      duration: 1.35,
      ease: 'power2.inOut'
    });

    tl.to(this.wordmarkMaskEl, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.35,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(this.wordmarkMaskEl, { clipPath: 'none', overflow: 'visible' });
      }
    }, '<');

    tl.to(this.wordmarkEl, {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 1.35,
      ease: 'power2.out',
      onComplete: () => {
        if (this.wordmarkEl) {
          gsap.set(this.wordmarkEl, { filter: 'none' });
          this.wordmarkEl.style.filter = 'none';
          this.wordmarkEl.style.webkitFilter = 'none';
        }
      }
    }, '<');

    // STAGE 4: Settled Lockup Hold (450ms)
    // Full lockup sits balanced in center of screen
    tl.to({}, { duration: 0.45 });

    // Remove vertical clipping before rocket launch so it can fly into the sky
    tl.set(this.wordmarkMaskEl, { clipPath: 'none', overflow: 'visible' });

    // STAGE 5: Rocket Launch & Synchronous Mid-Flight Middle-Split Opening
    // 1. Ignition & engine anticipation rumble
    if (rocketEl) {
      tl.to(rocketEl, {
        y: 4,
        duration: 0.06,
        yoyo: true,
        repeat: 2,
        ease: 'sine.inOut'
      });
    }

    if (outerFlameEl) {
      tl.to(outerFlameEl, {
        fill: '#ffffff',
        filter: 'drop-shadow(0 0 14px #00f0ff)',
        duration: 0.15
      }, '<');
    }

    if (innerFlameEl) {
      tl.to(innerFlameEl, {
        fill: '#00f0ff',
        scale: 1.35,
        transformOrigin: '50% 0%',
        duration: 0.15
      }, '<');
    }

    if (trailEl) {
      tl.fromTo(trailEl, {
        opacity: 0,
        scaleY: 0.2,
        transformOrigin: '489px 350px'
      }, {
        opacity: 1,
        scaleY: 1.4,
        stroke: '#00f0ff',
        duration: 0.15
      }, '<');
    }

    // 2. Blast Off! Accelerate directly upward into space (full ascent)
    if (rocketEl) {
      tl.to(rocketEl, {
        y: -7500,
        duration: 0.75,
        ease: 'power2.in'
      });
    }

    if (trailEl) {
      tl.to(trailEl, {
        y: -3500,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      }, '-=0.6');
    }

    // 3. Dot of "i" illuminates with crisp cyan snap right as rocket leaves
    if (dotEl) {
      tl.fromTo(dotEl, {
        opacity: 0,
        scale: 0.1,
        transformOrigin: '489px 358px'
      }, {
        opacity: 1,
        scale: 1,
        fill: '#00f0ff',
        filter: 'drop-shadow(0 0 14px #00f0ff)',
        duration: 0.25,
        ease: 'back.out(2.4)'
      }, '-=0.55');
    }

    // IN BETWEEN: Right as rocket shoots upward, split the screen!
    // Top curtain pulls UP with the rocket, bottom curtain pulls DOWN!
    // Zero waiting for rocket to reach the top, no getting stuck!
    tl.to(this.skipHintEl, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.out'
    }, '-=0.6');

    // Stage lockup gracefully dissolves as curtains open
    tl.to(this.stageEl, {
      opacity: 0,
      scale: 1.02,
      duration: 0.35,
      ease: 'power2.in'
    }, '<');

    if (this.ambientGlowEl) {
      tl.to(this.ambientGlowEl, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      }, '<');
    }

    if (this.gridPatternEl) {
      tl.to(this.gridPatternEl, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      }, '<');
    }

    // Middle-split shutter curtains part simultaneously mid-flight!
    const curtainEase = 'power4.inOut';
    if (this.curtainTop && this.curtainBottom) {
      tl.to(this.curtainTop, {
        yPercent: -101,
        duration: 0.65,
        ease: curtainEase,
        onStart: () => {
          document.documentElement.classList.remove('intro-pending');
          document.body.classList.remove('intro-active');
          this.triggerReveal();
        }
      }, '<');

      tl.to(this.curtainBottom, {
        yPercent: 101,
        duration: 0.65,
        ease: curtainEase,
      }, '<');
    } else {
      tl.to(this.container, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        onStart: () => {
          document.documentElement.classList.remove('intro-pending');
          document.body.classList.remove('intro-active');
          this.triggerReveal();
        }
      }, '<');
    }
  }

  triggerReveal() {
    if (this.hasRevealed) return;
    this.hasRevealed = true;
    if (typeof this.onStartReveal === 'function') {
      this.onStartReveal();
    } else if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }

  arrive() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    devLog('complete via skip or arrive');

    if (this.timeline) {
      this.timeline.pause();
    }

    // Fast split-shutter exit on skip
    const skipTl = gsap.timeline({
      onComplete: () => {
        this.destroy();
      }
    });

    skipTl.to([this.stageEl, this.skipHintEl], {
      opacity: 0,
      scale: 1.03,
      duration: 0.2,
      ease: 'power2.in'
    });

    if (this.curtainTop && this.curtainBottom) {
      skipTl.to(this.curtainTop, {
        yPercent: -101,
        duration: 0.48,
        ease: 'power4.inOut',
        onStart: () => {
          document.documentElement.classList.remove('intro-pending');
          document.body.classList.remove('intro-active');
          this.triggerReveal();
        }
      }, '-=0.1');

      skipTl.to(this.curtainBottom, {
        yPercent: 101,
        duration: 0.48,
        ease: 'power4.inOut',
      }, '<');
    } else {
      skipTl.to(this.container, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onStart: () => {
          document.documentElement.classList.remove('intro-pending');
          document.body.classList.remove('intro-active');
          this.triggerReveal();
        }
      }, '-=0.1');
    }

    if (typeof this.onComplete === 'function' && this.onComplete !== this.onStartReveal) {
      this.onComplete();
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Unconditionally ensure document classes are cleaned up and reveal is triggered
    document.documentElement.classList.remove('intro-pending');
    document.body.classList.remove('intro-active');
    this.triggerReveal();

    window.removeEventListener('keydown', this.handleKeydown);

    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    if (this.container) {
      this.container.removeEventListener('click', this.handleScreenClick);
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }

    window.__HIGHVERZ_INTRO_ACTIVE__ = false;
    activeIntroInstance = null;
    devLog('disposed');
  }
}

/**
 * Accessibility: prefers-reduced-motion
 */
function playReducedMotionIntro(options = {}) {
  devLog('reduced-motion intro');
  window.__HIGHVERZ_INTRO_ACTIVE__ = true;
  document.body.classList.add('intro-active');

  let container = document.getElementById('highverz-intro');
  if (!container) {
    container = document.createElement('div');
    container.id = 'highverz-intro';
    container.className = 'hv-reachify-container';
    container.innerHTML = `
      <div class="hv-reachify-bg"></div>
      <div class="hv-reachify-stage">
        <div class="hv-reachify-lockup">
          <div class="hv-reachify-mark">
            <div class="hv-reachify-mark-squircle">${HV_MARK_SVG}</div>
          </div>
          <div class="hv-reachify-wordmark-mask" style="width: auto; opacity: 1;">
            <div class="hv-reachify-wordmark" style="transform: none; opacity: 1; filter: none;">
              ${segmentedLogoSvg}
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.prepend(container);
  }

  gsap.to(container, {
    opacity: 0,
    duration: 0.45,
    delay: 0.6,
    ease: 'power2.out',
    onComplete: () => {
      document.documentElement.classList.remove('intro-pending');
      document.body.classList.remove('intro-active');
      if (container.parentNode) container.parentNode.removeChild(container);
      window.__HIGHVERZ_INTRO_ACTIVE__ = false;
      if (typeof options.onStartReveal === 'function') {
        options.onStartReveal();
      } else if (typeof options.onComplete === 'function') {
        options.onComplete();
      }
    }
  });
}

/**
 * Main entrance function: initHighverzIntro
 */
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
  const isForceIntro = urlParams.get('intro') === 'true' || options.force === true;

  const isWorkPage = window.location.pathname.includes('work') || !!document.querySelector('.work-hero-section');
  const isCaseStudyPage = window.location.pathname.includes('creator-') || !!document.querySelector('.ig-profile-shell');
  if ((isWorkPage || isCaseStudyPage) && !isForceIntro) {
    const existing = document.getElementById('highverz-intro');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.classList.remove('intro-active');
    if (options.onComplete) options.onComplete();
    return;
  }

  if (isExplicitlyDisabled || (window.__HV_SKIP_INTRO__ && !isForceIntro)) {
    const existing = document.getElementById('highverz-intro');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.classList.remove('intro-active');
    if (options.onComplete) options.onComplete();
    return;
  }

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
