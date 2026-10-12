/**
 * HIGHVERZ — Cinematic Page Transition Engine
 * 
 * Optical Defocus-and-Refocus Page Transitions
 * Lifecycle: IDLE → NAVIGATING → OUTGOING_BLUR → INCOMING_REFOCUS → HERO_WORD_REVEAL → IDLE
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Transition Lifecycle States
 */
export const TransitionState = {
  IDLE: 'IDLE',
  NAVIGATING: 'NAVIGATING',
  OUTGOING_BLUR: 'OUTGOING_BLUR',
  INCOMING_REFOCUS: 'INCOMING_REFOCUS',
  HERO_WORD_REVEAL: 'HERO_WORD_REVEAL',
  // Aliases for compatibility
  BLURRING: 'OUTGOING_BLUR',
  SHARP: 'INCOMING_REFOCUS',
};

let currentTransitionState = TransitionState.IDLE;

export function getTransitionState() {
  return currentTransitionState;
}

export function setTransitionState(state) {
  currentTransitionState = state;
  window.__hvTransitionState = state;
  window.dispatchEvent(new CustomEvent('hv:transition-state', { detail: { state } }));
}
window.__hvSetTransitionState = setTransitionState;
window.__hvGetTransitionState = getTransitionState;

/**
 * Normalizes a URL or path string to a canonical route identifier (e.g. '/why-us', '/').
 */
export function normalizeRoute(pathOrUrl) {
  if (!pathOrUrl) return '/';
  try {
    const url = typeof pathOrUrl === 'string'
      ? new URL(pathOrUrl, window.location.origin)
      : pathOrUrl;
    let p = (url.pathname || '/').split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
    p = p.replace(/\.html$/, '');
    if (p === '' || p === '/index') return '/';
    return p;
  } catch (e) {
    return '/';
  }
}

/**
 * Checks if two routes point to the same destination.
 */
export function isSameRoute(routeA, routeB) {
  return normalizeRoute(routeA) === normalizeRoute(routeB);
}

/**
 * Checks if a given path or URL represents the Home route.
 */
export function isHomeRoute(pathOrUrl) {
  if (!pathOrUrl) return false;
  return normalizeRoute(pathOrUrl) === '/';
}

/**
 * Validates whether transition animation should run between two routes.
 */
export function canTransition(currentPath, targetUrl) {
  // Exclude external origins
  if (targetUrl.origin !== window.location.origin) {
    return false;
  }
  // Exclude downloads and static non-html assets
  if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|mov|webm|pdf|xlsx|zip|json|xml|txt)$/i.test(targetUrl.pathname)) {
    return false;
  }
  // Exclude same page anchor or same route navigation
  if (isSameRoute(currentPath, targetUrl)) {
    return false;
  }
  return true;
}

/**
 * HTML Cache with TTL (3 minutes) to guarantee instantaneous transitions
 */
const HTML_CACHE_TTL = 3 * 60 * 1000;
const htmlCache = new Map();

/**
 * Start incoming metric counters underneath the route blur handoff.
 * Presets counter values to 0 without running premature animations so they don't flash before the hero sequence.
 */
function startIncomingMetricCounters(content) {
  const incomingHomeStats = content.querySelector('#stats-counter');
  if (incomingHomeStats) {
    incomingHomeStats.textContent = '4,500,000,000+';
    incomingHomeStats.dataset.transitionHydrated = 'true';
  }

  const incomingCreators = content.querySelector('.section-creators');
  if (incomingCreators) {
    incomingCreators.dataset.transitionHydrated = 'true';
  }

  // Pre-set metric counters in incoming content to 0 so they never flash target values before animating
  content.querySelectorAll('.work-metric-val').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-metric-target'));
    const prefix = el.getAttribute('data-metric-prefix') || '';
    const suffix = el.getAttribute('data-metric-suffix') || '';
    if (!isNaN(target)) {
      const isFloat = target % 1 !== 0;
      el.textContent = `${prefix}${isFloat ? (0).toFixed(1) : 0}${suffix}`;
    }
  });

  content.querySelectorAll('.team-metric-val').forEach((el) => {
    const format = el.getAttribute('data-metric-format');
    if (format === 'billion') el.textContent = '0.0B+';
    else if (format === 'days') el.textContent = '0 Days';
    else if (format === 'percent') el.textContent = '0.0%';
    else if (format === 'top') el.textContent = 'Top 15%';
  });
}

