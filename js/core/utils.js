/* ============================================================
   LIVING BLUEPRINT — Core Utilities
   ============================================================ */

'use strict';

/**
 * Debounce: trì hoãn thực thi đến khi ngừng gọi trong wait ms
 * @param {Function} fn
 * @param {number} wait - milliseconds
 * @returns {Function}
 */
export function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle: giới hạn tần suất thực thi, tối đa 1 lần/wait ms
 * @param {Function} fn
 * @param {number} wait - milliseconds
 * @returns {Function}
 */
export function throttle(fn, wait = 100) {
  let lastTime = 0;
  let rafId = null;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Lấy giá trị URL search param
 * @param {string} name - tên param
 * @returns {string|null}
 */
export function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/**
 * Clamp giá trị trong khoảng [min, max]
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map giá trị từ range này sang range khác
 * @param {number} value
 * @param {number} inMin
 * @param {number} inMax
 * @param {number} outMin
 * @param {number} outMax
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMin === inMax) return outMin;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Delay (promise-based)
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Kiểm tra element có trong viewport không
 * @param {Element} el
 * @param {number} [threshold=0] - px ngoài viewport vẫn tính
 * @returns {boolean}
 */
export function isInViewport(el, threshold = 0) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= window.innerHeight + threshold &&
    rect.bottom >= -threshold &&
    rect.left <= window.innerWidth + threshold &&
    rect.right >= -threshold
  );
}

/**
 * Lấy scroll progress của element (0 khi vào viewport, 1 khi ra)
 * @param {Element} el
 * @returns {number} 0–1
 */
export function getScrollProgress(el) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  return clamp((windowHeight - rect.top) / (windowHeight + rect.height), 0, 1);
}

/**
 * Slugify string (hỗ trợ tiếng Việt)
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  const map = {
    à:'a', á:'a', â:'a', ã:'a', ä:'a', å:'a',
    è:'e', é:'e', ê:'e', ë:'e',
    ì:'i', í:'i', î:'i', ï:'i',
    ò:'o', ó:'o', ô:'o', õ:'o', ö:'o',
    ù:'u', ú:'u', û:'u', ü:'u',
    ý:'y', ÿ:'y',
    ñ:'n', ç:'c', ß:'ss',
    // Vietnamese
    ắ:'a', ặ:'a', ầ:'a', ấ:'a', ậ:'a', ẳ:'a', ẵ:'a',
    ắ:'a', ặ:'a', ẻ:'e', ẽ:'e', ẹ:'e', ề:'e', ế:'e', ệ:'e', ể:'e', ễ:'e',
    ỉ:'i', ị:'i',
    ọ:'o', ỏ:'o', ồ:'o', ố:'o', ộ:'o', ổ:'o', ỗ:'o', ờ:'o', ớ:'o', ợ:'o', ở:'o', ỡ:'o',
    ụ:'u', ủ:'u', ừ:'u', ứ:'u', ự:'u', ử:'u', ữ:'u',
    ỳ:'y', ỵ:'y', ỷ:'y', ỹ:'y',
    đ:'d',
  };
  return str
    .toLowerCase()
    .replace(/[^\u0000-\u007E]/g, (c) => map[c] || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format số thành chuỗi 2 chữ số (01, 02, ...)
 * @param {number} n
 * @returns {string}
 */
export function padNumber(n) {
  return String(n).padStart(2, '0');
}

/**
 * Lấy CSS custom property value
 * @param {string} prop - e.g. '--color-accent'
 * @param {Element} [el=document.documentElement]
 * @returns {string}
 */
export function getCSSVar(prop, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(prop).trim();
}

/**
 * Kiểm tra prefers-reduced-motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Kiểm tra touch device
 * @returns {boolean}
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Load script dynamically (promise-based)
 * @param {string} src
 * @param {Object} [attrs] - additional attributes
 * @returns {Promise<void>}
 */
export function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Dispatch custom event
 * @param {string} name
 * @param {any} [detail]
 * @param {Element} [target=document]
 */
export function emit(name, detail = null, target = document) {
  target.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

/**
 * Wait for DOM ready
 * @returns {Promise<void>}
 */
export function domReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
      resolve();
    }
  });
}
