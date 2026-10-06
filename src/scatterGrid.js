export function initScatterGrid(container, options = {}) {
  const dotSize = options.dotSize || 3;
  const dotGap = options.dotGap || 2;
  const radius = options.radius || 200;
  const strength = options.strength || 1.5;
  const stiffness = options.stiffness || 0.02;
  const damping = options.damping || 0.88;
  const bleed = options.bleed || 50;
  const base = options.base || [30, 41, 59]; // slate-800
  const accent = options.accent || [0, 229, 255]; // cyan
  const STEPS = 14;

  // Make sure container has relative positioning
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  // Enable pointer events on the container so we can track mouse over it
  container.style.pointerEvents = 'auto';

  const canvas = document.createElement('canvas');
  canvas.classList.add('footer-scatter-canvas');
  // It shouldn't block pointer events for the container itself, but we track on window anyway
  canvas.style.pointerEvents = 'none'; 
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function buildRamp(from, to) {
    const ramp = [];
    for (let i = 0; i < STEPS; i++) {
      const t = i / (STEPS - 1);
      const r = Math.round(from[0] + (to[0] - from[0]) * t);
      const g = Math.round(from[1] + (to[1] - from[1]) * t);
      const b = Math.round(from[2] + (to[2] - from[2]) * t);
      ramp.push(`rgb(${r}, ${g}, ${b})`);
    }
    return ramp;
  }

  let ramp = buildRamp(base, accent);
  let dots = [];
  let ripples = [];
  let width = 0;
  let height = 0;
  let pointerX = -9999;
  let pointerY = -9999;
  let clock = 0;
  let raf = 0;
  
  let resizeTimer;
  
  function build() {
    const rect = container.getBoundingClientRect();
    const boxW = Math.max(1, Math.round(rect.width));
    const boxH = Math.max(1, Math.round(rect.height));
    width = boxW + bleed * 2;
    height = boxH + bleed * 2;
    
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.style.left = -bleed + "px";
    canvas.style.top = -bleed + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const mask = document.createElement("canvas");
    mask.width = width;
    mask.height = height;
    const mctx = mask.getContext("2d", { willReadFrequently: true });
    if (!mctx) return;
    
    // Check if there is an image to use
    const existingImg = container.querySelector('img');
    
    const drawAndExtract = () => {
      const data = mctx.getImageData(0, 0, width, height).data;
      
      const minStep = Math.max(2, dotSize + dotGap);
      let step = minStep;
      
      const countAt = s => {
        let n = 0;
        const half = s / 2;
        for (let y = half; y < height; y += s) {
          for (let x = half; x < width; x += s) {
            const px = (Math.round(y) * width + Math.round(x)) * 4;
            if (data[px + 3] > 60) n++; // Alpha threshold
          }
        }
        return n;
      };
      
      let count = countAt(step);
      let guard = 0;
      while (count > 8000 && guard < 20) {
        step *= 1.15;
        count = countAt(step);
        guard++;
      }
      
      const nextDots = [];
      const half = step / 2;
      for (let y = half; y < height; y += step) {
        for (let x = half; x < width; x += step) {
          const px = (Math.round(y) * width + Math.round(x)) * 4;
          if (data[px + 3] > 60) {
            nextDots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
          }
        }
      }
      dots = nextDots;
    };

    if (existingImg && existingImg.complete && existingImg.naturalWidth > 0) {
      const aspect = existingImg.naturalWidth / existingImg.naturalHeight;
      let w = boxW; // Use full width of container
      let h = w / aspect;
      if (h > boxH) {
          h = boxH;
          w = h * aspect;
      }
      // Center in canvas (which is box + bleed)
      mctx.drawImage(existingImg, bleed + (boxW - w)/2, bleed + (boxH - h)/2, w, h);
      
      // Hide the original image to only show dots
      existingImg.style.opacity = 0;
      
      drawAndExtract();
    } else if (existingImg) {
      existingImg.onload = () => {
        build();
      };
    } else {
      let text = options.text || "HIGHVERZ";
      let size = boxH * 0.8;
      mctx.font = `900 ${size}px "Inter", sans-serif`;
      
      const measured = mctx.measureText(text).width;
      if (measured > 0 && measured > boxW * 0.9) {
        size = size * (boxW * 0.9 / measured);
        mctx.font = `900 ${size}px "Inter", sans-serif`;
      }
      
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.fillStyle = "#000";
      mctx.fillText(text, width / 2, height / 2);
      drawAndExtract();
    }
  }
  
  function simulate() {
    const r2 = radius * radius;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = d.x - pointerX;
      const dy = d.y - pointerY;
      const dist2 = dx * dx + dy * dy;
      
      if (dist2 < r2 && dist2 > 0.5) {
        const dist = Math.sqrt(dist2);
        const f = (1 - dist / radius) * strength;
        d.vx += (dx / dist) * f;
        d.vy += (dy / dist) * f;
      }
      
      for (let j = 0; j < ripples.length; j++) {
        const rp = ripples[j];
        const rx = d.x - rp.x;
        const ry = d.y - rp.y;
        const rd = Math.sqrt(rx * rx + ry * ry) || 1;
        const band = Math.abs(rd - rp.r);
        if (band < 26) {
          const f = (1 - band / 26) * 2.4;
          d.vx += (rx / rd) * f;
          d.vy += (ry / rd) * f;
        }
      }
      
      d.vx += (d.hx - d.x) * stiffness;
      d.vy += (d.hy - d.y) * stiffness;
      d.vx *= damping;
      d.vy *= damping;
      d.x += d.vx;
      d.y += d.vy;
    }
    
    for (let j = ripples.length - 1; j >= 0; j--) {
      ripples[j].r += 14;
      if (ripples[j].r > Math.max(width, height) * 1.2) {
        ripples.splice(j, 1);
      }
    }
  }
  
  function paint() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const ox = d.x - d.hx;
      const oy = d.y - d.hy;
      const disp = Math.sqrt(ox * ox + oy * oy);
      
      let level = Math.min(1, disp / 24);
      let lift = 0;
      
      const s = Math.sin(d.hx * 0.012 - clock * 1.6);
      lift = s * 1.2;
      level = Math.max(level, Math.max(0, s - 0.86) * 3.2);
      
      const idx = Math.min(STEPS - 1, Math.max(0, Math.round(level * (STEPS - 1))));
      ctx.fillStyle = ramp[idx];
      ctx.fillRect(Math.round(d.x - dotSize / 2), Math.round(d.y + lift - dotSize / 2), dotSize, dotSize);
    }
  }
  
  let last = 0;
  const FIXED = 1/60;
  let acc = 0;
  
  function loop(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : FIXED;
    last = now;
    clock += dt;
    acc += dt;
    
    let guard = 0;
    while (acc >= FIXED && guard < 5) {
      simulate();
      acc -= FIXED;
      guard++;
    }
    
    paint();
    raf = requestAnimationFrame(loop);
  }
  
  build();
  raf = requestAnimationFrame(loop);
  
  const handlePointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
  };
  
  const handlePointerLeave = () => {
    pointerX = -9999;
    pointerY = -9999;
  };
  
  const handlePointerDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > width || y > height) return;
    
    if (ripples.length > 2) ripples.shift();
    ripples.push({ x, y, r: 0 });
  };
  
  window.addEventListener("pointermove", handlePointerMove, {passive: true});
  window.addEventListener("pointerdown", handlePointerDown, {passive: true});
  container.addEventListener("pointerleave", handlePointerLeave, {passive: true});
  
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      paint();
    }, 120);
  });
  resizeObserver.observe(container);
  
  return () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerDown);
    container.removeEventListener("pointerleave", handlePointerLeave);
  };
}