/**
 * Dynamic count-up animations for incoming metrics triggered in sync with hero entrance.
 */
function animateIncomingMetrics(content) {
  content.querySelectorAll('.work-metric-val').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-metric-target'));
    const prefix = el.getAttribute('data-metric-prefix') || '';
    const suffix = el.getAttribute('data-metric-suffix') || '';
    if (isNaN(target)) return;
    const isFloat = target % 1 !== 0;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        const displayVal = isFloat ? obj.val.toFixed(1) : Math.round(obj.val);
        el.textContent = `${prefix}${displayVal}${suffix}`;
      },
      onComplete: () => {
        const finalVal = isFloat ? target.toFixed(1) : target;
        el.textContent = `${prefix}${finalVal}${suffix}`;
      }
    });
  });

  content.querySelectorAll('.team-metric-val').forEach((el) => {
    const format = el.getAttribute('data-metric-format');
    if (format === 'billion') {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 4.5,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = `${obj.val.toFixed(1)}B+`; },
        onComplete: () => { el.textContent = '4.5B+'; }
      });
    } else if (format === 'days') {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 14,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = `${Math.round(obj.val)} Days`; },
        onComplete: () => { el.textContent = '14 Days'; }
      });
    } else if (format === 'percent') {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 99.4,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = `${obj.val.toFixed(1)}%`; },
        onComplete: () => { el.textContent = '99.4%'; }
      });
    }
  });
}


/**
 * Prefetches target HTML with TTL caching
 */
