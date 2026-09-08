/**
 * HIGHVERZ — Premium Dual-Theme Engine
 * "The Studio" (Light) ↔ "After Hours" (Dark)
 * 
 * Features:
 * - Cinematic radial transition overlay from theme button position
 * - localStorage persistence + system preference detection
 * - Logo swap (dark ↔ light variants)
 * - SVG Sun/Moon icon animation
 * - prefers-reduced-motion aware
 * - FOUC prevention (inline script in <head> handles initial state)
 */

const STORAGE_KEY = 'highverz-theme';
// ─── Get saved or system theme ───
function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// ─── Apply theme to DOM ───
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  updateIcons(theme);
  updateLogos(theme);
}

// ─── Update Sun / Moon icon visibility ───
function updateIcons(theme) {
  const sunIcons = document.querySelectorAll('.theme-icon-sun');
  const moonIcons = document.querySelectorAll('.theme-icon-moon');

  sunIcons.forEach(icon => {
    icon.style.opacity = theme === 'light' ? '1' : '0';
    icon.style.transform = theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)';
  });
  moonIcons.forEach(icon => {
    icon.style.opacity = theme === 'dark' ? '1' : '0';
    icon.style.transform = theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)';
  });
}

// ─── Swap nav logos based on theme ───
function updateLogos(theme) {
  const navLogos = document.querySelectorAll('.nav-brand-logo-img');
  navLogos.forEach(logo => {
    if (theme === 'light') {
      // Use the dark/cyan logo for visibility on light backgrounds
      logo.src = logo.src.replace('logo-white.png', 'logo-cyan.png');
    } else {
      // Use white logo for dark background
      logo.src = logo.src.replace('logo-cyan.png', 'logo-white.png');
    }
  });

  // Also swap footer logos if they exist
  const footerLogos = document.querySelectorAll('.footer-logo-img');
  footerLogos.forEach(logo => {
    if (theme === 'light') {
      logo.src = logo.src.replace('logo-white.png', 'logo-cyan.png');
    } else {
      logo.src = logo.src.replace('logo-cyan.png', 'logo-white.png');
    }
  });
}

// ─── Toggle Theme ───
function toggleTheme(button) {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Simple, immediate theme change. CSS transitions handle the smooth
  // crossfade for the scene, materials, controls, and background.
  applyTheme(newTheme);
}

// ─── Initialize Theme System ───
export function initThemeSystem() {
  // Apply initial theme (FOUC script in <head> should have already set data-theme,
  // but this ensures icons and logos are synced)
  const currentTheme = document.documentElement.getAttribute('data-theme') || getInitialTheme();
  applyTheme(currentTheme);

  // Bind all theme switcher buttons (one per page, but safe for multiples)
  const switchers = document.querySelectorAll('.theme-switcher');
  switchers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleTheme(btn);
    });
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
}
