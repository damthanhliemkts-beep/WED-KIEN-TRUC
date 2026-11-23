/* ============================================================
   LIVING BLUEPRINT — Component Logic: Mobile Drawer
   Fullscreen Mobile Navigation · Keyboard & Focus Accessible
   ============================================================ */

'use strict';

export function initDrawer() {
  const toggleBtn = document.querySelector('.site-navbar__toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggleBtn || !drawer) return;

  const closeBtn = drawer.querySelector('.mobile-drawer__close');
  const drawerLinks = drawer.querySelectorAll('.mobile-drawer__link');
  let lastFocusedElement = null;

  // Query all focusable elements inside drawer
  const getFocusableElements = () => {
    return Array.from(
      drawer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  };

  const openDrawer = () => {
    lastFocusedElement = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('scroll-locked');

    // Focus the close button or first link
    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      setTimeout(() => focusables[0].focus(), 100);
    }

    document.addEventListener('keydown', handleKeydown);
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('scroll-locked');

    document.removeEventListener('keydown', handleKeydown);

    // Restore focus to toggle button
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  // Keyboard accessibility: Escape & Focus Trap
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  };

  // Toggle button event
  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // Close button event
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  // Close when clicking a link inside the drawer
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });
}