export async function prefetchPage(urlStr) {
  const normUrl = urlStr.split('#')[0];
  const now = Date.now();
  if (htmlCache.has(normUrl)) {
    const entry = htmlCache.get(normUrl);
    if (now - entry.timestamp < HTML_CACHE_TTL) {
      return entry.text;
    }
    htmlCache.delete(normUrl);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(normUrl, { signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    htmlCache.set(normUrl, { text, timestamp: Date.now() });
    return text;
  } catch (e) {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

let activeFetchController = null;
let transitionSafetyTimer = null;
let activeTransitionTimeline = null;

/**
 * Core Page Transition Choreographer
 * Lifecycle: IDLE → NAVIGATING → OUTGOING_BLUR → INCOMING_REFOCUS → HERO_WORD_REVEAL → IDLE
 */
export async function navigateWithTransition(targetHref, isPopState = false) {
  // Reject re-entrant clicks during the active visual blur swap (450ms) to protect DOM stability
  if (currentTransitionState === TransitionState.OUTGOING_BLUR || currentTransitionState === TransitionState.INCOMING_REFOCUS) {
    return;
  }

  const currentPath = window.location.pathname;
  let targetUrl;
  try {
    targetUrl = new URL(targetHref, window.location.origin);
  } catch (e) {
    window.location.href = targetHref;
    return;
  }

  // Route eligibility check
  if (!canTransition(currentPath, targetUrl)) {
    if (!isPopState) {
      window.location.href = targetHref;
    } else {
      window.location.reload();
    }
    return;
  }

  // If a previous fetch was in progress, abort it and switch to the new target
  if (currentTransitionState === TransitionState.NAVIGATING && activeFetchController) {
    activeFetchController.abort();
    activeFetchController = null;
  }

  // If in HERO_WORD_REVEAL, kill running hero animations immediately to start new route transition
  if (currentTransitionState === TransitionState.HERO_WORD_REVEAL) {
    gsap.killTweensOf('.adscale-reveal-word, .hl-word, .hero-headline-connector, .hero-word-roller, .work-hero-tag, .team-hero-tag, .why-hero-subtitle');
  }

  setTransitionState(TransitionState.NAVIGATING);

  // Safety fallback timer to prevent permanently stuck states
  if (transitionSafetyTimer) window.clearTimeout(transitionSafetyTimer);
  transitionSafetyTimer = window.setTimeout(() => {
    if (currentTransitionState !== TransitionState.IDLE) {
      console.warn('Page transition safety timeout reached; resetting to IDLE.');
      setTransitionState(TransitionState.IDLE);
      document.body.classList.remove('page-is-transitioning');
      document.documentElement.classList.remove('page-transitioned', 'page-entering');
      const orphanLayer = document.getElementById('page-transition-layer');
      if (orphanLayer) orphanLayer.remove();
      const orphanBackdrop = document.getElementById('page-transition-backdrop');
      if (orphanBackdrop) orphanBackdrop.remove();
      const orphanShell = document.getElementById('page-transition-shell');
      if (orphanShell) orphanShell.remove();
      const curr = document.getElementById('page-content') || document.querySelector('main.page-content');
      if (curr) {
        curr.classList.remove('page-outgoing-frozen');
        curr.style.removeProperty('top');
        gsap.set(curr, { clearProps: 'all' });
      }
      const nav = document.getElementById('navbar') || document.querySelector('.navbar');
      if (nav) {
        gsap.set(nav, { clearProps: 'all' });
      }
    }
  }, 3200);

  const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. UPDATE NAVBAR TAB IMMEDIATELY ON CLICK (0ms tactile feedback)
  window.__hvUpdateNavbar?.(targetUrl.pathname);

  // 2. ENGAGE OPTICAL BLUR TRANSITION IMMEDIATELY ON CLICK (0ms transition start!)
  const currentContent = document.getElementById('page-content') || document.querySelector('main.page-content');
  const navbar = document.getElementById('navbar') || document.querySelector('.navbar');

  if (!prefersReducedMotion) {
    // Optical defocus of the navbar in sync with full-page defocus
    if (navbar) {
      gsap.killTweensOf(navbar);
      gsap.to(navbar, {
        filter: isMobile ? 'blur(10px)' : 'blur(14px)',
        opacity: isMobile ? 0.55 : 0.45,
        scale: isMobile ? 0.99 : 0.985,
        duration: isMobile ? 0.14 : 0.18,
        ease: 'power2.inOut',
      });
    }

    if (currentContent) {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      if (!currentContent.classList.contains('page-outgoing-frozen')) {
        currentContent.classList.add('page-outgoing-frozen');
        currentContent.style.top = `-${currentScrollY}px`;
      }
      if (window.lenis) {
        window.lenis.stop();
      }

      const transitionScrollbarWidth = Math.max(
        0,
        window.innerWidth - document.documentElement.clientWidth
      );
      document.body.style.setProperty(
        '--transition-scrollbar-width',
        `${transitionScrollbarWidth}px`
      );
      document.body.classList.add('page-is-transitioning');

      // Optical defocus of the active page directly on DOM content
      gsap.killTweensOf(currentContent);
      gsap.to(currentContent, {
        filter: isMobile ? 'blur(14px)' : 'blur(18px)',
        opacity: 0.1,
        scale: isMobile ? 0.992 : 0.988,
        duration: isMobile ? 0.16 : 0.20,
        ease: 'power2.inOut',
      });

      setTransitionState(TransitionState.OUTGOING_BLUR);
    }
  }

  try {
    // 3. Retrieve target document HTML (from memory cache or network)
    const normUrl = targetUrl.href.split('#')[0];
    let htmlText = null;
    if (htmlCache.has(normUrl)) {
      const entry = htmlCache.get(normUrl);
      if (Date.now() - entry.timestamp < HTML_CACHE_TTL) {
        htmlText = entry.text;
      } else {
        htmlCache.delete(normUrl);
      }
    }

    if (!htmlText) {
      activeFetchController = new AbortController();
      const res = await fetch(normUrl, { signal: activeFetchController.signal });
      if (!res.ok) {
        window.location.href = targetHref;
        setTransitionState(TransitionState.IDLE);
        return;
      }
      htmlText = await res.text();
      htmlCache.set(normUrl, { text: htmlText, timestamp: Date.now() });
    }
    activeFetchController = null;

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(htmlText, 'text/html');

    const incomingContent = newDoc.getElementById('page-content') || newDoc.querySelector('main.page-content');

    if (!currentContent || !incomingContent) {
      window.location.href = targetHref;
      setTransitionState(TransitionState.IDLE);
      return;
    }

    const targetTitle = newDoc.title;
    const targetBodyClass = newDoc.body.className;

    if (prefersReducedMotion) {
      if (window.__hvDisposePageRuntime) window.__hvDisposePageRuntime();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      currentContent.replaceWith(incomingContent);
      if (targetBodyClass) document.body.className = targetBodyClass;
      window.scrollTo(0, 0);
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
        window.lenis.start();
        window.lenis.resize();
      }
      if (!isPopState) {
        window.history.pushState({ path: targetHref }, '', targetHref);
      }
      if (targetTitle) document.title = targetTitle;
      window.__hvUpdateNavbar?.(window.location.pathname);
      window.__hvResetNavbar?.(window.location.pathname);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      window.__hvInitPageScripts?.(window.location.pathname, true);
      setTransitionState(TransitionState.IDLE);
      window.clearTimeout(transitionSafetyTimer);
      return;
    }

    // Pre-tokenize incoming headings and set up kinetic reveal states
    try {
      const heroHeadings = incomingContent.querySelectorAll(
        '.work-hero-title, .campaign-hero-headline, .why-hero-title, .team-hero-title, .case-hero-title'
      );
      heroHeadings.forEach((heading) => {
        if (window.splitAdscaleWords) window.splitAdscaleWords(heading);
        heading.dataset.adscaleAnimated = 'true';
      });
    } catch (_) {}

    // 1. Collect incoming headline words (subpages + home)
    const headlineWords = Array.from(
      incomingContent.querySelectorAll(
        '.adscale-reveal-word, #hero-headline .hl-word, #hero-headline .hero-headline-connector, #hero-headline .hero-word-roller'
      )
    );

    // 2. Collect incoming hero supporting lines
    const heroLineSelectors = [
      '.work-hero-tag', '.work-hero-desc', '.work-hero-cta', '.work-hero-metrics-grid', '.work-metric-item',
      '.campaign-hero-tag', '.campaign-hero-sub', '.campaign-hero-pillars',
      '.team-hero-tag', '.team-hero-desc', '.team-metrics-grid', '.team-metric-item',
      '.why-hero-subtitle',
      '.hero-trust-badge-wrap', '#hero-desc', '#hero-actions',
      '.case-kicker-tag', '.case-profile-chip-row', '.case-hero-desc'
    ].join(', ');
    const heroLineElements = Array.from(incomingContent.querySelectorAll(heroLineSelectors));

    // 3. Collect incoming next section header and individual cards
    const nextSectionSelectors = [
      // Work page: capabilities header & 6 cards
      '.work-capabilities-header', '.capability-card',
      // Why-us page: philosophy section header & 3 cards + comparison cards
      '.why-philosophy-section .services-header-row', '.why-philosophy-grid .service-card-item',
      '.comp-header-centered', '.comp-card',
      // Campaigns page: search bar and cards
      '.campaign-search-section', '.campaign-featured-label', '.campaign-movie-card',
      // Team page: leadership and member cards
      '.team-grid .founder-card', '.team-member-card',
      // Home page: creators carousel
      '.section-creators',
      // Case study: media & hud
      '.case-hero-media', '.case-follower-transform-card', '.case-stats-hud'
    ].join(', ');
    const nextSectionElements = Array.from(incomingContent.querySelectorAll(nextSectionSelectors));

    // CRITICAL: NEVER BLUR THE HEADLINE WORDS OR TEXT! Filter is explicitly 'none'
    if (headlineWords.length) {
      gsap.set(headlineWords, {
        opacity: 0,
        y: isMobile ? 18 : 26,
        scale: isMobile ? 0.98 : 0.95,
        filter: 'none',
        transformOrigin: '50% 100%',
        willChange: 'opacity, transform',
      });
    }

    if (heroLineElements.length) {
      gsap.set(heroLineElements, {
        opacity: 0,
        y: isMobile ? 14 : 18,
        filter: 'none',
        willChange: 'opacity, transform',
      });
    }

    if (nextSectionElements.length) {
      gsap.set(nextSectionElements, {
        opacity: 0,
        y: isMobile ? 20 : 26,
        filter: 'none',
        willChange: 'opacity, transform',
      });
    }

    // Flag incoming heroRoot so destination scripts know entrance was initiated by transition
    const heroRoot = incomingContent.querySelector(
      '.hero-section, .work-hero-section, .team-hero-section, .why-hero-section, .campaign-hero, .case-hero-section'
    );
    if (heroRoot) {
      heroRoot.dataset.pageEntryStarted = 'true';
    }

    // Mount incoming content inside transparent transition shell
    let shell = document.getElementById('page-transition-shell');
    if (shell) shell.remove();
    shell = document.createElement('div');
    shell.className = `page-transition-shell ${targetBodyClass || ''}`.trim();
    shell.id = 'page-transition-shell';
    shell.style.zIndex = '20';

    incomingContent.style.position = 'relative';
    incomingContent.style.width = '100%';
    incomingContent.style.minHeight = '100vh';
    incomingContent.style.pointerEvents = 'none';
    shell.appendChild(incomingContent);

    // Initial state: incoming shell starts blurred and transparent, ready for smooth optical refocus
    gsap.set(shell, {
      filter: isMobile ? 'blur(14px)' : 'blur(18px)',
      opacity: 0,
      scale: isMobile ? 1.008 : 1.015,
      y: isMobile ? 4 : 8,
      willChange: 'filter, opacity, transform',
    });

    // Hold current page background underneath both fades to prevent ambient layer flashing
    let backdrop = document.getElementById('page-transition-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'page-transition-backdrop';
      backdrop.id = 'page-transition-backdrop';
      backdrop.style.backgroundColor = getComputedStyle(document.body).backgroundColor || '#050809';
      backdrop.style.zIndex = '5'; // Placed BEHIND currentContent (10) and shell (20)
      document.body.appendChild(backdrop);
    }

    document.body.appendChild(shell);

    // Dispose old page runtime & ScrollTriggers
    if (window.__hvDisposePageRuntime) {
      window.__hvDisposePageRuntime();
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());

    // Hydrate incoming counters to 0 placeholder
    startIncomingMetricCounters(incomingContent);

    let shellPromoted = false;
    const promoteIncomingPage = () => {
      if (shellPromoted) return;
      shellPromoted = true;

      try {
        const activeBackdrop = document.getElementById('page-transition-backdrop');
        if (activeBackdrop) activeBackdrop.remove();

        // Remove old frozen content from DOM once optical refocus is complete
        if (currentContent && currentContent.parentNode) {
          currentContent.remove();
        }

        // Clear all inline styles and promote incomingContent into the live document
        gsap.set(shell, { clearProps: 'all' });
        incomingContent.removeAttribute('style');
        shell.insertAdjacentElement('beforebegin', incomingContent);
        shell.remove();

        gsap.set(incomingContent, { clearProps: 'all' });

        if (targetBodyClass) document.body.className = targetBodyClass;
        document.body.classList.remove('page-is-transitioning');
        document.body.style.removeProperty('--transition-scrollbar-width');
        document.documentElement.classList.remove('page-transitioned', 'page-entering');
        window.__hvEnsureCursorActive?.();

        // Reset scroll position to top
        window.scrollTo(0, 0);
        if (window.lenis) {
          window.lenis.scrollTo(0, { immediate: true });
          window.lenis.start();
          window.lenis.resize();
        }

        // Update URL and document title
        if (!isPopState) {
          window.history.pushState({ path: targetHref }, '', targetHref);
        }
        if (targetTitle) {
          document.title = targetTitle;
        }

        if (navbar) {
          navbar.classList.remove('nav-hidden');
          gsap.set(navbar, { clearProps: 'all' });
        }

        window.__hvUpdateNavbar?.(window.location.pathname);
        window.__hvResetNavbar?.(window.location.pathname);

        // Run destination page scripts (safely respecting in-flight entrance animations)
        window.__hvInitPageScripts?.(window.location.pathname, true);
      } catch (err) {
        console.error('Incoming page promotion failed:', err);
        setTransitionState(TransitionState.IDLE);
        window.clearTimeout(transitionSafetyTimer);
      }
    };

    activeTransitionTimeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
    });

    if (isMobile) {
      // =========================================================================
      // SNAPPY OPTICAL BLUR RE-FOCUS (MOBILE — 60FPS COMPOSITOR PERFORMANCE)
      // =========================================================================

      // 1. Incoming page refocused smoothly from blur(14px) to crystal clear blur(0px)
      activeTransitionTimeline.to(shell, {
        filter: 'blur(0px)',
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.18,
        ease: 'power2.out',
        clearProps: 'filter,transform,willChange',
      }, 0.08);

      // 2. Navbar smoothly refocused in sync with incoming page
      if (navbar) {
        activeTransitionTimeline.to(navbar, {
          filter: 'blur(0px)',
          opacity: 1,
          scale: 1,
          duration: 0.16,
          ease: 'power2.out',
          clearProps: 'all',
        }, 0.10);
      }

      // Outgoing page finishes fade
      if (currentContent) {
        activeTransitionTimeline.to(currentContent, {
          opacity: 0,
          filter: 'blur(16px)',
          y: -4,
          duration: 0.14,
          ease: 'power2.in',
        }, 0);
      }

      // Advance state to INCOMING_REFOCUS
      activeTransitionTimeline.call(() => {
        setTransitionState(TransitionState.INCOMING_REFOCUS);
      }, null, 0.20);

      // Promote destination into live document promptly at 0.26s
      activeTransitionTimeline.call(promoteIncomingPage, null, 0.26);

      // 4. AND THEN THE TEXT REVEALS ONE BY ONE (Word-by-Word Kinetic Reveal)
      if (headlineWords.length) {
        activeTransitionTimeline.call(() => {
          setTransitionState(TransitionState.HERO_WORD_REVEAL);
        }, null, 0.28);

        activeTransitionTimeline.to(headlineWords, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'none',
          duration: 0.40,
          stagger: 0.05,
          ease: 'power3.out',
          clearProps: 'all',
          onComplete: () => {
            if (incomingContent.querySelector('#hero-headline') && window.initHeroWordRoller) {
              window.initHeroWordRoller();
            }
          },
        }, 0.28);
      }

      // 5. AND THEN THE COMPONENTS REVEAL (Hero Lines, Subtitles, Tags, Metrics)
      if (heroLineElements.length) {
        activeTransitionTimeline.to(heroLineElements, {
          opacity: 1,
          y: 0,
          filter: 'none',
          duration: 0.36,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'all',
          onStart: () => {
            animateIncomingMetrics(incomingContent);
          },
        }, 0.34);
      }

      // 6. AND THEN THE CARDS REVEAL (Sequential Cascade)
      if (nextSectionElements.length) {
        activeTransitionTimeline.to(nextSectionElements, {
          opacity: 1,
          y: 0,
          filter: 'none',
          duration: 0.40,
          stagger: 0.055,
          ease: 'power2.out',
          clearProps: 'all',
        }, 0.44);
      }

    } else {
      // =========================================================================
      // CINEMATIC OPTICAL BLUR TRANSITION (DESKTOP WEB — BUTTERY SMOOTH 60FPS)
      // =========================================================================

      // 1. Incoming page refocused smoothly from blur(18px) to crystal clear blur(0px)
      activeTransitionTimeline.to(shell, {
        filter: 'blur(0px)',
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.24,
        ease: 'power2.out',
        clearProps: 'filter,transform,willChange',
      }, 0.10);

      // 2. Navbar smoothly refocused in sync with incoming page
      if (navbar) {
        activeTransitionTimeline.to(navbar, {
          filter: 'blur(0px)',
          opacity: 1,
          scale: 1,
          duration: 0.22,
          ease: 'power2.out',
          clearProps: 'all',
        }, 0.12);
      }

      // Outgoing page finishes fade
      if (currentContent) {
        activeTransitionTimeline.to(currentContent, {
          opacity: 0,
          filter: 'blur(20px)',
          y: -8,
          scale: 0.985,
          duration: 0.18,
          ease: 'power2.in',
        }, 0);
      }

      // Advance state to INCOMING_REFOCUS
      activeTransitionTimeline.call(() => {
        setTransitionState(TransitionState.INCOMING_REFOCUS);
      }, null, 0.26);

      // Promote destination into live document promptly at 0.34s
      activeTransitionTimeline.call(promoteIncomingPage, null, 0.34);

      // 3. AND THEN THE TEXT REVEALS ONE BY ONE (Beat 3: Word-by-Word Kinetic Reveal)
      if (headlineWords.length) {
        activeTransitionTimeline.call(() => {
          setTransitionState(TransitionState.HERO_WORD_REVEAL);
        }, null, 0.36);

        activeTransitionTimeline.to(headlineWords, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'none',
          duration: 0.46,
          stagger: 0.065,
          ease: 'power3.out',
          clearProps: 'all',
          onComplete: () => {
            if (incomingContent.querySelector('#hero-headline') && window.initHeroWordRoller) {
              window.initHeroWordRoller();
            }
          },
        }, 0.36);
      }

      // 4. AND THEN THE COMPONENTS REVEAL (Beat 4: Hero Lines, Subtitles, Tags, Metrics)
      if (heroLineElements.length) {
        activeTransitionTimeline.to(heroLineElements, {
          opacity: 1,
          y: 0,
          filter: 'none',
          duration: 0.40,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'all',
          onStart: () => {
            animateIncomingMetrics(incomingContent);
          },
        }, 0.48);
      }

      // 5. AND THEN THE CARDS REVEAL SEQUENTIALLY (Beat 5: Capability & Philosophy & Comparison Cards)
      if (nextSectionElements.length) {
        activeTransitionTimeline.to(nextSectionElements, {
          opacity: 1,
          y: 0,
          filter: 'none',
          duration: 0.46,
          stagger: 0.065,
          ease: 'power2.out',
          clearProps: 'all',
        }, 0.60);
      }
    }

    activeTransitionTimeline.eventCallback('onComplete', () => {
      promoteIncomingPage();
      setTransitionState(TransitionState.IDLE);
      // Clean up all transient inline styles across animated elements so scrolling never re-triggers them
      const allRevealed = document.querySelectorAll(
        '.adscale-reveal-word, .hl-word, .hero-headline-connector, .hero-word-roller, ' +
        '.capability-card, .service-card-item, .comp-card, .founder-card, .team-member-card, ' +
        '.campaign-movie-card, .creator-card, .founder-accord-card, .pillar-card, ' +
        '.work-metric-item, .team-metric-item'
      );
      gsap.set(allRevealed, { opacity: 1, filter: 'none', clearProps: 'all' });
      if (navbar) {
        gsap.set(navbar, { clearProps: 'all' });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      window.clearTimeout(transitionSafetyTimer);
    });

    // If user starts scrolling while transition timeline is playing, fast-forward so nothing stays hidden
    const onUserScrollDuringTransition = () => {
      if (getTransitionState() !== TransitionState.IDLE && activeTransitionTimeline) {
        activeTransitionTimeline.progress(1);
      }
    };
    window.addEventListener('scroll', onUserScrollDuringTransition, { passive: true, once: true });

  } catch (err) {
    if (err && err.name === 'AbortError') {
      return;
    }
    console.error('Page transition encountered an error:', err);
    const activeBackdrop = document.getElementById('page-transition-backdrop');
    if (activeBackdrop) activeBackdrop.remove();
    const activeShell = document.getElementById('page-transition-shell');
    if (activeShell) activeShell.remove();
    if (currentContent) {
      currentContent.classList.remove('page-outgoing-frozen');
      currentContent.style.removeProperty('top');
      gsap.set(currentContent, { clearProps: 'all' });
    }
    if (navbar) {
      gsap.set(navbar, { clearProps: 'all' });
    }
    document.body.classList.remove('page-is-transitioning');
    window.clearTimeout(transitionSafetyTimer);
    window.location.href = targetHref;
    setTransitionState(TransitionState.IDLE);
  }
}

