/* ============================================================
   LIVING BLUEPRINT — Page Logic: Projects Gallery & Filters
   Dynamic Rendering, 2-Tier Filter System, and 2/4 Column Grid Toggle
   ============================================================ */

'use strict';

import { projects, getProjectCounts } from '../core/data.js';
import { getParam } from '../core/utils.js';

export function initProjectsPage() {
  const gridContainer = document.getElementById('projects-grid');
  if (!gridContainer) return;

  const countReadout = document.getElementById('project-count');
  const emptyState = document.getElementById('projects-empty-state');
  const resetBtn = document.getElementById('projects-reset-btn');

  // Filter state
  let activeCategory = getParam('category') || 'all';
  let activeStatus = 'all';
  let activeGridMode = sessionStorage.getItem('lb_grid_mode') || '4';

  // 1. Initial Render of all project cards from data.js
  renderAllCards(gridContainer);

  // 2. Setup Grid View Switcher (2 cols vs 4 cols)
  initGridSwitcher(gridContainer, activeGridMode);

  // 3. Setup Tier 1: Primary Category Filters (All / Architecture / Interior)
  initCategoryFilters();

  // 4. Setup Tier 2: Status Filters (All / Completed / In Progress)
  initStatusFilters();

  // 5. Setup Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
    });
  }

  // 6. Apply initial filters (supports URL param e.g. ?category=architecture)
  applyFilters();

  /**
   * Renders project cards from the dataset
   */
  function renderAllCards(container) {
    container.innerHTML = projects.map((project) => `
      <article
        class="project-card"
        data-slug="${project.slug}"
        data-category="${project.category}"
        data-status="${project.status}"
        data-project-card-slug="${project.slug}"
      >
        <a
          href="project.html?slug=${project.slug}"
          class="project-card__link"
          data-cursor="view"
          data-cursor-label="XEM"
          aria-label="${project.title} — ${project.category === 'architecture' ? 'Kiến trúc' : 'Thiết kế Nội thất'} (${project.location})"
        >
          <!-- Rich Gradient / Architecture Placeholder -->
          <div
            class="project-card__bg"
            style="background: ${project.coverGradient}; background-size: cover; background-position: center; background-repeat: no-repeat;"
            role="img"
            aria-label="${project.coverAlt}"
            data-project-card-image="${project.slug}"
          ></div>

          <!-- Card Content Overlay -->
          <div class="project-card__overlay">
            <!-- Top Metadata Bar -->
            <div class="project-card__top-bar">
              <span class="project-card__status-tag">
                <span class="project-card__status-dot project-card__status-dot--${project.status}"></span>
                ${project.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}
              </span>
              <span class="project-card__year-badge" data-project-key="year">${project.year}</span>
            </div>

            <!-- Bottom Information -->
            <div class="project-card__content">
              <span class="project-card__cat">${project.category === 'architecture' ? 'Kiến trúc' : 'Nội thất'}</span>
              <h2 class="project-card__title" data-project-key="title">${project.title}</h2>
              <p class="project-card__meta">${project.location} · ${project.area}</p>
              <p class="project-card__desc" data-project-key="shortDesc">${project.shortDesc}</p>
              <span class="project-card__arrow">Xem chi tiết công trình &rarr;</span>
            </div>
          </div>
        </a>
      </article>
    `).join('');
  }

  /**
   * Grid Switcher: 2-column cinematic vs 4-column overview
   */
  function initGridSwitcher(container, initialMode) {
    const gridBtns = document.querySelectorAll('.grid-view-btn');
    if (gridBtns.length === 0) return;

    const setGridMode = (mode) => {
      activeGridMode = mode;
      sessionStorage.setItem('lb_grid_mode', mode);

      if (mode === '2') {
        container.classList.remove('projects-grid--col-4');
        container.classList.add('projects-grid--col-2');
      } else {
        container.classList.remove('projects-grid--col-2');
        container.classList.add('projects-grid--col-4');
      }

      gridBtns.forEach((btn) => {
        const btnMode = btn.getAttribute('data-grid');
        if (btnMode === mode) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    };

    setGridMode(initialMode);

    gridBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = btn.getAttribute('data-grid') || '4';
        setGridMode(mode);
      });
    });
  }

  /**
   * Category Filter Buttons (Tier 1)
   */
  function initCategoryFilters() {
    const categoryBtns = document.querySelectorAll('.filter-btn-primary');

    categoryBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = btn.getAttribute('data-filter') || 'all';
        activeCategory = cat;

        categoryBtns.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        applyFilters();
      });
    });
  }

  /**
   * Status Filter Buttons (Tier 2)
   */
  function initStatusFilters() {
    const statusBtns = document.querySelectorAll('.filter-btn-status');

    statusBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const stat = btn.getAttribute('data-status') || 'all';
        activeStatus = stat;

        statusBtns.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        applyFilters();
      });
    });
  }

  /**
   * Evaluates filter criteria, animates cards, and updates readouts
   */
  function applyFilters() {
    const cards = gridContainer.querySelectorAll('.project-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCategory = card.getAttribute('data-category');
      const cardStatus = card.getAttribute('data-status');

      const matchesCategory = (activeCategory === 'all' || cardCategory === activeCategory);
      const matchesStatus = (activeStatus === 'all' || cardStatus === activeStatus);

      if (matchesCategory && matchesStatus) {
        visibleCount++;
        // Fade in
        card.classList.remove('is-hidden');
        requestAnimationFrame(() => {
          card.classList.remove('is-filtered-out');
        });
      } else {
        // Fade out
        card.classList.add('is-filtered-out');
        setTimeout(() => {
          if (card.classList.contains('is-filtered-out')) {
            card.classList.add('is-hidden');
          }
        }, 300);
      }
    });

    // Update Counter Readout
    if (countReadout) {
      countReadout.textContent = `Đang hiển thị ${visibleCount} / ${projects.length} công trình`;
    }

    // Toggle Empty State Message
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.add('is-visible');
        gridContainer.style.display = 'none';
      } else {
        emptyState.classList.remove('is-visible');
        gridContainer.style.display = 'grid';
      }
    }
  }

  /**
   * Resets all filters back to All / Default
   */
  function resetAllFilters() {
    activeCategory = 'all';
    activeStatus = 'all';

    // Reset Tier 1 buttons
    const catBtns = document.querySelectorAll('.filter-btn-primary');
    catBtns.forEach((btn) => {
      if (btn.getAttribute('data-filter') === 'all') {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Reset Tier 2 buttons
    const statusBtns = document.querySelectorAll('.filter-btn-status');
    statusBtns.forEach((btn) => {
      if (btn.getAttribute('data-status') === 'all') {
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    applyFilters();
  }
}
