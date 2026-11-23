/* ============================================================
   LIVING BLUEPRINT — Component Logic: Page Loader
   Short, elegant entrance reveal · Failsafe non-blocking
   ============================================================ */

'use strict';

import { prefersReducedMotion } from '../core/utils.js';

export function initLoader() {
  const loader = document.querySelector('.page-loader');

  const hideLoader = () => {
    if (document.body.classList.contains('is-loaded')) return;
    document.body.classList.add('is-loaded');

    // Remove from accessibility tree after transition completes
    if (loader) {
      setTimeout(() => {
        loader.setAttribute('aria-hidden', 'true');
        loader.style.display = 'none';
      }, 550);
    }

    // Dispatch global event for other components if needed
    document.dispatchEvent(new CustomEvent('page:ready'));
  };

  // Immediate exit for reduced motion
  if (prefersReducedMotion()) {
    hideLoader();
    return;
  }

  // Minimum graceful presence: 250ms, then hide when DOM/window is ready
  const startTime = Date.now();
  const MIN_DISPLAY_TIME = 250;
  const HARD_TIMEOUT = 800; // Never block longer than 800ms under any network condition

  const onWindowLoad = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
    setTimeout(hideLoader, remaining);
  };

  if (document.readyState === 'complete') {
    onWindowLoad();
  } else {
    window.addEventListener('load', onWindowLoad, { once: true });
  }

  // Hard failsafe timeout
  setTimeout(hideLoader, HARD_TIMEOUT);
}
