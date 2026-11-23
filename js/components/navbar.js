/* ============================================================
   LIVING BLUEPRINT — Component Logic: Navbar
   Handles scroll state, active link indication, and navigation
   ============================================================ */

'use strict';

import { throttle } from '../core/utils.js';

export function initNavbar() {
  const navbar = document.querySelector('.site-navbar');
  if (!navbar) return;

  // 1. Scroll State: Toggle background & elevation
  const handleScroll = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 30) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  };

  // Run once initially and throttle scroll listener
  handleScroll();
  window.addEventListener('scroll', throttle(handleScroll, 50), { passive: true });

  // 2. Active Route Highlighting
  updateActiveNavLink();
  window.addEventListener('hashchange', updateActiveNavLink);

  // 3. Back to Top button in footer
  const backToTopBtn = document.querySelector('.site-footer__back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
}

/**
 * Determines and sets the active navigation link based on path & hash
 */
export function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  const navLinks = document.querySelectorAll('.site-navbar__link, .mobile-drawer__link');

  navLinks.forEach((link) => {
    link.classList.remove('is-active');
    link.removeAttribute('aria-current');

    const href = link.getAttribute('href');
    if (!href) return;

    let isActive = false;

    // Handle hash links (e.g., about.html#process or #process)
    if (href.includes('#process')) {
      if (currentHash === '#process' && (currentPath.endsWith('about.html') || currentPath.endsWith('about'))) {
        isActive = true;
      }
    } else if (href === 'index.html' || href === './' || href === '/') {
      if (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '') {
        if (!currentHash) isActive = true;
      }
    } else if (href.includes('projects.html') || href.includes('project.html')) {
      if (currentPath.includes('project')) {
        isActive = true;
      }
    } else if (href.includes('about.html')) {
      if (currentPath.includes('about') && currentHash !== '#process') {
        isActive = true;
      }
    } else if (href.includes('contact.html')) {
      if (currentPath.includes('contact')) {
        isActive = true;
      }
    }

    if (isActive) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
}
