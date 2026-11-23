/* ============================================================
   LIVING BLUEPRINT — Visual Content Editor Core Controller
   Complete Universal Visual Management System
   Allows editing ALL texts, images, and projects across the website
   ============================================================ */

'use strict';

import { getContent, loadSiteContent } from '../core/content.js';
import { projects } from '../core/data.js';

const CSRF_HEADER = 'LivingBlueprintEditor';

/**
 * Visual Editor Global State
 */
class VisualEditor {
  constructor() {
    this.isEditMode = false;
    this.isDirty = false;
    this.activeContent = null;
    this.originalContent = null;
    this.activeProjects = [];
    this.currentProjectSlug = null;
    this.currentProject = null;
    this.toastContainer = null;
    this.modalBackdrop = null;
  }

  /**
   * Khởi tạo Visual Editor
   */
  async init() {
    // Chỉ kích hoạt khi chạy trên môi trường cục bộ (localhost / 127.0.0.1)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      console.info('[Living Blueprint]: Visual Editor is disabled on production/public domain.');
      return;
    }

    // 1. Nạp dữ liệu mới nhất từ server
    await this.fetchInitialData();

    // 2. Xác định dự án hiện tại
    this.detectCurrentProject();

    // 3. Tiêm giao diện Dock & Toast
    this.injectStyles();
    this.injectDock();
    this.injectToastContainer();
    this.injectModals();

    // 4. Lắng nghe phím tắt & sự kiện
    this.setupEventListeners();

