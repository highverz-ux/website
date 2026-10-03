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
    this.interval = options.interval || 2500; // ms to pause on each word
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
        gsap.set(item, { y: 0, scale: 1, opacity: 1, filter: 'none', visibility: 'visible', clearProps: 'filter,transform' });
      } else {
        item.classList.remove('is-active', 'is-animating');
        gsap.set(item, { y: 8, scale: 0.98, opacity: 0, filter: 'blur(5px)', visibility: 'hidden' });
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

    // Prepare incoming item: softly blurred, gentle scale and micro-drift, ready to blend in
    gsap.set(nextItem, {
      y: 8,
      scale: 0.98,
      opacity: 0,
      filter: 'blur(5px) drop-shadow(0 0 14px rgba(24, 199, 216, 0.45))',
      visibility: 'visible'
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset currentItem cleanly for next cycle
        gsap.set(currentItem, {
          y: 8,
          scale: 0.98,
          opacity: 0,
          filter: 'blur(5px)',
          visibility: 'hidden'
        });
        currentItem.classList.remove('is-active', 'is-animating');
        nextItem.classList.remove('is-animating');
        nextItem.classList.add('is-active');

        // Clear inline filters on settled word for pristine 120fps hardware rendering
        gsap.set(nextItem, {
          y: 0,
          scale: 1,
          opacity: 1,
          filter: 'none',
          clearProps: 'filter,transform'
        });

        this.currentIndex = toIndex;
        this.isAnimating = false;
        if (!this.isPaused) {
          this.startCycle();
        }
      }
    });

    // 1. Current word softly lifts by only 8px, blooms with cyan glow, and dissolves away
    tl.to(currentItem, {
      y: -8,
      scale: 1.02,
      opacity: 0,
      filter: 'blur(5px) drop-shadow(0 0 14px rgba(24, 199, 216, 0.45))',
      duration: 0.72,
      ease: 'power2.inOut'
    }, 0);

    // 2. Next word emerges from the luminous blend and smoothly settles into crystal baseline
    tl.to(nextItem, {
      y: 0,
      scale: 1,
      opacity: 1,
      filter: 'blur(0px) drop-shadow(0 0 0px rgba(24, 199, 216, 0))',
      duration: 0.78,
      ease: 'power2.out'
    }, 0.08);
  }

  transitionReduced(fromIndex, toIndex) {
    this.isAnimating = true;
    const currentItem = this.items[fromIndex];
    const nextItem = this.items[toIndex];

    currentItem.classList.remove('is-active', 'is-animating');
    gsap.set(currentItem, { y: 0, scale: 1, opacity: 0, filter: 'none', visibility: 'hidden' });

    nextItem.classList.remove('is-animating');
    nextItem.classList.add('is-active');
    gsap.set(nextItem, { y: 0, scale: 1, opacity: 1, filter: 'none', visibility: 'visible', clearProps: 'filter,transform' });

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
      gsap.set(item, { y: 0, scale: 1, opacity: 1, filter: 'none', visibility: 'visible', clearProps: 'filter,transform' });
    } else {
      item.classList.remove('is-active', 'is-animating');
      gsap.set(item, { y: 8, scale: 0.98, opacity: 0, filter: 'blur(5px)', visibility: 'hidden' });
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
