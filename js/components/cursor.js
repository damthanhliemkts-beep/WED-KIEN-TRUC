/* ============================================================
   LIVING BLUEPRINT — Component Logic: Custom Ring Cursor
   Inspired by YODEZEEN · Smooth lerp interpolation
   ============================================================ */

'use strict';

import { prefersReducedMotion, isTouchDevice } from '../core/utils.js';

export function initCursor() {
  // Guard clause: Desktop with fine pointer & motion enabled only
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFinePointer || isTouchDevice() || prefersReducedMotion()) {
    return;
  }

  // Ensure DOM container exists
  let cursor = document.querySelector('.custom-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = `
      <div class="custom-cursor__dot"></div>
      <div class="custom-cursor__ring">
        <span class="custom-cursor__label">XEM</span>
      </div>
    `;
    document.body.appendChild(cursor);
  }

  const dot = cursor.querySelector('.custom-cursor__dot');
  const ring = cursor.querySelector('.custom-cursor__ring');
  const label = cursor.querySelector('.custom-cursor__label');

  // Mouse coordinate state
  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isMoving = false;

  // Lerp easing factor (lower = smoother/delayed, higher = snappier)
  const LERP_FACTOR = 0.16;

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursor.classList.contains('is-hidden')) {
      cursor.classList.remove('is-hidden');
    }
    if (!isMoving) {
      isMoving = true;
      ringX = mouseX;
      ringY = mouseY;
    }
  }, { passive: true });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.classList.add('is-hidden');
  });

  document.addEventListener('mouseenter', () => {
    cursor.classList.remove('is-hidden');
  });

  // Click down/up animation
  window.addEventListener('mousedown', () => {
    cursor.classList.add('is-clicking');
  });

  window.addEventListener('mouseup', () => {
    cursor.classList.remove('is-clicking');
  });

  // Interactive element hover detection via event delegation
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    // 1. Project viewable elements (Cards / Large images)
    const viewTarget = target.closest(
      '[data-cursor="view"], .p0-card-placeholder, .project-card, .about-portrait'
    );
    if (viewTarget) {
      cursor.classList.add('is-viewing');
      cursor.classList.remove('is-hovering');
      if (label) label.textContent = viewTarget.getAttribute('data-cursor-label') || 'XEM';
      return;
    }

    // 2. Clickable interactive elements (links, buttons, inputs)
    const hoverTarget = target.closest(
      'a, button, input, select, textarea, [role="button"], .site-navbar__brand, .site-footer__back-to-top'
    );
    if (hoverTarget) {
      cursor.classList.add('is-hovering');
      cursor.classList.remove('is-viewing');
      return;
    }

    // Default neutral state
    cursor.classList.remove('is-hovering', 'is-viewing');
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    if (
      target.closest('a, button, input, select, textarea, [data-cursor="view"], .p0-card-placeholder, .project-card')
    ) {
      cursor.classList.remove('is-hovering', 'is-viewing');
    }
  });

  // Animation Loop (rAF with lerp)
  function render() {
    // Precise instant position for center dot
    if (dot) {
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }

    // Smooth interpolated position for outer ring
    ringX += (mouseX - ringX) * LERP_FACTOR;
    ringY += (mouseY - ringY) * LERP_FACTOR;

    if (ring) {
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
