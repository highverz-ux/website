/**
 * HIGHVERZ — HERO ROTATING KEYWORD ROLLER
 * Silky-smooth vertical slot-roll matching .btn-label (inline-grid + overflow:hidden)
 * Cycles through: Reach → Boost → Trend → Clicks → Reach
 */

import gsap from 'gsap';

export class HeroWordRoller {
  constructor(options = {}) {
    this.container = document.getElementById('hero-word-roller');
    this.words = ['Reach', 'Boost', 'Trend', 'Clicks'];
    this.currentIndex = 0;
    this.interval = options.interval || 2800; // ms to pause on each word
    this.timer = null;
    this.isAnimating = false;
    this.isPaused = false;
    this.items = [];
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  init() {
    if (!this.container) return;
    this.setupDOM();
    this.bindEvents();
    this.startCycle();
  }

  setupDOM() {
    this.items = Array.from(this.container.querySelectorAll('.roller-item'));
    if (!this.items.length) return;

    // Reset items to clean initial state
    this.items.forEach((item, index) => {
      if (index === 0) {
        item.classList.add('is-active');
        item.classList.remove('is-animating');
        gsap.set(item, { yPercent: 0, opacity: 1, visibility: 'visible', clearProps: 'filter,transform' });
      } else {
        item.classList.remove('is-active', 'is-animating');
        gsap.set(item, { yPercent: 105, opacity: 0, filter: 'none', visibility: 'hidden' });
      }
    });

    this.currentIndex = 0;
  }

  startCycle() {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.next();
    }, this.interval);
  }

  next() {
    if (this.isAnimating || this.isPaused || !this.items.length) return;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextIndex = (this.currentIndex + 1) % this.items.length;

    if (isReduced) {
      this.transitionReduced(this.currentIndex, nextIndex);
    } else {
      this.transition(this.currentIndex, nextIndex);
    }
  }

  transition(fromIndex, toIndex) {
    this.isAnimating = true;
    const currentItem = this.items[fromIndex];
    const nextItem = this.items[toIndex];
    if (!currentItem || !nextItem) {
      this.isAnimating = false;
      return;
    }

    // Mark elements as actively animating so CSS permits their visibility during blend
    currentItem.classList.add('is-animating');
    nextItem.classList.add('is-animating');

    // Prepare the next word below the clipped line, matching the button-label roll.
    gsap.set(nextItem, {
      yPercent: 105,
      opacity: 0,
      filter: 'none',
      visibility: 'visible'
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset currentItem cleanly for next cycle
        gsap.set(currentItem, {
          yPercent: 105,
          opacity: 0,
          filter: 'none',
          visibility: 'hidden'
        });
        currentItem.classList.remove('is-active', 'is-animating');
        nextItem.classList.remove('is-animating');
        nextItem.classList.add('is-active');

        // Keep the settled word pinned to the baseline to prevent a visible hop.
        gsap.set(nextItem, {
          yPercent: 0,
          opacity: 1,
          filter: 'none',
          clearProps: 'filter'
        });

        this.currentIndex = toIndex;
        this.isAnimating = false;
        if (!this.isPaused) {
          this.startCycle();
        }
      }
    });

    // Both words travel through the same clipped lane for a continuous roll.
    tl.to(currentItem, {
      yPercent: -105,
      opacity: 0,
      duration: 0.58,
      ease: 'power3.inOut'
    }, 0);

    // The next word follows immediately from below; no blur/scale snap is applied.
    tl.to(nextItem, {
      yPercent: 0,
      opacity: 1,
      duration: 0.58,
      ease: 'power3.inOut'
    }, 0);
  }

  transitionReduced(fromIndex, toIndex) {
    this.isAnimating = true;
    const currentItem = this.items[fromIndex];
    const nextItem = this.items[toIndex];

    currentItem.classList.remove('is-active', 'is-animating');
    gsap.set(currentItem, { yPercent: 105, opacity: 0, filter: 'none', visibility: 'hidden' });

    nextItem.classList.remove('is-animating');
    nextItem.classList.add('is-active');
    gsap.set(nextItem, { yPercent: 0, opacity: 1, filter: 'none', visibility: 'visible', clearProps: 'filter' });

    this.currentIndex = toIndex;
    this.isAnimating = false;
    this.startCycle();
  }

  handleMouseEnter() {
    this.isPaused = true;
    this.clearTimer();
  }

  handleMouseLeave() {
    this.isPaused = false;
    this.startCycle();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isPaused = true;
      this.clearTimer();
    } else {
      this.isPaused = false;
      this.startCycle();
    }
  }

  bindEvents() {
    if (this.container) {
      this.container.addEventListener('mouseenter', this.handleMouseEnter);
      this.container.addEventListener('mouseleave', this.handleMouseLeave);
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.clearTimer();
    if (this.container) {
      this.container.removeEventListener('mouseenter', this.handleMouseEnter);
      this.container.removeEventListener('mouseleave', this.handleMouseLeave);
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

let activeRollerInstance = null;

export function prepareHeroWordRoller() {
  const el = document.getElementById('hero-word-roller');
  if (!el) return;
  const items = Array.from(el.querySelectorAll('.roller-item'));
  items.forEach((item, index) => {
    if (index === 0) {
      item.classList.add('is-active');
      item.classList.remove('is-animating');
      gsap.set(item, { yPercent: 0, opacity: 1, filter: 'none', visibility: 'visible', clearProps: 'filter,transform' });
    } else {
      item.classList.remove('is-active', 'is-animating');
      gsap.set(item, { yPercent: 105, opacity: 0, filter: 'none', visibility: 'hidden' });
    }
  });
}

export function initHeroWordRoller() {
  if (activeRollerInstance) {
    activeRollerInstance.destroy();
    activeRollerInstance = null;
  }
  const el = document.getElementById('hero-word-roller');
  if (!el) return null;
  activeRollerInstance = new HeroWordRoller();
  activeRollerInstance.init();
  return activeRollerInstance;
}
