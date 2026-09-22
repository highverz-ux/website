/**
 * HIGHVERZ — Page Transition Engine
 * Recreates the Framer diagonal wipe transition from the reference recording.
 *
 * SPECIFICATION:
 * - Angle: 315° (135° in CSS linear-gradient coordinates, top-left to bottom-right)
 * - Feather / Softness Width: 30%
 * - Duration: 0.8s
 * - Easing: cubic-bezier(0.27, 0, 0.51, 1)
 *
 * EXCLUSION POLICY:
 * - Strictly excludes Home route ('/' and '/index.html').
 * - Navigating to or from Home performs native direct browser navigation without transition.
 * - Navigating between any non-Home pages triggers the diagonal wipe transition.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Checks if a given path or URL represents the Home route.
 */
export function isHomeRoute(pathOrUrl) {
  if (!pathOrUrl) return false;
  try {
    const url = typeof pathOrUrl === 'string'
      ? new URL(pathOrUrl, window.location.origin)
      : pathOrUrl;
    const p = url.pathname.replace(/\/+$/, '') || '/';
    return p === '/' || p === '/index.html';
  } catch (e) {
    return false;
  }
}

/**
 * Validates whether transition animation should run between two routes.
 * Transitions to Home are excluded to preserve native Three.js 3D canvas and intro scene.
 * Transitions from Home to Work and other non-Home pages are fully supported.
 */
export function canTransition(currentPath, targetUrl) {
  // Exclude if destination is Home (Home retains native load & 3D scene)
  if (isHomeRoute(targetUrl)) {
    return false;
  }
  // Exclude external origins
  if (targetUrl.origin !== window.location.origin) {
    return false;
  }
  // Exclude downloads and static non-html assets
  if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|mov|webm|pdf|xlsx|zip|json|xml|txt)$/i.test(targetUrl.pathname)) {
    return false;
  }
  // Exclude same page anchor navigation
  if (targetUrl.pathname === window.location.pathname) {
    return false;
  }
  return true;
}

const htmlCache = new Map();

/**
 * Prefetches target HTML for instantaneous transition response
 */
export async function prefetchPage(urlStr) {
  try {
    const normUrl = urlStr.split('#')[0];
    if (htmlCache.has(normUrl)) return htmlCache.get(normUrl);
    const res = await fetch(normUrl);
    if (!res.ok) return null;
    const text = await res.text();
    htmlCache.set(normUrl, text);
    return text;
  } catch (e) {
    return null;
  }
}

let isTransitioning = false;

/**
 * Core Page Transition Choreographer
 */