/**
 * Initializes global click and popstate listeners
 */
export function initPageTransitions() {
  if (window.__hvPageTransitionsInitialized) return;
  window.__hvPageTransitionsInitialized = true;

  // Pre-cache primary routes in memory
  const targetRoutes = ['/index.html', '/work.html', '/campaigns.html', '/team.html', '/why-us.html'];
  setTimeout(() => {
    targetRoutes.forEach((r) => {
      if (r !== window.location.pathname) {
        prefetchPage(r);
      }
    });
  }, 250);

  // Intercept click on links
  document.addEventListener('click', (e) => {
    // Ignore right click, middle click, modifier keys (open in new tab)
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    const link = e.target.closest('a');
    if (!link) return;

    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download') || link.dataset.noTransition === 'true') return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return;
    }

    // Same route navigation: smooth scroll to top if not a hash link
    if (isSameRoute(window.location.pathname, url)) {
      if (!url.hash) {
        e.preventDefault();
        if (window.lenis) {
          window.lenis.scrollTo(0, { duration: 0.6 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return;
    }

    if (isHomeRoute(url) && !isHomeRoute(window.location.pathname)) {
      try {
        sessionStorage.setItem('hv_from_subpage', 'true');
      } catch (_) {}
    }

    if (canTransition(window.location.pathname, url)) {
      e.preventDefault();
      navigateWithTransition(url.href, false);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (!isHomeRoute(window.location.pathname)) {
      try {
        sessionStorage.setItem('hv_from_subpage', 'true');
      } catch (_) {}
    }
  });

  // Prefetch on pointerenter / mouseover for zero-latency instant transitions
  const handlePrefetch = (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    try {
      const url = new URL(href, window.location.href);
      if (canTransition(window.location.pathname, url)) {
        prefetchPage(url.href);
      }
    } catch (_) {}
  };
  document.addEventListener('pointerenter', handlePrefetch, { passive: true, capture: true });
  document.addEventListener('mouseover', handlePrefetch, { passive: true });

  // Handle browser back and forward
  window.addEventListener('popstate', () => {
    navigateWithTransition(window.location.href, true);
  });
}
