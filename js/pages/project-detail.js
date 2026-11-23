/* ============================================================
   LIVING BLUEPRINT — Page Logic: Project Detail Monograph
   Phase 4: Complete 7-Section Architectural Editorial Experience
   ============================================================ */

'use strict';

import { getProjectBySlug, getNextProject } from '../core/data.js';
import { getParam } from '../core/utils.js';

export function initProjectDetailPage() {
  const container = document.getElementById('project-detail-mount');
  if (!container) return;

  const slug = getParam('slug') || 'villa-la-phong';
  const project = getProjectBySlug(slug);

  if (!project) {
    renderNotFound(container, slug);
    return;
  }

  // Set document metadata
  document.title = `${project.title} — Living Blueprint`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${project.title} — ${project.shortDesc}`);
  }

  // Render all 7 monograph sections
  container.innerHTML = `
    <!-- ── SECTION 01: HERO BANNER ── -->
    <section class="pdetail-hero" aria-label="Ảnh đại diện công trình">
      <div
        class="pdetail-hero__bg"
        id="detail-hero-bg"
        style="background: ${project.coverGradient};"
        role="img"
        aria-label="${project.coverAlt}"
        data-project-image="coverGradient"
      ></div>
      <div class="pdetail-hero__overlay" aria-hidden="true"></div>

      <div class="pdetail-hero__content">
        <div class="pdetail-hero__top-nav">
          <a href="projects.html" class="pdetail-back-btn" data-cursor="view" data-cursor-label="VỀ THƯ VIỆN">
            <span aria-hidden="true">&larr;</span>
            <span>Quay lại thư viện dự án</span>
          </a>
        </div>

        <div class="pdetail-hero__meta-pill">
          <span>${project.category === 'architecture' ? 'Thiết kế Kiến trúc' : 'Kiến trúc Nội thất'}</span>
          <span aria-hidden="true">·</span>
          <span data-project-key="year">${project.year}</span>
        </div>

        <h1 class="pdetail-hero__title" data-project-key="title">${project.title}</h1>

        <div class="pdetail-hero__specs-bar">
          <div class="pdetail-hero__specs-item">
            <span>ĐỊA ĐIỂM:</span>
            <strong data-project-key="location">${project.location}</strong>
          </div>
          <div class="pdetail-hero__specs-item">
            <span>DIỆN TÍCH:</span>
            <strong data-project-key="area">${project.area}</strong>
          </div>
          <div class="pdetail-hero__specs-item">
            <span>LOẠI HÌNH:</span>
            <strong data-project-key="type">${project.type}</strong>
          </div>
          <div class="pdetail-hero__specs-item">
            <span class="pdetail-hero__status-badge">
              <span class="pdetail-hero__status-dot"></span>
              <span data-project-key="statusLabel">${project.statusLabel || (project.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện')}</span>
            </span>
          </div>
          <div class="pdetail-hero__specs-item">
            <span class="pdetail-hero__demo-tag" style="display: inline-flex; align-items: center; padding: 2px 8px; border: 1px solid var(--color-accent); color: var(--color-accent); font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px;">
              Dự án minh họa
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SECTION 02: TỔNG QUAN DỰ ÁN (OVERVIEW & CONTEXT) ── -->
    <section class="pdetail-section" id="section-overview" aria-label="Tổng quan dự án">
      <div class="container">
        <div class="pdetail-section-head">
          <span class="pdetail-section-kicker">Section 01 · Bối cảnh &amp; Mục tiêu</span>
          <h2 class="pdetail-section-title">Tổng quan <em>Công trình</em></h2>
        </div>

        <div class="pdetail-overview-grid">
          <!-- Left Column: Narrative & Objectives -->
          <div class="pdetail-narrative">
            <p class="pdetail-narrative__summary" data-project-key="summary">
              ${project.summary || project.fullDesc}
            </p>

            ${project.context ? `
              <h3 class="pdetail-narrative__context-title">Bối cảnh Địa hình &amp; Vi khí hậu</h3>
              <p class="pdetail-narrative__context-text" data-project-key="context">${project.context}</p>
            ` : ''}

            ${project.objectives && project.objectives.length > 0 ? `
              <div class="pdetail-objectives-box">
                <span class="pdetail-objectives-title">Mục tiêu Thiết kế Cốt lõi</span>
                <div class="pdetail-objectives-list" role="list">
                  ${project.objectives.map((obj, idx) => `
                    <div class="pdetail-objective-item" role="listitem" data-project-array="objectives" data-idx="${idx}">${obj}</div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Column: Specs Sidebar Titleblock -->
          <aside class="pdetail-specs-sidebar" aria-label="Thông số kỹ thuật dự án minh họa">
            <div class="pdetail-specs-header">
              <span class="pdetail-specs-header-title">HỒ SƠ Ý NIỆM (MINH HỌA)</span>
              <span class="font-mono text-xs" style="color: var(--color-accent);" data-project-key="year">LB-${project.year}</span>
            </div>

            <div class="pdetail-specs-grid">
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Loại hình công trình</span>
                <span class="pdetail-spec-val" data-project-key="type">${project.type}</span>
              </div>
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Tổng diện tích sàn (Giả định)</span>
                <span class="pdetail-spec-val" data-project-key="area">${project.area}</span>
              </div>
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Ngôn ngữ kiến trúc</span>
                <span class="pdetail-spec-val" data-project-key="style">${project.style}</span>
              </div>
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Trạng thái hồ sơ</span>
                <span class="pdetail-spec-val" data-project-key="statusLabel">${project.statusLabel || (project.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện')}</span>
              </div>
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Địa điểm (Bối cảnh giả định)</span>
                <span class="pdetail-spec-val" data-project-key="location">${project.location}</span>
              </div>
              <div class="pdetail-spec-cell">
                <span class="pdetail-spec-label">Năm nghiên cứu ý niệm</span>
                <span class="pdetail-spec-val" data-project-key="year">${project.year}</span>
              </div>
            </div>

            <div class="pdetail-role-box">
              <span class="pdetail-role-label">Vai trò đề xuất</span>
              <span class="pdetail-role-val" data-project-key="role">${project.role || 'Chủ trì Thiết kế Kiến trúc &amp; Nội thất (Đề xuất ý niệm)'}</span>
            </div>

            <div style="margin-top: 1rem; padding: 0.75rem; background: var(--color-bg-warm, #EFECE6); border-left: 2px solid var(--color-accent); font-size: 0.75rem; line-height: 1.5; color: var(--color-ink-muted);">
              <strong>* Ghi chú minh họa:</strong> Mọi thông số kỹ thuật, địa danh, năm thiết kế và vai trò nêu trên là dữ liệu giả định phục vụ portfolio sáng tạo cá nhân; không nhận tác phẩm của bên thứ ba làm tác phẩm thực tế.
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- ── SECTION 03: Ý TƯỞNG THIẾT KẾ (CONCEPT) ── -->
    <section class="pdetail-section pdetail-section--warm" id="section-concept" aria-label="Ý tưởng thiết kế">
      <div class="container">
        <div class="pdetail-section-head">
          <span class="pdetail-section-kicker">Section 02 · Triết lý &amp; Tổ chức Không gian</span>
          <h2 class="pdetail-section-title">Ý niệm <em>Kiến trúc</em></h2>
        </div>

        <div class="pdetail-concept-layout">
          <div>
            ${project.philosophy ? `
              <blockquote class="pdetail-philosophy-quote" data-project-key="philosophy">
                ${project.philosophy}
              </blockquote>
            ` : ''}
          </div>

          <div>
            <p class="pdetail-concept-desc" data-project-key="concept">
              ${project.concept || project.shortDesc}
            </p>
            ${project.spatialStrategy ? `
              <p class="pdetail-concept-desc" style="margin-top: 1rem;">
                <strong>Tổ chức không gian:</strong> <span data-project-key="spatialStrategy">${project.spatialStrategy}</span>
              </p>
            ` : ''}
            ${project.landscapeRelation ? `
              <p class="pdetail-concept-desc" style="margin-top: 1rem;">
                <strong>Giao thoa cảnh quan:</strong> <span data-project-key="landscapeRelation">${project.landscapeRelation}</span>
              </p>
            ` : ''}
          </div>
        </div>

        ${project.keyDecisions && project.keyDecisions.length > 0 ? `
          <div class="pdetail-decisions-grid" role="list">
            ${project.keyDecisions.map((dec, idx) => `
              <div class="pdetail-decision-card" role="listitem">
                <span class="pdetail-decision-num">QUYẾT ĐỊNH THIẾT KẾ 0${idx + 1}</span>
                <p class="pdetail-decision-text" data-project-array="keyDecisions" data-idx="${idx}">${dec}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </section>

    <!-- ── SECTION 04: BẢN VẼ KIẾN TRÚC (DRAWINGS) ── -->
    ${project.drawings && project.drawings.length > 0 ? `
      <section class="pdetail-section" id="section-drawings" aria-label="Bản vẽ kiến trúc">
        <div class="container">
          <div class="pdetail-section-head section-head--row">
            <div>
              <span class="pdetail-section-kicker">Section 03 · Kỹ thuật &amp; Kết cấu</span>
              <h2 class="pdetail-section-title">Bản vẽ <em>Kiến trúc</em></h2>
            </div>
            <span class="font-mono text-xs text-muted">HỒ SƠ BẢN VẼ Ý NIỆM (${project.drawings.length} BẢN VẼ)</span>
          </div>

          <!-- Drawing Tabs -->
          <nav class="pdetail-drawings-tabs" role="tablist" aria-label="Danh mục bản vẽ kiến trúc">
            ${project.drawings.map((drw, idx) => `
              <button
                class="pdetail-drawing-tab-btn ${idx === 0 ? 'is-active' : ''}"
                data-drawing-idx="${idx}"
                role="tab"
                aria-selected="${idx === 0 ? 'true' : 'false'}"
                type="button"
              >
                ${drw.title} (${drw.scale})
              </button>
            `).join('')}
          </nav>

          <!-- Drawings Display Container -->
          <div class="pdetail-drawings-display">
            ${project.drawings.map((drw, idx) => `
              <div
                class="pdetail-drawing-card ${idx === 0 ? 'is-active' : ''}"
                data-drawing-idx="${idx}"
                role="tabpanel"
              >
                <div
                  class="pdetail-drawing-canvas-wrap"
                  data-lightbox-type="drawing"
                  data-drawing-idx="${idx}"
                  data-cursor="view"
                  data-cursor-label="PHÓNG TO"
                  title="Nhấn để phóng to bản vẽ"
                >
                  ${drw.svg && drw.svg.trim().startsWith('<svg') ? drw.svg : `<img src="${(drw.svg || '').replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '')}" alt="${drw.title}" class="drawing-img-canvas" style="max-width: 100%; max-height: 520px; object-fit: contain; margin: 0 auto; display: block; background: #FAF8F5; border-radius: 4px;">`}
                </div>

                <div class="pdetail-drawing-meta-bar">
                  <div>
                    <h3 class="pdetail-drawing-info-title" data-project-drawing-key="title" data-idx="${idx}">${drw.title}</h3>
                    <p class="pdetail-drawing-info-desc" data-project-drawing-key="desc" data-idx="${idx}">${drw.desc}</p>
                  </div>
                  <button
                    class="pdetail-drawing-expand-btn"
                    type="button"
                    data-lightbox-type="drawing"
                    data-drawing-idx="${idx}"
                  >
                    <span>Phóng to bản vẽ</span>
                    <span aria-hidden="true">⤢</span>
                  </button>
                </div>
              </div>
            `).join('')}

            <p class="pdetail-drawing-disclaimer">
              * Ghi chú quy chuẩn: Toàn bộ bản vẽ vector trên là hình minh họa ý niệm kiến trúc (conceptual architectural diagrams) phục vụ trình diễn portfolio, không phải hồ sơ bản vẽ kỹ thuật dùng để thi công trực tiếp.
            </p>
          </div>
        </div>
      </section>
    ` : ''}

    <!-- ── SECTION 05: KHÔNG GIAN KIẾN TRÚC & NỘI THẤT (EDITORIAL GALLERY) ── -->
    ${project.gallery && project.gallery.length > 0 ? `
      <section class="pdetail-section pdetail-section--warm" id="section-gallery" aria-label="Không gian kiến trúc và nội thất">
        <div class="container">
          <div class="pdetail-section-head section-head--row">
            <div>
              <span class="pdetail-section-kicker">Section 04 · Khảo sát Không gian</span>
              <h2 class="pdetail-section-title">Không gian &amp; <em>Xúc giác</em></h2>
            </div>
            <span class="font-mono text-xs text-muted">${project.gallery.length} GÓC NHÌN TUYỂN CHỌN</span>
          </div>

          <div class="pdetail-gallery-grid" role="list">
            ${project.gallery.map((photo, idx) => `
              <div
                class="pdetail-gallery-item pdetail-gallery-item--${photo.aspect || 'wide'}"
                role="listitem"
                data-lightbox-type="gallery"
                data-gallery-idx="${idx}"
                data-cursor="view"
                data-cursor-label="XEM ẢNH"
                title="Nhấn để phóng to"
              >
                <div
                  class="pdetail-gallery-thumb"
                  style="background: ${photo.gradient};"
                  role="img"
                  aria-label="${photo.alt}"
                  data-project-gallery-image="${idx}"
                ></div>
                <div class="pdetail-gallery-overlay">
                  <div>
                    <span class="pdetail-gallery-tag" data-project-gallery-key="tag" data-idx="${idx}">${photo.tag || 'Không gian'}</span>
                    <h3 class="pdetail-gallery-title" data-project-gallery-key="title" data-idx="${idx}">${photo.title}</h3>
                    <p class="text-xs text-muted" style="color: rgba(245,243,239,0.85); margin-top: 4px;" data-project-gallery-key="caption" data-idx="${idx}">${photo.caption}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <p class="pdetail-drawing-disclaimer" style="margin-top: 1.5rem;">
            * Ghi chú hình ảnh: Các phối cảnh và bố cục màu sắc đại diện cho ý tưởng thiết kế không gian minh họa; không đại diện cho công trình đã xây dựng thực tế của bên thứ ba.
          </p>
        </div>
      </section>
    ` : ''}

    <!-- ── SECTION 06: VẬT LIỆU & CHI TIẾT (MATERIALS & TECTONICS) ── -->
    <section class="pdetail-section" id="section-materials" aria-label="Vật liệu và chi tiết cấu trúc">
      <div class="container">
        <div class="pdetail-section-head">
          <span class="pdetail-section-kicker">Section 05 · Chất liệu &amp; Ánh sáng</span>
          <h2 class="pdetail-section-title">Vật liệu &amp; <em>Chi tiết</em></h2>
        </div>

        ${project.materials && project.materials.length > 0 ? `
          <div class="pdetail-materials-grid" role="list">
            ${project.materials.map((mat, idx) => `
              <div class="pdetail-material-card" role="listitem">
                <div class="pdetail-material-swatch" style="background-color: ${mat.swatchColor};"></div>
                <span class="pdetail-material-category" data-project-mat-key="category" data-idx="${idx}">${mat.category}</span>
                <h3 class="pdetail-material-name" data-project-mat-key="name" data-idx="${idx}">${mat.name}</h3>
                <span class="pdetail-material-origin" data-project-mat-key="origin" data-idx="${idx}">${mat.origin}</span>
                <p class="pdetail-material-desc" data-project-mat-key="description" data-idx="${idx}">${mat.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="pdetail-tectonics-layout">
          <div class="pdetail-lighting-box">
            <h3>Chiến lược Ánh sáng Tự nhiên &amp; Nhân tạo</h3>
            <p data-project-key="lightingStrategy">${project.lightingStrategy || 'Ánh sáng tự nhiên được đưa sâu vào lòng công trình thông qua giếng trời và vách kính mở. Hệ thống chiếu sáng nhân tạo gián tiếp tôn vinh vẻ đẹp thô mộc của vật liệu.'}</p>
          </div>

          <div class="pdetail-details-box">
            <h3>Chi tiết Kiến trúc Tiêu biểu</h3>
            <div class="pdetail-details-list" role="list">
              ${(project.tectonicDetails || [
                'Mộng gỗ truyền thống xử lý chìm không để lộ vít kim loại.',
                'Khe co giãn nhiệt âm chân tường tạo cảm giác khối tích thanh thoát.',
                'Hệ thống thu nước ngầm kín bảo vệ bề mặt hoàn thiện tự nhiên.'
              ]).map((det, idx) => `
                <div class="pdetail-details-item" role="listitem" data-project-array="tectonicDetails" data-idx="${idx}">${det}</div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SECTION 07: DỰ ÁN TIẾP THEO (NEXT PROJECT) ── -->
    ${(() => {
      const next = getNextProject(project.slug);
      return `
        <a
          href="project.html?slug=${next.slug}"
          class="pdetail-next-section"
          data-cursor="view"
          data-cursor-label="TIẾP THEO"
          aria-label="Khám phá dự án tiếp theo: ${next.title}"
        >
          <div class="pdetail-next-bg" style="background: ${next.coverGradient};"></div>
          <div class="pdetail-next-overlay" aria-hidden="true"></div>

          <div class="pdetail-next-content">
            <span class="pdetail-next-kicker">Dự án tiếp theo · ${next.category === 'architecture' ? 'Kiến trúc' : 'Nội thất'}</span>
            <h2 class="pdetail-next-title">${next.title}</h2>
            <span class="pdetail-next-meta">${next.year} · ${next.location} · ${next.area}</span>
            <span class="pdetail-next-cta">
              <span>Khám phá dự án tiếp theo</span>
              <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </a>
      `;
    })()}
  `;

  // Initialize interactive components
  initDrawingTabs(container);
  initLightbox(container, project);
}

/**
 * Tab switcher cho danh mục bản vẽ kiến trúc
 */
function initDrawingTabs(container) {
  const tabs = container.querySelectorAll('.pdetail-drawing-tab-btn');
  const cards = container.querySelectorAll('.pdetail-drawing-card');
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = tab.getAttribute('data-drawing-idx');

      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      cards.forEach(c => c.classList.remove('is-active'));

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const targetCard = container.querySelector(`.pdetail-drawing-card[data-drawing-idx="${idx}"]`);
      if (targetCard) targetCard.classList.add('is-active');
    });
  });
}

/**
 * Interactive Lightbox Modal cho bản vẽ và bộ sưu tập ảnh
 */
function initLightbox(container, project) {
  let lightbox = document.getElementById('detail-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'detail-lightbox';
    lightbox.className = 'pdetail-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Phóng to ảnh kiến trúc');
    lightbox.innerHTML = `
      <button class="pdetail-lightbox__close" type="button" aria-label="Đóng phóng to">&times;</button>
      <button class="pdetail-lightbox__nav-btn pdetail-lightbox__nav-btn--prev" type="button" aria-label="Hình trước">&larr;</button>
      <button class="pdetail-lightbox__nav-btn pdetail-lightbox__nav-btn--next" type="button" aria-label="Hình tiếp theo">&rarr;</button>
      <div class="pdetail-lightbox__body">
        <div class="pdetail-lightbox__image-wrap" id="lightbox-media-container"></div>
        <div class="pdetail-lightbox__caption">
          <h3 class="pdetail-lightbox__caption-title" id="lightbox-title"></h3>
          <p class="pdetail-lightbox__caption-text" id="lightbox-desc"></p>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const mediaContainer = lightbox.querySelector('#lightbox-media-container');
  const titleEl = lightbox.querySelector('#lightbox-title');
  const descEl = lightbox.querySelector('#lightbox-desc');
  const closeBtn = lightbox.querySelector('.pdetail-lightbox__close');
  const prevBtn = lightbox.querySelector('.pdetail-lightbox__nav-btn--prev');
  const nextBtn = lightbox.querySelector('.pdetail-lightbox__nav-btn--next');

  // Media pool for lightbox
  let currentPool = [];
  let currentIndex = 0;

  const showMedia = (index) => {
    if (currentPool.length === 0) return;
    currentIndex = (index + currentPool.length) % currentPool.length;
    const item = currentPool[currentIndex];

    if (item.type === 'drawing') {
      const isSvg = item.svg && item.svg.trim().startsWith('<svg');
      if (isSvg) {
        mediaContainer.innerHTML = item.svg;
      } else {
        const cleanUrl = (item.svg || '').replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        mediaContainer.innerHTML = `<img src="${cleanUrl}" alt="${item.title}" style="max-width: 90vw; max-height: 80vh; object-fit: contain; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border-radius: 4px; background: #FAF8F5;">`;
      }
    } else {
      if (item.gradient && item.gradient.startsWith('url(')) {
        const cleanUrl = item.gradient.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        mediaContainer.innerHTML = `<img src="${cleanUrl}" alt="${item.title}" style="max-width: 90vw; max-height: 80vh; object-fit: contain; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border-radius: 4px;">`;
      } else {
        mediaContainer.innerHTML = `
          <div class="lightbox-gradient-view" style="background: ${item.gradient}; width: 85vw; max-width: 960px; height: 550px;"></div>
        `;
      }
    }

    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.desc || item.caption || '';
  };

  let lastActiveElement = null;
  const getLightboxFocusables = () => {
    return Array.from(
      lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    );
  };

  const openLightbox = (pool, initialIdx = 0) => {
    lastActiveElement = document.activeElement;
    currentPool = pool;
    showMedia(initialIdx);
    lightbox.classList.add('is-open');
    document.body.classList.add('scroll-locked');
    document.addEventListener('keydown', handleKeydown);

    setTimeout(() => {
      if (closeBtn) closeBtn.focus();
    }, 60);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('scroll-locked');
    document.removeEventListener('keydown', handleKeydown);

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      showMedia(currentIndex - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      showMedia(currentIndex + 1);
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getLightboxFocusables();
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  };

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => showMedia(currentIndex - 1));
  nextBtn.addEventListener('click', () => showMedia(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Wire drawing triggers
  const drawingTriggers = container.querySelectorAll('[data-lightbox-type="drawing"]');
  drawingTriggers.forEach((trig) => {
    trig.addEventListener('click', (e) => {
      if (document.body.classList.contains('lb-edit-mode')) {
        if (e.target.closest('.lb-card-action-bar, .lb-img-change-badge, .lb-drawing-action-bar, [contenteditable="true"]')) {
          return;
        }
      }
      const idx = parseInt(trig.getAttribute('data-drawing-idx') || '0', 10);
      const pool = (project.drawings || []).map(d => ({
        type: 'drawing',
        title: d.title,
        desc: `${d.scale} · ${d.desc}`,
        svg: d.svg
      }));
      openLightbox(pool, idx);
    });
  });

  // Wire gallery triggers
  const galleryTriggers = container.querySelectorAll('[data-lightbox-type="gallery"]');
  galleryTriggers.forEach((trig) => {
    trig.addEventListener('click', (e) => {
      if (document.body.classList.contains('lb-edit-mode')) {
        if (e.target.closest('.lb-card-action-bar, .lb-img-change-badge, .lb-gallery-action-bar, [contenteditable="true"]')) {
          return;
        }
      }
      const idx = parseInt(trig.getAttribute('data-gallery-idx') || '0', 10);
      const pool = (project.gallery || []).map(g => ({
        type: 'gallery',
        title: g.title,
        desc: g.caption,
        gradient: g.gradient
      }));
      openLightbox(pool, idx);
    });
  });
}

/**
 * Hiển thị thông báo 404 thân thiện khi slug không tồn tại
 */
function renderNotFound(container, invalidSlug) {
  document.title = 'Không tìm thấy công trình — Living Blueprint';
  container.innerHTML = `
    <div class="container" style="padding-top: calc(var(--nav-height) + 5rem); padding-bottom: 8rem; text-align: center; max-width: 680px; margin: 0 auto;">
      <span style="font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 2px; color: var(--color-accent); text-transform: uppercase;">404 · Dữ liệu không tồn tại</span>
      <h1 style="font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3.25rem); font-weight: 300; margin-top: 1rem; margin-bottom: 1.5rem; line-height: 1.2;">
        Không Tìm Thấy Công Trình
      </h1>
      <p style="color: var(--color-ink-muted); font-size: 1.05rem; line-height: 1.7; margin-bottom: 2.5rem;">
        Dự án với mã định danh "<em>${invalidSlug}</em>" không tồn tại trong kho lưu trữ hoặc đã được di chuyển. Vui lòng quay lại thư viện để xem danh sách 8 công trình kiến trúc và nội thất tuyển chọn.
      </p>
      <a href="projects.html" class="link-arrow" style="font-size: 0.95rem; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid var(--color-ink); padding: 0.85rem 1.75rem; text-decoration: none; color: var(--color-ink);">
        &larr; Quay lại thư viện dự án
      </a>
    </div>
  `;
}
