/**
 * HIGHVERZ MONOLITH — Premium Architectural Brand Sculpture
 *
 * Art Direction:
 *   Deep Obsidian (#0A0D0F) front face with satin micro-sheen
 *   Substantial Graphite (#151A1D) dimensional extrusion depth
 *   Machined Silver (#9CA5A8 -> #DDE4E8) directional key-light bevels
 *   Controlled Highverz Cyan (#25C8D9) edge reflection strictly on the right
 *   Subtle cool blue-gray studio backlight for razor-sharp silhouette separation
 *   Clean architectural studio grounding (contact shadow & minimal pedestal)
 *
 * Rules:
 *   - No wireframes, rings, low-poly geometry, or gaming effects.
 *   - Logo is massive (45%-55% of hero), solid, heavy, and instantly recognizable.
 *   - Motion is ultra-refined: micro light shifts on mouse move, elegant idle sweep.
 */

export function initHV3D(canvasId, containerId) {
  const canvas = document.getElementById(canvasId);
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Canvas element not needed for SVG 2.5D monolith
  if (canvas) canvas.style.display = 'none';

  // Official Highverz HV vector silhouette (exact geometry)
  const D = 'M 0 13 L 0 20 L 3 28 L 101 186 L 101 188 L 242 417 L 252 429 L 266 435 L 441 435 L 445 433 L 450 427 L 450 418 L 337 231 L 337 217 L 343 211 L 350 209 L 407 210 L 422 215 L 440 229 L 458 255 L 558 425 L 566 431 L 576 434 L 713 434 L 722 431 L 733 422 L 745 404 L 745 402 L 777 353 L 777 351 L 892 167 L 892 159 L 889 153 L 885 149 L 878 147 L 663 147 L 658 148 L 650 156 L 649 162 L 652 172 L 737 304 L 737 311 L 706 357 L 695 376 L 692 379 L 689 379 L 685 375 L 647 311 L 602 240 L 598 231 L 579 202 L 562 172 L 551 159 L 537 150 L 526 147 L 302 147 L 295 144 L 287 136 L 218 22 L 207 10 L 193 2 L 185 0 L 17 0 L 7 4 Z';

  // Inject or update styles
  let styleEl = document.getElementById('hv-monolith-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'hv-monolith-css';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* ── Monolith Stage ── */
    .hv-monolith {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2;
    }

    /* ── Atmospheric Studio Background ── */
    .hv-monolith-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    /* Soft cool blue-gray backlight for silhouette separation */
    .hv-monolith-bg::before {
      content: '';
      position: absolute;
      top: 16%;
      left: 24%;
      width: 68%;
      height: 68%;
      background: radial-gradient(
        ellipse 58% 50% at 52% 48%,
        rgba(35, 55, 72, 0.45) 0%,
        rgba(18, 30, 40, 0.24) 40%,
        rgba(6, 8, 9, 0) 74%
      );
      filter: blur(55px);
      transform: rotate(-3deg);
    }

    /* Architectural Studio Wall Highlight Edge */
    .hv-monolith-bg::after {
      content: '';
      position: absolute;
      top: 10%;
      right: 22%;
      width: 1px;
      height: 72%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(37, 200, 217, 0.10) 25%,
        rgba(156, 165, 168, 0.08) 65%,
        transparent 100%
      );
    }

    /* ── Monolith Inner Dimensional Frame ── */
    .hv-monolith-inner {
      position: relative;
      width: clamp(440px, 50vw, 700px);
      transform: perspective(1400px) rotateY(6.5deg) rotateX(1.8deg);
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ── SVG Master Visual ── */
    .hv-monolith-svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
      filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.75))
              drop-shadow(0 8px 20px rgba(0, 0, 0, 0.55));
    }

    /* ── Studio Pedestal & Contact Shadow ── */
    .hv-pedestal-wrap {
      position: relative;
      width: 86%;
      margin: 10px auto 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Heavy diffuse contact shadow directly on ground */
    .hv-ground-shadow {
      width: 96%;
      height: 22px;
      background: radial-gradient(
        ellipse 52% 50% at 50% 50%,
        rgba(0, 0, 0, 0.85) 0%,
        rgba(0, 0, 0, 0.45) 45%,
        transparent 75%
      );
      filter: blur(8px);
      margin-top: -8px;
    }

    /* Architectural razor pedestal rail */
    .hv-pedestal-rail {
      width: 100%;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(25, 32, 38, 0.4) 15%,
        rgba(156, 165, 168, 0.35) 45%,
        rgba(37, 200, 217, 0.4) 75%,
        rgba(25, 32, 38, 0.3) 88%,
        transparent 100%
      );
      border-radius: 1px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    /* ── Reveal & Idle Animations ── */
    .hv-depth-group,
    .hv-face-group,
    .hv-bevel-group,
    .hv-cyan-group,
    .hv-sweep-group,
    .hv-pedestal-wrap {
      opacity: 0;
      transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Progressive cinematic light reveal sequence */
    .hv-monolith.phase-1 .hv-depth-group { opacity: 1; }
    .hv-monolith.phase-2 .hv-face-group  { opacity: 1; }
    .hv-monolith.phase-3 .hv-bevel-group { opacity: 1; }
    .hv-monolith.phase-4 .hv-cyan-group,
    .hv-monolith.phase-4 .hv-pedestal-wrap { opacity: 1; }
    .hv-monolith.phase-5 .hv-sweep-group { opacity: 1; }

    /* When settled or immediately in fallback, full opacity */
    .hv-monolith.settled .hv-depth-group,
    .hv-monolith.settled .hv-face-group,
    .hv-monolith.settled .hv-bevel-group,
    .hv-monolith.settled .hv-cyan-group,
    .hv-monolith.settled .hv-pedestal-wrap {
      opacity: 1 !important;
    }

    /* Subtle idle float (max 2-3px vertical, luxury stillness) */
    @keyframes hv-monolith-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }

    .hv-monolith.settled .hv-monolith-inner {
      animation: hv-monolith-float 8s ease-in-out infinite;
    }

    /* Extremely slow, elegant light sweep across front face */
    @keyframes hv-light-sweep {
      0%   { transform: translateX(-350px) rotate(15deg); opacity: 0; }
      15%  { opacity: 0.35; }
      85%  { opacity: 0.35; }
      100% { transform: translateX(1250px) rotate(15deg); opacity: 0; }
    }

    .hv-monolith.settled .hv-sweep-bar {
      animation: hv-light-sweep 12s ease-in-out infinite;
      animation-delay: 1.5s;
    }
  `;

  /* ═══════════════════════════════════════════════
     DENSE EXTRUSION DEPTH (Solid Monumental Slabs)
     Offsetting towards bottom-right simulates real perspective depth.
     ═══════════════════════════════════════════════ */
  const DEPTH_LAYERS_COUNT = 24;
  let depthSvgMarkup = '';

  for (let i = DEPTH_LAYERS_COUNT; i >= 1; i--) {
    const progress = i / DEPTH_LAYERS_COUNT;
    const x = i * 1.15;
    const y = i * 0.85;

    // Color gradient: deep obsidian near back (#0a0d0f), graphite near front (#161b20)
    const r = Math.round(10 + (1 - progress) * 12);
    const g = Math.round(13 + (1 - progress) * 14);
    const b = Math.round(15 + (1 - progress) * 17);
    const fillHex = `rgb(${r}, ${g}, ${b})`;

    depthSvgMarkup += `<use href="#hv-shape" x="${x}" y="${y}" fill="${fillHex}" />\n`;
  }

  // Create monolith DOM
  const monolith = document.createElement('div');
  monolith.className = 'hv-monolith';
  monolith.innerHTML = `
    <div class="hv-monolith-bg" aria-hidden="true"></div>
    <div class="hv-monolith-inner">
      <svg class="hv-monolith-svg" viewBox="-20 -20 960 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Master HV path definition -->
          <path id="hv-shape" d="${D}"/>

          <!-- 01. FRONT FACE KEY-LIGHT GRADIENT (Obsidian with satin falloff) -->
          <linearGradient id="hv-face-specular" x1="50" y1="20" x2="880" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="#242c33" />
            <stop offset="22%"  stop-color="#1b2126" />
            <stop offset="50%"  stop-color="#13171a" />
            <stop offset="80%"  stop-color="#0c0f12" />
            <stop offset="100%" stop-color="#080a0c" />
          </linearGradient>

          <!-- 02. SATIN SHEEN (Subtle upper shoulder highlight for tactile materiality) -->
          <radialGradient id="hv-face-sheen" cx="28%" cy="22%" r="48%">
            <stop offset="0%"   stop-color="rgba(215, 228, 238, 0.16)" />
            <stop offset="45%"  stop-color="rgba(180, 195, 205, 0.05)" />
            <stop offset="100%" stop-color="rgba(0, 0, 0, 0)" />
          </radialGradient>

          <!-- 03. DIRECTIONAL SILVER BEVEL HIGHLIGHT (Key light: upper-left crisp edges) -->
          <linearGradient id="hv-silver-bevel" x1="0" y1="0" x2="892" y2="435" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="rgba(240, 245, 248, 0.88)" />
            <stop offset="20%"  stop-color="rgba(185, 195, 202, 0.58)" />
            <stop offset="48%"  stop-color="rgba(140, 150, 158, 0.32)" />
            <stop offset="78%"  stop-color="rgba(100, 110, 118, 0.14)" />
            <stop offset="100%" stop-color="rgba(60, 70, 78, 0.04)" />
          </linearGradient>

          <!-- 04. CONTROLLED HIGHVERZ CYAN RIM (Right edge accent ONLY) -->
          <linearGradient id="hv-cyan-rim" x1="300" y1="217" x2="892" y2="217" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="rgba(37, 200, 217, 0)" />
            <stop offset="68%"  stop-color="rgba(37, 200, 217, 0)" />
            <stop offset="85%"  stop-color="rgba(37, 200, 217, 0.45)" />
            <stop offset="96%"  stop-color="rgba(37, 200, 217, 0.85)" />
            <stop offset="100%" stop-color="rgba(37, 200, 217, 0.95)" />
          </linearGradient>

          <!-- 05. AMBIENT DEPTH OCCLUSION RIM (Dark groove under front slab) -->
          <linearGradient id="hv-occlusion-bevel" x1="0" y1="0" x2="892" y2="435" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="rgba(0, 0, 0, 0.3)" />
            <stop offset="100%" stop-color="rgba(0, 0, 0, 0.8)" />
          </linearGradient>

          <!-- 06. TRAVELING LIGHT SWEEP GRADIENT -->
          <linearGradient id="hv-sweep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="rgba(255, 255, 255, 0)" />
            <stop offset="40%"  stop-color="rgba(230, 242, 250, 0.18)" />
            <stop offset="50%"  stop-color="rgba(255, 255, 255, 0.28)" />
            <stop offset="60%"  stop-color="rgba(37, 200, 217, 0.18)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
          </linearGradient>

          <!-- Clip path for front face light reflections -->
          <clipPath id="hv-face-clip">
            <use href="#hv-shape"/>
          </clipPath>
        </defs>

        <!-- ━━━ 1. EXTRUSION SLAB DEPTH (Solid Monumental Body) ━━━ -->
        <g class="hv-depth-group">
          ${depthSvgMarkup}
        </g>

        <!-- ━━━ 2. AMBIENT OCCLUSION GROOVE (Delineates front slab from side depth) ━━━ -->
        <g class="hv-depth-group">
          <use href="#hv-shape" x="0.8" y="0.6" fill="none" stroke="url(#hv-occlusion-bevel)" stroke-width="2.5" />
        </g>

        <!-- ━━━ 3. FRONT MONOLITH FACE (Obsidian with satin key-light falloff) ━━━ -->
        <g class="hv-face-group">
          <!-- Deep obsidian body -->
          <use href="#hv-shape" fill="url(#hv-face-specular)"/>
          <!-- Satin specular sheen on upper shoulder -->
          <use href="#hv-shape" fill="url(#hv-face-sheen)"/>
        </g>

        <!-- ━━━ 4. MACHINED SILVER BEVEL (Key-light catches top & left edges) ━━━ -->
        <g class="hv-bevel-group">
          <use href="#hv-shape" fill="none" stroke="url(#hv-silver-bevel)" stroke-width="2" stroke-linejoin="round" />
        </g>

        <!-- ━━━ 5. CONTROLLED CYAN RIM LIGHT (Right-facing perimeter only) ━━━ -->
        <g class="hv-cyan-group">
          <use href="#hv-shape" fill="none" stroke="url(#hv-cyan-rim)" stroke-width="2.4" stroke-linejoin="round" />
        </g>

        <!-- ━━━ 6. SATIN LIGHT SWEEP (Subtle traveling highlight across front plane) ━━━ -->
        <g class="hv-sweep-group" clip-path="url(#hv-face-clip)">
          <rect class="hv-sweep-bar" x="-350" y="-80" width="300" height="600" fill="url(#hv-sweep-gradient)" />
        </g>
      </svg>

      <!-- Pedestal Stage & Contact Shadow -->
      <div class="hv-pedestal-wrap">
        <div class="hv-ground-shadow"></div>
        <div class="hv-pedestal-rail"></div>
      </div>
    </div>
  `;

  container.appendChild(monolith);

  /* ═══════════════════════════════════════════════
     CINEMATIC REVEAL SEQUENCE (2.0s Total)
     0.0s: Silhouette / dark stage
     0.3s: Extrusion depth and studio back ambient appear
     0.7s: Obsidian front surface catches key light
     1.0s: Silver bevel catches directional highlight
     1.3s: Cyan rim accent strikes right edge + pedestal grounds
     1.8s: Settles into quiet luxury stillness
     ═══════════════════════════════════════════════ */
  requestAnimationFrame(() => {
    setTimeout(() => monolith.classList.add('phase-1'), 250);
    setTimeout(() => monolith.classList.add('phase-2'), 650);
    setTimeout(() => monolith.classList.add('phase-3'), 1000);
    setTimeout(() => monolith.classList.add('phase-4'), 1350);
    setTimeout(() => monolith.classList.add('phase-5'), 1700);
    setTimeout(() => monolith.classList.add('settled'), 2000);
  });

  /* ═══════════════════════════════════════════════
     MICRO LIGHT & PERSPECTIVE INTERACTION
     Mouse shifts LIGHT and SUBTLE PERSPECTIVE (~1.5 deg max).
     Never full 3D spinning or disorientation.
     ═══════════════════════════════════════════════ */
  const innerEl = monolith.querySelector('.hv-monolith-inner');
  const specularGrad = monolith.querySelector('#hv-face-specular');
  const cyanRimGrad = monolith.querySelector('#hv-cyan-rim');

  let mouseX = 0;
  let mouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════════
     SCROLL PARALLAX (Natural recession into depth)
     ═══════════════════════════════════════════════ */
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    const hero = document.getElementById('hero');
    if (hero) {
      const r = hero.getBoundingClientRect();
      scrollProgress = Math.max(0, Math.min(1.4, -r.top / (r.height || 1)));
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════════
     FRAME LOOP (Damped interpolation for buttery motion)
     ═══════════════════════════════════════════════ */
  function tick() {
    requestAnimationFrame(tick);

    currentMouseX += (mouseX - currentMouseX) * 0.04;
    currentMouseY += (mouseY - currentMouseY) * 0.04;

    // Shift key light gradient smoothly across surface
    if (specularGrad) {
      const shiftX = 50 + currentMouseX * 70;
      const shiftY = 20 - currentMouseY * 45;
      specularGrad.setAttribute('x1', String(shiftX));
      specularGrad.setAttribute('y1', String(shiftY));
    }

    // Rightward mouse increases cyan rim presence
    if (cyanRimGrad) {
      const stops = cyanRimGrad.querySelectorAll('stop');
      const boost = Math.max(0, currentMouseX) * 0.2;
      if (stops[3]) stops[3].setAttribute('stop-color', `rgba(37, 200, 217, ${0.85 + boost})`);
    }

    // Micro perspective tilt (maximum 1.5° yaw, 0.8° pitch)
    if (innerEl) {
      const yaw = 6.5 + currentMouseX * 1.5;
      const pitch = 1.8 - currentMouseY * 0.8;
      innerEl.style.transform = `perspective(1400px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;
    }

    // Scroll recession
    if (scrollProgress > 0) {
      const sp = Math.min(1.2, scrollProgress);
      monolith.style.opacity = String(Math.max(0, 1 - sp * 1.3));
      monolith.style.transform = `translateY(${sp * 35}px) scale(${1 - sp * 0.08})`;
    } else {
      monolith.style.opacity = '1';
      monolith.style.transform = 'none';
    }
  }

  tick();

  // Public API compatibility
  return {
    scene: null,
    camera: null,
    renderer: null,
    masterGroup: null,
    toggleExplode: () => false,
    resize: () => {},
  };
}
