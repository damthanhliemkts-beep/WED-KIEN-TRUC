/* ============================================================
   LIVING BLUEPRINT — Visual Content Editor Core Controller
   Complete Client-Side Visual Management System
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
    this.domElements = new Map(); // key -> element
    this.projectElements = new Map(); // key -> element
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

    // 2. Xác định dự án hiện tại nếu đang ở trang chi tiết
    this.detectCurrentProject();

    // 3. Tiêm giao diện Dock & Toast
    this.injectStyles();
    this.injectDock();
    this.injectToastContainer();
    this.injectModals();

    // 4. Lắng nghe phím tắt & sự kiện
    this.setupEventListeners();

    console.info('%c[Living Blueprint Editor]%c: Đã sẵn sàng. Nhấn Ctrl+E để bật chỉnh sửa.', 'color:#A8865C; font-weight:600;', 'color:#9E9A93;');
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
   * Xác định trang chi tiết công trình
   */
  detectCurrentProject() {
    const params = new URLSearchParams(window.location.search);
    this.currentProjectSlug = params.get('slug');
    if (this.currentProjectSlug) {
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

    dock.innerHTML = `
      <div class="lb-dock__brand" id="lb-dock-collapse-btn" title="Thu gọn / Mở rộng thanh công cụ">
        <span class="lb-dock__brand-dot"></span>
        <span>LB Editor</span>
      </div>

      <div class="lb-dock__divider"></div>

      <div class="lb-dock__tools" style="display: flex; align-items: center; gap: 8px;">
        <!-- Nút gạt chế độ Chỉnh sửa / Xem trước -->
        <button type="button" class="lb-btn" id="lb-toggle-edit-btn" title="Bật / Tắt chế độ chỉnh sửa (Ctrl + E)">
          <span id="lb-mode-icon">✏️</span>
          <span id="lb-mode-text">Chỉnh sửa</span>
        </button>

        <!-- Nút Thêm công trình mới -->
        <button type="button" class="lb-btn" id="lb-add-project-btn" title="Thêm công trình kiến trúc / nội thất mới">
          <span>+</span>
          <span>Thêm đồ án</span>
        </button>

        <!-- Nút Quản lý danh sách đồ án -->
        <button type="button" class="lb-btn" id="lb-manage-projects-btn" title="Quản lý và sắp xếp 8 đồ án">
          <span>📁</span>
          <span>Quản lý đồ án</span>
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
    document.getElementById('lb-add-project-btn').addEventListener('click', () => this.openAddProjectModal());
    document.getElementById('lb-manage-projects-btn').addEventListener('click', () => this.openManageProjectsModal());
    document.getElementById('lb-save-btn').addEventListener('click', () => this.saveChanges());
    document.getElementById('lb-undo-btn').addEventListener('click', () => this.undoChanges());
    document.getElementById('lb-dock-collapse-btn').addEventListener('click', () => {
      dock.classList.toggle('lb-dock--collapsed');
    });
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
   * Bật / Tắt chế độ chỉnh sửa
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
      this.showToast('Đã BẬT chế độ chỉnh sửa. Bạn có thể nhấp vào văn bản hoặc ảnh để thay đổi.', 'info');
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
   * Kích hoạt chỉnh sửa trực tiếp trên các phần tử văn bản
   */
  attachInlineEditHandlers() {
    // 1. Văn bản tĩnh site-content
    const contentElements = document.querySelectorAll('[data-content-key]');
    contentElements.forEach((el) => {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');

      if (!el._lbBound) {
        el.addEventListener('input', () => this.handleContentInput(el));
        el.addEventListener('paste', (e) => this.handlePlainTextPaste(e));
        el._lbBound = true;
      }
    });

    // 2. Văn bản chi tiết công trình (nếu có trên trang project-detail)
    const projectElements = document.querySelectorAll('[data-project-key]');
    projectElements.forEach((el) => {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');

      if (!el._lbBound) {
        el.addEventListener('input', () => this.handleProjectInput(el));
        el.addEventListener('paste', (e) => this.handlePlainTextPaste(e));
        el._lbBound = true;
      }
    });
  }

  /**
   * Hủy kích hoạt chỉnh sửa trực tiếp khi chuyển sang Xem trước
   */
  detachInlineEditHandlers() {
    document.querySelectorAll('[data-content-key], [data-project-key]').forEach((el) => {
      el.removeAttribute('contenteditable');
    });
  }

  /**
   * Xử lý nhập liệu văn bản site-content
   */
  handleContentInput(el) {
    const key = el.getAttribute('data-content-key');
    const val = el.innerText.trim();
    this.setContentValue(key, val);
    this.markDirty();
  }

  /**
   * Xử lý nhập liệu chi tiết công trình
   */
  handleProjectInput(el) {
    if (!this.currentProject) return;
    const key = el.getAttribute('data-project-key');
    const val = el.innerText.trim();
    this.currentProject[key] = val;
    this.markDirty();
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
  attachImageEditHandlers() {
    const imageElements = document.querySelectorAll('[data-editable-image], [data-project-image]');
    imageElements.forEach((el) => {
      if (el.querySelector('.lb-img-change-badge')) return;

      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'lb-img-change-badge';
      badge.innerHTML = `<span>📷</span><span>Thay ảnh</span>`;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerImageUpload(el);
      });
      el.appendChild(badge);
    });
  }

  /**
   * Xóa huy hiệu "Thay ảnh" khi tắt chế độ chỉnh sửa
   */
  detachImageEditHandlers() {
    document.querySelectorAll('.lb-img-change-badge').forEach(b => b.remove());
  }

  /**
   * Kích hoạt chọn file ảnh từ máy tính
   */
  triggerImageUpload(targetElement) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      // 1. Xem trước ảnh tức thì
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target.result;
        if (targetElement.tagName === 'IMG') {
          targetElement.src = previewUrl;
        } else {
          targetElement.style.backgroundImage = `url('${previewUrl}')`;
          targetElement.style.backgroundSize = 'cover';
          targetElement.style.backgroundPosition = 'center';
        }
      };
      reader.readAsDataURL(file);

      // 2. Gửi ảnh lên server qua API /api/upload-image
      this.showToast('Đang tải ảnh lên máy chủ...', 'info');
      try {
        const uploadedUrl = await this.uploadImageFile(file);
        if (uploadedUrl) {
          // Lưu đường dẫn ảnh vào dữ liệu
          const contentKey = targetElement.getAttribute('data-editable-image');
          const projectKey = targetElement.getAttribute('data-project-image');

          if (contentKey) {
            this.setContentValue(contentKey, uploadedUrl);
          } else if (projectKey && this.currentProject) {
            this.currentProject[projectKey] = uploadedUrl;
          }

          this.markDirty();
          this.showToast('Tải ảnh thành công! Đừng quên bấm "Lưu thay đổi".', 'success');
        }
      } catch (err) {
        this.showToast('Lỗi tải ảnh: ' + err.message, 'error');
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.remove();
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

      // Hiển thị preview ngay
      const r = new FileReader();
      r.onload = (e) => {
        preview.style.display = 'block';
        preview.style.backgroundImage = `url('${e.target.result}')`;
      };
      r.readAsDataURL(file);

      // Tải lên server
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

      // Tạo slug chuẩn từ tiêu đề
      let slug = this.slugify(titleVal);
      // Đảm bảo không trùng slug
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

      // Đưa đồ án mới lên đầu danh sách
      this.activeProjects.unshift(newProject);
      this.markDirty();
      this.closeModal();

      // Lưu ngay vào server
      await this.saveChanges();

      // Điều hướng tới trang chi tiết của công trình mới tạo
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
            <a href="project.html?slug=${p.slug}" class="lb-btn" title="Xem chi tiết đồ án">Xem</a>
            <button type="button" class="lb-btn lb-btn--danger" data-action="delete" data-index="${index}" title="Xóa đồ án">Xóa</button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;

    // Gắn sự kiện lên/xuống/xóa
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-index'), 10);

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
        } else if (action === 'delete') {
          const target = this.activeProjects[idx];
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

    // Cảnh báo nếu thoát trang khi chưa lưu thay đổi
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