export async function navigateWithTransition(targetHref, isPopState = false) {
  if (isTransitioning) return;

  const currentPath = window.location.pathname;
  let targetUrl;
  try {
    targetUrl = new URL(targetHref, window.location.origin);
  } catch (e) {
    window.location.href = targetHref;
    return;
  }

  // Double-check: if either current or target route is Home, do not animate
  if (!canTransition(currentPath, targetUrl)) {
    if (!isPopState) {
      window.location.href = targetHref;
    } else {
      window.location.reload();
    }
    return;
  }

  isTransitioning = true;

  try {
    // 1. Retrieve target document HTML (from memory cache or network)
    let htmlText = htmlCache.get(targetUrl.href.split('#')[0]);
    if (!htmlText) {
      htmlText = await prefetchPage(targetUrl.href);
    }
    if (!htmlText) {
      // Fallback to native navigation if fetch fails
      window.location.href = targetHref;
      isTransitioning = false;
      return;
    }

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(htmlText, 'text/html');

    // Find main content container (#page-content or fallback)
    const currentContent = document.getElementById('page-content') || document.querySelector('main.page-content');
    const incomingContent = newDoc.getElementById('page-content') || newDoc.querySelector('main.page-content');

    if (!currentContent || !incomingContent) {
      window.location.href = targetHref;
      isTransitioning = false;
      return;
    }

    const targetTitle = newDoc.title;
    const targetBodyClass = newDoc.body.className;

    // 2. Update Browser History & Document Title
    if (!isPopState) {
      window.history.pushState({ path: targetHref }, '', targetHref);
    }
    if (targetTitle) {
      document.title = targetTitle;
    }

    // 3. Update Navbar active states and slide indicator immediately
    if (window.__hvUpdateNavbar) {
      window.__hvUpdateNavbar(window.location.pathname);
    }

    // Close mobile menu if active
    document.body.classList.remove('mobile-menu-active');
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) mobileToggle.classList.remove('is-active');

    // Keep cursor active and clear any stuck click/magnetic states
    if (window.__hvEnsureCursorActive) {
      window.__hvEnsureCursorActive();
    }

    // 4. Freeze Lenis scrolling during transition to prevent scroll/layout thrashing
    if (window.lenis) {
      window.lenis.stop();
    }

    // 5. Freeze current content in visual viewport (preserves exact visual frame without bottom cut-off)
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    currentContent.classList.add('page-outgoing-frozen');
    currentContent.style.top = `-${currentScrollY}px`;

    // Immediately reset document scroll while outgoing content is pinned at -scrollY
    // This completely eliminates scroll-jump and bottom/top layout gaps when swapping pages
    window.scrollTo(0, 0);
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }

    // 6. Mount incoming content inside an isolated 100vw x 100vh viewport shell
    const shell = document.createElement('div');
    shell.className = 'page-transition-shell';
    shell.id = 'page-transition-shell';

    document.documentElement.classList.add('page-transitioned');

    // Pre-activate incoming hero elements so the wipe immediately reveals the live content
    // This eliminates any blank delay during the wipe and prevents delayed secondary entrance animations
    const heroSelectors = [
      '.campaign-hero-tag',
      '.campaign-hero-headline',
      '.campaign-hero-sub',
      '.campaign-hero-pillars',
      '.campaign-search-section',
      '.campaign-featured-label',
      '.work-hero-container',
      '.team-hero-container',
      '.why-hero-container',
      '.case-hero-container'
    ].join(',');
    incomingContent.querySelectorAll(heroSelectors).forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.animation = 'none';
    });
    const incCampaignHero = incomingContent.querySelector('.campaign-hero');
    if (incCampaignHero) {
      incCampaignHero.dataset.heroAnimated = 'true';
    }

    // Pre-set metric counters in incoming content to 0 so they never flash target values before animating
    incomingContent.querySelectorAll('.work-metric-val').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-metric-target'));
      const prefix = el.getAttribute('data-metric-prefix') || '';
      const suffix = el.getAttribute('data-metric-suffix') || '';
      if (!isNaN(target)) {
        const isFloat = target % 1 !== 0;
        el.textContent = `${prefix}${isFloat ? (0).toFixed(1) : 0}${suffix}`;
      }
    });
    incomingContent.querySelectorAll('.team-metric-val').forEach((el) => {
      const format = el.getAttribute('data-metric-format');
      if (format === 'billion') el.textContent = '0.0B+';
      else if (format === 'days') el.textContent = '0 Days';
      else if (format === 'percent') el.textContent = '0.0%';
    });

    incomingContent.style.position = 'relative';
    incomingContent.style.width = '100%';
    incomingContent.style.minHeight = '100vh';
    incomingContent.style.pointerEvents = 'none';
    shell.appendChild(incomingContent);

    // Smooth black shadow band tracing the diagonal transition wavefront (no blue color)
    const glow = document.createElement('div');
    glow.className = 'page-transition-glow';
    glow.id = 'page-transition-glow';

    // Detect light mode vs dark mode
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

    // Set initial 0% mask (incoming content hidden until wipe begins)
    const initialMask = 'linear-gradient(135deg, #000 -18%, transparent -6%)';
    shell.style.webkitMaskImage = initialMask;
    shell.style.maskImage = initialMask;

    document.body.appendChild(shell);
    document.body.appendChild(glow);
    document.body.classList.add('page-is-transitioning');

    // 7. Execute diagonal wipe transition with smooth pure black shading
    // Angle: 135° (top-left to bottom-right diagonal sweep)
    // Duration: 0.56s (fluid, responsive, and smooth)
    // Easing: cubic-bezier(0.27, 0, 0.51, 1)
    function cubicBezierEase(t) {
      const cx = 3 * 0.27, bx = 3 * (0.51 - 0.27) - cx, ax = 1 - cx - bx;
      const cy = 3 * 0,    by = 3 * (1 - 0) - cy,    ay = 1 - cy - by;
      function sampleX(tt) { return ((ax * tt + bx) * tt + cx) * tt; }
      function sampleY(tt) { return ((ay * tt + by) * tt + cy) * tt; }
      let guess = t;
      for (let i = 0; i < 8; i++) {
        const err = sampleX(guess) - t;
        if (Math.abs(err) < 1e-6) break;
        const dx = (3 * ax * guess + 2 * bx) * guess + cx;
        if (Math.abs(dx) < 1e-6) break;
        guess -= err / dx;
      }
      return sampleY(guess);
    }

    const animObj = { progress: 0 };
    const duration = 0.56;

    gsap.to(animObj, {
      progress: 1,
      duration: duration,
      ease: 'none',
      onUpdate: () => {
        const p = animObj.progress;
        const eased = cubicBezierEase(p);
        // glowPos travels from -12% to 112% for seamless edge-to-edge coverage
        const glowPos = -12 + 124 * eased;
        const c = glowPos.toFixed(2);

        // Viewport mask revealing incoming page with soft feather along wavefront
        const maskVal = `linear-gradient(135deg, #000 ${(glowPos - 7).toFixed(2)}%, transparent ${(glowPos + 7).toFixed(2)}%)`;
        shell.style.webkitMaskImage = maskVal;
        shell.style.maskImage = maskVal;

        // Smooth pure black gradient shading (no blue/cyan tints)
        const peakAlpha = isLightMode ? 0.60 : 0.95;
        const midAlpha = isLightMode ? 0.35 : 0.65;
        const lowAlpha = isLightMode ? 0.12 : 0.22;

        glow.style.background = `linear-gradient(135deg,
          transparent ${(glowPos - 18).toFixed(2)}%,
          rgba(0, 0, 0, ${lowAlpha}) ${(glowPos - 9).toFixed(2)}%,
          rgba(0, 0, 0, ${midAlpha}) ${(glowPos - 3).toFixed(2)}%,
          rgba(0, 0, 0, ${peakAlpha}) ${c}%,
          rgba(0, 0, 0, ${midAlpha}) ${(glowPos + 3).toFixed(2)}%,
          rgba(0, 0, 0, ${lowAlpha}) ${(glowPos + 9).toFixed(2)}%,
          transparent ${(glowPos + 18).toFixed(2)}%
        )`;
        glow.style.filter = 'none';

        const glowAlpha = Math.sin(p * Math.PI) ** 0.5;
        glow.style.opacity = (glowAlpha * 1.0).toFixed(3);
      },
      onComplete: () => {
        // Clean up glow element
        glow.remove();

        // Kill previous page ScrollTriggers
        ScrollTrigger.getAll().forEach((t) => t.kill());

        // Remove old frozen content from DOM
        currentContent.remove();

        // Promote incoming content into normal document flow
        incomingContent.removeAttribute('style');
        shell.insertAdjacentElement('beforebegin', incomingContent);
        shell.remove();

        // Update body class while preserving essential runtime flags (cursor, theme)
        const wasCursorActive = document.body.classList.contains('cursor-active');
        if (targetBodyClass) {
          document.body.className = targetBodyClass;
        }
        document.body.classList.remove('page-is-transitioning');
        if (wasCursorActive || window.innerWidth > 900) {
          document.body.classList.add('cursor-active');
        }
        if (window.__hvEnsureCursorActive) {
          window.__hvEnsureCursorActive();
        }

        // Restart and refresh Lenis scroll calculations
        if (window.lenis) {
          window.lenis.start();
          window.lenis.resize();
        }

        // Re-initialize page scripts for the new route
        if (window.__hvInitPageScripts) {
          window.__hvInitPageScripts(window.location.pathname);
        }

        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
        }

        isTransitioning = false;
      }
    });

  } catch (err) {
    console.error('Page transition encountered an error:', err);
    window.location.href = targetHref;
    isTransitioning = false;
  }
}

