/* ============================================================
   LIVING BLUEPRINT — Core: Content Data Layer with Robust Fallback
   Manages reading and fallback for site-content.json and data models
   ============================================================ */

'use strict';

/**
 * Default in-memory content fallback
 */
const defaultContent = {
  site: {
    brandTitle: "Living Blueprint",
    brandSub: "Kiến trúc & Nội thất",
    metaDescription: "Living Blueprint — Portfolio cá nhân kiến trúc sư thực hành kiến trúc & nội thất đương đại. Trải nghiệm biến đổi không gian kiến trúc 4 giai đoạn."
  },
  home: {
    heroKicker: "LIVING BLUEPRINT · PORTFOLIO KIẾN TRÚC SƯ CÁ NHÂN",
    heroTitle: "Từ Nét Vẽ Đến Không Gian Sống",
    heroDesc: "Hành trình kiến tạo từ nét phác thảo ý niệm đến không gian cư ngụ tĩnh tại. Biệt thự pavilion, kiến trúc đương đại và ánh sáng tự nhiên.",
    heroNotice: "* Minh họa ý niệm kiến trúc (Demo Visualization)",
    heroCta: "Khám phá công trình tiêu biểu",
    featuredKicker: "Công trình tuyển chọn",
    featuredTitle: "Kiến trúc & Nội thất"
  },
  about: {
    portraitNotice: "Vị trí ảnh chân dung kiến trúc sư — Sẽ được cập nhật khi có ảnh chính thức.",
    kicker: "Portfolio Kiến trúc sư Cá nhân",
    name: "Living Blueprint",
    nameSub: "Kiến tạo từ ánh sáng & khoảng lặng",
    bio: "Tôi là kiến trúc sư thực hành độc lập, chuyên sâu về thiết kế kiến trúc, sáng tạo không gian nội thất và nghiên cứu phát triển các ý niệm không gian đương đại.",
    bioSub: "Trọng tâm thực hành hướng đến việc kiến tạo những nơi chốn cư ngụ tĩnh tại — nơi hình khối kiến trúc đối thoại hài hòa cùng khí hậu bản địa, và từng chi tiết nội thất được đúc kết từ sự tinh khiết của vật liệu tự nhiên.",
    pullquote: "\"Kiến trúc không phải hành vi chiếm đoạt cảnh quan, mà là sự dung hòa tinh tế giữa ánh sáng tự nhiên, xúc cảm vật liệu và tỷ lệ con người trước không gian.\"",
    metaNote: "* Thông tin thực hành: Portfolio thể hiện các phương án ý niệm kiến trúc và nội thất do kiến trúc sư cá nhân nghiên cứu và định hình; không sử dụng danh xưng công ty nhiều nhân viên hay thông tin tiểu sử chưa qua xác minh."
  },
  contact: {
    title: "Khởi tạo",
    titleSub: "không gian sống.",
    desc: "Nếu bạn đang ấp ủ một ý niệm cư ngụ tĩnh tại, một biệt thự nghỉ dưỡng hòa mình vào thiên nhiên hay một giải pháp không gian nội thất tối giản, hãy để lại thông tin để chúng ta cùng đối thoại.",
    practiceName: "Living Blueprint — Portfolio Kiến trúc sư Cá nhân",
    email: "inquiries@livingblueprint.demo",
    locations: "Hà Nội · Đà Nẵng · TP.Hồ Chí Minh",
    hours: "Thứ Hai — Thứ Sáu: 09:00 — 18:00 (GMT+7)",
    disclaimer: "* Ghi chú portfolio: Biểu mẫu liên hệ đóng vai trò là thành phần giao diện trải nghiệm mẫu (UX Demo). Thông tin bạn nhập được kiểm tra định dạng trực tiếp tại trình duyệt nhưng chưa được gửi tới máy chủ thật."
  },
  footer: {
    tagline: "Portfolio Kiến trúc sư Cá nhân",
    headline: "Kiến trúc thở cùng thiên nhiên.\nKhông gian trường tồn cùng thời gian.",
    desc: "Portfolio cá nhân kiến trúc sư thực hành kiến trúc và nội thất tối giản đương đại, chuyên sâu về biệt thự pavilion, không gian nghỉ dưỡng và nghiên cứu ý niệm không gian.",
    locations: "Hà Nội · Đà Nẵng · TP.HCM (Minh họa)",
    hours: "Thứ Hai — Thứ Sáu: 09:00 — 18:00 (GMT+7)",
    disclaimer: "Thông báo minh họa: Mọi đồ án kiến trúc, hình ảnh minh họa, địa danh, tên gọi và thông số trên website đều là các ý niệm sáng tạo phục vụ mục đích trưng bày portfolio cá nhân kiến trúc sư. Không cấu thành hợp đồng dịch vụ thương mại thực tế.",
    copyright: "© 2024 Living Blueprint"
  }
};

let activeContent = { ...defaultContent };
let isLoaded = false;

/**
 * Tải nội dung từ data/site-content.json với cơ chế fallback an toàn
 * @returns {Promise<Object>}
 */
export async function loadSiteContent() {
  if (isLoaded) return activeContent;

  try {
    const res = await fetch('./data/site-content.json');
    if (res.ok) {
      const data = await res.json();
      activeContent = deepMerge(defaultContent, data);
      isLoaded = true;
      return activeContent;
    }
  } catch (err) {
    // Fallback quietly to defaultContent without interrupting page render
    console.info('[Living Blueprint]: Running with bundled fallback content.');
  }

  isLoaded = true;
  return activeContent;
}

/**
 * Lấy giá trị nội dung theo đường dẫn key (ví dụ: 'about.bio' hoặc 'contact.headline')
 * @param {string} path
 * @param {any} fallback
 * @returns {any}
 */
export function getContent(path, fallback = '') {
  if (!path) return fallback;
  const parts = path.split('.');
  let current = activeContent;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback;
    }
  }
  return current !== undefined ? current : fallback;
}

/**
 * Ánh xạ nội dung lên DOM dựa trên thuộc tính data-content-key
 */
export function bindContentToDom() {
  const elements = document.querySelectorAll('[data-content-key]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-content-key');
    const val = getContent(key);
    if (val) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = val;
      } else {
        el.textContent = val;
      }
    }
  });
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
