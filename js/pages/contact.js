/* ============================================================
   LIVING BLUEPRINT — Page Logic: Contact Form & Inquiries
   Phase 5: Client-side validation, Vietnamese feedback,
   non-destructive errors, and transparent demo submission notice
   ============================================================ */

'use strict';

export function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const scopeSelect = document.getElementById('scope');
  const messageInput = document.getElementById('message');
  const submitBtn = form.querySelector('.form-submit-btn');

  // Feedback display container
  let feedbackBox = document.getElementById('contact-feedback');
  if (!feedbackBox) {
    feedbackBox = document.createElement('div');
    feedbackBox.id = 'contact-feedback';
    feedbackBox.className = 'contact-feedback';
    feedbackBox.setAttribute('role', 'alert');
    feedbackBox.setAttribute('aria-live', 'polite');
    feedbackBox.style.display = 'none';
    form.parentNode.insertBefore(feedbackBox, form);
  }

  /**
   * Helper: Set inline field error message and aria attributes
   */
  function setFieldError(input, message) {
    const parent = input.closest('.form-field');
    if (!parent) return;

    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');

    let errSpan = parent.querySelector('.form-error-msg');
    if (!errSpan) {
      errSpan = document.createElement('span');
      errSpan.className = 'form-error-msg';
      errSpan.setAttribute('role', 'alert');
      parent.appendChild(errSpan);
    }
    errSpan.textContent = message;
  }

  /**
   * Helper: Clear field error state
   */
  function clearFieldError(input) {
    const parent = input.closest('.form-field');
    if (!parent) return;

    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const errSpan = parent.querySelector('.form-error-msg');
    if (errSpan) {
      errSpan.remove();
    }
  }

  /**
   * Email format validation regex
   */
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Optional phone format validation
   */
  function isValidPhone(phone) {
    if (!phone) return true; // Phone is optional
    // Accept standard international or Vietnamese phone numbers: 9 to 15 digits, spaces, hyphens, plus sign
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    const re = /^(\+?[0-9]{9,15})$/;
    return re.test(cleaned);
  }

  // Clear errors in real-time as user types without resetting form values
  [nameInput, emailInput, phoneInput, scopeSelect, messageInput].forEach((input) => {
    if (!input) return;
    const evtType = input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(evtType, () => {
      clearFieldError(input);
      if (feedbackBox.style.display === 'block') {
        feedbackBox.style.display = 'none';
      }
    });
  });

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    let firstInvalidElement = null;

    // 1. Validate Name
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (!nameVal) {
      setFieldError(nameInput, 'Vui lòng nhập họ và tên của bạn.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = nameInput;
    } else if (nameVal.length < 2) {
      setFieldError(nameInput, 'Họ và tên phải chứa ít nhất 2 ký tự.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = nameInput;
    } else {
      clearFieldError(nameInput);
    }

    // 2. Validate Email
    const emailVal = emailInput ? emailInput.value.trim() : '';
    if (!emailVal) {
      setFieldError(emailInput, 'Vui lòng nhập địa chỉ email liên hệ.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = emailInput;
    } else if (!isValidEmail(emailVal)) {
      setFieldError(emailInput, 'Địa chỉ email không đúng định dạng (ví dụ: name@domain.com).');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = emailInput;
    } else {
      clearFieldError(emailInput);
    }

    // 3. Validate Phone (Optional, but validated if entered)
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    if (phoneVal && !isValidPhone(phoneVal)) {
      setFieldError(phoneInput, 'Số điện thoại không hợp lệ (ví dụ: 0912 345 678 hoặc +84 912 345 678).');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = phoneInput;
    } else if (phoneInput) {
      clearFieldError(phoneInput);
    }

    // 4. Validate Scope
    const scopeVal = scopeSelect ? scopeSelect.value : '';
    if (!scopeVal) {
      setFieldError(scopeSelect, 'Vui lòng chọn loại hình dự án bạn quan tâm.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = scopeSelect;
    } else {
      clearFieldError(scopeSelect);
    }

    // 5. Validate Message
    const messageVal = messageInput ? messageInput.value.trim() : '';
    if (!messageVal) {
      setFieldError(messageInput, 'Vui lòng nhập nội dung yêu cầu tư vấn.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = messageInput;
    } else if (messageVal.length < 10) {
      setFieldError(messageInput, 'Nội dung yêu cầu nên có ít nhất 10 ký tự để được hỗ trợ tốt nhất.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = messageInput;
    } else {
      clearFieldError(messageInput);
    }

    // If validation fails, preserve entered input values and focus the first error field
    if (!isValid) {
      if (firstInvalidElement) {
        firstInvalidElement.focus();
        firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Simulated Submission Transition
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Đang xác thực thông tin...</span>`;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      const scopeText = scopeSelect.options[scopeSelect.selectedIndex].text;

      // Prepare Structured Data Hook for future backend / webhook integration (in-memory only, no PII logged to console)
      const inquiryPayload = {
        name: nameVal,
        email: emailVal,
        phone: phoneVal || null,
        scope: scopeVal,
        scopeLabel: scopeText,
        message: messageVal,
        submittedAt: new Date().toISOString(),
        status: 'demo_validated_frontend_only',
      };

      // Strict Privacy: Do not log personal data (name, email, phone, message) to console
      console.info(
        '%c[Living Blueprint]: Form validation passed in Demo Mode. PII protected (not logged).',
        'color:#A8865C; font-weight:bold;'
      );

      // Render Transparent Demo Notice Modal / Box (NO false "Đã gửi thành công" claim)
      feedbackBox.className = 'contact-feedback contact-feedback--demo';
      feedbackBox.innerHTML = `
        <div class="feedback-inner">
          <div class="feedback-header">
            <div>
              <span class="feedback-tag">Xác nhận Kiểm tra Giao diện</span>
              <h3 class="feedback-title">Thông Báo Tiếp Nhận (Chế Độ Demo)</h3>
            </div>
            <button type="button" id="close-feedback-btn" class="feedback-close-btn" aria-label="Đóng thông báo">&times;</button>
          </div>

          <p class="feedback-body">
            Kính gửi <strong>${escapeHtml(nameVal)}</strong>, thông tin yêu cầu tư vấn cho hạng mục <em>"${escapeHtml(scopeText)}"</em> đã được xác thực hợp lệ trên giao diện.
          </p>

          <table class="feedback-summary-table">
            <tbody>
              <tr>
                <td>Họ và tên:</td>
                <td><strong>${escapeHtml(nameVal)}</strong></td>
              </tr>
              <tr>
                <td>Email liên hệ:</td>
                <td><strong>${escapeHtml(emailVal)}</strong></td>
              </tr>
              <tr>
                <td>Số điện thoại:</td>
                <td>${phoneVal ? escapeHtml(phoneVal) : '<em>(Không cung cấp)</em>'}</td>
              </tr>
              <tr>
                <td>Loại dự án:</td>
                <td>${escapeHtml(scopeText)}</td>
              </tr>
              <tr>
                <td>Nội dung tóm tắt:</td>
                <td>${escapeHtml(messageVal.length > 80 ? messageVal.slice(0, 80) + '...' : messageVal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="feedback-alert-box">
            <strong>* Lưu ý quan trọng:</strong> Website hiện đang hoạt động ở chế độ <strong>Portfolio Trình Diễn (Frontend Demo)</strong> và chưa kết nối cổng gửi email máy chủ thực tế. Dữ liệu của bạn <strong>CHƯA</strong> được chuyển phát đến hòm thư thực tế của kiến trúc sư. Khi hệ thống chính thức tích hợp hạ tầng backend, yêu cầu này sẽ được chuyển phát tự động.
          </div>
        </div>
      `;
      feedbackBox.style.display = 'block';

      // Setup close button on notice
      const closeBtn = document.getElementById('close-feedback-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          feedbackBox.style.display = 'none';
        });
      }

      // Smooth scroll to the notice box
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 450);
  });
}

/**
 * Basic HTML sanitizer for safe feedback interpolation
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