/**
 * Initializes global click and popstate listeners
 */
export function initPageTransitions() {
  // Pre-cache all dedicated non-Home pages in memory so transition starts in 0ms without waiting for fetch
  const targetRoutes = ['/work.html', '/campaigns.html', '/team.html', '/why-us.html'];
  setTimeout(() => {
    targetRoutes.forEach(r => {
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

    // Check if link specifies target="_blank"
    if (link.target && link.target !== '_self') return;

    // Check if link has download or data-no-transition
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

    // If destination is same page with hash (anchor scroll), let normal/Lenis anchor scrolling work
    if (url.pathname === window.location.pathname) {
      if (!url.hash) {
        // Clicking same page link without hash: scroll smoothly to top
        e.preventDefault();
        if (window.lenis) {
          window.lenis.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return;
    }

    // If navigating to Home from any subpage, flag it in sessionStorage to skip intro screen
    if (isHomeRoute(url) && !isHomeRoute(window.location.pathname)) {
      try {
        sessionStorage.setItem('hv_from_subpage', 'true');
      } catch (_) {}
    }

    // Check if this navigation is between non-Home pages
    if (canTransition(window.location.pathname, url)) {
      e.preventDefault();
      navigateWithTransition(url.href, false);
    }
  });

  // Track subpage exit
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
    } catch (err) {}
  }, { passive: true });

  // Handle browser back and forward
  window.addEventListener('popstate', () => {
    const currentPath = window.location.pathname;
    if (isHomeRoute(currentPath)) {
      // Navigating back/forward to Home: reload natively
      window.location.reload();
      return;
    }
    navigateWithTransition(window.location.href, true);
  });
}

