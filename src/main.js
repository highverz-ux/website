/**
 * HIGHVERZ — Master Animation & Interaction Choreography
 * GSAP 3 + ScrollTrigger + Lenis Smooth Scroll
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initHV3D } from './hv3d.js';
import { initHighverzIntro, replayHighverzIntro } from './intro/HighverzIntro.js';
import './enquiry/enquiry.css';
import { initEnquirySystem } from './enquiry/enquiry.js';
import { initThemeSystem } from './theme.js';

gsap.registerPlugin(ScrollTrigger);

// ==========================================================================
// LENIS SMOOTH SCROLL SETUP
// ==========================================================================
let lenis;

function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.6,
    infinite: false,
  });

  window.lenis = lenis;

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// Initialize on DOM Ready or immediately if document is already ready
let hasBooted = false;
function boot() {
  if (hasBooted) return;
  hasBooted = true;
  initLenis();
  initThemeSystem();
  initCustomCursor();
  initNavbar();
  init3DScene();
  initStatsMarquee();
  initCreatorsSection();
  initStatementParallax();
  initServicesReveal();
  initPortfolioGrid();
  initTestimonialsReveal();
  initProcessScrollDraw();
  initCTAReveal();
  initMagneticElements();
  initScrollVelocityEffects();
  initServiceFilters();
  initEnquirySystem();

  const isWorkPage = window.location.pathname.includes('work') || !!document.querySelector('.work-hero-section');
  const isCaseStudyPage = window.location.pathname.includes('creator-') || !!document.querySelector('.case-hero-section') || !!document.querySelector('.ig-profile-shell');
  const isTeamPage = window.location.pathname.includes('team') || !!document.querySelector('.page-team');
  const isWhyUs = window.location.pathname.includes('why-us') || !!document.querySelector('.page-why-us') || !!document.querySelector('.comparison-section');
  const isDedicatedPage = isWorkPage || isCaseStudyPage || isTeamPage || isWhyUs;

  if (isDedicatedPage) {
    // Dedicated pages (Work, Creators, Team, Why Us) enter immediately without intro screen
    if (lenis) lenis.start();
    if (isWorkPage) initWorkHeroIntro();
    if (isTeamPage) initTeamPageAnimations();
    if (isWhyUs) initWhyUsAnimations();
  }

  // Always initialize reels player if reel cards exist on any page
  if (document.querySelectorAll('.ig-reel-card').length > 0) {
    initInstagramReelsPlayer();
  }

  if (!isDedicatedPage) {
    const skipIntro = window.location.search.includes('no-intro') || sessionStorage.getItem('highverzIntroPlayed');
    if (skipIntro) {
      // Intro overlay already played — remove it and run hero animation directly on reload
      const introEl = document.getElementById('highverz-intro');
      if (introEl) introEl.remove();
      if (lenis) {
        lenis.start();
        lenis.scrollTo(0, { immediate: true });
      }
      // Animate the hero lines and text effects directly on reload (buffered to guarantee paint)
      setTimeout(() => {
        initHeroIntro(false);
      }, 70);
    } else {
      // First visit: play the premium Highverz intro screen, then animate hero
      sessionStorage.setItem('highverzIntroPlayed', 'true');
      if (lenis) lenis.stop();
      initHighverzIntro({
        onComplete: () => {
          if (lenis) lenis.start();
          initHeroIntro(false);
        }
      });
    }

    // Shift + I triggers intro replay dynamically in-place without page reload
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        if (lenis) lenis.stop();
        replayHighverzIntro();
      }
    });
  }

  // Recalculate ScrollTrigger measurements once layout is painted
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// ==========================================================================
// 01. FLUID KINETIC MAGNETIC CURSOR TRACKER
// ==========================================================================
function initCustomCursor() {
  const cursorWrap = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorGlow = document.getElementById('cursor-glow');
  const cursorText = document.getElementById('cursor-text');

  if (!cursorWrap || !cursorRing) return;

  // Touch device and small screen check
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900) {
    cursorWrap.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  // Pointer coordinates
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let prevMouseX = mouseX;
  let prevMouseY = mouseY;

  // Physics render positions
  let dotX = mouseX;
  let dotY = mouseY;
  let ringX = mouseX;
  let ringY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;

  // Kinetic stretch & orientation parameters
  let smoothSpeed = 0;
  let targetAngle = 0;
  let currentAngle = 0;
  let scaleX = 1;
  let scaleY = 1;

  // Interactive states
  let isHovering = false;
  let isMagnetic = false;
  let clickScale = 1;
  let magneticTarget = null;

  // Mouse move tracking
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorWrap.classList.contains('is-hidden')) {
      cursorWrap.classList.remove('is-hidden');
    }
  }, { passive: true });

  // Mouse down / up reactions
  window.addEventListener('mousedown', () => {
    clickScale = 0.76;
    if (cursorRing) cursorRing.classList.add('is-clicking');
  });

  window.addEventListener('mouseup', () => {
    clickScale = 1.18; // Elastic overshoot
    if (cursorRing) cursorRing.classList.remove('is-clicking');
  });

  // Window bounds handling
  document.addEventListener('mouseleave', () => {
    if (cursorWrap) cursorWrap.classList.add('is-hidden');
  });
  document.addEventListener('mouseenter', () => {
    if (cursorWrap) cursorWrap.classList.remove('is-hidden');
  });

  // 60/120fps physics render loop
  function renderPhysicsCursor() {
    // 1. Instant velocity & speed calculation
    const deltaX = mouseX - prevMouseX;
    const deltaY = mouseY - prevMouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    const instantSpeed = Math.hypot(deltaX, deltaY);
    smoothSpeed += (instantSpeed - smoothSpeed) * 0.22;

    // 2. Compute target position for trailing ring
    let targetRingX = mouseX;
    let targetRingY = mouseY;

    if (isMagnetic && magneticTarget) {
      const rect = magneticTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Magnetic pull toward element center
      targetRingX = centerX + (mouseX - centerX) * 0.28;
      targetRingY = centerY + (mouseY - centerY) * 0.28;

      // Tactile physical displacement on the hovered button
      const maxDisplace = 10;
      const dispX = Math.max(-maxDisplace, Math.min(maxDisplace, (mouseX - centerX) * 0.2));
      const dispY = Math.max(-maxDisplace, Math.min(maxDisplace, (mouseY - centerY) * 0.2));
      magneticTarget.style.transform = `translate3d(${dispX}px, ${dispY}px, 0)`;
    }

    // 3. Independent Lerp Calculations
    // Zero-latency pinpoint lead
    dotX += (mouseX - dotX) * 0.88;
    dotY += (mouseY - dotY) * 0.88;

    // Fluid trailing ring with inertia
    const ringLerp = isMagnetic ? 0.26 : 0.18;
    ringX += (targetRingX - ringX) * ringLerp;
    ringY += (targetRingY - ringY) * ringLerp;

    // Atmospheric ambient glow drift
    glowX += (mouseX - glowX) * 0.09;
    glowY += (mouseY - glowY) * 0.09;

    // 4. Click scale spring decay
    clickScale += (1.0 - clickScale) * 0.18;

    // 5. Kinetic velocity vector stretching (squash & stretch)
    if (smoothSpeed > 1.2 && !isHovering && !isMagnetic) {
      targetAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff < -180) angleDiff += 360;
      while (angleDiff > 180) angleDiff -= 360;
      currentAngle += angleDiff * 0.25;

      const stretch = Math.min(smoothSpeed * 0.0034, 0.42);
      scaleX += (1 + stretch - scaleX) * 0.25;
      scaleY += (1 - stretch * 0.48 - scaleY) * 0.25;
    } else {
      scaleX += (1 - scaleX) * 0.2;
      scaleY += (1 - scaleY) * 0.2;
      currentAngle += (0 - currentAngle) * 0.2;
    }

    const finalScaleX = scaleX * clickScale;
    const finalScaleY = scaleY * clickScale;

    // 6. Apply GPU Matrix Transforms
    if (cursorDot) {
      cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
    }

    if (cursorRing) {
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) rotate(${currentAngle}deg) scale(${finalScaleX}, ${finalScaleY})`;
    }

    if (cursorGlow) {
      cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
    }

    requestAnimationFrame(renderPhysicsCursor);
  }
  requestAnimationFrame(renderPhysicsCursor);

  // 7. Interactive Magnetic & Hover Binding
  function bindMagneticHoverElements() {
    // Magnetic targets (buttons, links, pills, badges)
    const magneticSelectors = [
      '.btn-primary-cyan',
      '.btn-secondary-dark',
      '.btn-nav-talk',
      '.nav-link',
      '.service-badge-item',
      '.founder-social-btn',
      '.domain-chip',
      '.admin-leads-trigger',
      '.f-social',
      '.brand-logo'
    ].join(',');

    const magneticElements = document.querySelectorAll(magneticSelectors);
    magneticElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        isMagnetic = true;
        magneticTarget = el;
        if (cursorRing) cursorRing.classList.add('is-magnetic');
      });

      el.addEventListener('mouseleave', () => {
        isMagnetic = false;
        if (magneticTarget) {
          magneticTarget.style.transform = '';
          magneticTarget = null;
        }
        if (cursorRing) cursorRing.classList.remove('is-magnetic');
      });
    });

    // Content Hover targets with custom labels
    const hoverTargets = document.querySelectorAll('[data-cursor], a, button, .portfolio-vertical-card, .creator-card');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (el.closest('#navbar') && !el.classList.contains('btn-nav-talk')) return;
        isHovering = true;
        const text = el.getAttribute('data-cursor') || (el.tagName === 'BUTTON' || el.tagName === 'A' ? 'CLICK ↗' : 'VIEW ↗');
        if (cursorText) cursorText.textContent = text;
        if (cursorRing) cursorRing.classList.add('is-hovering');
        if (cursorDot) cursorDot.classList.add('is-hidden');
      });

      el.addEventListener('mouseleave', () => {
        if (el.closest('#navbar') && !el.classList.contains('btn-nav-talk')) return;
        isHovering = false;
        if (cursorText) cursorText.textContent = '';
        if (cursorRing) cursorRing.classList.remove('is-hovering');
        if (cursorDot) cursorDot.classList.remove('is-hidden');
      });
    });
  }

  bindMagneticHoverElements();
}

// ==========================================================================
// ==========================================================================
// 02. NAVBAR SCROLL ANIMATION, SMART DIRECTION & ACTIVE INDICATOR
// ==========================================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const navList = navbar.querySelector('.nav-list');
  const navLinks = navbar.querySelectorAll('.nav-link');
  let activeLink = navbar.querySelector('.nav-link.active');

  // ------------------------------------------------------------------------
  // A. Desktop Sliding Pill Indicator (.nav-indicator)
  // ------------------------------------------------------------------------
  let indicator = null;
  function positionIndicator(targetEl, isHover = false) {
    if (!indicator || !navList) return;
    if (!targetEl || targetEl.offsetParent === null) {
      indicator.style.opacity = '0';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const listRect = navList.getBoundingClientRect();
    const left = rect.left - listRect.left;
    const width = rect.width;

    indicator.style.width = `${Math.round(width)}px`;
    indicator.style.transform = `translate(${Math.round(left)}px, -50%) translateZ(0)`;
    indicator.style.opacity = '1';

    if (isHover) {
      indicator.classList.add('is-hovered');
    } else {
      indicator.classList.remove('is-hovered');
    }
  }

  if (navList) {
    indicator = navList.querySelector('.nav-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'nav-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      navList.appendChild(indicator);
    }

    // Set initial indicator position
    if (activeLink) {
      requestAnimationFrame(() => positionIndicator(activeLink, false));
    }

    // Hover interactions across desktop nav items
    navLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => positionIndicator(link, true));
      link.addEventListener('focus', () => positionIndicator(link, true));
    });

    navList.addEventListener('mouseleave', () => {
      activeLink = navbar.querySelector('.nav-link.active');
      if (activeLink) {
        positionIndicator(activeLink, false);
      } else if (indicator) {
        indicator.style.opacity = '0';
      }
    });

    // Recalculate indicator on resize / font load
    const handleResize = () => {
      activeLink = navbar.querySelector('.nav-link.active');
      if (activeLink) positionIndicator(activeLink, false);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    if (document.fonts) {
      document.fonts.ready.then(handleResize);
    }
  }

  // ------------------------------------------------------------------------
  // B. Scroll Direction & Floating State Transition
  // ------------------------------------------------------------------------
  let lastScrollY = window.scrollY || 0;
  let isHidden = false;
  let isScrolled = false;
  let isProgrammaticScroll = false;
  let scrollDownDistance = 0;
  let scrollUpDistance = 0;
  let lastScrollTime = performance.now();

  function onScrollUpdate(currentScrollY) {
    const scrollY = Math.max(0, currentScrollY);

    // Initial state near top of page (hero navbar)
    if (scrollY <= 55) {
      if (isScrolled) {
        navbar.classList.remove('scrolled');
        isScrolled = false;
      }
      if (isHidden) {
        navbar.classList.remove('nav-hidden');
        isHidden = false;
      }
      scrollDownDistance = 0;
      scrollUpDistance = 0;
      lastScrollY = scrollY;
      return;
    }

    // Scrolled state (compact, higher blur, sleek shadow)
    if (scrollY > 55 && !isScrolled) {
      navbar.classList.add('scrolled');
      isScrolled = true;
    }

    // If scrolling programmatically or mobile drawer is active, keep navbar pinned and visible
    if (isProgrammaticScroll || document.body.classList.contains('mobile-menu-active')) {
      if (isHidden) {
        navbar.classList.remove('nav-hidden');
        isHidden = false;
      }
      lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - lastScrollY;
    const now = performance.now();
    const timeDelta = Math.max(now - lastScrollTime, 1);
    const velocity = Math.abs(delta) / timeDelta;
    lastScrollTime = now;

    if (delta > 3) {
      // Scrolling down
      scrollUpDistance = 0;
      scrollDownDistance += delta;

      // Only hide if scrolled well past hero (> 280px) AND user is scrolling down quickly
      if (scrollY > 280 && (scrollDownDistance > 140 || velocity > 1.2) && !isHidden) {
        navbar.classList.add('nav-hidden');
        isHidden = true;
      }
    } else if (delta < -3) {
      // Scrolling up
      scrollDownDistance = 0;
      scrollUpDistance += Math.abs(delta);

      // Any intentional upward scroll reveals navbar smoothly
      if ((scrollUpDistance > 8 || scrollY <= 140) && isHidden) {
        navbar.classList.remove('nav-hidden');
        isHidden = false;
      }
    }

    lastScrollY = scrollY;
  }

  // Hook into Lenis smooth scroll and native scroll
  if (window.lenis) {
    window.lenis.on('scroll', (e) => onScrollUpdate(e.scroll));
  }
  window.addEventListener('scroll', () => {
    onScrollUpdate(window.scrollY);
  }, { passive: true });

  // Peek reveal: when cursor moves to top 50px of the viewport, bring navbar back
  window.addEventListener('mousemove', (e) => {
    if (e.clientY <= 50 && isHidden) {
      navbar.classList.remove('nav-hidden');
      isHidden = false;
    }
  }, { passive: true });

  // ------------------------------------------------------------------------
  // C. Section Scroll & In-Page Smooth Navigation
  // ------------------------------------------------------------------------
  const inPageLinks = navbar.querySelectorAll('.nav-menu a, .brand-logo');
  inPageLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;

      let targetEl = null;
      if (href.startsWith('#')) {
        targetEl = document.querySelector(href);
      } else if (href === '/index.html' && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
        targetEl = document.getElementById('hero');
      }

      if (targetEl) {
        e.preventDefault();
        isProgrammaticScroll = true;
        navbar.classList.remove('nav-hidden');
        isHidden = false;

        // Update active class & slide indicator
        if (link.classList.contains('nav-link')) {
          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
          activeLink = link;
          positionIndicator(link, false);
        }

        if (window.lenis) {
          window.lenis.scrollTo(targetEl, {
            offset: -80,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          const top = targetEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }

        setTimeout(() => {
          isProgrammaticScroll = false;
        }, 1300);
      }
    });
  });

  // ------------------------------------------------------------------------
  // D. ScrollSpy on Homepage Sections
  // ------------------------------------------------------------------------
  const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  if (isHomepage && 'IntersectionObserver' in window) {
    const sectionSelectors = [
      { id: 'hero', linkSelector: '.nav-link[href="/index.html"]' }
    ];

    const observer = new IntersectionObserver((entries) => {
      if (isProgrammaticScroll) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const match = sectionSelectors.find((s) => s.id === entry.target.id);
          if (match) {
            const targetNav = navbar.querySelector(match.linkSelector);
            if (targetNav && !targetNav.classList.contains('active')) {
              navLinks.forEach((l) => l.classList.remove('active'));
              targetNav.classList.add('active');
              activeLink = targetNav;
              positionIndicator(targetNav, false);
            }
          }
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sectionSelectors.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
  }

  // Initialize mobile drawer
  initMobileNav(navbar);
}

// ==========================================================================
// 02b. MOBILE NAVIGATION DRAWER & INTERACTION
// ==========================================================================
function initMobileNav(navbar) {
  let toggleBtn = document.getElementById('mobile-toggle');
  const navActions = navbar.querySelector('.nav-actions');

  // If mobile toggle doesn't exist on this page, create and append to navActions
  if (!toggleBtn && navActions) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-toggle';
    toggleBtn.id = 'mobile-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle navigation');
    toggleBtn.innerHTML = '<span class="toggle-bar"></span><span class="toggle-bar"></span>';
    navActions.appendChild(toggleBtn);
  }

  // Create or select mobile nav overlay
  let overlay = document.getElementById('mobile-nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.id = 'mobile-nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname.endsWith('index.html') || (!pathname.includes('work') && !pathname.includes('team') && !pathname.includes('creator'));
    const isWork = pathname.includes('work.html');
    const isTeam = pathname.includes('team.html');
    const isWhyUs = pathname.includes('why-us');

    overlay.innerHTML = `
      <div class="mobile-nav-backdrop-glow" aria-hidden="true"></div>
      <div class="mobile-nav-content">
        <div class="mobile-nav-header">
          <span class="mobile-nav-label">Navigation</span>
          <span class="mobile-nav-brand">HIGHVERZ</span>
        </div>
        <ul class="mobile-nav-list">
          <li class="mobile-nav-item">
            <a href="/index.html" class="mobile-nav-link ${isHome ? 'active' : ''}">
              <span class="mobile-nav-num">01</span>
              <span class="mobile-nav-text">Home</span>
            </a>
          </li>
          <li class="mobile-nav-item">
            <a href="/work.html" class="mobile-nav-link ${isWork ? 'active' : ''}">
              <span class="mobile-nav-num">02</span>
              <span class="mobile-nav-text">Work</span>
            </a>
          </li>
          <li class="mobile-nav-item">
            <a href="/team.html" class="mobile-nav-link ${isTeam ? 'active' : ''}">
              <span class="mobile-nav-num">03</span>
              <span class="mobile-nav-text">Team</span>
            </a>
          </li>
          <li class="mobile-nav-item">
            <a href="/why-us.html" class="mobile-nav-link ${isWhyUs ? 'active' : ''}">
              <span class="mobile-nav-num">04</span>
              <span class="mobile-nav-text">Why Us</span>
            </a>
          </li>
        </ul>
        <div class="mobile-nav-cta-box">
          <a href="#contact" class="mobile-nav-talk-btn" id="mobile-nav-talk-btn">
            <span>Let's Talk</span>
            <span class="btn-arrow-icon">↗</span>
          </a>
          <div class="mobile-nav-footer-meta">
            <a href="mailto:contact@highverz.com" class="mobile-nav-email">contact@highverz.com</a>
            <span class="mobile-nav-location">Dubai & Worldwide</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    if (toggleBtn) {
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-menu-active');
    if (window.lenis) window.lenis.stop();

    // Staggered Entrance Animation
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(overlay,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' }
      );
      gsap.fromTo(overlay.querySelectorAll('.mobile-nav-item'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.065, ease: 'power3.out', delay: 0.08 }
      );
      gsap.fromTo(overlay.querySelector('.mobile-nav-cta-box'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.28 }
      );
    }
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    if (toggleBtn) {
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('mobile-menu-active');
    if (window.lenis) window.lenis.start();

    if (typeof gsap !== 'undefined') {
      gsap.to(overlay, {
        opacity: 0,
        y: -16,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  // Handle all links inside drawer
  overlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#contact') {
        e.preventDefault();
        closeMenu();
        const modal = document.getElementById('enquiry-modal');
        if (modal) {
          modal.classList.add('is-active');
          document.body.classList.add('enquiry-modal-open');
        } else {
          const contactSec = document.getElementById('contact');
          if (contactSec) {
            contactSec.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = '/index.html#contact';
          }
        }
        return;
      }
      closeMenu();
    });
  });

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  // Close when tapping backdrop outside content
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeMenu();
    }
  });
}

// ==========================================================================
// 03. HERO CHOREOGRAPHY (WORD BLUR-FADE REVEAL — ROI Media style)
// ==========================================================================
function initHeroIntro(immediate = false) {
  const heroHeadline = document.getElementById('hero-headline');
  if (!heroHeadline) return;

  const line1Words = heroHeadline.querySelectorAll('.hero-headline-line:nth-child(1) .hl-word');
  const line2Words = heroHeadline.querySelectorAll('.hero-headline-line:nth-child(2) .hl-word');
  const platformChips = heroHeadline.querySelectorAll('.hl-platform-chips .platform-chip');
  const headlineLines = heroHeadline.querySelectorAll('.hero-headline-line');

  if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.hl-word, #hero-platform-icons, .platform-chip, #hero-desc, #hero-actions, .section-trusted', { 
      opacity: 1, y: 0, x: 0, scale: 1, filter: 'none', clearProps: 'all' 
    });
    headlineLines.forEach((line) => { line.style.overflow = 'visible'; });
    return;
  }

  headlineLines.forEach((line) => { line.style.overflow = 'visible'; });

  // Normal clean transition — zero blur, crisp fade and gentle upward slide
  gsap.set('.hl-word', { opacity: 0, y: 22 });
  if (platformChips.length) {
    gsap.set(platformChips, { opacity: 0, y: 10, scale: 0.9 });
  }
  gsap.set('#hero-platform-icons', { opacity: 1 });
  gsap.set('#hero-desc', { opacity: 0, y: 16 });
  gsap.set('#hero-actions', { opacity: 0, y: 18 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      // Clear inline properties so text is 100% natural, crisp, and responsive
      gsap.set('.hl-word, #hero-platform-icons, .platform-chip, #hero-desc, #hero-actions', { clearProps: 'opacity,transform,y,scale' });
    }
  });

  // 1. Line 1: Normal clean word reveal
  tl.fromTo(line1Words.length ? line1Words : '.hl-word',
    { opacity: 0, y: 22 },
    {
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.045,
      ease: 'power3.out',
    },
    0.05
  );

  // 2. Inline Platform Chips: normal clean slide-up
  if (platformChips.length) {
    tl.fromTo(platformChips,
      { opacity: 0, y: 10, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out'
      },
      0.3
    );
  } else {
    tl.fromTo('#hero-platform-icons',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      0.3
    );
  }

  // 3. Line 2: Normal clean word reveal
  if (line2Words.length) {
    tl.fromTo(line2Words,
      { opacity: 0, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.045,
        ease: 'power3.out',
      },
      0.22
    );
  }

  // 4. Subtitle paragraph: normal clean fade in
  tl.fromTo('#hero-desc',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
    0.45
  );

  // 5. Action gradient buttons: normal clean fade in
  tl.fromTo('#hero-actions',
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
    0.6
  );

  // 6. Trusted by ambitious brands strip (if present)
  tl.fromTo('.section-trusted',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
    0.75
  );

  // Hero parallax on scroll (gentle depth push)
  gsap.to('.hero-content', {
    y: -40,
    opacity: 0.5,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
    }
  });

  // Replay trigger on headline for testing & interactive polish
  if (!heroHeadline.hasAttribute('data-replay-attached')) {
    heroHeadline.setAttribute('data-replay-attached', 'true');
    heroHeadline.addEventListener('click', () => {
      initHeroIntro(false);
    });
  }
}

// Expose globally for replay / testing
window.initHeroIntro = initHeroIntro;

// Automatically re-trigger hero intro on Vite hot reload so updates are instantly visible
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    setTimeout(() => initHeroIntro(false), 80);
  });
}

// ==========================================================================
// 04. 2D HERO MONOLITH INITIALIZATION
// ==========================================================================
function init3DScene() {
  try {
    initHV3D('hv-canvas', 'hv-canvas-container');
  } catch (err) {
    console.warn('Hero visual initialization notice:', err);
  }
}

// ==========================================================================
// 05. STATS & MARQUEE SCROLL REVEAL
// ==========================================================================
function initStatsMarquee() {
  const statsSection = document.querySelector('.section-stats-marquee');
  const statsNumber = document.getElementById('stats-counter');
  if (!statsSection || !statsNumber) return;

  let activeCounterTween = null;

  function playCounterAnimation() {
    if (activeCounterTween) {
      activeCounterTween.kill();
    }

    const counter = { val: 0 };
    statsNumber.textContent = '0+';

    activeCounterTween = gsap.to(counter, {
      val: 4500000000,
      duration: 2.4,
      ease: 'power3.out',
      onUpdate: () => {
        statsNumber.textContent = Math.floor(counter.val).toLocaleString('en-US') + '+';
      },
      onComplete: () => {
        statsNumber.textContent = '4,500,000,000+';
        // Subtle glow pulse on completion
        gsap.fromTo(statsNumber,
          { filter: 'drop-shadow(0 0 35px rgba(0, 229, 255, 0.85))' },
          { filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.4))', duration: 0.9, ease: 'power2.out' }
        );
        activeCounterTween = null;
      }
    });
  }

  // Trigger whenever the 4.5B stats section enters the viewport (scrolling down or back up)
  ScrollTrigger.create({
    trigger: statsSection,
    start: 'top 85%',
    onEnter: () => {
      playCounterAnimation();
    },
    onEnterBack: () => {
      playCounterAnimation();
    }
  });

  // Fade-up reveal
  gsap.fromTo(statsNumber,
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 90%',
        toggleActions: 'play none none reverse',
      }
    }
  );

  // Caption reveal
  gsap.fromTo('.stats-caption',
    { opacity: 0, y: 20 },
    {
      opacity: 1, y: 0,
      duration: 1,
      ease: 'expo.out',
      delay: 0.15,
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      }
    }
  );

  // Marquee track reveal
  gsap.fromTo('.marquee-track-wrapper',
    { opacity: 0, y: 25 },
    {
      opacity: 1, y: 0,
      duration: 1.2,
      ease: 'expo.out',
      delay: 0.3,
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 86%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}


// ==========================================================================
// 05b. CREATORS GROWTH SHOWCASE (SIDE-BY-SIDE DUAL SHOWCASE)
// ==========================================================================
function initCreatorsSection() {
  const section = document.querySelector('.section-creators');
  const cards = document.querySelectorAll('.section-creators .creator-card');
  if (!section || !cards.length) return;

  // Format number with commas
  function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
  }

  const activeTweens = [];

  // Animate stat numbers and dynamic chips (days / "din", months, followers)
  function animateStats() {
    // Kill any ongoing tweens
    activeTweens.forEach((tw) => {
      if (tw && tw.kill) tw.kill();
    });
    activeTweens.length = 0;

    // 1. Follower counts (BEFORE / AFTER e.g. 0 to 100,000 and 0 to 400,000)
    const statNumbers = section.querySelectorAll('.stat-number');
    statNumbers.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (target === 0 || isNaN(target)) {
        el.textContent = '0';
        return;
      }

      el.textContent = '0';
      const obj = { val: 0 };
      const tw = gsap.to(obj, {
        val: target,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = formatNumber(obj.val);
        },
        onComplete: () => {
          el.textContent = formatNumber(target);
        }
      });
      activeTweens.push(tw);
    });

    // 2. Dynamic timeline / days ("din thing") / months / follower chips (.stat-dyn-num)
    const dynNums = section.querySelectorAll('.stat-dyn-num');
    dynNums.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;

      el.textContent = '0';
      const obj = { val: 0 };
      const tw = gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        },
        onComplete: () => {
          el.textContent = target;
        }
      });
      activeTweens.push(tw);
    });

    // 3. Dynamic background unified watermark growth graph (draw line path)
    const watermarkLine = section.querySelector('.watermark-line');
    if (watermarkLine) {
      const tw = gsap.fromTo(watermarkLine,
        { strokeDashoffset: 2400 },
        { strokeDashoffset: 0, duration: 2.5, ease: 'power2.out' }
      );
      activeTweens.push(tw);
    }
  }


  // Header scroll reveal
  gsap.fromTo('.creators-header',
    { opacity: 0, y: 35 },
    {
      opacity: 1, y: 0,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        once: true,
      }
    }
  );

  // Cards reveal with staggered entrance (once: true guarantees cards never disappear on scroll)
  gsap.fromTo(cards,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 1.1,
      stagger: 0.18,
      ease: 'expo.out',
      clearProps: 'transform',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        once: true,
      }
    }
  );

  // Trigger stat animation whenever the creators section enters the viewport
  ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      animateStats();
    }
  });

  // If section is already within viewport on page load/refresh
  if (section.getBoundingClientRect().top < window.innerHeight) {
    animateStats();
  }
}


// ==========================================================================
// 06. STATEMENT PARALLAX (ENHANCED)
// ==========================================================================
function initStatementParallax() {
  const lines = document.querySelectorAll('.stmt-line');
  if (!lines.length) return;

  // Stagger word reveals with clip-path
  lines.forEach((line, index) => {
    const speed = parseFloat(line.getAttribute('data-speed')) || 1;

    gsap.fromTo(line,
      { y: 60 * speed, opacity: 0.4 },
      {
        y: -20 * speed,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.section-statement',
          start: 'top 85%',
          end: 'bottom 20%',
          scrub: 1.2 + (index * 0.15),
        }
      }
    );
  });

  // Statement caption reveal
  gsap.fromTo('.statement-caption',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.statement-caption',
        start: 'top 88%',
        once: true,
      }
    }
  );

  // Watermark parallax
  gsap.to('.statement-watermark', {
    y: -100,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section-statement',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
    }
  });
}

// ==========================================================================
// 07. SERVICES CARDS STAGGER REVEAL
// ==========================================================================
function initServicesReveal() {
  const cards = document.querySelectorAll('.service-card-item');
  if (!cards.length) return;

  // Header reveal
  gsap.fromTo('.services-header-row',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.section-services',
        start: 'top 82%',
        once: true,
      }
    }
  );

  // Cards cascade from bottom smoothly
  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: (i % 5) * 0.06,
        ease: 'expo.out',
        clearProps: 'transform',
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          once: true,
        }
      }
    );
  });
  // Capability filter bar reveal
  const filterBar = document.querySelector('.services-filter-bar');
  if (filterBar) {
    gsap.fromTo(filterBar,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.section-services',
          start: 'top 82%',
          once: true,
        }
      }
    );
  }
}

// ==========================================================================
// 07b. WORK HERO & SERVICE FILTERS (DEDICATED WORK PAGE)
// ==========================================================================
function initWorkHeroIntro() {
  const workHero = document.querySelector('.work-hero-section');
  if (!workHero) return;

  animateWorkMetrics();

  function animateWorkMetrics() {
    const metricVals = workHero.querySelectorAll('.work-metric-val');
    metricVals.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-metric-target'));
      const prefix = el.getAttribute('data-metric-prefix') || '';
      const suffix = el.getAttribute('data-metric-suffix') || '';
      if (isNaN(target)) return;

      const isFloat = target % 1 !== 0;
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 1.8,
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
  }
}

// ==========================================================================
// 07c. TEAM & FOUNDERS SECTION ANIMATIONS
// ==========================================================================
function initTeamPageAnimations() {
  const teamHero = document.querySelector('.team-hero-section');
  if (!teamHero) return;

  // Dynamic count-up animations for leadership metrics
  let activeMetricTweens = [];
  function animateMetrics() {
    activeMetricTweens.forEach((tw) => {
      if (tw && tw.kill) tw.kill();
    });
    activeMetricTweens = [];

    const metricVals = teamHero.querySelectorAll('.team-metric-val');
    metricVals.forEach((el) => {
      const format = el.getAttribute('data-metric-format');
      if (format === 'billion') {
        const obj = { val: 0 };
        el.textContent = '0.0B+';
        const tw = gsap.to(obj, {
          val: 4.5,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = obj.val.toFixed(1) + 'B+';
          },
          onComplete: () => {
            el.textContent = '4.5B+';
            gsap.fromTo(el,
              { filter: 'drop-shadow(0 0 28px rgba(0, 229, 255, 0.85))' },
              { filter: 'drop-shadow(0 0 16px rgba(0, 229, 255, 0.4))', duration: 0.8, ease: 'power2.out' }
            );
          }
        });
        activeMetricTweens.push(tw);
      } else if (format === 'days') {
        const obj = { val: 0 };
        el.textContent = '0 Days';
        const tw = gsap.to(obj, {
          val: 60,
          duration: 1.9,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + ' Days';
          },
          onComplete: () => {
            el.textContent = '60 Days';
          }
        });
        activeMetricTweens.push(tw);
      } else if (format === 'percent') {
        const obj = { val: 0 };
        el.textContent = '0.0%';
        const tw = gsap.to(obj, {
          val: 99.4,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = obj.val.toFixed(1) + '%';
          },
          onComplete: () => {
            el.textContent = '99.4%';
            gsap.fromTo(el,
              { filter: 'drop-shadow(0 0 28px rgba(0, 229, 255, 0.85))' },
              { filter: 'drop-shadow(0 0 16px rgba(0, 229, 255, 0.4))', duration: 0.8, ease: 'power2.out' }
            );
          }
        });
        activeMetricTweens.push(tw);
      } else if (format === 'top') {
        const obj = { val: 15 };
        el.textContent = 'Top 15%';
        const tw = gsap.to(obj, {
          val: 1,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = 'Top ' + Math.round(obj.val) + '%';
          },
          onComplete: () => {
            el.textContent = 'Top 1%';
          }
        });
        activeMetricTweens.push(tw);
      }
    });
  }

  animateMetrics();

  // Re-trigger counter when scrolling back into view
  ScrollTrigger.create({
    trigger: '.team-metrics-grid',
    start: 'top 90%',
    onEnterBack: () => {
      animateMetrics();
    }
  });

  // Founder Accordion Cards Entrance & Expand/Collapse Interactivity
  const accordCards = document.querySelectorAll('.founder-accord-card');
  if (accordCards.length > 0) {
    accordCards.forEach((card, idx) => {
      // Entrance animation
      gsap.fromTo(card,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: idx * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );

      const body = card.querySelector('.accord-body');
      if (!body) return;

      // Ensure initially closed
      gsap.set(body, { height: 0, opacity: 0, overflow: 'hidden' });

      function toggleAccordion() {
        const isOpen = card.classList.contains('is-open');

        if (isOpen) {
          // Collapse
          card.classList.remove('is-open');
          card.setAttribute('aria-expanded', 'false');
          gsap.to(body, {
            height: 0,
            opacity: 0,
            duration: 0.38,
            ease: 'power3.inOut',
            onComplete: () => {
              if (window.ScrollTrigger) ScrollTrigger.refresh();
            }
          });
        } else {
          // Collapse any other open cards
          accordCards.forEach((other) => {
            if (other !== card && other.classList.contains('is-open')) {
              other.classList.remove('is-open');
              other.setAttribute('aria-expanded', 'false');
              const otherBody = other.querySelector('.accord-body');
              if (otherBody) {
                gsap.to(otherBody, { height: 0, opacity: 0, duration: 0.32, ease: 'power3.inOut' });
              }
            }
          });

          // Expand current
          card.classList.add('is-open');
          card.setAttribute('aria-expanded', 'true');
          gsap.fromTo(body,
            { height: 0, opacity: 0 },
            {
              height: 'auto',
              opacity: 1,
              duration: 0.45,
              ease: 'power3.out',
              onComplete: () => {
                if (window.ScrollTrigger) ScrollTrigger.refresh();
              }
            }
          );
        }
      }

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');

      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        toggleAccordion();
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          if (e.target.closest('a')) return;
          e.preventDefault();
          toggleAccordion();
        }
      });
    });
  }

  // Pillar Cards Entrance
  const pillarCards = document.querySelectorAll('.pillar-card');
  if (pillarCards.length > 0) {
    gsap.fromTo(pillarCards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.team-pillars-grid',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

// ==========================================================================
// WHY US & COMPARISON SECTION APPEAR ANIMATIONS
// ==========================================================================
function initWhyUsAnimations() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;



  // 2. Philosophy Cards Grid Stagger Entrance
  const philGrid = document.querySelector('.section-services .services-cards-grid');
  if (philGrid) {
    const philCards = philGrid.querySelectorAll('.service-card-item');
    if (philCards.length > 0) {
      if (isReducedMotion) {
        gsap.set(philCards, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(philCards,
          { opacity: 0, y: 35, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: philGrid,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    }
  }

  // 3. Comparison Section ("What makes us different") Appear Animations
  const compSection = document.querySelector('.comparison-section');
  if (!compSection) return;

  const compTitle = compSection.querySelector('.comp-main-title');
  const compCards = compSection.querySelector('.comp-dual-cards');
  const cardTrad = compSection.querySelector('.comp-card-traditional');
  const cardHv = compSection.querySelector('.comp-card-hv');
  const tradRows = compSection.querySelectorAll('.comp-card-traditional .comp-list-row');
  const hvRows = compSection.querySelectorAll('.comp-card-hv .comp-list-row');
  const tradDashes = compSection.querySelectorAll('.comp-card-traditional .val-dash-icon');
  const hvChecks = compSection.querySelectorAll('.comp-card-hv .val-check-icon');
  const compCta = compSection.querySelector('.comparison-cta');

  if (isReducedMotion) {
    if (compTitle) gsap.set(compTitle, { opacity: 1, y: 0 });
    if (cardTrad) gsap.set(cardTrad, { opacity: 1, x: 0, y: 0, scale: 1 });
    if (cardHv) gsap.set(cardHv, { opacity: 1, x: 0, y: 0, scale: 1 });
    gsap.set([...tradRows, ...hvRows], { opacity: 1, x: 0, y: 0 });
    gsap.set([...tradDashes, ...hvChecks], { opacity: 1, scale: 1 });
    if (compCta) gsap.set(compCta, { opacity: 1, y: 0 });
    return;
  }

  // Section Header Entrance
  if (compTitle) {
    gsap.fromTo(compTitle,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: compSection,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  // Dual Comparison Cards & Rows Orchestrated Entrance
  if (compCards && cardTrad && cardHv) {
    const isMobile = window.innerWidth <= 860;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: compCards,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });

    // 1. Cards Entrance: Glide in with gentle 3D-depth perspective
    tl.fromTo(cardTrad,
      {
        opacity: 0,
        y: 45,
        x: isMobile ? 0 : -32,
        scale: 0.96
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: 0.95,
        ease: 'power3.out'
      }
    );

    tl.fromTo(cardHv,
      {
        opacity: 0,
        y: 45,
        x: isMobile ? 0 : 32,
        scale: 0.96
      },
      {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: 0.95,
        ease: 'power3.out'
      },
      '-=0.75'
    );

    // 2. Card Top Headers (Badges & Titles)
    const cardTops = compCards.querySelectorAll('.comp-card-top');
    if (cardTops.length > 0) {
      tl.fromTo(cardTops,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out' },
        '-=0.55'
      );
    }

    // 3. Comparison Rows Stagger: Stagger down both cards
    if (tradRows.length > 0) {
      tl.fromTo(tradRows,
        { opacity: 0, y: 12, x: isMobile ? 0 : -10 },
        { opacity: 1, y: 0, x: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
        '-=0.45'
      );
    }

    if (hvRows.length > 0) {
      tl.fromTo(hvRows,
        { opacity: 0, y: 12, x: isMobile ? 0 : 10 },
        { opacity: 1, y: 0, x: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
        '-=0.65'
      );
    }

    // 4. Dash icons on traditional card fade in
    if (tradDashes.length > 0) {
      tl.fromTo(tradDashes,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
        '-=0.5'
      );
    }

    // 5. Highverz checkmark badges burst in with spring pop
    if (hvChecks.length > 0) {
      tl.fromTo(hvChecks,
        { scale: 0, opacity: 0, rotation: -30 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: 'back.out(2.5)'
        },
        '-=0.6'
      );
    }

    // 6. Call to Action Button Entrance
    if (compCta) {
      tl.fromTo(compCta,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        '-=0.25'
      );
    }
  }
}

function initServiceFilters() {
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const cards = document.querySelectorAll('.service-card-item');
  const countLabel = document.getElementById('active-services-count');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      let visibleCount = 0;

      // Filter cards with smooth fade/scale
      cards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const matches = filter === 'all' || category === filter;

        if (matches) {
          visibleCount++;
          card.style.display = 'flex';
          gsap.fromTo(card,
            { opacity: 0, scale: 0.96, y: 12 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        } else {
          gsap.to(card, {
            opacity: 0,
            scale: 0.96,
            y: 8,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
            }
          });
        }
      });

      if (countLabel) {
        countLabel.textContent = `${visibleCount} Capabilities`;
      }
    });
  });
}

// ==========================================================================
// ==========================================================================
// 08. PORTFOLIO ROLLING MARQUEE & TAB CONTROLS (INFLUENCERS FIRST)
// ==========================================================================
function initPortfolioGrid() {
  const toggleBtns = document.querySelectorAll('.portfolio-toggle-btn');
  const glider = document.getElementById('portfolio-glider');
  
  // Home page marquees
  const marqueeInfluencers = document.getElementById('portfolio-marquee-influencers');
  const marqueeBrands = document.getElementById('portfolio-marquee-brands');
  
  // Work page non-marquee showcase grids
  const showcaseInfluencers = document.getElementById('portfolio-showcase-influencers');
  const showcaseBrands = document.getElementById('portfolio-showcase-brands');

  if (!marqueeInfluencers && !marqueeBrands && !showcaseInfluencers && !showcaseBrands) return;

  // Switch between Influencers / Creators and Brands
  function switchPortfolioTab(tab) {
    toggleBtns.forEach((btn) => {
      const isTarget = btn.getAttribute('data-portfolio-tab') === tab;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    if (glider) {
      glider.classList.toggle('brands-active', tab === 'brands');
    }

    // Home page marquee handling
    if (marqueeInfluencers && marqueeBrands) {
      const targetMarquee = tab === 'brands' ? marqueeBrands : marqueeInfluencers;
      const otherMarquee = tab === 'brands' ? marqueeInfluencers : marqueeBrands;

      if (otherMarquee) {
        otherMarquee.classList.remove('active');
      }

      if (targetMarquee) {
        targetMarquee.classList.add('active');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(targetMarquee,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
          );
        }
      }
    }

    // Work page grid showcase handling
    if (showcaseInfluencers && showcaseBrands) {
      const targetShowcase = tab === 'brands' ? showcaseBrands : showcaseInfluencers;
      const otherShowcase = tab === 'brands' ? showcaseInfluencers : showcaseBrands;

      if (otherShowcase) {
        otherShowcase.classList.add('hidden');
        otherShowcase.classList.remove('active');
      }

      if (targetShowcase) {
        targetShowcase.classList.remove('hidden');
        targetShowcase.classList.add('active');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(targetShowcase,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
          );
        }
      }
    }
  }

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-portfolio-tab');
      switchPortfolioTab(tab);
    });
  });

  // Work page creator category filter chips
  const filterChips = document.querySelectorAll('.work-filter-chip');
  const creatorCards = document.querySelectorAll('.work-creator-card');

  if (filterChips.length && creatorCards.length) {
    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const filter = chip.getAttribute('data-creator-filter');

        creatorCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          const isMatch = filter === 'all' || category === filter;

          if (isMatch) {
            card.classList.remove('filtered-out');
            if (typeof gsap !== 'undefined') {
              gsap.fromTo(card,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform' }
              );
            }
          } else {
            card.classList.add('filtered-out');
          }
        });
      });
    });
  }

  // Portfolio header reveal
  if (typeof gsap !== 'undefined') {
    const pHeader = document.querySelector('.portfolio-header-container');
    if (pHeader) {
      gsap.fromTo(pHeader,
        { opacity: 0, y: 35 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '.section-portfolio',
            start: 'top 85%',
            once: true,
          }
        }
      );
    }

    // Marquee container reveal on scroll (Homepage)
    const marqueeContainer = document.querySelector('.portfolio-marquee-container');
    if (marqueeContainer) {
      gsap.fromTo(marqueeContainer,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 1,
          delay: 0.1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '.section-portfolio',
            start: 'top 80%',
            once: true,
          }
        }
      );
    }

    // Dedicated Work Page Portfolio Container reveal
    const workPortfolio = document.querySelector('.work-portfolio-container');
    if (workPortfolio) {
      gsap.fromTo(workPortfolio,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 1,
          delay: 0.08,
          ease: 'expo.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: '.section-portfolio',
            start: 'top 82%',
            once: true,
          }
        }
      );
    }
  }
}

// ==========================================================================
// 09. TESTIMONIALS REVEAL
// ==========================================================================
function initTestimonialsReveal() {
  const section = document.querySelector('.section-testimonials');
  const cards = document.querySelectorAll('.testi-card');
  if (!section || !cards.length) return;

  gsap.fromTo('.testimonials-header',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        once: true,
      }
    }
  );

  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40, scale: 0.98 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.9,
        delay: i * 0.1,
        ease: 'expo.out',
        clearProps: 'transform',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });
}

// ==========================================================================
// 10. PROCESS SINGLE-LINE CONNECTED SCROLL DRAW (ENHANCED)
// ==========================================================================
// ==========================================================================
// 10. PROCESS SINGLE-LINE CONNECTED SCROLL DRAW (ENHANCED)
// ==========================================================================
function initProcessScrollDraw() {
  const lineActive = document.getElementById('process-line-active');
  const lineHead = document.getElementById('process-line-head');
  const nodes = document.querySelectorAll('.process-track-node');
  const steps = document.querySelectorAll('.process-col');
  const processSection = document.querySelector('.section-process');
  const trackContainer = document.getElementById('process-track-container');

  if (!steps.length || !processSection || !trackContainer) return;

  // Header & section entrance animation
  gsap.fromTo('.process-header',
    { opacity: 0, y: 35 },
    {
      opacity: 1, y: 0,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: processSection,
        start: 'top 80%',
        once: true,
      }
    }
  );

  // Stagger in the process cards on entrance
  gsap.fromTo('.process-col',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.process-grid',
        start: 'top 85%',
        once: true,
      }
    }
  );

  // Compute exact horizontal centers of each step card
  const getStepCenters = () => {
    const trackWidth = trackContainer.offsetWidth || 1;
    return Array.from(steps).map(step => {
      const center = step.offsetLeft + step.offsetWidth / 2;
      return Math.min(100, Math.max(0, (center / trackWidth) * 100));
    });
  };

  // Function to set active state based on width percent
  const setProcessProgress = (pct, animate = false) => {
    const clamped = Math.min(100, Math.max(0, pct));
    if (lineActive) {
      if (animate) {
        gsap.to(lineActive, { width: `${clamped}%`, duration: 0.45, ease: 'power2.out' });
      } else {
        lineActive.style.width = `${clamped}%`;
      }
    }
    if (lineHead) {
      if (animate) {
        gsap.to(lineHead, { left: `${clamped}%`, duration: 0.45, ease: 'power2.out' });
      } else {
        lineHead.style.left = `${clamped}%`;
      }
    }

    const centers = getStepCenters();
    steps.forEach((step, idx) => {
      const targetCenter = centers[idx] || ((idx * 2 + 1) * 10);
      // Activate when line reaches within 5% of center or passes it
      if (clamped >= targetCenter - 6) {
        if (!step.classList.contains('active')) {
          step.classList.add('active');
          const iconBox = step.querySelector('.process-icon-box');
          if (iconBox) {
            gsap.fromTo(iconBox, { scale: 0.85 }, { scale: 1.06, duration: 0.35, ease: 'back.out(2)' });
          }
        }
      } else {
        step.classList.remove('active');
      }
    });

    nodes.forEach((node, idx) => {
      const targetCenter = centers[idx] || ((idx * 2 + 1) * 10);
      if (clamped >= targetCenter - 4) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  };

  // Initial state: first step active
  const initialCenters = getStepCenters();
  setProcessProgress(initialCenters[0] || 10, false);

  // Scroll scrub across the section
  ScrollTrigger.create({
    trigger: processSection,
    start: 'top 70%',
    end: 'bottom 50%',
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress;
      const centers = getStepCenters();
      const firstCenter = centers[0] || 10;
      const lastCenter = centers[centers.length - 1] || 90;
      // Interpolate smoothly from first step center to last step center
      const currentWidth = firstCenter + progress * (lastCenter - firstCenter + 5);
      setProcessProgress(currentWidth, false);
    }
  });

  // Interactive click on any step to jump progress to it
  steps.forEach((step, idx) => {
    step.addEventListener('click', () => {
      const centers = getStepCenters();
      const targetPct = centers[idx] || ((idx * 2 + 1) * 10);
      setProcessProgress(targetPct, true);
    });
  });

  // Recalculate on window resize
  window.addEventListener('resize', () => {
    const centers = getStepCenters();
    const activeSteps = document.querySelectorAll('.process-col.active');
    const lastActiveIdx = activeSteps.length - 1;
    if (lastActiveIdx >= 0 && centers[lastActiveIdx]) {
      setProcessProgress(centers[lastActiveIdx], false);
    }
  });
}

// ==========================================================================
// 11. CTA SECTION REVEAL
// ==========================================================================
function initCTAReveal() {
  const ctaSection = document.querySelector('.section-cta');
  if (!ctaSection) return;

  const isMobile = window.innerWidth <= 768;

  gsap.fromTo('.cta-left-content',
    { opacity: 0, x: isMobile ? 0 : -50, y: isMobile ? 25 : 0 },
    {
      opacity: 1, x: 0, y: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: ctaSection,
        start: 'top 75%',
        once: true,
      }
    }
  );

  gsap.fromTo('.cta-action-box',
    { opacity: 0, y: 30, scale: 0.9 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 1.2,
      delay: 0.15,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: ctaSection,
        start: 'top 72%',
        once: true,
      }
    }
  );

  gsap.fromTo('.cta-right-box',
    { opacity: 0, x: isMobile ? 0 : 50, y: isMobile ? 25 : 0 },
    {
      opacity: 1, x: 0, y: 0,
      duration: 1.4,
      delay: 0.25,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: ctaSection,
        start: 'top 70%',
        once: true,
      }
    }
  );
}

// ==========================================================================
// 12. MAGNETIC BUTTON PHYSICS
// ==========================================================================
function initMagneticElements() {
  const magneticItems = document.querySelectorAll(
    '.btn-primary-cyan, .btn-secondary-dark, .btn-primary-cyan-large, .btn-nav-talk, .portfolio-arrow-btn, .floating-badge-item'
  );

  magneticItems.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;

      gsap.to(btn, {
        x,
        y,
        duration: 0.35,
        ease: 'power3.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  });
}

// ==========================================================================
// 13. SCROLL VELOCITY REACTIVE EFFECTS
// ==========================================================================
function initScrollVelocityEffects() {
  // Section skewing disabled to prevent GPU repaint jitter, subpixel blurriness,
  // and hover conflicts on interactive card grids.
}

// ==========================================================================
// 14. INSTAGRAM REELS INTERACTIVE PLAYER (CASE STUDY PAGES)
// ==========================================================================
function initInstagramReelsPlayer() {
  const reelCards = document.querySelectorAll('.ig-reel-card');
  if (!reelCards.length) return;

  const cursorText = document.getElementById('cursor-text');

  reelCards.forEach((card) => {
    const video = card.querySelector('.ig-reel-video');
    const soundBtn = card.querySelector('.ig-sound-toggle-btn');
    const poster = card.querySelector('.ig-reel-poster');
    const progressFill = card.querySelector('.ig-reel-progress-fill');
    if (!video) return;

    // Helper to update sound icon state
    function updateSoundUI(isMuted) {
      if (!soundBtn) return;
      const mutedIcon = soundBtn.querySelector('.sound-icon-muted');
      const unmutedIcon = soundBtn.querySelector('.sound-icon-unmuted');
      if (mutedIcon) mutedIcon.style.display = isMuted ? 'block' : 'none';
      if (unmutedIcon) unmutedIcon.style.display = isMuted ? 'none' : 'block';
      soundBtn.setAttribute('title', isMuted ? 'Unmute Audio' : 'Mute Audio');
      soundBtn.setAttribute('aria-label', isMuted ? 'Unmute Audio' : 'Mute Audio');
    }

    // Synchronize card UI with native video events
    video.addEventListener('play', () => {
      card.classList.add('is-playing');
      card.setAttribute('data-cursor', 'PAUSE');
      if (cursorText && card.matches(':hover')) {
        cursorText.textContent = 'PAUSE';
      }
      if (poster) {
        poster.style.opacity = '0';
      }
      updateSoundUI(video.muted);
    });

    video.addEventListener('pause', () => {
      card.classList.remove('is-playing');
      card.setAttribute('data-cursor', 'PLAY REEL');
      if (cursorText && card.matches(':hover')) {
        cursorText.textContent = 'PLAY REEL';
      }
    });

    video.addEventListener('ended', () => {
      card.classList.remove('is-playing');
      card.setAttribute('data-cursor', 'PLAY REEL');
      if (cursorText && card.matches(':hover')) {
        cursorText.textContent = 'PLAY REEL';
      }
      if (progressFill) progressFill.style.width = '0%';
    });

    // Real-time playback progress bar
    if (progressFill) {
      video.addEventListener('timeupdate', () => {
        if (video.duration) {
          const pct = (video.currentTime / video.duration) * 100;
          progressFill.style.width = `${pct}%`;
        }
      });
    }

    // Play helper with audio user gesture handling
    function playVideo() {
      // Pause all other playing reels on the page first
      reelCards.forEach((otherCard) => {
        if (otherCard !== card) {
          const otherVideo = otherCard.querySelector('.ig-reel-video');
          if (otherVideo && !otherVideo.paused) {
            otherVideo.pause();
          }
        }
      });

      // User clicked Play: try unmuted audio playback
      video.muted = false;
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            updateSoundUI(false);
          })
          .catch((err) => {
            // If browser blocks unmuted audio autoplay, fallback to muted play
            console.warn('Audio policy fallback to muted play:', err);
            video.muted = true;
            updateSoundUI(true);
            video.play().catch((e) => console.warn('Muted play error:', e));
          });
      }
    }

    // Toggle play/pause
    function togglePlayback() {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    }

    // Sound toggle button (prevents pausing or re-triggering card click)
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        video.muted = !video.muted;
        updateSoundUI(video.muted);

        // If paused when unmuting, start playing
        if (video.paused) {
          playVideo();
        }
      });
    }

    // Direct click anywhere on the card toggles play and pause
    card.addEventListener('click', (e) => {
      if (e.target.closest('.ig-sound-toggle-btn') || e.target.closest('a')) return;
      togglePlayback();
    });

    // Keyboard accessibility (Space or Enter on card)
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (e.target.closest('.ig-sound-toggle-btn')) return;
        e.preventDefault();
        togglePlayback();
      }
    });
  });

  // Smooth entrance stagger for reels
  if (typeof gsap !== 'undefined') {
    gsap.fromTo('.ig-reel-card',
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'expo.out',
        delay: 0.15
      }
    );

    gsap.fromTo('.breakdown-card',
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.highverz-agency-breakdown',
          start: 'top 82%',
          once: true
        }
      }
    );
  }
}




