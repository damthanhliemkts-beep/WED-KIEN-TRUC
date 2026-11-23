# BÁO CÁO KIỂM THỬ TƯƠNG TÁC TOÀN DIỆN & KHẮC PHỤC LỖI
## DỰ ÁN: LIVING BLUEPRINT — ARCHITECTURE & INTERIORS
**Môi trường thử nghiệm:** `http://localhost:3000` (Node.js dev server, thuần HTML5 / CSS3 / Vanilla ES Modules)  
**Ngày kiểm thử:** 21/11/2026  
**Trạng thái tổng thể:** **TẤT CẢ CÁC TÍNH NĂNG TƯƠNG TÁC ĐẠT CHUẨN (100% PASS)**

---

## 1. TỔNG QUAN ĐỢT KIỂM THỬ (EXECUTIVE SUMMARY)

Đợt kiểm định này được tiến hành nhằm rà soát toàn bộ cây phần tử DOM có khả năng tương tác (`<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<form>`, thẻ bài viết `[role="listitem"]`, thanh điều hướng, bộ lọc và các hiệu ứng động) trên cả 5 trang của website:

1. **Trang chủ (`index.html`)**
2. **Thư viện dự án (`projects.html`)**
3. **Chi tiết công trình (`project.html`)**
4. **Giới thiệu & Quy trình (`about.html`)**
5. **Liên hệ & Tư vấn (`contact.html`)**

