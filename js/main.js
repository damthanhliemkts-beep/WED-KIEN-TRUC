/* ============================================================
   LIVING BLUEPRINT — Global Application Init
   Phase 1: Global Components & Interactions
   Phase 2: Cinematic Hero Scroll
   Phase 3: Projects Gallery & Interactive Filters
   ============================================================ */

'use strict';

import { domReady, prefersReducedMotion, isTouchDevice } from './core/utils.js';
import { getProjectCounts, syncProjectsFromJson } from './core/data.js';
import { loadSiteContent, bindContentToDom } from './core/content.js';
import { initLoader } from './components/loader.js';
import { initNavbar } from './components/navbar.js';
import { initDrawer } from './components/drawer.js';
import { initCursor } from './components/cursor.js';
import { initHeroScroll } from './animations/hero-scroll.js';
import { initProjectsPage } from './pages/projects.js';
import { initContactPage } from './pages/contact.js';
import { initProjectDetailPage } from './pages/project-detail.js';

/* ── Dev console branding ──────────────────────────────── */
console.log(
  '%cLiving Blueprint%c — Architecture & Interiors',
  'color:#A8865C; font-weight:600; font-size:14px; letter-spacing:1px;',
  'color:#6B6762; font-size:12px;'
);
console.log(
  '%cPhase 3 · Projects Gallery & Interactive Filters Active',
  'color:#6B6762; font-size:11px; font-style:italic;'
);

const counts = getProjectCounts();
console.log(
  `%c${counts.all} projects loaded — ${counts.architecture} Architecture · ${counts.interior} Interior`,
  'color:#6B6762; font-size:11px;'
);

/* ── Global state ──────────────────────────────────────── */
export const App = {
  reducedMotion: false,
  touchDevice:   false,
  currentPage:   '',
};

// 1. Immediately start non-blocking page loader
initLoader();

/* ── DOM Ready Init ────────────────────────────────────── */
domReady().then(async () => {
  App.reducedMotion = prefersReducedMotion();
  App.touchDevice   = isTouchDevice();

  // Load and synchronize data models from JSON with fallback
  await Promise.all([
    syncProjectsFromJson(),
    loadSiteContent()
  ]);
  bindContentToDom();

  // Identify current page
  const path = window.location.pathname;
  if (path.includes('projects'))       App.currentPage = 'projects';
  else if (path.includes('project'))   App.currentPage = 'project-detail';
  else if (path.includes('about'))     App.currentPage = 'about';
  else if (path.includes('contact'))   App.currentPage = 'contact';
  else                                 App.currentPage = 'home';

  // Add body data attributes for CSS targeting
  document.body.dataset.page = App.currentPage;
  if (App.reducedMotion) document.body.dataset.reducedMotion = 'true';
  if (App.touchDevice)   document.body.dataset.touch = 'true';

  // 2. Initialize Navigation & Active Link Tracking
  initNavbar();

  // 3. Initialize Mobile Fullscreen Drawer Menu
  initDrawer();

  // 4. Initialize Custom Ring Cursor (desktop only)
  initCursor();

  // 5. Initialize Cinematic Hero Scroll (Home page only)
  if (App.currentPage === 'home') {
    initHeroScroll();
  }

  // 6. Initialize Projects Gallery & Interactive Filters (Projects page only)
  if (App.currentPage === 'projects') {
    initProjectsPage();
  }

  // 7. Initialize Contact Page & Form Validation (Contact page only)
  if (App.currentPage === 'contact') {
    initContactPage();
  }

  // 8. Initialize Project Detail Monograph Experience (Project detail page only)
  if (App.currentPage === 'project-detail') {
    initProjectDetailPage();
  }

  console.log(
    `%c[Ready] Page: ${App.currentPage} | Touch: ${App.touchDevice} | Reduced motion: ${App.reducedMotion}`,
    'color:#A8A5A0; font-size:10px;'
  );
});
