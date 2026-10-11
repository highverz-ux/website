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
    incomingCreators.querySelectorAll('.stat-number').forEach((el) => {
      const target = parseInt(el.dataset.count || '', 10);
      el.textContent = Number.isNaN(target) ? '0' : target.toLocaleString('en-US');
    });
    incomingCreators.querySelectorAll('.stat-dyn-num').forEach((el) => {
      const target = parseInt(el.dataset.count || '', 10);
      el.textContent = Number.isNaN(target) ? '0' : String(target);
    });
  }

  const workHero = content.querySelector('.work-hero-section');
  if (workHero) {
    workHero.dataset.transitionMetricsStarted = 'true';
    const items = [];
    workHero.querySelectorAll('.work-metric-val').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-metric-target'));
      if (Number.isNaN(target)) return;
      const prefix = el.getAttribute('data-metric-prefix') || '';
      const suffix = el.getAttribute('data-metric-suffix') || '';
      const isFloat = target % 1 !== 0;
      const value = { current: 0 };
      el.textContent = `${prefix}${isFloat ? '0.0' : '0'}${suffix}`;
      items.push({ el, target, prefix, suffix, isFloat, value });
    });
    const timeline = gsap.timeline({ defaults: { duration: 1.6, ease: 'power2.out' } });
    items.forEach((item) => {
      timeline.to(item.value, {
        current: item.target,
        onUpdate: () => {
          const display = item.isFloat ? item.value.current.toFixed(1) : Math.round(item.value.current);
          item.el.textContent = `${item.prefix}${display}${item.suffix}`;
        },
        onComplete: () => {
          const display = item.isFloat ? item.target.toFixed(1) : item.target;
          item.el.textContent = `${item.prefix}${display}${item.suffix}`;
        },
      }, 0);
    });
  }

  const teamHero = content.querySelector('.team-hero-section');
  if (teamHero) {
    teamHero.dataset.transitionMetricsStarted = 'true';
    const timeline = gsap.timeline({ defaults: { duration: 2, ease: 'power2.out' } });
    teamHero.querySelectorAll('.team-metric-val').forEach((el) => {
      const format = el.getAttribute('data-metric-format');
      const value = { current: format === 'top' ? 15 : 0 };
      let target;
      let render;
      if (format === 'billion') {
        target = 4.5; el.textContent = '0.0B+';
        render = () => { el.textContent = `${value.current.toFixed(1)}B+`; };
      } else if (format === 'days') {
        target = 60; el.textContent = '0 Days';
        render = () => { el.textContent = `${Math.round(value.current)} Days`; };
      } else if (format === 'percent') {
        target = 99.4; el.textContent = '0.0%';
        render = () => { el.textContent = `${value.current.toFixed(1)}%`; };
      } else if (format === 'top') {
        target = 1; el.textContent = 'Top 15%';
        render = () => { el.textContent = `Top ${Math.round(value.current)}%`; };
      } else {
        return;
      }
      timeline.to(value, { current: target, onUpdate: render, onComplete: render }, 0);
    });
  }
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

    // Pre-tokenize incoming headings and hold text ready for hero reveal
    try {
      const heroHeadings = incomingContent.querySelectorAll(
        '.work-hero-title, .campaign-hero-headline, .why-hero-title, .team-hero-title, .case-hero-title'
      );
      heroHeadings.forEach((heading) => {
        if (window.splitAdscaleWords) window.splitAdscaleWords(heading);
      });
      // Pre-tokenize incoming headings and hold headline words ready for kinetic de-blur reveal
      incomingContent.querySelectorAll('.adscale-reveal-word').forEach((w) => {
        w.style.opacity = '0';
        w.style.transform = 'translateY(25px)';
        w.style.filter = 'blur(10px)';
      });
      // Hold home screen incoming headline words ready for kinetic de-blur reveal
      incomingContent.querySelectorAll('.hl-word, .hero-headline-connector, .hero-word-roller').forEach((w) => {
        w.style.opacity = '0';
        w.style.transform = 'translateY(25px)';
        w.style.filter = 'blur(10px)';
      });
      // All other page components (tags, descriptions, CTAs, cards, grids, media) remain 100% visible and complete!
    } catch (_) {}

    // Mount incoming content inside transparent transition layer
    const transitionLayer = document.createElement('div');
    transitionLayer.className = `page-transition-layer ${targetBodyClass || ''}`.trim();
    transitionLayer.id = 'page-transition-layer';

    incomingContent.style.position = 'relative';
    incomingContent.style.width = '100%';
    incomingContent.style.minHeight = '100vh';
    incomingContent.style.pointerEvents = 'none';
    transitionLayer.appendChild(incomingContent);

    document.body.appendChild(transitionLayer);
    document.body.classList.add('page-is-transitioning');

    // Dispose old page runtime & ScrollTriggers
    if (window.__hvDisposePageRuntime) {
      window.__hvDisposePageRuntime();
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());

    // Hydrate incoming counters
    startIncomingMetricCounters(incomingContent);

    const navbar = document.getElementById('navbar');

    // Cinematic optical rack-focus parameters: 28px bokeh with anamorphic bloom & saturation
    const PEAK_BLUR = 'blur(28px) brightness(1.12) saturate(120%)';
    const CRISP_FOCUS = 'blur(0px) brightness(1) saturate(100%)';

    // Initial visual states:
    // Outgoing page is at normal 1.0 focus
    gsap.set(currentContent, {
      opacity: 1,
      filter: CRISP_FOCUS,
      scale: 1,
      y: 0,
      transformOrigin: '50% 30%',
      willChange: 'filter, opacity, transform',
    });

    if (navbar) {
      gsap.set(navbar, {
        filter: 'blur(0px)',
        y: 0,
        willChange: 'filter',
      });
    }

    // Incoming page starts deeply blurred, slightly pushed into background depth
    // with scale 1.04 to guarantee 0px border bleed during 28px blur
    gsap.set(transitionLayer, {
      opacity: 0,
      filter: PEAK_BLUR,
      scale: 1.04,
      transformOrigin: '50% 30%',
      willChange: 'filter, opacity, transform',
    });

    // 1. Enter OUTGOING_BLUR state: camera focal plane pulls away from outgoing page
    setTransitionState(TransitionState.OUTGOING_BLUR);

    activeTransitionTimeline = gsap.timeline({
      defaults: { overwrite: 'auto' },
    });

    // Phase 1: Outgoing page smoothly racks out of focus over 0.36s with forward lens breathing
    activeTransitionTimeline.to(currentContent, {
      filter: PEAK_BLUR,
      scale: 1.025,
      y: -6,
      duration: 0.36,
      ease: 'power2.inOut',
    }, 0);

    // Navbar stays stably anchored as navigation HUD with subtle optical softening
    if (navbar) {
      activeTransitionTimeline.to(navbar, {
        filter: 'blur(3.5px)',
        duration: 0.22,
        ease: 'power2.inOut',
      }, 0);
      activeTransitionTimeline.to(navbar, {
        filter: 'blur(0px)',
        duration: 0.30,
        ease: 'power2.out',
      }, 0.22);
    }

    // Phase 2: Organic Aperture Cross-Dissolve (0.16s to 0.36s = 200ms smooth crossover)
    // While both pages are immersed in deep bokeh, they seamlessly blend into each other
    activeTransitionTimeline.to(transitionLayer, {
      opacity: 1,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.16);

    activeTransitionTimeline.to(currentContent, {
      opacity: 0,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.16);

    // Incoming cards & kicker badges prepared for subtle physical depth settling
    const incomingCards = incomingContent.querySelectorAll(
      '.work-hero-metrics-grid, .team-metrics-grid, .why-comparison-table, .hero-trust-badge-wrap, .carousel-viewport, .case-stats-hud, .case-follower-transform-card, .campaign-hero-pillars, .campaign-search-section, .campaign-featured-label'
    );
    const incomingKickers = incomingContent.querySelectorAll(
      '.work-hero-tag, .team-hero-tag, .why-hero-tag, .campaign-hero-tag, .case-kicker-tag'
    );
    if (incomingCards.length) {
      gsap.set(incomingCards, { y: 14, scale: 0.985 });
    }
    if (incomingKickers.length) {
      gsap.set(incomingKickers, { y: 8 });
    }

    // At 0.34s: Old page is completely transparent in deep bokeh; advance state to INCOMING_REFOCUS
    activeTransitionTimeline.call(() => {
      setTransitionState(TransitionState.INCOMING_REFOCUS);
      currentContent.remove();
      window.__hvUpdateNavbar?.(targetUrl.pathname);
    }, null, 0.34);

    // Phase 3: Whole incoming page smoothly refocusses from 28px bokeh to crystal clarity (0.22s to 0.62s)
    activeTransitionTimeline.to(transitionLayer, {
      filter: CRISP_FOCUS,
      scale: 1.0,
      duration: 0.40,
      ease: 'power3.out',
    }, 0.22);

    // Components settle into position with physical spring mass
    if (incomingCards.length) {
      activeTransitionTimeline.to(incomingCards, {
        y: 0,
        scale: 1.0,
        duration: 0.42,
        ease: 'power3.out',
        clearProps: 'transform',
      }, 0.26);
    }

    if (incomingKickers.length) {
      activeTransitionTimeline.to(incomingKickers, {
        y: 0,
        duration: 0.40,
        ease: 'power3.out',
        clearProps: 'transform',
      }, 0.26);
    }

    // When refocus completes: Destination is completely sharp!
    activeTransitionTimeline.eventCallback('onComplete', () => {
      try {
        // Clear blur and promote incomingContent into the live document
        gsap.set(transitionLayer, { clearProps: 'opacity,filter,willChange' });
        incomingContent.removeAttribute('style');
        transitionLayer.insertAdjacentElement('beforebegin', incomingContent);
        transitionLayer.remove();

        gsap.set(incomingContent, { clearProps: 'filter,willChange' });
        if (navbar) gsap.set(navbar, { clearProps: 'filter,willChange' });

        if (targetBodyClass) document.body.className = targetBodyClass;
        document.body.classList.remove('page-is-transitioning');
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
        if (window.ScrollTrigger) ScrollTrigger.refresh();

        // Advance state to HERO_WORD_REVEAL!
        setTransitionState(TransitionState.HERO_WORD_REVEAL);

        // Run destination page scripts & start the word-by-word reveal!
        window.__hvInitPageScripts?.(window.location.pathname, true);

        // Fail-safe timeout to ensure state returns to IDLE if page has no reveal
        window.setTimeout(() => {
          if (currentTransitionState === TransitionState.HERO_WORD_REVEAL) {
            setTransitionState(TransitionState.IDLE);
          }
          window.clearTimeout(transitionSafetyTimer);
        }, 1200);

      } catch (err) {
        console.error('Incoming page initialization failed:', err);
        setTransitionState(TransitionState.IDLE);
        window.clearTimeout(transitionSafetyTimer);
      }
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

  // Prefetch on hover
  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    try {
      const url = new URL(href, window.location.href);
      if (canTransition(window.location.pathname, url)) {
        prefetchPage(url.href);
      }
    } catch (_) {}
  }, { passive: true });

  // Handle browser back and forward
  window.addEventListener('popstate', () => {
    navigateWithTransition(window.location.href, true);
  });
}