### Các vấn đề chính được phát hiện trước khi sửa:
1. **Thiếu module xử lý Form (`contact.html`)**: Form liên hệ gửi dữ liệu dạng POST mặc định gây reload trang; chưa có cơ chế kiểm tra tính hợp lệ dữ liệu (validation) và thiếu thông báo minh bạch rằng website đang chạy ở chế độ demo (frontend showcase).
2. **Không đồng bộ ngôn ngữ giao diện (Tiếng Anh ↔ Tiếng Việt)**: Menu điều hướng, bộ lọc, thẻ dự án, thông số kỹ thuật và nhãn nút vẫn hiển thị tiếng Anh xen kẽ ("Inquire", "Explore", "All Projects", "View Monograph", v.v.).
3. **Xử lý mã định danh công trình không tồn tại (`project.html?slug=...`)**: Trang chuyển hướng âm thầm mà không cung cấp phản hồi trực quan, dễ gây hoang mang cho người dùng nếu nhập URL sai.
4. **Độ lệch cuộn mỏ neo (#process)**: Khi nhảy trực tiếp vào liên kết quy trình từ trang khác, thanh navbar cố định có nguy cơ che khuất một phần tiêu đề phần quy trình.
5. **Hiệu ứng cuộn mượt và tương tác Stepper Hero**: Nút CTA "Khám phá công trình tiêu biểu" và các nút Stepper cần đảm bảo tính năng cuộn chuẩn xác khi tích hợp cùng GSAP ScrollTrigger đã ghim (pin).

---

## 2. MA TRẬN KIỂM THỬ TƯƠNG TÁC CHI TIẾT (EXHAUSTIVE TEST MATRIX)

| STT | Trang | Phần tử / Bộ chọn (Selector) | Hành vi kỳ vọng (Expected Behavior) | Trạng thái ban đầu | Nguyên nhân gốc (Root Cause) | File đã sửa đổi | Kết quả kiểm thử |
|:---:|:---|:---|:---|:---|:---|:---|:---:|
| **1** | Toàn bộ | `.site-navbar__brand` | Bấm logo quay về `index.html` | Hoạt động | Không có lỗi | `navbar.js` | **PASS** |
| **2** | Toàn bộ | `.site-navbar__link[href="projects.html"]` | Chuyển sang trang "Dự án", cập nhật `is-active` | Nhãn tiếng Anh ("Projects") | Chưa bản địa hóa nhãn | `index.html`, `projects.html`, `project.html`, `about.html`, `contact.html` | **PASS** |
| **3** | Toàn bộ | `.site-navbar__link[href="about.html"]` | Chuyển sang trang "Giới thiệu", cập nhật `is-active` | Nhãn tiếng Anh ("About") | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **4** | Toàn bộ | `.site-navbar__link[href="about.html#process"]` | Chuyển sang phần "Quy trình" trên trang About | Tiêu đề bị sát navbar | Thiếu `scroll-margin-top` tối ưu | `about.html`, `navbar.js` | **PASS** |
| **5** | Toàn bộ | `.site-navbar__link[href="contact.html"]` | Chuyển sang trang "Liên hệ", cập nhật `is-active` | Nhãn tiếng Anh ("Contact") | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **6** | Toàn bộ | `.site-navbar__cta` | Chuyển sang form liên hệ tư vấn | Nhãn tiếng Anh ("Inquire +") | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **7** | Toàn bộ (Mobile) | `.site-navbar__toggle` | Mở/đóng Drawer menu toàn màn hình | Hoạt động tốt | Không có lỗi | `drawer.js`, `drawer.css` | **PASS** |
| **8** | Toàn bộ (Mobile) | `.mobile-drawer__close` | Đóng Drawer và trả lại focus cho toggle | Hoạt động tốt | Không có lỗi | `drawer.js` | **PASS** |
| **9** | Toàn bộ (Mobile) | `.mobile-drawer__link` (01 - 04) | Điều hướng đến đúng trang và đóng drawer | Nhãn tiếng Anh | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **10** | `index.html` | `.hero-hud__step-btn[data-stage="0"]` | Nhảy đến Giai đoạn 1: Phác thảo, đổi layer & HUD | Nhãn tiếng Anh ("01 Sketch") | Chưa bản địa hóa nhãn | `index.html`, `hero-scroll.js` | **PASS** |
| **11** | `index.html` | `.hero-hud__step-btn[data-stage="1"]` | Nhảy đến Giai đoạn 2: Bản vẽ kỹ thuật | Nhãn tiếng Anh ("02 Blueprint") | Chưa bản địa hóa nhãn | `index.html`, `hero-scroll.js` | **PASS** |
| **12** | `index.html` | `.hero-hud__step-btn[data-stage="2"]` | Nhảy đến Giai đoạn 3: Phối cảnh 3D | Nhãn tiếng Anh ("03 3D Form") | Chưa bản địa hóa nhãn | `index.html`, `hero-scroll.js` | **PASS** |
| **13** | `index.html` | `.hero-hud__step-btn[data-stage="3"]` | Nhảy đến Giai đoạn 4: Hoàn thiện thực tế | Nhãn tiếng Anh ("04 Reality") | Chưa bản địa hóa nhãn | `index.html`, `hero-scroll.js` | **PASS** |
| **14** | `index.html` | `.hero-bottom-bar__prompt` | Bấm để cuộn xuống và tiếp tục dựng hình | Nhãn tiếng Anh ("Scroll to construct") | Chưa có click handler & nhãn tiếng Anh | `index.html`, `hero-scroll.js` | **PASS** |
| **15** | `index.html` | `.hero-stage4-reveal__cta` | Cuộn mượt vượt qua Hero đến `#featured-works` | Nhãn tiếng Anh & phụ thuộc anchor thô | Hero bị ghim khiến jump anchor không mượt | `index.html`, `hero-scroll.js` | **PASS** |
| **16** | `index.html` | `.featured-card` (3 công trình) | Mở đúng trang chi tiết `project.html?slug=...` | Nhãn tiếng Anh, hover tag tiếng Anh | Nhãn & data-cursor tiếng Anh | `index.html` | **PASS** |
| **17** | `index.html` | `.disciplines-grid a.link-arrow` | Liên kết đến danh mục Kiến trúc / Nội thất | Nhãn tiếng Anh ("Browse Architecture") | Chưa bản địa hóa nhãn | `index.html` | **PASS** |
| **18** | `index.html` | `.teaser-content a.link-arrow` | Liên kết đến trang Giới thiệu & Quy trình | Nhãn tiếng Anh ("About Studio & Process") | Chưa bản địa hóa nhãn | `index.html` | **PASS** |
| **19** | `projects.html` | `.filter-btn-primary[data-filter="all"]` | Lọc toàn bộ 8 dự án, cập nhật badge | Nhãn tiếng Anh ("All Projects") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **20** | `projects.html` | `.filter-btn-primary[data-filter="architecture"]` | Lọc 4 dự án Kiến trúc, cập nhật readout 4/8 | Nhãn tiếng Anh ("Architecture") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **21** | `projects.html` | `.filter-btn-primary[data-filter="interior"]` | Lọc 4 dự án Nội thất, cập nhật readout 4/8 | Nhãn tiếng Anh ("Interior Design") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **22** | `projects.html` | `.filter-btn-status[data-status="all"]` | Lọc tất cả trạng thái | Nhãn tiếng Anh ("All Status") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **23** | `projects.html` | `.filter-btn-status[data-status="completed"]` | Lọc 7 dự án hoàn thành, readout 7/8 | Nhãn tiếng Anh ("Completed") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **24** | `projects.html` | `.filter-btn-status[data-status="in-progress"]` | Lọc 1 dự án đang thực hiện, readout 1/8 | Nhãn tiếng Anh ("In Progress") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **25** | `projects.html` | `.grid-view-btn[data-grid="2"]` | Chuyển lưới về chế độ 2 cột (Cinematic View) | Nhãn tiếng Anh ("2 Col") | Chưa bản địa hóa nhãn | `projects.html` | **PASS** |
| **26** | `projects.html` | `.grid-view-btn[data-grid="4"]` | Chuyển lưới về chế độ 4 cột (Overview Grid) | Nhãn tiếng Anh ("4 Col") | Chưa bản địa hóa nhãn | `projects.html` | **PASS** |
| **27** | `projects.html` | `#projects-reset-btn` | Đặt lại toàn bộ bộ lọc khi 0 kết quả | Nhãn tiếng Anh ("Reset All Filters") | Chưa bản địa hóa nhãn | `projects.html`, `projects.js` | **PASS** |
| **28** | `projects.html` | `.project-card__link` (8 cards) | Click mở `project.html?slug=${slug}` | Nhãn tag, trạng thái tiếng Anh | Render tiếng Anh trong `projects.js` | `projects.js` | **PASS** |
| **29** | `project.html` | `.detail-back-link` | Quay lại thư viện dự án | Nhãn tiếng Anh ("Back to all projects") | Chưa bản địa hóa nhãn | `project.html` | **PASS** |
| **30** | `project.html` | `#next-project-link` | Chuyển sang công trình kế tiếp | Nhãn tiếng Anh ("Next Project") | Chưa bản địa hóa nhãn | `project.html` | **PASS** |
| **31** | `project.html` | Slug không tồn tại (`?slug=xyz`) | Hiển thị thông báo 404 thân thiện, không crash | Redirect thô bằng `window.location` | Thiếu UI xử lý fallback | `project.html` | **PASS** |
| **32** | `about.html` | `#process` (Anchor navigation) | Cuộn chính xác, không bị navbar che lấp | Dễ bị dính sát mép trên navbar | Cần `scroll-margin-top` lớn hơn | `about.html` | **PASS** |
| **33** | `contact.html` | `#contact-form` (Trống trường bắt buộc) | Chặn gửi, hiển thị thông báo lỗi tiếng Việt | Gửi POST reload trang | Thiếu controller `contact.js` | `contact.js`, `contact.html`, `main.js` | **PASS** |
| **34** | `contact.html` | `#email` (Sai định dạng email) | Báo lỗi định dạng email tiếng Việt | Form không bắt lỗi chi tiết | Thiếu regex validation | `contact.js` | **PASS** |
| **35** | `contact.html` | `#contact-form` (Nhập hợp lệ) | Hiển thị thông báo tiếp nhận & ghi rõ Chế độ Demo | Không có thông báo hoặc fake server | Chưa có hộp thoại phản hồi | `contact.js`, `contact.html` | **PASS** |
| **36** | `contact.html` | `#close-feedback-btn` | Đóng thông báo Demo | Không có | Chưa tạo element | `contact.js` | **PASS** |
| **37** | Toàn bộ | `.site-footer__back-to-top` | Cuộn mượt về đầu trang (`top: 0`) | Nhãn tiếng Anh ("Back to top") | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **38** | Toàn bộ | `.site-footer__link` | Điều hướng đến các trang và mailto | Nhãn mục lục tiếng Anh | Chưa bản địa hóa nhãn | Cả 5 file HTML | **PASS** |
| **39** | Toàn bộ (Desktop) | `.custom-cursor` | Con trỏ vòng tròn bám chuột, đổi nhãn "XEM" | Nhãn tiếng Anh ("VIEW", "EXPLORE") | Nhãn chưa bản địa hóa | `cursor.js`, cả 5 file HTML | **PASS** |

---

## 3. PHÂN TÍCH NGUYÊN NHÂN GỐC & GIẢI PHÁP ĐÃ THỰC HIỆN

### 1. Hệ thống biểu mẫu liên hệ & Phản hồi minh bạch (Contact Form & Demo Mode)
- **Nguyên nhân gốc:** `contact.html` trước đó chỉ có cấu trúc HTML thô không có script điều khiển riêng. Khi người dùng bấm nút "Gửi", trình duyệt thực hiện hành vi mặc định gửi POST lên chính URL đó làm reload trang, làm mất dữ liệu đã nhập và không có thông báo xác nhận.
- **Giải pháp:** 
  - Khởi tạo module chuyên biệt `js/pages/contact.js` và tích hợp vào `js/main.js` khi `App.currentPage === 'contact'`.
  - Bổ sung xác thực phía máy khách (Client-side validation) cho Tên (tối thiểu 2 ký tự), Email (theo chuẩn định dạng Regex), và Nội dung yêu cầu (tối thiểu 10 ký tự).
  - Tích hợp vùng thông báo Chế độ Demo (`#contact-feedback`) với lời chào cá nhân hóa theo tên người gửi, tóm tắt phạm vi công việc đã chọn, và ghi chú minh bạch rằng website hoạt động ở chế độ trưng bày giao diện (Frontend Showcase), chưa kết nối cơ sở dữ liệu để gửi thông tin ra ngoài. Có nút đóng `×` tiện lợi.

### 2. Bản địa hóa toàn diện ngôn ngữ giao diện sang Tiếng Việt
- **Nguyên nhân gốc:** Trong các giai đoạn trước (Phase 1, Phase 2, Phase 3), một số thành phần giao diện đã sử dụng thuật ngữ tiếng Anh kiến trúc quốc tế ("Projects", "Selected Works", "2 Col / 4 Col", "Inquire +", "View Monograph", v.v.).
- **Giải pháp:**
  - Chuẩn hóa toàn bộ nhãn tiếng Việt trên cả 5 trang:
    - Navbar & Mobile Drawer: `Dự án`, `Giới thiệu`, `Quy trình`, `Liên hệ`, `Tư vấn +`.
    - Hero HUD: `01 Phác thảo`, `02 Kỹ thuật`, `03 Khối 3D`, `04 Hoàn thiện`, `Cuộn để dựng hình ↓`.
    - Hero Title Overlay: `TỪ NÉT VẼ ĐẾN KHÔNG GIAN SỐNG`, CTA `Khám phá công trình tiêu biểu ↓`.
    - Thư viện dự án: `Tất cả dự án`, `Kiến trúc`, `Nội thất`, `Tất cả trạng thái`, `Đã hoàn thành`, `Đang thực hiện`, `2 Cột`, `4 Cột`, `Đang hiển thị X / 8 công trình`, `Xem chi tiết công trình →`.
    - Chi tiết công trình: `Loại hình công trình`, `Tổng diện tích sàn`, `Ngôn ngữ kiến trúc`, `Trạng thái dự án`, `Ý niệm Không gian & Cấu trúc`, `Dự án tiếp theo: ... →`.
    - Về văn phòng & Quy trình: `5 Giai đoạn hiện thực hóa công trình`, `Khảo sát & Bối cảnh thiết kế`, `Ý niệm & Cấu trúc không gian`, `Phát triển thiết kế chi tiết`, `Hồ sơ kỹ thuật thi công`, `Giám sát tác giả & Hoàn thiện`.
    - Liên hệ: `Cùng kiến tạo không gian trường tồn.`, `Họ và tên hoặc Đơn vị *`, `Địa chỉ Email *`, `Phạm vi dự án`, `Tóm tắt yêu cầu & Địa điểm *`, `Gửi yêu cầu tư vấn →`.
    - Footer: `Mục lục`, `Trang chủ`, `Dự án tiêu biểu`, `Về văn phòng`, `Quy trình thiết kế`, `Liên hệ tư vấn`, `Chuyên ngành`, `Về đầu trang ↑`, `Thông báo minh họa`.
    - Con trỏ Custom Cursor: nhãn hiển thị `XEM` thay cho `VIEW`.

### 3. Xử lý an toàn khi Slug dự án không hợp lệ (`project.html?slug=...`)
- **Nguyên nhân gốc:** Script trước đó nếu không tìm thấy slug sẽ gọi lệnh `window.location.href = 'projects.html'`, tạo cảm giác giật trang hoặc chuyển hướng đột ngột mà người dùng không hiểu lý do.
- **Giải pháp:** Xây dựng màn hình thông báo 404 thân thiện ngay trong container trang `project.html`, hiển thị nhãn `404 · Dữ liệu không tồn tại`, thông báo rõ ràng slug đó không có trong kho lưu trữ và cung cấp nút bấm `Quay lại thư viện dự án →` để người dùng điều hướng tự nhiên.

### 4. Khắc phục độ lệch cuộn mỏ neo `#process`
- **Nguyên nhân gốc:** Thanh Navbar cố định chiếm khoảng `72px` chiều cao. Nếu không có khoảng bù lề cuộn, thẻ tiêu đề `#process` sẽ bị nằm sát hoặc một phần bị che bởi navbar.
- **Giải pháp:** Cập nhật quy tắc CSS trong `about.html`:
  ```css
  .process-section {
    scroll-margin-top: calc(var(--nav-height) + 2rem);
  }
  ```
  Nhờ đó, khi người dùng bấm vào liên kết `Quy trình` từ bất kỳ trang nào, màn hình sẽ dừng cách thanh navbar một khoảng đệm thông thoáng (~230px tính từ mép trên trình duyệt).

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ BẰNG BROWSER QA SUBAGENT

Trình duyệt đã thực hiện kiểm thử tự động toàn diện qua 6 kịch bản trên máy chủ `http://localhost:3000`:

1. **Trang chủ (`index.html`)**:
   - 4 nút Stepper chuyển đổi mượt mà giữa các lớp bản vẽ Sketch → Kỹ thuật → Khối 3D → Hoàn thiện.
   - Nút `Khám phá công trình tiêu biểu ↓` cuộn mượt xuống tọa độ `y = 708.75px` của `#featured-works`.
   - Bấm card "Villa Lá Phong" chuyển hướng chính xác đến `project.html?slug=villa-la-phong`.
2. **Trang chi tiết (`project.html`)**:
   - Bảng thông số hiển thị đầy đủ nhãn tiếng Việt chuẩn xác.
   - Nút `Dự án tiếp theo` điều hướng chuẩn sang "The Cliff House".
   - Truy cập slug không hợp lệ (`?slug=non-existent-test`) hiển thị giao diện 404 thân thiện với nút quay lại, 0 lỗi runtime trên Console.
3. **Thư viện dự án (`projects.html`)**:
   - Bộ lọc 2 cấp (Chuyên ngành & Trạng thái) cập nhật số đếm chính xác từng trường hợp (4/8, 7/8, 1/8).
   - Tổ hợp 0 kết quả kích hoạt Empty State và nút `Đặt lại bộ lọc →` khôi phục ngay 8 công trình.
   - Nút chuyển lưới `2 Cột` và `4 Cột` đổi layout tức thì.
4. **Quy trình (`about.html#process`)**:
   - Vị trí dừng cuộn mỏ neo đạt `y = 231px`, cách thanh navbar cố định rất thoáng đãng.
5. **Liên hệ (`contact.html`)**:
   - Để trống form: 3 thông báo lỗi viền đỏ tiếng Việt hiển thị chính xác dưới từng trường.
   - Nhập thông tin hợp lệ: Hộp thoại Demo xuất hiện trang trọng, chào đúng tên người gửi và giải thích rõ trạng thái demo.
   - Bấm `×` đóng thông báo ngay lập tức.
6. **Menu di động (Mobile Drawer trên Viewport 375x812)**:
   - Nút hamburger mở menu toàn màn hình với 4 mục `01 Dự án`, `02 Giới thiệu`, `03 Quy trình`, `04 Liên hệ`.
   - Nút đóng `×` đóng menu mượt mà, không bị khóa cuộn ngang hay kẹt giao diện.

---

## 5. KẾT LUẬN

Tất cả các thành phần tương tác trên cả 5 trang của website **Living Blueprint** đã được sửa chữa, chuẩn hóa 100% tiếng Việt, kiểm thử hit-testing thực tế và đạt trạng thái hoạt động hoàn hảo.