    console.info('%c[Living Blueprint Editor]%c: Đã sẵn sàng. Nhấn Ctrl+E để chỉnh sửa TẤT CẢ nội dung.', 'color:#A8865C; font-weight:600;', 'color:#9E9A93;');
  }

  /**
   * Nạp dữ liệu ban đầu từ API
   */
  async fetchInitialData() {
    try {
      const [contentRes, projectsRes] = await Promise.all([
        fetch('/api/content').then(r => r.json()).catch(() => null),
        fetch('/api/projects').then(r => r.json()).catch(() => null)
      ]);

      if (contentRes) {
        this.activeContent = JSON.parse(JSON.stringify(contentRes));
        this.originalContent = JSON.parse(JSON.stringify(contentRes));
      } else {
        this.activeContent = await loadSiteContent();
        this.originalContent = JSON.parse(JSON.stringify(this.activeContent));
      }

      if (Array.isArray(projectsRes) && projectsRes.length > 0) {
        this.activeProjects = JSON.parse(JSON.stringify(projectsRes));
      } else {
        this.activeProjects = JSON.parse(JSON.stringify(projects));
      }
    } catch (e) {
      console.warn('[Visual Editor]: Nạp dữ liệu qua API thất bại, sử dụng dữ liệu cục bộ.', e);
    }
  }

  /**
   * Xác định trang chi tiết công trình (hỗ trợ cả khi không có ?slug=)
   */
  detectCurrentProject() {
    const params = new URLSearchParams(window.location.search);
    let slug = params.get('slug');

    // Nếu đang ở trang project.html mà không có query param slug, mặc định lấy đồ án đầu tiên
    if (!slug && (window.location.pathname.includes('project') || document.getElementById('project-detail-mount'))) {
      slug = this.activeProjects[0]?.slug || 'villa-la-phong';
    }

    this.currentProjectSlug = slug;
    if (this.currentProjectSlug && this.activeProjects) {
      this.currentProject = this.activeProjects.find(p => p.slug === this.currentProjectSlug);
    }
  }

  /**
   * Đảm bảo stylesheet của Visual Editor được nạp
   */
  injectStyles() {
    if (!document.querySelector('link[href*="visual-editor.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/editor/visual-editor.css';
      document.head.appendChild(link);
    }
  }

  /**
   * Tạo thanh công cụ nổi (Floating Dock) ở góc dưới màn hình
   */
  injectDock() {
    if (document.getElementById('lb-editor-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'lb-editor-dock';
    dock.className = 'lb-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', 'Living Blueprint Visual Editor Toolbar');

    const isProjectPage = window.location.pathname.includes('project');

    dock.innerHTML = `
      <div class="lb-dock__brand" id="lb-dock-collapse-btn" title="Thu gọn / Mở rộng thanh công cụ">
        <span class="lb-dock__brand-dot"></span>
        <span>LB Editor</span>
      </div>

      <div class="lb-dock__divider"></div>

      <div class="lb-dock__tools" style="display: flex; align-items: center; gap: 8px;">
        <!-- Nút gạt chế độ Chỉnh sửa / Xem trước -->
        <button type="button" class="lb-btn" id="lb-toggle-edit-btn" title="Bật / Tắt chế độ chỉnh sửa tất cả (Ctrl + E)">
          <span id="lb-mode-icon">✏️</span>
          <span id="lb-mode-text">Chỉnh sửa</span>
        </button>

        ${isProjectPage ? `
          <!-- Nút Sửa chi tiết công trình đang xem -->
          <button type="button" class="lb-btn" id="lb-edit-current-project-btn" title="Mở bảng sửa toàn bộ thông số đồ án này">
            <span>📝</span>
            <span>Sửa đồ án này</span>
          </button>
        ` : ''}

        <!-- Nút Thêm công trình mới -->
        <button type="button" class="lb-btn" id="lb-add-project-btn" title="Thêm công trình kiến trúc / nội thất mới">
          <span>+</span>
          <span>Thêm đồ án</span>
        </button>

        <!-- Nút Quản lý danh sách đồ án -->
        <button type="button" class="lb-btn" id="lb-manage-projects-btn" title="Quản lý và sắp xếp các đồ án">
          <span>📁</span>
          <span>Quản lý đồ án</span>
        </button>

        <!-- Nút Cấu hình Tên & Logo Website -->
        <button type="button" class="lb-btn" id="lb-site-settings-btn" title="Chỉnh sửa tên thương hiệu, tiêu đề trang và logo web">
          <span>🏷️</span>
          <span>Tên &amp; Logo Web</span>
        </button>

        <div class="lb-dock__divider"></div>

        <!-- Trạng thái lưu -->
        <div class="lb-badge-status" id="lb-status-badge">
          <span class="lb-badge-status__dot"></span>
          <span id="lb-status-text">Đã lưu</span>
        </div>

        <!-- Nút Hoàn tác -->
        <button type="button" class="lb-btn" id="lb-undo-btn" title="Khôi phục lại thay đổi chưa lưu" style="display: none;">
          <span>↩</span>
          <span>Hoàn tác</span>
        </button>

        <!-- Nút Lưu thay đổi -->
        <button type="button" class="lb-btn lb-btn--primary" id="lb-save-btn" title="Lưu vĩnh viễn dữ liệu (Ctrl + S)">
          <span>💾</span>
          <span>Lưu thay đổi</span>
        </button>
      </div>
    `;

    document.body.appendChild(dock);

    // Gắn sự kiện các nút trên Dock
    document.getElementById('lb-toggle-edit-btn').addEventListener('click', () => this.toggleEditMode());
    document.getElementById('lb-site-settings-btn').addEventListener('click', () => this.openSiteSettingsModal());
    document.getElementById('lb-add-project-btn').addEventListener('click', () => this.openAddProjectModal());
    document.getElementById('lb-manage-projects-btn').addEventListener('click', () => this.openManageProjectsModal());
    document.getElementById('lb-save-btn').addEventListener('click', () => this.saveChanges());
    document.getElementById('lb-undo-btn').addEventListener('click', () => this.undoChanges());
    document.getElementById('lb-dock-collapse-btn').addEventListener('click', () => {
      dock.classList.toggle('lb-dock--collapsed');
    });

    const editCurrentBtn = document.getElementById('lb-edit-current-project-btn');
    if (editCurrentBtn) {
      editCurrentBtn.addEventListener('click', () => this.openEditCurrentProjectModal());
    }
  }

  /**
   * Tạo container chứa thông báo Toast
   */
  injectToastContainer() {
    if (document.getElementById('lb-toast-container')) return;
    const container = document.createElement('div');
    container.id = 'lb-toast-container';
    container.className = 'lb-toast-container';
    document.body.appendChild(container);
    this.toastContainer = container;
  }

  /**
   * Tạo khung modal quản trị
   */
  injectModals() {
    if (document.getElementById('lb-modal-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'lb-modal-backdrop';
    backdrop.className = 'lb-modal-backdrop';
    backdrop.innerHTML = `
      <div class="lb-modal" id="lb-modal-box" role="dialog" aria-modal="true">
        <div class="lb-modal__header">
          <h2 class="lb-modal__title" id="lb-modal-title">Quản lý Đồ Án</h2>
          <button type="button" class="lb-modal__close" id="lb-modal-close-btn" aria-label="Đóng">&times;</button>
        </div>
        <div class="lb-modal__body" id="lb-modal-content">
          <!-- Dynamic Modal Content -->
        </div>
        <div class="lb-modal__footer" id="lb-modal-footer">
          <!-- Dynamic Footer Buttons -->
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    this.modalBackdrop = backdrop;

    document.getElementById('lb-modal-close-btn').addEventListener('click', () => this.closeModal());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeModal();
    });
  }

  /**
   * Bật / Tắt chế độ chỉnh sửa toàn diện
   */
  toggleEditMode(forceState = null) {
    this.isEditMode = forceState !== null ? forceState : !this.isEditMode;
    const btn = document.getElementById('lb-toggle-edit-btn');
    const icon = document.getElementById('lb-mode-icon');
    const text = document.getElementById('lb-mode-text');

    if (this.isEditMode) {
      document.body.classList.add('lb-edit-mode');
      btn.classList.add('lb-btn--active');
      icon.textContent = '👁️';
      text.textContent = 'Xem trước';
      this.attachInlineEditHandlers();
      this.attachImageEditHandlers();
      this.showToast('Đã BẬT chỉnh sửa toàn diện. Nhấp vào BẤT KỲ chữ hoặc ảnh nào để sửa trực tiếp.', 'info');
    } else {
      document.body.classList.remove('lb-edit-mode');
      btn.classList.remove('lb-btn--active');
      icon.textContent = '✏️';
      text.textContent = 'Chỉnh sửa';
      this.detachInlineEditHandlers();
      this.detachImageEditHandlers();
      this.showToast('Đang ở chế độ XEM TRƯỚC (người dùng thật).', 'info');
    }
  }

  /**
   * Kích hoạt chỉnh sửa trực tiếp trên TẤT CẢ các phần tử văn bản hiển thị
   */
  attachInlineEditHandlers() {
    this.detectCurrentProject();

    // 1. Tất cả phần tử có data-content-key (nội dung trang tĩnh)
    const contentElements = document.querySelectorAll('[data-content-key]');
    contentElements.forEach((el) => {
      this.makeEditable(el, (val) => {
        const key = el.getAttribute('data-content-key');
        this.setContentValue(key, val);
      });
    });

    // 2. Tất cả phần tử trên trang chi tiết công trình (project.html)
    const projectMount = document.getElementById('project-detail-mount');
    if (projectMount) {
      const projectElements = projectMount.querySelectorAll(
        '[data-project-key], [data-project-array], [data-project-drawing-key], [data-project-gallery-key], [data-project-mat-key], h1, h2, h3, p, blockquote, .pdetail-spec-val, .pdetail-objective-item, .pdetail-decision-text, .pdetail-material-name, .pdetail-material-desc, .pdetail-drawing-info-title, .pdetail-drawing-info-desc, .pdetail-gallery-title, .pdetail-gallery-tag'
      );
      projectElements.forEach((el) => {
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.closest('.pdetail-hero__top-nav') || el.closest('.lb-dock') || el.closest('.lb-modal')) return;

        this.makeEditable(el, (val) => {
          this.handleProjectInput(el, val);
        });
      });
    }

    // 3. Mọi khối văn bản trên các trang khác (about, contact, index, projects)
    const generalElements = document.querySelectorAll(
      'main h1, main h2, main h3, main p, main blockquote, .about-bio, .about-name, .about-intro span, .philosophy-card__title, .philosophy-card__desc, .discipline-card__title, .discipline-card__desc, .contact-info-desc, .contact-block-val, .site-footer__copyright, .site-footer__tagline, .site-footer__headline, .site-footer__desc'
    );
    generalElements.forEach((el) => {
      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.closest('.lb-dock') || el.closest('.lb-modal') || el.closest('#project-detail-mount')) return;

      this.makeEditable(el, (val) => {
        const contentKey = el.getAttribute('data-content-key');
        if (contentKey) {
          this.setContentValue(contentKey, val);
        } else {
          const page = document.body.dataset.page || 'general';
          const key = `${page}.${el.className.split(' ')[0] || el.tagName.toLowerCase()}`;
          this.setContentValue(key, val);
        }
      });
    });
  }

  /**
   * Biến một phần tử thành có thể chỉnh sửa an toàn
   */
  makeEditable(el, updateCallback) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');

    if (!el._lbBound) {
      el.addEventListener('input', () => {
        const val = el.innerText.trim();
        updateCallback(val);
        this.markDirty();
      });
      el.addEventListener('paste', (e) => this.handlePlainTextPaste(e));
      el._lbBound = true;
    }
  }

  /**
   * Hủy kích hoạt chỉnh sửa trực tiếp khi chuyển sang Xem trước
   */
  detachInlineEditHandlers() {
    document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
      el.removeAttribute('contenteditable');
    });
  }

  /**
   * Xử lý nhập liệu chi tiết công trình
   */
  handleProjectInput(el, val) {
    if (!this.currentProject) {
      this.detectCurrentProject();
      if (!this.currentProject) return;
    }

    // 1. Direct project key
    const directKey = el.getAttribute('data-project-key');
    if (directKey) {
      this.currentProject[directKey] = val;
      return;
    }

    // 2. Array item (objectives, keyDecisions, tectonicDetails)
    const arrayName = el.getAttribute('data-project-array');
    const idx = parseInt(el.getAttribute('data-idx'), 10);
    if (arrayName && !isNaN(idx) && Array.isArray(this.currentProject[arrayName])) {
      this.currentProject[arrayName][idx] = val;
      return;
    }

    // 3. Drawing key
    const drawKey = el.getAttribute('data-project-drawing-key');
    if (drawKey && !isNaN(idx) && this.currentProject.drawings && this.currentProject.drawings[idx]) {
      this.currentProject.drawings[idx][drawKey] = val;
      return;
    }

    // 4. Gallery key
    const galKey = el.getAttribute('data-project-gallery-key');
    if (galKey && !isNaN(idx) && this.currentProject.gallery && this.currentProject.gallery[idx]) {
      this.currentProject.gallery[idx][galKey] = val;
      return;
    }

    // 5. Material key
    const matKey = el.getAttribute('data-project-mat-key');
    if (matKey && !isNaN(idx) && this.currentProject.materials && this.currentProject.materials[idx]) {
      this.currentProject.materials[idx][matKey] = val;
      return;
    }

    // 6. Nhận diện ngữ cảnh theo class
    if (el.classList.contains('pdetail-hero__title')) {
      this.currentProject.title = val;
    } else if (el.classList.contains('pdetail-narrative__summary')) {
      this.currentProject.summary = val;
    } else if (el.classList.contains('pdetail-narrative__context-text')) {
      this.currentProject.context = val;
    } else if (el.classList.contains('pdetail-philosophy-quote')) {
      this.currentProject.philosophy = val;
    } else if (el.classList.contains('pdetail-concept-desc')) {
      this.currentProject.concept = val;
    }
  }

  /**
   * Chỉ cho phép dán văn bản thuần (Plain Text), ngăn chặn tiêm mã HTML/Script
   */
  handlePlainTextPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  /**
   * Gán giá trị vào cấu trúc activeContent theo key dạng 'section.field'
   */
  setContentValue(path, value) {
    if (!path) return;
    const parts = path.split('.');
    let curr = this.activeContent;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
  }

  /**
   * Gắn huy hiệu "Thay ảnh" trên các khối ảnh
   */
  /**
   * Gắn thanh công cụ thay ảnh và sửa đồ án trực tiếp trên TẤT CẢ các khối ảnh & thẻ dự án toàn trang
   */
  attachImageEditHandlers() {
    // 0. Logo & Thương hiệu trên thanh Navbar
    const navLogo = document.querySelector('.site-navbar__logo-icon, [data-editable-image="site.logoUrl"]');
    if (navLogo && !navLogo.parentElement.querySelector('.lb-logo-action-bar')) {
      const logoParent = navLogo.parentElement;
      const bar = document.createElement('div');
      bar.className = 'lb-logo-action-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" style="padding: 3px 8px; font-size: 10px;" title="Thay đổi Logo Website (PNG trong suốt, SVG, JPG)">
          <span>📷</span><span>Đổi Logo</span>
        </button>
      `;
      const btn = bar.querySelector('button');
      const triggerLogoChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const currentLogo = this.activeContent?.site?.logoUrl || navLogo.src || '';
        this.openImagePickerModal({
          title: 'Logo Website (PNG, SVG, WebP)',
          currentImage: currentLogo,
          onApply: async (newUrl) => {
            this.setContentValue('site.logoUrl', newUrl);
            document.querySelectorAll('.site-navbar__logo-icon, .page-loader__logo, .site-footer__brand img, .mobile-drawer__header img, .mobile-drawer__brand img').forEach(img => {
              img.src = newUrl;
            });
            this.markDirty();
            await this.saveChanges();
            this.showToast('Đã thay đổi Logo website thành công!', 'success');
          }
        });
      };

      btn.addEventListener('click', triggerLogoChange);
      logoParent.appendChild(bar);

      if (!navLogo._lbBound) {
        navLogo.style.cursor = 'pointer';
        navLogo.addEventListener('click', (e) => {
          if (this.isEditMode) {
            e.preventDefault();
            e.stopPropagation();
            triggerLogoChange(e);
          }
        });
        navLogo._lbBound = true;
      }
    }

    // 0b. Ảnh bìa hoàn thiện trên trang chủ (Home Hero Reality Layer)
    const homeHero = document.querySelector('.hero-cinematic');
    if (homeHero && !homeHero.querySelector('.lb-hero-action-bar')) {
      const homeBar = document.createElement('div');
      homeBar.className = 'lb-hero-action-bar';
      homeBar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi ảnh bìa giai đoạn hoàn thiện của trang chủ">
          <span>📷</span><span>Đổi ảnh bìa trang chủ</span>
        </button>
      `;
      const homeBtn = homeBar.querySelector('button');
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentHeroCover = this.activeContent?.home?.heroCoverImage || '';
        this.openImagePickerModal({
          title: 'Ảnh Bìa Hoàn Thiện Trang Chủ',
          currentImage: currentHeroCover,
          onApply: async (newUrl) => {
            this.setContentValue('home.heroCoverImage', newUrl);
            const heroRealityBg = document.querySelector('.hero-cinematic__bg-reality');
            if (heroRealityBg) {
              const cleanCover = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;
              heroRealityBg.style.backgroundImage = `radial-gradient(circle at 65% 35%, rgba(200, 169, 122, 0.25) 0%, transparent 65%), linear-gradient(to bottom, rgba(26,25,22,0.45) 0%, rgba(26,25,22,0.7) 100%), ${cleanCover}`;
              heroRealityBg.style.backgroundSize = 'cover';
              heroRealityBg.style.backgroundPosition = 'center';
            }
            this.markDirty();
            await this.saveChanges();
            this.showToast('Đã đổi ảnh bìa trang chủ thành công!', 'success');
          }
        });
      });
      homeHero.appendChild(homeBar);
    }

    // 1. Thẻ dự án (trên projects.html và index.html)
    const cardElements = document.querySelectorAll('.project-card, .featured-card, [data-project-card-image]');
    cardElements.forEach((card) => {
      const cardContainer = card.closest('.project-card') || card.closest('.featured-card') || card;
      if (cardContainer.querySelector('.lb-card-action-bar')) return;

      const slug = cardContainer.getAttribute('data-slug') ||
                   cardContainer.getAttribute('data-project-card-slug') ||
                   card.getAttribute('data-project-card-image');

      const project = this.activeProjects.find(p => p.slug === slug);
      if (!project) return;

      const bar = document.createElement('div');
      bar.className = 'lb-card-action-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi hình ảnh đại diện của ${project.title}">
          <span>📷</span><span>Đổi ảnh</span>
        </button>
        <button type="button" class="lb-card-btn lb-card-btn--edit" title="Sửa chi tiết thông số đồ án ${project.title}">
          <span>✏️</span><span>Sửa</span>
        </button>
      `;

      const btnImg = bar.querySelector('.lb-card-btn--img');
      const btnEdit = bar.querySelector('.lb-card-btn--edit');

      btnImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openImagePickerModal({
          title: project.title,
          currentImage: project.coverGradient,
          onApply: async (newUrl) => {
            project.coverGradient = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;

            const bgEl = cardContainer.querySelector('.project-card__bg, .featured-card__bg') || cardContainer;
            if (bgEl) {
              bgEl.style.backgroundImage = `url('${newUrl}')`;
              bgEl.style.backgroundSize = 'cover';
              bgEl.style.backgroundPosition = 'center';
              bgEl.style.backgroundRepeat = 'no-repeat';
            }

            this.markDirty();
            await this.saveChanges();
            this.showToast(`Đã thay đổi ảnh bìa cho đồ án "${project.title}" thành công!`, 'success');
          }
        });
      });

      btnEdit.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openEditProjectModal(project);
      });

      cardContainer.appendChild(bar);

      // Nhấp trực tiếp vào ảnh thẻ trong chế độ sửa cũng mở modal thay ảnh
      const bgEl = cardContainer.querySelector('.project-card__bg, .featured-card__bg');
      if (bgEl && !bgEl._lbCardClickBound) {
        bgEl.addEventListener('click', (e) => {
          if (this.isEditMode) {
            e.preventDefault();
            e.stopPropagation();
            btnImg.click();
          }
        });
        bgEl._lbCardClickBound = true;
      }

      // Ngăn chặn điều hướng ngoài ý muốn khi nhấp vào thẻ trong chế độ sửa
      const links = cardContainer.querySelectorAll('a');
      links.forEach((link) => {
        if (!link._lbNavBlocked) {
          link.addEventListener('click', (e) => {
            if (this.isEditMode) {
              if (e.target.closest('.lb-card-action-bar') || e.target.closest('[contenteditable="true"]') || e.target.closest('.project-card__bg, .featured-card__bg')) {
                e.preventDefault();
              }
            }
          });
          link._lbNavBlocked = true;
        }
      });
    });

    // 2. Ảnh bìa chính trên trang chi tiết công trình (project.html Hero)
    const heroSection = document.getElementById('hero-section') || document.querySelector('.pdetail-hero');
    const heroBg = document.getElementById('detail-hero-bg') || document.querySelector('[data-project-image="coverGradient"]');
    if (heroSection && heroBg && !heroSection.querySelector('.lb-hero-action-bar')) {
      const heroBar = document.createElement('div');
      heroBar.className = 'lb-hero-action-bar';
      heroBar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi ảnh bìa chính của công trình">
          <span>📷</span><span>Đổi ảnh bìa chính</span>
        </button>
      `;

      const heroBtn = heroBar.querySelector('button');
      const triggerHeroChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.detectCurrentProject();
        if (!this.currentProject) return;

        this.openImagePickerModal({
          title: `Ảnh bìa: ${this.currentProject.title}`,
          currentImage: this.currentProject.coverGradient,
          onApply: async (newUrl) => {
            this.currentProject.coverGradient = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;
            heroBg.style.backgroundImage = `url('${newUrl}')`;
            heroBg.style.backgroundSize = 'cover';
            heroBg.style.backgroundPosition = 'center';

            this.markDirty();
            await this.saveChanges();
            this.showToast('Đã thay đổi ảnh bìa chính thành công!', 'success');
          }
        });
      };

      heroBtn.addEventListener('click', triggerHeroChange);
      heroSection.appendChild(heroBar);

      if (!heroBg._lbBound) {
        heroBg.addEventListener('click', (e) => {
          if (this.isEditMode) {
            if (e.target.closest('.pdetail-hero__content, .pdetail-hero__top-nav, button, a')) return;
            triggerHeroChange(e);
          }
        });
        heroBg._lbBound = true;
      }
    }

    // 3. TẤT CẢ các ảnh trong thư viện Không Gian (project.html Section 05 - cả 6 ảnh)
    const galleryItems = document.querySelectorAll('.pdetail-gallery-item');
    galleryItems.forEach((item) => {
      if (item.querySelector('.lb-gallery-action-bar')) return;

      const idx = parseInt(item.getAttribute('data-gallery-idx') || '0', 10);
      const thumb = item.querySelector('.pdetail-gallery-thumb') || item;

      const bar = document.createElement('div');
      bar.className = 'lb-gallery-action-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi hình ảnh này (Tải từ máy hoặc chọn ảnh mẫu)">
          <span>📷</span><span>Đổi ảnh này</span>
        </button>
      `;

      const btn = bar.querySelector('button');
      const triggerGalleryChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.detectCurrentProject();
        if (!this.currentProject || !this.currentProject.gallery || !this.currentProject.gallery[idx]) return;

        const photo = this.currentProject.gallery[idx];
        this.openImagePickerModal({
          title: photo.title || `Ảnh thư viện #${idx + 1}`,
          currentImage: photo.gradient,
          onApply: async (newUrl) => {
            photo.gradient = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;
            thumb.style.backgroundImage = `url('${newUrl}')`;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';
            thumb.style.backgroundRepeat = 'no-repeat';

            this.markDirty();
            await this.saveChanges();
            this.showToast(`Đã thay đổi ảnh #${idx + 1} thành công!`, 'success');
          }
        });
      };

      btn.addEventListener('click', triggerGalleryChange);
      item.appendChild(bar);

      if (!item._lbBound) {
        item.addEventListener('click', (e) => {
          if (this.isEditMode) {
            if (e.target.closest('[contenteditable="true"]') || e.target.closest('.lb-gallery-action-bar')) return;
            triggerGalleryChange(e);
          }
        });
        item._lbBound = true;
      }
    });

    // 4. TẤT CẢ các bản vẽ kiến trúc (project.html Section 04 - mọi tab)
    const drawingCards = document.querySelectorAll('.pdetail-drawing-card');
    drawingCards.forEach((card) => {
      const canvasWrap = card.querySelector('.pdetail-drawing-canvas-wrap') || card;
      if (canvasWrap.querySelector('.lb-drawing-action-bar')) return;

      const idx = parseInt(card.getAttribute('data-drawing-idx') || canvasWrap.getAttribute('data-drawing-idx') || '0', 10);
      const bar = document.createElement('div');
      bar.className = 'lb-drawing-action-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Tải ảnh bản vẽ kiến trúc mới (JPG, PNG, WebP) hoặc nhập link ảnh CAD">
          <span>📷</span><span>Đổi bản vẽ / Tải ảnh lên</span>
        </button>
      `;

      const btn = bar.querySelector('button');
      const triggerDrawingChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.detectCurrentProject();
        if (!this.currentProject || !this.currentProject.drawings || !this.currentProject.drawings[idx]) return;

        const drw = this.currentProject.drawings[idx];
        this.openImagePickerModal({
          title: `Bản vẽ: ${drw.title}`,
          currentImage: drw.svg && drw.svg.startsWith('<svg') ? '' : drw.svg,
          onApply: async (newUrl) => {
            drw.svg = newUrl;
            const cleanUrl = newUrl.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
            canvasWrap.innerHTML = `<img src="${cleanUrl}" alt="${drw.title}" class="drawing-img-canvas" style="max-width: 100%; max-height: 520px; object-fit: contain; margin: 0 auto; display: block; background: #FAF8F5; border-radius: 4px;">`;
            
            canvasWrap.appendChild(bar);

            this.markDirty();
            await this.saveChanges();
            this.showToast(`Đã cập nhật bản vẽ "${drw.title}" thành công!`, 'success');
          }
        });
      };

      btn.addEventListener('click', triggerDrawingChange);
      canvasWrap.appendChild(bar);

      if (!canvasWrap._lbBound) {
        canvasWrap.addEventListener('click', (e) => {
          if (this.isEditMode) {
            if (e.target.closest('.lb-drawing-action-bar') || e.target.closest('[contenteditable="true"]')) return;
            triggerDrawingChange(e);
          }
        });
        canvasWrap._lbBound = true;
      }
    });

    // 5. Dự án tiếp theo (project.html Section 07)
    const nextSection = document.querySelector('.pdetail-next-section');
    if (nextSection && !nextSection.querySelector('.lb-next-action-bar')) {
      const nextBg = nextSection.querySelector('.pdetail-next-bg');
      const nextHref = nextSection.getAttribute('href') || '';
      const match = nextHref.match(/slug=([^&]+)/);
      const nextSlug = match ? match[1] : null;
      const nextProj = nextSlug ? this.activeProjects.find(p => p.slug === nextSlug) : null;

      if (nextProj) {
        const bar = document.createElement('div');
        bar.className = 'lb-next-action-bar';
        bar.innerHTML = `
          <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi ảnh đại diện đồ án tiếp theo: ${nextProj.title}">
            <span>📷</span><span>Đổi ảnh đồ án này</span>
          </button>
        `;
        const btn = bar.querySelector('button');
        const triggerNextChange = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          this.openImagePickerModal({
            title: `Ảnh đồ án: ${nextProj.title}`,
            currentImage: nextProj.coverGradient,
            onApply: async (newUrl) => {
              nextProj.coverGradient = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;
              if (nextBg) {
                nextBg.style.backgroundImage = `url('${newUrl}')`;
                nextBg.style.backgroundSize = 'cover';
                nextBg.style.backgroundPosition = 'center';
              }
              this.markDirty();
              await this.saveChanges();
              this.showToast(`Đã thay đổi ảnh cho đồ án "${nextProj.title}" thành công!`, 'success');
            }
          });
        };

        btn.addEventListener('click', triggerNextChange);
        nextSection.appendChild(bar);

        if (!nextSection._lbBound) {
          nextSection.addEventListener('click', (e) => {
            if (this.isEditMode) {
              if (e.target.closest('[contenteditable="true"]')) return;
              triggerNextChange(e);
            }
          });
          nextSection._lbBound = true;
        }
      }
    }

    // 6. Mẫu vật liệu & Màu sắc (project.html Section 06)
    const matCards = document.querySelectorAll('.pdetail-material-card');
    matCards.forEach((card, idx) => {
      const swatch = card.querySelector('.pdetail-material-swatch');
      if (swatch && !swatch._lbBound) {
        swatch.title = 'Nhấp để đổi màu mẫu vật liệu';
        swatch.addEventListener('click', (e) => {
          if (!this.isEditMode) return;
          e.stopPropagation();
          this.detectCurrentProject();
          if (!this.currentProject || !this.currentProject.materials || !this.currentProject.materials[idx]) return;

          const mat = this.currentProject.materials[idx];
          const newColor = prompt(`Nhập mã màu HEX mới cho vật liệu "${mat.name}" (VD: #8C7860, #4A5568):`, mat.swatchColor || '#6B6762');
          if (newColor && newColor.trim()) {
            mat.swatchColor = newColor.trim();
            swatch.style.backgroundColor = newColor.trim();
            this.markDirty();
            this.saveChanges();
            this.showToast(`Đã cập nhật màu vật liệu "${mat.name}" thành công!`, 'success');
          }
        });
        swatch._lbBound = true;
      }
    });

    // 7. Ảnh chân dung kiến trúc sư (about.html)
    const portrait = document.querySelector('.about-portrait, [data-editable-image="about.portrait"]');
    if (portrait && !portrait.querySelector('.lb-portrait-action-bar')) {
      const bar = document.createElement('div');
      bar.className = 'lb-portrait-action-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img" title="Thay đổi ảnh chân dung kiến trúc sư (Tải từ máy hoặc chọn ảnh)">
          <span>📷</span><span>Đổi ảnh chân dung / Tải ảnh lên</span>
        </button>
      `;
      const btn = bar.querySelector('button');
      const triggerPortraitChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const currBg = portrait.style.backgroundImage || (this.activeContent?.about?.portrait) || '';
        this.openImagePickerModal({
          title: 'Ảnh Chân Dung Kiến Trúc Sư Đàm Thanh Liêm',
          currentImage: currBg,
          onApply: async (newUrl) => {
            this.setContentValue('about.portrait', newUrl);
            portrait.classList.add('has-image');
            portrait.style.backgroundImage = `url('${newUrl}')`;
            portrait.style.backgroundSize = 'cover';
            portrait.style.backgroundPosition = 'center';
            portrait.style.backgroundRepeat = 'no-repeat';

            this.markDirty();
            await this.saveChanges();
            this.showToast('Đã thay đổi ảnh chân dung thành công!', 'success');
          }
        });
      };

      btn.addEventListener('click', triggerPortraitChange);
      portrait.appendChild(bar);

      if (!portrait._lbBound) {
        portrait.addEventListener('click', (e) => {
          if (this.isEditMode) {
            if (e.target.closest('button, .lb-portrait-action-bar, [contenteditable="true"]')) return;
            triggerPortraitChange(e);
          }
        });
        portrait._lbBound = true;
      }
    }

    // 8. Tất cả các ảnh có data-editable-image khác
    const editableImages = document.querySelectorAll('[data-editable-image]');
    editableImages.forEach((el) => {
      if (el.classList.contains('about-portrait')) return;
      const parent = el.parentElement || el;
      if (parent.querySelector('.lb-editable-img-bar')) return;

      const contentKey = el.getAttribute('data-editable-image');
      const bar = document.createElement('div');
      bar.className = 'lb-editable-img-bar';
      bar.innerHTML = `
        <button type="button" class="lb-card-btn lb-card-btn--img">
          <span>📷</span><span>Đổi ảnh</span>
        </button>
      `;
      const btn = bar.querySelector('button');
      const triggerImgChange = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.openImagePickerModal({
          title: 'Hình ảnh hiển thị',
          currentImage: el.style.backgroundImage || el.src || '',
          onApply: async (newUrl) => {
            this.setContentValue(contentKey, newUrl);
            if (el.tagName === 'IMG') {
              el.src = newUrl;
            } else {
              el.style.backgroundImage = `url('${newUrl}')`;
              el.style.backgroundSize = 'cover';
              el.style.backgroundPosition = 'center';
            }
            this.markDirty();
            await this.saveChanges();
            this.showToast('Đã thay đổi hình ảnh thành công!', 'success');
          }
        });
      };
      btn.addEventListener('click', triggerImgChange);
      parent.appendChild(bar);

      if (!el._lbBound) {
        el.addEventListener('click', (e) => {
          if (this.isEditMode) {
            if (e.target.closest('button, .lb-editable-img-bar, [contenteditable="true"]')) return;
            triggerImgChange(e);
          }
        });
        el._lbBound = true;
      }
    });
  }

  /**
   * Xóa tất cả thanh công cụ ảnh khi tắt chế độ chỉnh sửa
   */
  detachImageEditHandlers() {
    document.querySelectorAll(
      '.lb-card-action-bar, .lb-img-change-badge, .lb-gallery-action-bar, .lb-drawing-action-bar, .lb-hero-action-bar, .lb-portrait-action-bar, .lb-next-action-bar, .lb-swatch-action-bar, .lb-editable-img-bar, .lb-logo-action-bar'
    ).forEach(b => b.remove());
  }

  /**
   * Mở Modal Chọn / Tải Hình Ảnh Đa Năng (File máy tính, URL mạng, Thư viện ảnh mẫu)
   */
  openImagePickerModal({ title, currentImage, onApply }) {
    const modalTitle = document.getElementById('lb-modal-title');
    const modalContent = document.getElementById('lb-modal-content');
    const modalFooter = document.getElementById('lb-modal-footer');

    modalTitle.innerHTML = `<span>📷</span><span>Thay Đổi Hình Ảnh: ${title}</span>`;

    let selectedImageUrl = currentImage || '';
    if (selectedImageUrl.startsWith("url('") || selectedImageUrl.startsWith('url("')) {
      selectedImageUrl = selectedImageUrl.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
    }

    const presets = [
      {
        title: 'Villa Rừng Thông Minimalist',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'
      },
      {
        title: 'Pavilion Đương Đại Ven Hồ',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80'
      },
      {
        title: 'Biệt Thự Đồi Đá Ven Biển',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80'
      },
      {
        title: 'Nội Thất Gỗ Mộc Tối Giản',
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80'
      },
      {
        title: 'Studio Kiến Trúc Sáng Tạo',
        url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80'
      },
      {
        title: 'Bê Tông Mỹ Thuật & Vườn Zen',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80'
      }
    ];

    modalContent.innerHTML = `
      <div class="lb-image-picker">
        <!-- Tab Navigation -->
        <div class="lb-picker-tabs">
          <button type="button" class="lb-picker-tab-btn is-active" data-tab="upload">📁 Tải ảnh từ máy tính</button>
          <button type="button" class="lb-picker-tab-btn" data-tab="url">🔗 Nhập Link ảnh Web</button>
          <button type="button" class="lb-picker-tab-btn" data-tab="presets">🏛️ Ảnh mẫu kiến trúc</button>
        </div>

        <!-- Tab 1: Upload -->
        <div class="lb-picker-pane is-active" id="pane-upload">
          <div class="lb-upload-box" id="picker-upload-box">
            <div style="font-size: 28px; margin-bottom: 8px;">📷</div>
            <p style="margin: 0; font-size: 14px; color: #F5F3EF; font-weight: 500;">Bấm vào đây để chọn ảnh từ máy tính của bạn</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #9E9A93;">Hỗ trợ ảnh định dạng JPG, PNG, WebP (Tối đa 10MB)</p>
            <input type="file" id="picker-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;">
          </div>
        </div>

        <!-- Tab 2: URL -->
        <div class="lb-picker-pane" id="pane-url" style="display: none;">
          <div class="lb-form-group">
            <label class="lb-form-label">Dán đường dẫn ảnh trực tuyến (Image URL)</label>
            <div style="display: flex; gap: 8px;">
              <input type="url" class="lb-form-input" id="picker-url-input" placeholder="https://images.unsplash.com/photo-..." style="flex: 1;">
              <button type="button" class="lb-btn" id="picker-preview-url-btn">Xem trước</button>
            </div>
            <span style="font-size: 11px; color: #9E9A93; margin-top: 4px; display: block;">Có thể sử dụng ảnh từ Unsplash, Pinterest hoặc bất kỳ website nào.</span>
          </div>
        </div>

        <!-- Tab 3: Presets -->
        <div class="lb-picker-pane" id="pane-presets" style="display: none;">
          <div class="lb-presets-grid">
            ${presets.map((p) => `
              <div class="lb-preset-item" data-url="${p.url}">
                <div class="lb-preset-thumb" style="background-image: url('${p.url}');"></div>
                <div class="lb-preset-title">${p.title}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live Preview Section -->
        <div class="lb-picker-preview-section">
          <div class="lb-picker-preview-label">Xem trước ảnh hiển thị:</div>
          <div class="lb-picker-preview-img" id="picker-preview-display" style="${selectedImageUrl ? `background-image: url('${selectedImageUrl}');` : 'background: #2A2825;'}">
            ${!selectedImageUrl ? '<span style="color: #6B6762; font-size: 12px;">Chưa chọn ảnh</span>' : ''}
          </div>
        </div>
      </div>
    `;

    modalFooter.innerHTML = `
      <button type="button" class="lb-btn" id="picker-cancel-btn">Hủy bỏ</button>
      <button type="button" class="lb-btn lb-btn--primary" id="picker-apply-btn">✓ Áp dụng hình ảnh này</button>
    `;

    // Tab switching
    const tabBtns = modalContent.querySelectorAll('.lb-picker-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const tab = btn.getAttribute('data-tab');
        modalContent.querySelectorAll('.lb-picker-pane').forEach(p => p.style.display = 'none');
        document.getElementById(`pane-${tab}`).style.display = 'block';
      });
    });

    const previewDisplay = document.getElementById('picker-preview-display');
    const updatePreview = (url) => {
      selectedImageUrl = url;
      previewDisplay.innerHTML = '';
      previewDisplay.style.backgroundImage = `url('${url}')`;
      previewDisplay.style.backgroundSize = 'cover';
      previewDisplay.style.backgroundPosition = 'center';
    };

    // Upload handling
    const uploadBox = document.getElementById('picker-upload-box');
    const fileInput = document.getElementById('picker-file-input');
    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => updatePreview(e.target.result);
      reader.readAsDataURL(file);

      this.showToast('Đang tải ảnh lên máy chủ...', 'info');
      try {
        const uploadedUrl = await this.uploadImageFile(file);
        updatePreview(uploadedUrl);
        this.showToast('Đã tải ảnh lên máy chủ thành công!', 'success');
      } catch (err) {
        this.showToast('Lỗi tải ảnh: ' + err.message, 'error');
      }
    });

    // URL preview
    document.getElementById('picker-preview-url-btn').addEventListener('click', () => {
      const url = document.getElementById('picker-url-input').value.trim();
      if (!url) {
        alert('Vui lòng nhập đường dẫn ảnh.');
        return;
      }
      updatePreview(url);
    });

    // Preset selection
    modalContent.querySelectorAll('.lb-preset-item').forEach(item => {
      item.addEventListener('click', () => {
        modalContent.querySelectorAll('.lb-preset-item').forEach(i => i.classList.remove('is-selected'));
        item.classList.add('is-selected');
        const url = item.getAttribute('data-url');
        updatePreview(url);
      });
    });

    // Cancel / Apply
    document.getElementById('picker-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('picker-apply-btn').addEventListener('click', async () => {
      if (!selectedImageUrl) {
        alert('Vui lòng chọn hoặc tải lên một hình ảnh.');
        return;
      }
      this.closeModal();
      await onApply(selectedImageUrl);
    });

    this.openModal();
  }

  /**
   * Kích hoạt chọn file ảnh từ máy tính (Fallback)
   */
  triggerImageUpload(targetElement) {
    this.openImagePickerModal({
      title: 'Khối hình ảnh',
      currentImage: targetElement.style.backgroundImage || '',
      onApply: async (newUrl) => {
        const contentKey = targetElement.getAttribute('data-editable-image');
        const projectKey = targetElement.getAttribute('data-project-image');
        const galleryIdx = targetElement.getAttribute('data-project-gallery-image');

        if (targetElement.tagName === 'IMG') {
          targetElement.src = newUrl;
        } else {
          targetElement.style.backgroundImage = `url('${newUrl}')`;
          targetElement.style.backgroundSize = 'cover';
          targetElement.style.backgroundPosition = 'center';
        }

        if (contentKey) {
          this.setContentValue(contentKey, newUrl);
        } else if (projectKey && this.currentProject) {
          this.currentProject[projectKey] = `url('${newUrl}')`;
        } else if (galleryIdx !== null && this.currentProject && this.currentProject.gallery) {
          const idx = parseInt(galleryIdx, 10);
          if (this.currentProject.gallery[idx]) {
            this.currentProject.gallery[idx].gradient = `url('${newUrl}')`;
          }
        }

        this.markDirty();
        await this.saveChanges();
        this.showToast('Đã thay ảnh thành công!', 'success');
      }
    });
  }

  /**
   * Upload file ảnh tới API
   */
  async uploadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const payload = {
            filename: file.name,
            data: reader.result
          };
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': CSRF_HEADER
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || 'Tải ảnh thất bại.'));
          }
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Đánh dấu có thay đổi chưa lưu
   */
  markDirty() {
    this.isDirty = true;
    const badge = document.getElementById('lb-status-badge');
    const text = document.getElementById('lb-status-text');
    const undoBtn = document.getElementById('lb-undo-btn');

    if (badge && text) {
      badge.classList.add('lb-badge-status--dirty');
      text.textContent = 'Chưa lưu';
    }
    if (undoBtn) undoBtn.style.display = 'inline-flex';
  }

  /**
   * Đánh dấu đã lưu toàn bộ
   */
  markClean() {
    this.isDirty = false;
    const badge = document.getElementById('lb-status-badge');
    const text = document.getElementById('lb-status-text');
    const undoBtn = document.getElementById('lb-undo-btn');

    if (badge && text) {
      badge.classList.remove('lb-badge-status--dirty');
      text.textContent = 'Đã lưu';
    }
    if (undoBtn) undoBtn.style.display = 'none';
  }

  /**
   * Hoàn tác toàn bộ thay đổi chưa lưu
   */
  undoChanges() {
    if (!this.isDirty) return;
    if (!confirm('Bạn có chắc chắn muốn hủy bỏ các thay đổi chưa lưu và khôi phục lại ban đầu?')) return;
    window.location.reload();
  }

  /**
   * Lưu thay đổi vào hệ thống qua API
   */
  async saveChanges() {
    this.showToast('Đang lưu thay đổi...', 'info');

    try {
      const promises = [];

      // 1. Lưu site-content.json
      if (this.activeContent) {
        promises.push(
          fetch('/api/content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': CSRF_HEADER
            },
            body: JSON.stringify(this.activeContent, null, 2)
          }).then(r => r.json())
        );
      }

      // 2. Lưu projects.json
      if (this.activeProjects && this.activeProjects.length > 0) {
        promises.push(
          fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': CSRF_HEADER
            },
            body: JSON.stringify(this.activeProjects, null, 2)
          }).then(r => r.json())
        );
      }

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res && res.success);

      if (allSuccess) {
        this.markClean();
        this.showToast('Đã lưu thành công toàn bộ thay đổi vào hệ thống!', 'success');
      } else {
        const errorMsg = results.find(r => r && r.error)?.error || 'Lỗi khi lưu dữ liệu.';
        this.showToast(errorMsg, 'error');
      }
    } catch (err) {
      this.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
    }
  }

  /**
   * Mở Modal Chỉnh Sửa Toàn Diện Công Trình Đang Xem
   */
  openEditCurrentProjectModal() {
    this.detectCurrentProject();
    this.openEditProjectModal(this.currentProject);
  }

  /**
   * Mở Modal Chỉnh Sửa Bất Kỳ Đồ Án Nào
   */
  openEditProjectModal(targetProject = null) {
    const p = targetProject || this.currentProject;
    if (!p) {
      this.showToast('Không xác định được công trình để chỉnh sửa.', 'error');
      return;
    }

    const title = document.getElementById('lb-modal-title');
    const content = document.getElementById('lb-modal-content');
    const footer = document.getElementById('lb-modal-footer');

    title.innerHTML = `<span>📝</span><span>Chỉnh Sửa Toàn Bộ: ${p.title}</span>`;

    let workingDrawings = JSON.parse(JSON.stringify(p.drawings || []));
    let workingGallery = JSON.parse(JSON.stringify(p.gallery || []));
    let newCoverUrl = null;
    let activeModalTab = 'ep-info';

    const renderFullModal = () => {
      content.innerHTML = `
        <!-- Modal Tabs -->
        <div class="lb-modal-tabs">
          <button type="button" class="lb-modal-tab-btn ${activeModalTab === 'ep-info' ? 'is-active' : ''}" data-tab="ep-info">
            📋 Thông tin & Ý niệm
          </button>
          <button type="button" class="lb-modal-tab-btn ${activeModalTab === 'ep-drawings' ? 'is-active' : ''}" data-tab="ep-drawings">
            📐 Bản vẽ Kiến trúc (${workingDrawings.length})
          </button>
          <button type="button" class="lb-modal-tab-btn ${activeModalTab === 'ep-gallery' ? 'is-active' : ''}" data-tab="ep-gallery">
            🖼️ Thư viện ảnh (${workingGallery.length})
          </button>
        </div>

        <!-- PANE 1: THÔNG TIN CHUNG -->
        <div class="lb-modal-tab-pane ${activeModalTab === 'ep-info' ? 'is-active' : ''}" id="pane-ep-info">
          <form id="lb-edit-project-form" class="lb-form-grid" novalidate>
            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Tên công trình *</label>
              <input type="text" class="lb-form-input" id="ep-title" value="${p.title || ''}" required>
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Phân loại *</label>
              <select class="lb-form-select" id="ep-category">
                <option value="architecture" ${p.category === 'architecture' ? 'selected' : ''}>Thiết kế Kiến trúc</option>
                <option value="interior" ${p.category === 'interior' ? 'selected' : ''}>Kiến trúc Nội thất</option>
              </select>
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Năm hoàn thành / thiết kế *</label>
              <input type="number" class="lb-form-input" id="ep-year" value="${p.year || new Date().getFullYear()}">
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Địa điểm *</label>
              <input type="text" class="lb-form-input" id="ep-location" value="${p.location || ''}">
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Diện tích *</label>
              <input type="text" class="lb-form-input" id="ep-area" value="${p.area || ''}">
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Loại hình chi tiết</label>
              <input type="text" class="lb-form-input" id="ep-type" value="${p.type || ''}">
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Phong cách kiến trúc</label>
              <input type="text" class="lb-form-input" id="ep-style" value="${p.style || 'Minimal Luxury · Đương đại'}">
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Trạng thái công trình</label>
              <select class="lb-form-select" id="ep-status">
                <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
                <option value="in-progress" ${p.status === 'in-progress' ? 'selected' : ''}>Đang thực hiện</option>
              </select>
            </div>

            <div class="lb-form-group">
              <label class="lb-form-label">Vai trò thiết kế</label>
              <input type="text" class="lb-form-input" id="ep-role" value="${p.role || 'Chủ trì Thiết kế Kiến trúc & Nội thất'}">
            </div>

            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Tóm tắt tổng quan công trình</label>
              <textarea class="lb-form-textarea" id="ep-summary" rows="3">${p.summary || ''}</textarea>
            </div>

            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Bối cảnh địa hình & vi khí hậu</label>
              <textarea class="lb-form-textarea" id="ep-context" rows="2">${p.context || ''}</textarea>
            </div>

            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Triết lý kiến tạo</label>
              <textarea class="lb-form-textarea" id="ep-philosophy" rows="2">${p.philosophy || ''}</textarea>
            </div>

            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Ý niệm kiến trúc & tổ chức không gian</label>
              <textarea class="lb-form-textarea" id="ep-concept" rows="3">${p.concept || ''}</textarea>
            </div>

            <div class="lb-form-group lb-form-grid--full">
              <label class="lb-form-label">Chiến lược chiếu sáng</label>
              <textarea class="lb-form-textarea" id="ep-lighting" rows="2">${p.lightingStrategy || ''}</textarea>
            </div>

            <!-- Khung thay đổi ảnh bìa -->
            <div class="lb-form-group lb-form-grid--full">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="lb-form-label" style="margin: 0;">Ảnh đại diện công trình (Cover Photo)</label>
                <button type="button" class="lb-btn" id="ep-open-picker-btn" style="padding: 4px 10px; font-size: 11px;">📷 Mở thư viện chọn ảnh</button>
              </div>
              <div class="lb-upload-box" id="ep-upload-box">
                <p style="margin: 0; font-size: 13px; color: #A8865C;">📷 Bấm vào đây để chọn ảnh mới từ máy tính</p>
                <input type="file" id="ep-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;">
              </div>
              <div class="lb-upload-preview" id="ep-upload-preview" style="display: block; ${newCoverUrl ? `background-image: url('${newCoverUrl}');` : (p.coverGradient.startsWith('url') ? `background-image: ${p.coverGradient};` : `background: ${p.coverGradient};`)}"></div>
            </div>
          </form>
        </div>

        <!-- PANE 2: QUẢN LÝ BẢN VẼ KIẾN TRÚC -->
        <div class="lb-modal-tab-pane ${activeModalTab === 'ep-drawings' ? 'is-active' : ''}" id="pane-ep-drawings">
          <div id="ep-drawings-list-container">
            ${workingDrawings.map((drw, idx) => {
              const isSvg = drw.svg && drw.svg.trim().startsWith('<svg');
              const cleanUrl = drw.svg ? drw.svg.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '') : '';
              return `
                <div class="lb-media-edit-card" data-idx="${idx}">
                  <div class="lb-media-edit-thumb" id="drw-thumb-${idx}">
                    ${isSvg ? `<div style="padding: 4px; font-size: 10px; color: #1A1916; background: #FAF8F5; text-align: center; font-weight: bold;">📐 VECTOR SVG</div>` : `<div style="width: 100%; height: 100%; background: url('${cleanUrl}') center/contain no-repeat #FAF8F5;"></div>`}
                  </div>
                  <div class="lb-media-edit-fields">
                    <div>
                      <label class="lb-form-label">Tên bản vẽ</label>
                      <input type="text" class="lb-form-input ep-drw-title" data-idx="${idx}" value="${drw.title || ''}" placeholder="Mặt bằng...">
                    </div>
                    <div>
                      <label class="lb-form-label">Tỷ lệ</label>
                      <input type="text" class="lb-form-input ep-drw-scale" data-idx="${idx}" value="${drw.scale || '1:100'}" placeholder="1:100">
                    </div>
                    <div class="lb-media-edit-fields--full">
                      <label class="lb-form-label">Mô tả bản vẽ</label>
                      <input type="text" class="lb-form-input ep-drw-desc" data-idx="${idx}" value="${drw.desc || ''}" placeholder="Mô tả công năng hoặc giải pháp...">
                    </div>
                  </div>
                  <div class="lb-media-edit-actions">
                    <button type="button" class="lb-btn lb-btn--primary" data-action="pick-drawing" data-idx="${idx}" style="font-size: 11px; padding: 6px 10px;">
                      📷 Đổi bản vẽ
                    </button>
                    <button type="button" class="lb-btn lb-btn--danger" data-action="delete-drawing" data-idx="${idx}" style="font-size: 11px; padding: 6px 10px;">
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button type="button" class="lb-btn" id="ep-add-drawing-btn" style="width: 100%; margin-top: 10px; padding: 12px; border: 1px dashed #A8865C; background: rgba(168,134,92,0.05);">
            ➕ Thêm bản vẽ kiến trúc mới
          </button>
        </div>

        <!-- PANE 3: QUẢN LÝ THƯ VIỆN ẢNH -->
        <div class="lb-modal-tab-pane ${activeModalTab === 'ep-gallery' ? 'is-active' : ''}" id="pane-ep-gallery">
          <div id="ep-gallery-list-container">
            ${workingGallery.map((photo, idx) => {
              const bgStyle = photo.gradient.startsWith('url') ? `background-image: ${photo.gradient};` : `background: ${photo.gradient};`;
              return `
                <div class="lb-media-edit-card" data-idx="${idx}">
                  <div class="lb-media-edit-thumb" id="gal-thumb-${idx}" style="${bgStyle}; background-size: cover; background-position: center;"></div>
                  <div class="lb-media-edit-fields">
                    <div>
                      <label class="lb-form-label">Tiêu đề ảnh</label>
                      <input type="text" class="lb-form-input ep-gal-title" data-idx="${idx}" value="${photo.title || ''}" placeholder="Phối cảnh...">
                    </div>
                    <div>
                      <label class="lb-form-label">Thẻ phân loại</label>
                      <input type="text" class="lb-form-input ep-gal-tag" data-idx="${idx}" value="${photo.tag || 'Không gian'}" placeholder="Ngoại thất, Nội thất...">
                    </div>
                    <div class="lb-media-edit-fields--full">
                      <label class="lb-form-label">Chú thích không gian & xúc giác</label>
                      <input type="text" class="lb-form-input ep-gal-caption" data-idx="${idx}" value="${photo.caption || ''}" placeholder="Mô tả ánh sáng, chất cảm vật liệu...">
                    </div>
                  </div>
                  <div class="lb-media-edit-actions">
                    <button type="button" class="lb-btn lb-btn--primary" data-action="pick-photo" data-idx="${idx}" style="font-size: 11px; padding: 6px 10px;">
                      📷 Đổi ảnh này
                    </button>
                    <button type="button" class="lb-btn lb-btn--danger" data-action="delete-photo" data-idx="${idx}" style="font-size: 11px; padding: 6px 10px;">
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button type="button" class="lb-btn" id="ep-add-gallery-btn" style="width: 100%; margin-top: 10px; padding: 12px; border: 1px dashed #A8865C; background: rgba(168,134,92,0.05);">
            ➕ Thêm ảnh mới vào thư viện
          </button>
        </div>
      `;

      // Tab handlers
      content.querySelectorAll('.lb-modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveInputsToMemory();
          activeModalTab = btn.getAttribute('data-tab');
          renderFullModal();
        });
      });

      // Cover photo handlers
      const uploadBox = document.getElementById('ep-upload-box');
      const fileInput = document.getElementById('ep-file-input');
      const preview = document.getElementById('ep-upload-preview');

      if (uploadBox && fileInput) {
        uploadBox.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) return;

          const r = new FileReader();
          r.onload = (e) => {
            newCoverUrl = e.target.result;
            if (preview) {
              preview.style.display = 'block';
              preview.style.backgroundImage = `url('${e.target.result}')`;
            }
          };
          r.readAsDataURL(file);

          this.showToast('Đang tải ảnh đại diện lên...', 'info');
          try {
            const uploaded = await this.uploadImageFile(file);
            newCoverUrl = uploaded;
            this.showToast('Ảnh bìa đã sẵn sàng!', 'success');
          } catch (err) {
            this.showToast('Lỗi tải ảnh: ' + err.message, 'error');
          }
        });
      }

      const pickerBtn = document.getElementById('ep-open-picker-btn');
      if (pickerBtn) {
        pickerBtn.addEventListener('click', () => {
          saveInputsToMemory();
          this.openImagePickerModal({
            title: `Ảnh bìa ${p.title}`,
            currentImage: newCoverUrl || p.coverGradient,
            onApply: async (pickedUrl) => {
              newCoverUrl = pickedUrl;
              renderFullModal();
              this.openModal();
            }
          });
        });
      }

      // Drawing actions
      content.querySelectorAll('[data-action="pick-drawing"]').forEach(btn => {
        btn.addEventListener('click', () => {
          saveInputsToMemory();
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          const drw = workingDrawings[idx];
          this.openImagePickerModal({
            title: `Bản vẽ: ${drw.title || 'Mới'}`,
            currentImage: drw.svg && drw.svg.startsWith('<svg') ? '' : drw.svg,
            onApply: async (pickedUrl) => {
              drw.svg = pickedUrl;
              renderFullModal();
              this.openModal();
            }
          });
        });
      });

      content.querySelectorAll('[data-action="delete-drawing"]').forEach(btn => {
        btn.addEventListener('click', () => {
          saveInputsToMemory();
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          workingDrawings.splice(idx, 1);
          renderFullModal();
        });
      });

      const addDrwBtn = document.getElementById('ep-add-drawing-btn');
      if (addDrwBtn) {
        addDrwBtn.addEventListener('click', () => {
          saveInputsToMemory();
          workingDrawings.push({
            id: `drw-${Date.now()}`,
            title: 'Bản vẽ chi tiết mới',
            type: 'plan',
            scale: '1:100',
            desc: 'Mô tả chi tiết công năng và giải pháp kỹ thuật.',
            svg: '<svg viewBox="0 0 1200 750" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="750" fill="#FAF8F5"/><rect x="80" y="80" width="1040" height="590" fill="none" stroke="#1A1916" stroke-width="2"/><text x="600" y="375" fill="#1A1916" font-family="sans-serif" font-size="20" text-anchor="middle">SƠ ĐỒ BẢN VẼ MỚI</text></svg>'
          });
          renderFullModal();
        });
      }

      // Gallery actions
      content.querySelectorAll('[data-action="pick-photo"]').forEach(btn => {
        btn.addEventListener('click', () => {
          saveInputsToMemory();
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          const photo = workingGallery[idx];
          this.openImagePickerModal({
            title: `Ảnh: ${photo.title || 'Mới'}`,
            currentImage: photo.gradient,
            onApply: async (pickedUrl) => {
              photo.gradient = pickedUrl.startsWith('url') ? pickedUrl : `url('${pickedUrl}')`;
              renderFullModal();
              this.openModal();
            }
          });
        });
      });

      content.querySelectorAll('[data-action="delete-photo"]').forEach(btn => {
        btn.addEventListener('click', () => {
          saveInputsToMemory();
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          workingGallery.splice(idx, 1);
          renderFullModal();
        });
      });

      const addGalBtn = document.getElementById('ep-add-gallery-btn');
      if (addGalBtn) {
        addGalBtn.addEventListener('click', () => {
          saveInputsToMemory();
          workingGallery.push({
            id: `photo-${Date.now()}`,
            title: 'Góc nhìn không gian mới',
            aspect: 'wide',
            gradient: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
            caption: 'Góc nhìn thể hiện sự hài hòa giữa hình khối kiến trúc và ánh sáng tự nhiên.',
            tag: 'Không gian',
            alt: 'Ảnh không gian kiến trúc mới'
          });
          renderFullModal();
        });
      }
    };

    const saveInputsToMemory = () => {
      const titleInput = document.getElementById('ep-title');
      if (titleInput) {
        p.title = titleInput.value.trim();
        p.category = document.getElementById('ep-category').value;
        p.year = parseInt(document.getElementById('ep-year').value, 10) || p.year;
        p.location = document.getElementById('ep-location').value.trim();
        p.area = document.getElementById('ep-area').value.trim();
        p.type = document.getElementById('ep-type').value.trim();
        p.style = document.getElementById('ep-style').value.trim();
        p.status = document.getElementById('ep-status').value;
        p.statusLabel = p.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện';
        p.role = document.getElementById('ep-role').value.trim();
        p.summary = document.getElementById('ep-summary').value.trim();
        p.context = document.getElementById('ep-context').value.trim();
        p.philosophy = document.getElementById('ep-philosophy').value.trim();
        p.concept = document.getElementById('ep-concept').value.trim();
        p.lightingStrategy = document.getElementById('ep-lighting').value.trim();
      }

      content.querySelectorAll('.ep-drw-title').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingDrawings[idx]) workingDrawings[idx].title = input.value.trim();
      });
      content.querySelectorAll('.ep-drw-scale').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingDrawings[idx]) workingDrawings[idx].scale = input.value.trim();
      });
      content.querySelectorAll('.ep-drw-desc').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingDrawings[idx]) workingDrawings[idx].desc = input.value.trim();
      });

      content.querySelectorAll('.ep-gal-title').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingGallery[idx]) workingGallery[idx].title = input.value.trim();
      });
      content.querySelectorAll('.ep-gal-tag').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingGallery[idx]) workingGallery[idx].tag = input.value.trim();
      });
      content.querySelectorAll('.ep-gal-caption').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        if (workingGallery[idx]) workingGallery[idx].caption = input.value.trim();
      });
    };

    renderFullModal();

    footer.innerHTML = `
      <button type="button" class="lb-btn" id="lb-modal-cancel-btn">Hủy bỏ</button>
      <button type="button" class="lb-btn lb-btn--primary" id="lb-modal-save-ep-btn">Lưu thông số đồ án</button>
    `;

    document.getElementById('lb-modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('lb-modal-save-ep-btn').addEventListener('click', async () => {
      saveInputsToMemory();

      if (newCoverUrl) {
        p.coverGradient = newCoverUrl.startsWith('url') ? newCoverUrl : `url('${newCoverUrl}')`;
      }
      p.drawings = workingDrawings;
      p.gallery = workingGallery;

      this.markDirty();
      this.closeModal();
      await this.saveChanges();
      this.showToast('Đã lưu toàn bộ thông số và bản vẽ/ảnh đồ án thành công!', 'success');

      // Cập nhật card trên trang nếu có
      const cardBg = document.querySelector(`[data-project-card-slug="${p.slug}"] .project-card__bg, [data-project-card-image="${p.slug}"]`);
      if (cardBg && newCoverUrl) {
        cardBg.style.backgroundImage = `url('${newCoverUrl}')`;
        cardBg.style.backgroundSize = 'cover';
        cardBg.style.backgroundPosition = 'center';
      }

      const isCurrentDetail = window.location.pathname.includes('project') && (!this.currentProjectSlug || this.currentProjectSlug === p.slug);
      if (isCurrentDetail) {
        setTimeout(() => window.location.reload(), 800);
      }
    });

    this.openModal();
  }

  /**
   * Mở Modal Thêm Đồ Án Mới
   */
  openAddProjectModal() {
    const title = document.getElementById('lb-modal-title');
    const content = document.getElementById('lb-modal-content');
    const footer = document.getElementById('lb-modal-footer');

    title.innerHTML = '<span>➕</span><span>Thêm Công Trình Kiến Trúc / Nội Thất Mới</span>';

    content.innerHTML = `
      <form id="lb-add-project-form" class="lb-form-grid" novalidate>
        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Tên công trình *</label>
          <input type="text" class="lb-form-input" id="p-title" placeholder="VD: Biệt thự Đồi Thông, Mộc Studio..." required>
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Phân loại *</label>
          <select class="lb-form-select" id="p-category" required>
            <option value="architecture">Thiết kế Kiến trúc</option>
            <option value="interior">Kiến trúc Nội thất</option>
          </select>
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Năm hoàn thành / thiết kế *</label>
          <input type="number" class="lb-form-input" id="p-year" value="${new Date().getFullYear()}" required>
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Địa điểm *</label>
          <input type="text" class="lb-form-input" id="p-location" placeholder="VD: Ba Vì, Hà Nội..." required>
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Diện tích *</label>
          <input type="text" class="lb-form-input" id="p-area" placeholder="VD: 350 m²" required>
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Loại hình chi tiết</label>
          <input type="text" class="lb-form-input" id="p-type" placeholder="VD: Biệt thự nghỉ dưỡng, Căn hộ cao cấp...">
        </div>

        <div class="lb-form-group">
          <label class="lb-form-label">Trạng thái công trình</label>
          <select class="lb-form-select" id="p-status">
            <option value="completed">Đã hoàn thành</option>
            <option value="in-progress">Đang thực hiện</option>
          </select>
        </div>

        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Mô tả ý niệm không gian *</label>
          <textarea class="lb-form-textarea" id="p-summary" rows="3" placeholder="Tóm tắt ý đồ kiến trúc, giải pháp thông gió, đón ánh sáng tự nhiên và bảng vật liệu..." required></textarea>
        </div>

        <!-- Khung tải ảnh đại diện -->
        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Ảnh đại diện công trình (Cover Photo)</label>
          <div class="lb-upload-box" id="p-upload-box">
            <p style="margin: 0; font-size: 13px; color: #A8865C;">📷 Bấm vào đây để chọn ảnh từ máy tính (JPG, PNG, WebP)</p>
            <input type="file" id="p-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;">
          </div>
          <div class="lb-upload-preview" id="p-upload-preview"></div>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button type="button" class="lb-btn" id="lb-modal-cancel-btn">Hủy bỏ</button>
      <button type="button" class="lb-btn lb-btn--primary" id="lb-modal-submit-btn">Tạo đồ án</button>
    `;

    let uploadedCoverUrl = null;
    const uploadBox = document.getElementById('p-upload-box');
    const fileInput = document.getElementById('p-file-input');
    const preview = document.getElementById('p-upload-preview');

    uploadBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const r = new FileReader();
      r.onload = (e) => {
        preview.style.display = 'block';
        preview.style.backgroundImage = `url('${e.target.result}')`;
      };
      r.readAsDataURL(file);

      this.showToast('Đang tải ảnh đại diện lên...', 'info');
      try {
        uploadedCoverUrl = await this.uploadImageFile(file);
        this.showToast('Ảnh đại diện đã sẵn sàng!', 'success');
      } catch (err) {
        this.showToast('Lỗi tải ảnh: ' + err.message, 'error');
      }
    });

    document.getElementById('lb-modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('lb-modal-submit-btn').addEventListener('click', async () => {
      const titleVal = document.getElementById('p-title').value.trim();
      const catVal = document.getElementById('p-category').value;
      const yearVal = parseInt(document.getElementById('p-year').value, 10) || new Date().getFullYear();
      const locVal = document.getElementById('p-location').value.trim();
      const areaVal = document.getElementById('p-area').value.trim();
      const typeVal = document.getElementById('p-type').value.trim() || (catVal === 'architecture' ? 'Biệt thự tư nhân' : 'Không gian nội thất');
      const statusVal = document.getElementById('p-status').value;
      const summaryVal = document.getElementById('p-summary').value.trim();

      if (!titleVal || !locVal || !areaVal || !summaryVal) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
        return;
      }

      let slug = this.slugify(titleVal);
      let uniqueSlug = slug;
      let counter = 1;
      while (this.activeProjects.some(p => p.slug === uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const newProject = {
        slug: uniqueSlug,
        title: titleVal,
        category: catVal,
        year: yearVal,
        location: locVal,
        status: statusVal,
        statusLabel: statusVal === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện',
        area: areaVal,
        type: typeVal,
        style: 'Minimal Luxury · Đương đại',
        coverGradient: uploadedCoverUrl ? `url('${uploadedCoverUrl}')` : 'linear-gradient(145deg, #3A4538 0%, #5C6E59 50%, #8A9D87 100%)',
        coverAlt: `Ảnh đại diện công trình ${titleVal}`,
        shortDesc: summaryVal.slice(0, 150) + '...',
        summary: summaryVal,
        context: `Công trình được nghiên cứu dựa trên khí hậu bản địa tại ${locVal}, tôn trọng tự nhiên và xúc cảm vật liệu.`,
        objectives: [
          'Tối ưu hóa khả năng đón nhận ánh sáng tự nhiên và thông gió đối lưu.',
          'Sử dụng vật liệu bền vững, tôn trọng xúc cảm bề mặt nguyên bản.',
          'Kết nối mật thiết giữa không gian cư ngụ và cảnh quan xung quanh.'
        ],
        philosophy: 'Thiết kế tinh khiết, tĩnh tại và trường tồn cùng thời gian.',
        concept: summaryVal,
        drawings: [
          {
            id: 'plan-1',
            title: 'Mặt bằng tổng thể (Minh họa)',
            type: 'plan',
            scale: '1:100',
            desc: 'Sơ đồ bố trí công năng luân chuyển giữa các khối không gian.',
            svg: '<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#1A1916"/><rect x="50" y="50" width="700" height="400" fill="none" stroke="#A8865C" stroke-width="1.5" stroke-dasharray="4,4"/><text x="400" y="250" fill="#DDD9D2" font-family="sans-serif" font-size="16" text-anchor="middle">SƠ ĐỒ Ý NIỆM MẶT BẰNG</text></svg>'
          }
        ],
        gallery: [
          {
            id: 'photo-1',
            title: 'Phối cảnh góc',
            aspect: 'wide',
            gradient: uploadedCoverUrl ? `url('${uploadedCoverUrl}')` : 'linear-gradient(135deg, #2D3A2F 0%, #4D5E4F 100%)',
            caption: 'Góc nhìn thể hiện sự hài hòa giữa hình khối kiến trúc và ánh sáng tự nhiên.',
            tag: 'Ngoại thất',
            alt: `Ảnh phối cảnh ${titleVal}`
          }
        ],
        materials: [
          { name: 'Đá tự nhiên bản địa', category: 'Hoàn thiện', origin: locVal, description: 'Bề mặt khò nhám tự nhiên.', swatchColor: '#6B6762' },
          { name: 'Gỗ tự nhiên ấm', category: 'Nội thất', origin: 'Bền vững', description: 'Gỗ hoàn thiện mộc tự nhiên.', swatchColor: '#A8865C' }
        ]
      };

      this.activeProjects.unshift(newProject);
      this.markDirty();
      this.closeModal();

      await this.saveChanges();
      this.showToast(`Đã tạo thành công đồ án "${titleVal}"! Đang chuyển hướng...`, 'success');
      setTimeout(() => {
        window.location.href = `project.html?slug=${uniqueSlug}`;
      }, 1200);
    });

    this.openModal();
  }

  /**
   * Mở Modal Quản Lý Danh Sách Đồ Án
   */
  openManageProjectsModal() {
    const title = document.getElementById('lb-modal-title');
    const content = document.getElementById('lb-modal-content');
    const footer = document.getElementById('lb-modal-footer');

    title.innerHTML = '<span>📁</span><span>Quản Lý Toàn Bộ Đồ Án Kiến Trúc & Nội Thất</span>';

    this.renderProjectsList(content);

    footer.innerHTML = `
      <button type="button" class="lb-btn" id="lb-modal-cancel-btn">Đóng</button>
      <button type="button" class="lb-btn lb-btn--primary" id="lb-modal-save-projects-btn">Lưu danh sách</button>
    `;

    document.getElementById('lb-modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('lb-modal-save-projects-btn').addEventListener('click', async () => {
      await this.saveChanges();
      this.closeModal();
      window.location.reload();
    });

    this.openModal();
  }

  /**
   * Render danh sách các đồ án trong modal
   */
  renderProjectsList(container) {
    let html = `<div class="lb-project-list">`;
    this.activeProjects.forEach((p, index) => {
      const isArch = p.category === 'architecture';
      const catLabel = isArch ? 'Kiến trúc' : 'Nội thất';
      const bgStyle = p.coverGradient.startsWith('url') ? `background-image: ${p.coverGradient};` : `background: ${p.coverGradient};`;

      html += `
        <div class="lb-project-item" data-index="${index}">
          <div class="lb-project-item__thumb" style="${bgStyle}"></div>
          <div class="lb-project-item__info">
            <div class="lb-project-item__title">${p.title}</div>
            <div class="lb-project-item__meta">
              <span>${catLabel}</span>
              <span>·</span>
              <span>${p.year}</span>
              <span>·</span>
              <span>${p.location}</span>
              <span>·</span>
              <span>${p.area}</span>
            </div>
          </div>
          <div class="lb-project-item__actions">
            ${index > 0 ? `<button type="button" class="lb-btn" data-action="up" data-index="${index}" title="Chuyển lên">↑</button>` : ''}
            ${index < this.activeProjects.length - 1 ? `<button type="button" class="lb-btn" data-action="down" data-index="${index}" title="Chuyển xuống">↓</button>` : ''}
            <button type="button" class="lb-btn" data-action="change-img" data-index="${index}" title="Đổi ảnh đại diện">📷 Ảnh</button>
            <button type="button" class="lb-btn" data-action="edit" data-index="${index}" title="Sửa thông số đồ án">✏️ Sửa</button>
            <a href="project.html?slug=${p.slug}" class="lb-btn" title="Xem chi tiết đồ án">Xem</a>
            <button type="button" class="lb-btn lb-btn--danger" data-action="delete" data-index="${index}" title="Xóa đồ án">Xóa</button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const target = this.activeProjects[idx];
        if (!target) return;

        if (action === 'up' && idx > 0) {
          const temp = this.activeProjects[idx];
          this.activeProjects[idx] = this.activeProjects[idx - 1];
          this.activeProjects[idx - 1] = temp;
          this.markDirty();
          this.renderProjectsList(container);
        } else if (action === 'down' && idx < this.activeProjects.length - 1) {
          const temp = this.activeProjects[idx];
          this.activeProjects[idx] = this.activeProjects[idx + 1];
          this.activeProjects[idx + 1] = temp;
          this.markDirty();
          this.renderProjectsList(container);
        } else if (action === 'change-img') {
          this.openImagePickerModal({
            title: target.title,
            currentImage: target.coverGradient,
            onApply: async (newUrl) => {
              target.coverGradient = newUrl.startsWith('url') ? newUrl : `url('${newUrl}')`;
              this.markDirty();
              await this.saveChanges();
              this.openManageProjectsModal();
              this.showToast(`Đã thay đổi ảnh cho đồ án "${target.title}" thành công!`, 'success');
            }
          });
        } else if (action === 'edit') {
          this.openEditProjectModal(target);
        } else if (action === 'delete') {
          if (confirm(`Bạn có chắc chắn muốn xóa đồ án "${target.title}"?`)) {
            this.activeProjects.splice(idx, 1);
            this.markDirty();
            this.renderProjectsList(container);
            this.showToast(`Đã xóa đồ án "${target.title}". Hãy bấm "Lưu danh sách".`, 'info');
          }
        }
      });
    });
  }

  /**
   * Escape HTML utility để ngăn XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Mở Modal Cấu Hình Tên Thương Hiệu, Tiêu Đề & Logo Website
   */
  openSiteSettingsModal() {
    const title = document.getElementById('lb-modal-title');
    const content = document.getElementById('lb-modal-content');
    const footer = document.getElementById('lb-modal-footer');

    title.innerHTML = '<span>🏷️</span><span>Cấu Hình Tên & Logo Website Toàn Trang</span>';

    const currentTitle = this.activeContent?.site?.brandTitle || 'Living Blueprint';
    const currentSub = this.activeContent?.site?.brandSub || 'Kiến trúc & Nội thất';
    const currentMeta = this.activeContent?.site?.metaDescription || '';
    let workingLogoUrl = this.activeContent?.site?.logoUrl || 'assets/svg/logo.svg';
    let workingHeroCover = this.activeContent?.home?.heroCoverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80';
    let currentMotion = this.activeContent?.site?.introAnimation || 'cinematic';

    content.innerHTML = `
      <form id="lb-site-settings-form" class="lb-form-grid" novalidate>
        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Tên thương hiệu / Studio / KTS *</label>
          <input type="text" class="lb-form-input" id="ss-brand-title" value="${this.escapeHtml(currentTitle)}" placeholder="VD: Living Blueprint, KTS. Đàm Thanh Liêm..." required>
        </div>

        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Phụ đề thương hiệu / Lĩnh vực *</label>
          <input type="text" class="lb-form-input" id="ss-brand-sub" value="${this.escapeHtml(currentSub)}" placeholder="VD: Kiến trúc & Nội thất, Minimal Luxury..." required>
        </div>

        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Mô tả tóm tắt trang (SEO Meta Description)</label>
          <textarea class="lb-form-textarea" id="ss-meta-desc" rows="2" placeholder="Tóm tắt giới thiệu ngắn gọn khi chia sẻ link trang web...">${this.escapeHtml(currentMeta)}</textarea>
        </div>

        <!-- Khung Logo Website -->
        <div class="lb-form-group lb-form-grid--full" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
          <label class="lb-form-label" style="margin-bottom: 8px; display: block;">Logo Website (Hiển thị tại Header, Footer & Màn hình tải)</label>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div id="ss-logo-preview" style="width: 56px; height: 56px; border-radius: 8px; background: #1A1916; border: 1px solid rgba(168,134,92,0.4); display: flex; align-items: center; justify-content: center; padding: 6px;">
              <img src="${workingLogoUrl}" alt="Logo Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px;">
                <button type="button" class="lb-btn" id="ss-upload-logo-btn"><span>📷</span><span>Tải logo từ máy</span></button>
                <button type="button" class="lb-btn" id="ss-pick-logo-btn"><span>🌐</span><span>Chọn ảnh logo</span></button>
                <input type="file" id="ss-logo-file-input" accept="image/png,image/svg+xml,image/jpeg,image/webp" style="display: none;">
              </div>
              <span style="font-size: 11px; color: #8C8881;">Hỗ trợ file SVG vector, PNG nền trong suốt, JPG, WebP.</span>
            </div>
          </div>
        </div>

        <!-- Khung Ảnh bìa trang chủ -->
        <div class="lb-form-group lb-form-grid--full" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
          <label class="lb-form-label" style="margin-bottom: 8px; display: block;">Ảnh bìa trang chủ (Giai đoạn hoàn thiện của thang đổi ảnh)</label>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div id="ss-hero-preview" style="width: 100px; height: 60px; border-radius: 6px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.15); background-image: url('${workingHeroCover}');"></div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button type="button" class="lb-btn" id="ss-change-hero-btn"><span>📷</span><span>Đổi ảnh bìa trang chủ</span></button>
              <span style="font-size: 11px; color: #8C8881;">Ảnh sẽ xuất hiện ở Giai đoạn 4: Hoàn thiện thực tế trong thang cuộn cinematic.</span>
            </div>
          </div>
        </div>

        <!-- Tùy chọn Hiệu ứng mở trang -->
        <div class="lb-form-group lb-form-grid--full">
          <label class="lb-form-label">Hiệu ứng chuyển động mở trang (Initial Intro Motion)</label>
          <select class="lb-form-select" id="ss-intro-motion">
            <option value="cinematic" ${currentMotion === 'cinematic' ? 'selected' : ''}>Điện ảnh & Tinh tế (Mở rèm, HUD trượt nhẹ, logo thanh lịch)</option>
            <option value="minimal" ${currentMotion === 'minimal' ? 'selected' : ''}>Tối giản & Nhanh gọn (Tải nhanh 200ms, không độ trễ)</option>
            <option value="dramatic" ${currentMotion === 'dramatic' ? 'selected' : ''}>Nghệ thuật & Sâu lắng (Hiện dần từ từ, phác thảo ấn tượng)</option>
          </select>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button type="button" class="lb-btn" id="lb-modal-cancel-btn">Hủy bỏ</button>
      <button type="button" class="lb-btn lb-btn--primary" id="lb-modal-save-ss-btn">Lưu cấu hình</button>
    `;

    // Handle logo upload from disk
    const logoFileInput = document.getElementById('ss-logo-file-input');
    const uploadLogoBtn = document.getElementById('ss-upload-logo-btn');
    const pickLogoBtn = document.getElementById('ss-pick-logo-btn');
    const logoPreviewImg = document.querySelector('#ss-logo-preview img');

    uploadLogoBtn.addEventListener('click', () => logoFileInput.click());
    logoFileInput.addEventListener('change', async () => {
      const file = logoFileInput.files[0];
      if (!file) return;

      this.showToast('Đang tải logo mới lên máy chủ...', 'info');
      try {
        const uploadedUrl = await this.uploadImageFile(file);
        workingLogoUrl = uploadedUrl;
        logoPreviewImg.src = uploadedUrl;
        this.showToast('Đã tải logo thành công!', 'success');
      } catch (err) {
        this.showToast('Lỗi tải logo: ' + err.message, 'error');
      }
    });

    pickLogoBtn.addEventListener('click', () => {
      this.openImagePickerModal({
        title: 'Logo Website',
        currentImage: workingLogoUrl,
        onApply: (newUrl) => {
          workingLogoUrl = newUrl;
          logoPreviewImg.src = newUrl;
          this.openModal();
        }
      });
    });

    // Handle hero cover image change
    const changeHeroBtn = document.getElementById('ss-change-hero-btn');
    const heroPreview = document.getElementById('ss-hero-preview');
    changeHeroBtn.addEventListener('click', () => {
      this.openImagePickerModal({
        title: 'Ảnh Bìa Hoàn Thiện Trang Chủ',
        currentImage: workingHeroCover,
        onApply: (newUrl) => {
          workingHeroCover = newUrl;
          heroPreview.style.backgroundImage = `url('${newUrl}')`;
          this.openModal();
        }
      });
    });

    document.getElementById('lb-modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('lb-modal-save-ss-btn').addEventListener('click', async () => {
      const newTitle = document.getElementById('ss-brand-title').value.trim();
      const newSub = document.getElementById('ss-brand-sub').value.trim();
      const newMeta = document.getElementById('ss-meta-desc').value.trim();
      const newMotion = document.getElementById('ss-intro-motion').value;

      if (!newTitle) {
        alert('Tên thương hiệu không được để trống.');
        return;
      }

      if (!this.activeContent.site) this.activeContent.site = {};
      if (!this.activeContent.home) this.activeContent.home = {};

      this.activeContent.site.brandTitle = newTitle;
      this.activeContent.site.brandSub = newSub;
      this.activeContent.site.metaDescription = newMeta;
      this.activeContent.site.logoUrl = workingLogoUrl;
      this.activeContent.site.introAnimation = newMotion;
      this.activeContent.home.heroCoverImage = workingHeroCover;

      this.markDirty();
      this.closeModal();

      await this.saveChanges();
      this.showToast('Đã cập nhật Tên thương hiệu, Logo và Ảnh bìa thành công!', 'success');

      // Cập nhật DOM ngay tức thì
      document.querySelectorAll('.site-navbar__brand-title, .site-footer__brand-title, .page-loader__brand, .mobile-drawer__brand-text').forEach(el => {
        el.textContent = newTitle;
      });
      document.querySelectorAll('.site-navbar__brand-sub').forEach(el => {
        el.textContent = newSub;
      });
      document.querySelectorAll('.site-navbar__logo-icon, .page-loader__logo, .site-footer__brand img, .mobile-drawer__header img, .mobile-drawer__brand img').forEach(el => {
        el.src = workingLogoUrl;
      });

      const heroRealityBg = document.querySelector('.hero-cinematic__bg-reality');
      if (heroRealityBg && workingHeroCover) {
        const cleanCover = workingHeroCover.startsWith('url') ? workingHeroCover : `url('${workingHeroCover}')`;
        heroRealityBg.style.backgroundImage = `radial-gradient(circle at 65% 35%, rgba(200, 169, 122, 0.25) 0%, transparent 65%), linear-gradient(to bottom, rgba(26,25,22,0.45) 0%, rgba(26,25,22,0.7) 100%), ${cleanCover}`;
      }
    });

    this.openModal();
  }

  /**
   * Mở modal
   */
  openModal() {
    if (this.modalBackdrop) {
      this.modalBackdrop.classList.add('is-open');
    }
  }

  /**
   * Đóng modal
   */
  closeModal() {
    if (this.modalBackdrop) {
      this.modalBackdrop.classList.remove('is-open');
    }
  }

  /**
   * Hiển thị thông báo Toast
   */
  showToast(message, type = 'success') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `lb-toast lb-toast--${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-weight: bold; color: ${type === 'success' ? '#67C23A' : type === 'error' ? '#E57373' : '#A8865C'};">${icon}</span><span>${message}</span>`;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  /**
   * Lắng nghe phím tắt Ctrl+E (Chỉnh sửa) và Ctrl+S (Lưu)
   */
  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.toggleEditMode();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveChanges();
      } else if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi?';
      }
    });
  }

  /**
   * Chuyển đổi chuỗi tiếng Việt thành slug URL an toàn
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

// Khởi tạo Singleton
export const visualEditor = new VisualEditor();
