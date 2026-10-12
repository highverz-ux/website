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
    }
  }, 3200);

  try {
    // 1. Retrieve target document HTML (from memory cache or network)
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

    // Find main content container (#page-content or fallback)
    const currentContent = document.getElementById('page-content') || document.querySelector('main.page-content');
    const incomingContent = newDoc.getElementById('page-content') || newDoc.querySelector('main.page-content');

    if (!currentContent || !incomingContent) {
      window.location.href = targetHref;
      setTransitionState(TransitionState.IDLE);
      return;
    }

    const targetTitle = newDoc.title;
    const targetBodyClass = newDoc.body.className;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    // Freeze Lenis scrolling during transition
    if (window.lenis) {
      window.lenis.stop();
    }

    // Freeze current content in visual viewport (prevents scroll jumps)
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    currentContent.classList.add('page-outgoing-frozen');
    currentContent.style.top = `-${currentScrollY}px`;

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

    const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;

    // Initial kinetic states on incoming elements (ready for synchronized entrance)
    if (headlineWords.length) {
      gsap.set(headlineWords, {
        opacity: 0,
        y: isMobile ? 18 : 26,
        scale: isMobile ? 0.97 : 0.95,
        filter: isMobile ? 'none' : 'blur(4px)',
        transformOrigin: '50% 100%',
        willChange: 'opacity, transform',
      });
    }

    if (heroLineElements.length) {
      gsap.set(heroLineElements, {
        opacity: 0,
        y: isMobile ? 14 : 18,
        willChange: 'opacity, transform',
      });
    }

    if (nextSectionElements.length) {
      gsap.set(nextSectionElements, {
        opacity: 0,
        y: isMobile ? 20 : 26,
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
    const shell = document.createElement('div');
    shell.className = `page-transition-shell ${targetBodyClass || ''}`.trim();
    shell.id = 'page-transition-shell';
    shell.style.zIndex = '20';

    incomingContent.style.position = 'relative';
    incomingContent.style.width = '100%';
    incomingContent.style.minHeight = '100vh';
    incomingContent.style.pointerEvents = 'none';
    shell.appendChild(incomingContent);

    // Hold current page background underneath both fades to prevent ambient layer flashing
    const backdrop = document.createElement('div');
    backdrop.className = 'page-transition-backdrop';
    backdrop.id = 'page-transition-backdrop';
    backdrop.style.backgroundColor = getComputedStyle(document.body).backgroundColor || '#050809';
    backdrop.style.zIndex = '5'; // Placed BEHIND currentContent (10) and shell (20)

    const glow = document.createElement('div');
    glow.className = 'page-transition-glow';
    glow.id = 'page-transition-glow';
    glow.style.zIndex = '25';

    document.body.appendChild(backdrop);
    document.body.appendChild(shell);
    document.body.appendChild(glow);

    // Lock native scrollbar width to prevent layout jump during transition
    const transitionScrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth
    );
    document.body.style.setProperty(
      '--transition-scrollbar-width',
      `${transitionScrollbarWidth}px`
    );
    document.body.classList.add('page-is-transitioning');

    // Dispose old page runtime & ScrollTriggers
    if (window.__hvDisposePageRuntime) {
      window.__hvDisposePageRuntime();
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());

    // Hydrate incoming counters to 0 placeholder
    startIncomingMetricCounters(incomingContent);

    // Keep navbar active tab immediately in sync with destination link (0ms latency feedback):
    window.__hvUpdateNavbar?.(targetUrl.pathname);

    // Initial visual states (pure hardware-accelerated opacity & transform, zero rasterization jank):
    gsap.set(currentContent, {
      opacity: 1,
      scale: 1,
      y: 0,
      willChange: 'opacity, transform',
    });

    // Incoming page starts hidden underneath the blur veil
    gsap.set(shell, {
      opacity: 0,
      scale: isMobile ? 1 : 1.018,
      y: isMobile ? 8 : 10,
      willChange: 'opacity, transform',
    });
    gsap.set(glow, { opacity: 0 });

    setTransitionState(TransitionState.OUTGOING_BLUR);

    let shellPromoted = false;
    const promoteIncomingPage = () => {
      if (shellPromoted) return;
      shellPromoted = true;

      try {
        glow.remove();
        backdrop.remove();

        // Remove old frozen content from DOM once crossfade is complete
        currentContent.remove();

        // Clear blur and promote incomingContent into the live document
        gsap.set(shell, { clearProps: 'opacity,filter,willChange' });
        incomingContent.removeAttribute('style');
        shell.insertAdjacentElement('beforebegin', incomingContent);
        shell.remove();

        gsap.set(incomingContent, { clearProps: 'filter,willChange' });

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
      // FAST, CRISP, LIGHTWEIGHT MOBILE TRANSITION (NO HEAVY BLUR, FAST & CLEAR)
      // =========================================================================

      // 1. Outgoing page smoothly and quickly fades out over 0.18s
      activeTransitionTimeline.to(currentContent, {
        opacity: 0,
        y: -6,
        duration: 0.18,
        ease: 'power2.inOut',
      }, 0);

      // 2. Incoming page appears with clean, snappy fade-in over 0.18s (fast & clear)
      activeTransitionTimeline.fromTo(shell,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.18,
          ease: 'power2.out',
          clearProps: 'transform,willChange',
        },
        0.04
      );

      // Advance state to INCOMING_REFOCUS
      activeTransitionTimeline.call(() => {
        setTransitionState(TransitionState.INCOMING_REFOCUS);
      }, null, 0.18);

      // Promote destination into live document promptly at 0.20s
      activeTransitionTimeline.call(promoteIncomingPage, null, 0.20);

      // 4. AND THEN THE TEXT REVEALS ONE BY ONE (Beat 3: Word-by-Word Kinetic Reveal)
      // Fast, clear, distinct cadence on mobile starting at 0.22s!
      if (headlineWords.length) {
        activeTransitionTimeline.call(() => {
          setTransitionState(TransitionState.HERO_WORD_REVEAL);
        }, null, 0.22);

        activeTransitionTimeline.to(headlineWords, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.44,
          stagger: 0.055, // Snappy one-by-one pacing!
          ease: 'power3.out',
          clearProps: 'transform,willChange',
          onComplete: () => {
            if (incomingContent.querySelector('#hero-headline') && window.initHeroWordRoller) {
              window.initHeroWordRoller();
            }
          },
        }, 0.22);
      }

      // 5. AND THEN THE COMPONENTS REVEAL (Beat 4: Hero Lines, Subtitles, Tags, Metrics)
      // Smoothly follows headline words at 0.36s!
      if (heroLineElements.length) {
        activeTransitionTimeline.to(heroLineElements, {
          opacity: 1,
          y: 0,
          duration: 0.40,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'opacity,transform,willChange',
          onStart: () => {
            animateIncomingMetrics(incomingContent);
          },
        }, 0.36);
      }

      // 6. AND THEN THE CARDS REVEAL (Beat 5: Capability, Philosophy & Comparison Cards)
      // "and aslo cards animation should be there as it is"
      // Cards cascade into view sequentially right after the components at 0.48s!
      if (nextSectionElements.length) {
        activeTransitionTimeline.to(nextSectionElements, {
          opacity: 1,
          y: 0,
          duration: 0.46,
          stagger: 0.065, // Sequential cascade fully preserved!
          ease: 'power2.out',
          clearProps: 'opacity,transform,willChange',
        }, 0.48);
      }

    } else {
      // =========================================================================
      // CINEMATIC OPTICAL BLUR TRANSITION (DESKTOP WEB — BUTTERY SMOOTH 60FPS)
      // =========================================================================

      // 1. Outgoing page smoothly crossfades and subtly recesses (0.0s -> 0.24s)
      activeTransitionTimeline.to(currentContent, {
        opacity: 0,
        y: -10,
        scale: 0.985,
        duration: 0.24,
        ease: 'power2.inOut',
      }, 0);

      // 2. Optical blur veil blooms smoothly across the viewport (0.0s -> 0.20s)
      activeTransitionTimeline.fromTo(glow,
        { opacity: 0 },
        { opacity: 0.96, duration: 0.20, ease: 'power2.out' },
        0
      );

      // 3. Incoming page lands smoothly underneath the blur veil (0.16s -> 0.38s)
      activeTransitionTimeline.fromTo(shell,
        { opacity: 0, scale: 1.018, y: 10 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.22,
          ease: 'power2.out',
          clearProps: 'transform,willChange',
        },
        0.16
      );

      // 4. Optical blur veil smoothly melts away into crystal-clear focus (0.20s -> 0.48s)
      activeTransitionTimeline.to(glow, {
        opacity: 0,
        duration: 0.28,
        ease: 'power2.out',
      }, 0.20);

      // Advance state to INCOMING_REFOCUS
      activeTransitionTimeline.call(() => {
        setTransitionState(TransitionState.INCOMING_REFOCUS);
      }, null, 0.22);

      // Promote destination into live document promptly at 0.44s
      activeTransitionTimeline.call(promoteIncomingPage, null, 0.44);

      // 5. AND THEN THE TEXT REVEALS ONE BY ONE (Beat 3: Word-by-Word Kinetic Reveal)
      // Starts right as blur melts into clarity (at 0.46s)!
      if (headlineWords.length) {
        activeTransitionTimeline.call(() => {
          setTransitionState(TransitionState.HERO_WORD_REVEAL);
        }, null, 0.46);

        activeTransitionTimeline.to(headlineWords, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.46,
          stagger: 0.065, // Distinct, perceptible one-by-one cadence!
          ease: 'power3.out',
          clearProps: 'transform,willChange',
          onComplete: () => {
            if (incomingContent.querySelector('#hero-headline') && window.initHeroWordRoller) {
              window.initHeroWordRoller();
            }
          },
        }, 0.46);
      }

      // 6. AND THEN THE COMPONENTS REVEAL (Beat 4: Hero Lines, Subtitles, Tags, Metrics)
      // Cascades in smoothly right after the headline text reveal starts (at 0.60s)!
      if (heroLineElements.length) {
        activeTransitionTimeline.to(heroLineElements, {
          opacity: 1,
          y: 0,
          duration: 0.40,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'opacity,transform,willChange',
          onStart: () => {
            animateIncomingMetrics(incomingContent);
          },
        }, 0.60);
      }

      // 7. AND THEN THE CARDS REVEAL SEQUENTIALLY (Beat 5: Capability & Philosophy & Comparison Cards)
      // Cascades into view sequentially right after the components (at 0.74s)!
      if (nextSectionElements.length) {
        activeTransitionTimeline.to(nextSectionElements, {
          opacity: 1,
          y: 0,
          duration: 0.46,
          stagger: 0.065, // Sequential cascade fully preserved!
          ease: 'power2.out',
          clearProps: 'opacity,transform,willChange',
        }, 0.74);
      }
    }

    activeTransitionTimeline.eventCallback('onComplete', () => {
      promoteIncomingPage();
      setTransitionState(TransitionState.IDLE);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      window.clearTimeout(transitionSafetyTimer);
    });

  } catch (err) {
    if (err && err.name === 'AbortError') {
      return;
    }
    console.error('Page transition encountered an error:', err);
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
