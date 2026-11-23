# KẾ HOẠCH TRIỂN KHAI: VISUAL CONTENT EDITOR
## LIVING BLUEPRINT — PORTFOLIO KIẾN TRÚC & NỘI THẤT CÁ NHÂN

> **Tài liệu:** Kế hoạch Thiết kế Kiến trúc & Lộ trình Triển khai Chế độ Chỉnh sửa Trực quan  
> **Trạng thái:** Chờ phê duyệt từ người dùng (Awaiting User Sign-off)  
> **Mục tiêu cốt lõi:** Cho phép kiến trúc sư mở website tại `http://localhost:3000`, bật chế độ chỉnh sửa, nhấp trực tiếp vào văn bản/hình ảnh để cập nhật nội dung và nhấn Lưu thực sự vào file dữ liệu JSON trong dự án mà không cần can thiệp mã nguồn HTML/CSS/JS thủ công.

---

## 1. KHẢO SÁT HIỆN TRẠNG MÃ NGUỒN & ĐÁNH GIÁ TƯƠNG THÍCH

Qua khảo sát toàn bộ workspace `d:\ArchitecturePortfolio\`:

1. **Máy chủ hiện tại (`server.js`):**
   - Đang sử dụng module native thuần của Node.js (`http`, `fs`, `path`), lắng nghe duy nhất tại `127.0.0.1:3000`.
   - Hiện tại chỉ phục vụ file tĩnh (static file serving), chưa có API tiếp nhận request POST/PUT để ghi dữ liệu hoặc lưu hình ảnh.
   - **Đánh giá:** Rất thuận lợi để mở rộng thêm các REST API cục bộ (`/api/*`) mà hoàn toàn **không cần cài thêm thư viện npm nặng nề**, đảm bảo chạy độc lập, nhẹ và an toàn tuyệt đối.

2. **Cấu trúc Dữ liệu & Nội dung hiển thị:**
   - **8 Đồ án mẫu:** Đang nằm trong `js/core/data.js` dưới dạng mảng JavaScript `projects = [...]`. Được nạp vào `projects.html` qua `projects.js` và `project.html` qua `project-detail.js`.
   - **Văn bản các trang tĩnh:** Đang nằm trực tiếp trong file HTML (`index.html`, `about.html`, `contact.html`).
   - **Đánh giá:** Để chỉnh sửa trực quan mà dữ liệu được lưu bền vững khi tải lại trang, giải pháp tối ưu nhất là chuyển toàn bộ nội dung văn bản và thông tin dự án vào **các file dữ liệu JSON chuẩn mực** nằm trong thư mục `data/` của workspace, đúng như định hướng của bạn: *"Ưu tiên lưu nội dung vào các file dữ liệu JSON trong workspace ArchitecturePortfolio"*.

3. **Tính toàn vẹn của Giao diện & Hiệu ứng (Phase 1–6):**
   - Website đang sở hữu hệ thống animation phức tạp: GSAP ScrollTrigger 4 giai đoạn, Custom Ring Cursor, Fullscreen Mobile Drawer, Bộ lọc Projects với chuyển lưới 2/4 cột, Lightbox modal phím Escape, và kiểm tra client-side validation.
   - **Yêu cầu bắt buộc:** Module Visual Editor phải được đóng gói độc lập theo dạng **Overlay Layer (Lớp phủ quản trị)**, chỉ kích hoạt khi chạy trên `localhost:3000`. Khi tắt chế độ chỉnh sửa (Preview Mode) hoặc khi triển khai production, toàn bộ các thuộc tính và class của editor tự động vô hiệu hóa, trả lại giao diện 100% nguyên bản.

---

## 2. THIẾT KẾ KIẾN TRÚC LƯU TRỮ (DATA ARCHITECTURE)

Thiết lập thư mục `d:\ArchitecturePortfolio\data\` với cấu trúc phân cấp rõ ràng:

```
d:\ArchitecturePortfolio\
├── data/
│   ├── site-content.json           ← Toàn bộ văn bản có thể chỉnh sửa của 5 trang
│   ├── projects.json               ← Cơ sở dữ liệu đầy đủ của 8 đồ án mẫu
│   └── backups/                    ← Thư mục lưu trữ tự động các bản snapshot lịch sử
│       ├── site-content_20261121_113000.json
│       └── projects_20261121_113000.json
├── assets/
│   └── images/
│       └── uploads/                ← Thư mục lưu ảnh mới người dùng tải lên từ máy tính
```

### A. Cấu trúc `site-content.json` (Trang tĩnh)
Lưu trữ nội dung phân cấp theo trang và từng khối thông tin:
```json
{
  "home": {
    "heroKicker": "LIVING BLUEPRINT · PORTFOLIO KIẾN TRÚC SƯ CÁ NHÂN",
    "heroTitle": "Từ Nét Vẽ Đến Không Gian Sống",
    "heroDesc": "Hành trình kiến tạo từ nét phác thảo ý niệm đến không gian cư ngụ tĩnh tại...",
    "featuredKicker": "Công trình tuyển chọn",
    "featuredTitle": "Kiến trúc & Nội thất"
  },
  "about": {
    "portraitNotice": "Vị trí ảnh chân dung kiến trúc sư — Sẽ được cập nhật khi có ảnh chính thức.",
    "architectTitle": "Living Blueprint",
    "architectSubtitle": "Kiến tạo từ ánh sáng & khoảng lặng",
    "bio1": "Tôi là kiến trúc sư thực hành độc lập, chuyên sâu về thiết kế kiến trúc...",
    "bio2": "Trọng tâm thực hành hướng đến việc kiến tạo những nơi chốn cư ngụ tĩnh tại...",
    "pullquote": "\"Kiến trúc không phải hành vi chiếm đoạt cảnh quan...\"",
    "philosophy": [
      { "num": "01", "title": "Ánh sáng như chất liệu tạo hình", "desc": "..." },
      { "num": "02", "title": "Tính chân thực của vật liệu", "desc": "..." },
      { "num": "03", "title": "Lấy con người làm trung tâm", "desc": "..." }
    ],
    "process": [
      { "step": "01", "title": "01. Khảo sát và tiếp nhận yêu cầu", "desc": "..." },
      { "step": "02", "title": "02. Nghiên cứu bối cảnh và phát triển ý tưởng", "desc": "..." },
      { "step": "03", "title": "03. Hoàn thiện phương án kiến trúc và nội thất", "desc": "..." },
      { "step": "04", "title": "04. Triển khai hồ sơ thiết kế", "desc": "..." },
      { "step": "05", "title": "05. Đồng hành trong quá trình hiện thực hóa công trình", "desc": "..." }
    ]
  },
  "contact": {
    "headline": "Khởi tạo",
    "headlineSub": "không gian sống.",
    "intro": "Nếu bạn đang ấp ủ một ý niệm cư ngụ tĩnh tại...",
    "email": "inquiries@livingblueprint.demo",
    "location": "Hà Nội · Đà Nẵng · TP.Hồ Chí Minh",
    "hours": "Thứ Hai — Thứ Sáu: 09:00 — 18:00 (GMT+7)"
  },
  "footer": {
    "desc": "Portfolio cá nhân kiến trúc sư thực hành kiến trúc và nội thất tối giản đương đại...",
    "disclaimer": "Mọi đồ án kiến trúc, hình ảnh minh họa, địa danh..."
  }
}
```

### B. Cấu trúc `projects.json` (Dự án)
Di chuyển toàn bộ 8 dự án từ `data.js` sang định dạng JSON thuần, bổ sung cờ trạng thái:
- `order`: Số thứ tự hiển thị (1, 2, 3...)
- `isHidden`: `false` (cho phép ẩn/hiện dự án)
- `coverImage`: Đường dẫn hình ảnh hoặc gradient đại diện
- Giữ nguyên 100% các trường: `slug`, `title`, `category`, `year`, `location`, `status`, `area`, `type`, `style`, `summary`, `context`, `objectives`, `philosophy`, `concept`, `drawings`, `gallery`, `materials`...

---

## 3. THIẾT KẾ API NODE.JS CỤC BỘ (LOCAL SECURE BACKEND)

Nâng cấp `server.js` để xử lý các yêu cầu nghiệp vụ qua cổng `127.0.0.1:3000`:

### A. Cơ chế An toàn & Bảo mật bắt buộc:
1. **Ràng buộc IP 127.0.0.1 / `::1`:**
   Mọi request đến `/api/*` sẽ được kiểm tra `req.socket.remoteAddress`. Nếu không xuất phát từ máy cục bộ, lập tức từ chối `403 Forbidden`.
2. **Ngăn chặn ghi file tùy ý (No Arbitrary File Write):**
   Backend chỉ chấp nhận đọc/ghi duy nhất 2 file: `data/site-content.json` và `data/projects.json`. Mọi tham số đường dẫn bên ngoài đều bị từ chối.
3. **Cơ chế Ghi file An toàn (Atomic Safe Write):**
   - Trước khi ghi đè, hệ thống tự động copy file hiện tại vào `data/backups/{filename}_{timestamp}.json`.
   - Ghi dữ liệu mới vào file tạm `.tmp` trước, sau đó dùng `fs.renameSync` để thay thế nguyên tử (atomic), đảm bảo dữ liệu không bị hỏng nếu quá trình ghi bị ngắt đột ngột.
4. **Xác thực dữ liệu trước khi lưu (Validation):**
   Kiểm tra định dạng JSON hợp lệ; nếu JSON lỗi, trả về `400 Bad Request` kèm thông báo lỗi chi tiết, không làm hỏng file dữ liệu cũ.

### B. Danh sách Endpoints API:

| Phương thức | Đường dẫn Endpoint | Mục đích chức năng |
| :---: | :--- | :--- |
| `GET` | `/api/content` | Đọc toàn bộ nội dung văn bản từ `data/site-content.json` |
| `POST` | `/api/content` | Lưu nội dung văn bản mới, tạo bản sao lưu snapshot |
| `GET` | `/api/projects` | Đọc danh sách toàn bộ các dự án từ `data/projects.json` |
| `POST` | `/api/projects` | Cập nhật danh sách dự án (sửa/thêm/ẩn/sắp xếp), tạo sao lưu |
| `POST` | `/api/upload-image` | Tiếp nhận file ảnh (Base64/Binary), kiểm tra đuôi `.jpg`, `.png`, `.webp`, khử khuẩn tên file, lưu vào `assets/images/uploads/` và trả về URL ảnh |
| `GET` | `/api/backups` | Lấy danh sách các phiên bản sao lưu khả dụng |
| `POST` | `/api/restore-backup` | Khôi phục dữ liệu từ một bản sao lưu cụ thể |

---

## 4. THIẾT KẾ GIAO DIỆN QUẢN TRỊ & TRẢI NGHIỆM BIÊN TẬP TRỰC QUAN

Đóng gói trong 2 file độc lập:
- `js/editor/visual-editor.js`
- `css/editor/visual-editor.css`

### A. Thanh công cụ Quản trị Nổi (Floating Bottom Dock)
Thiết kế tối giản sang trọng theo chuẩn Living Blueprint:
- Nằm cố định ở đáy màn hình với nền đen than `#1A1916`, viền vàng đồng mảnh `#A8865C`, góc bo tinh tế:
  1. **Nút Bật / Tắt Chế độ chỉnh sửa**: Nút gạt chuyển đổi trạng thái (Phím tắt nhanh: `Ctrl + E`).
  2. **Nút Chế độ Xem trước (Preview)**: Tạm thời ẩn toàn bộ viền chỉnh sửa và thanh công cụ để duyệt website như người dùng thật.
  3. **Huy hiệu Trạng thái (Status Badge)**:
     - Xanh/Xám: *"Đã lưu toàn bộ"*
     - Vàng hổ phách nhấp nháy: *"Có X thay đổi chưa lưu"*
  4. **Nút "Hoàn tác" (Undo/Revert)**: Hủy bỏ các thay đổi tạm thời chưa lưu trong phiên, khôi phục lại văn bản ban đầu.
  5. **Nút "Lưu Thay Đổi" (Save Changes - Phím tắt `Ctrl + S`)**: Gửi dữ liệu về API, hiển thị hiệu ứng lưu và thông báo Toast xác nhận thành công.
  6. **Nút "Quản lý Dự án"**: Mở Modal quản trị 8 công trình.
  7. **Nút "Quản lý Hình ảnh"**: Mở kho ảnh đã tải lên.

### B. Chỉnh sửa Văn bản Trực quan (Inline Text Editing)
- Gắn thuộc tính định danh lên các thẻ HTML: `data-editable="about.architectTitle"`, `data-editable="contact.headline"`, v.v.
- Khi bật chế độ chỉnh sửa:
  - Xuất hiện đường viền nét đứt nhẹ màu đồng (`outline: 1px dashed rgba(168, 134, 92, 0.45)`).
  - Khi hover: Viền chuyển sang nét liền vàng đồng rõ nét kèm nhãn nhỏ phía trên chỉ dẫn vị trí khối tin.
  - Nhấp chuột: Kích hoạt `contenteditable="true"`, cho phép sửa trực tiếp văn bản tại chỗ với đúng phông chữ Cormorant Garamond / Inter nguyên bản.
  - **Chống mã độc (Sanitization):** Sự kiện `paste` và `input` chỉ nhận văn bản thuần (`plain text`), loại bỏ triệt để mọi thẻ HTML hoặc thẻ `<script>`.
  - Tự động ghi nhận thay đổi vào bộ đệm bộ nhớ và kích hoạt nút *"Lưu Thay Đổi"*.

### C. Quản lý & Thay đổi Hình ảnh Trực quan
- Các thẻ ảnh hoặc khung ảnh có thuộc tính `data-editable-image="about.portrait"`:
  - Khi hover ở chế độ chỉnh sửa: Xuất hiện nút badge nổi mờ bán trong suốt *"Thay ảnh"* kèm icon máy ảnh.
  - Nhấp vào nút: Mở hộp thoại chọn file native từ máy tính (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - **Xem trước tức thì (Instant Preview):** Sử dụng `FileReader` / `URL.createObjectURL` để hiển thị ảnh mới ngay lập tức trên giao diện mà chưa cần gửi lên server.
  - Khi người dùng bấm *"Lưu Thay Đổi"*: Ứng dụng gửi ảnh đến `/api/upload-image`, nhận đường dẫn tĩnh (ví dụ `/assets/images/uploads/portrait_20261121.jpg`) và cập nhật cấu trúc dữ liệu.
  - **Nguyên tắc an toàn:** Không bao giờ xóa file ảnh gốc ban đầu.

### D. Modal Quản trị 8 Dự án (Project Manager Modal)
- Mở một bảng điều khiển trang nhã hiển thị danh sách 8 dự án mẫu:
  - Cột thứ tự: Kéo thả hoặc nút bấm Lên / Xuống (`Move Up` / `Move Down`).
  - Cột trạng thái: Nút gạt Ẩn / Hiện dự án (`isHidden`).
  - Cột thao tác: Nút *"Chỉnh sửa thông số"* và nút *"Thêm dự án mới"*.
  - Bảng chỉnh sửa thông số dự án: Cho phép sửa Tên công trình, Phân loại (Kiến trúc / Nội thất), Năm, Địa điểm, Diện tích, Mô tả tóm tắt, Ý niệm, và danh sách ảnh Gallery.
  - **Bảo toàn liên kết:** Giữ nguyên giá trị `slug` ban đầu khi sửa nội dung thông thường để không làm gãy đường dẫn URL.

---

## 5. LỘ TRÌNH TRIỂN KHAI TỪNG BƯỚC (ROADMAP)

### Bước 1: Khởi tạo Cấu trúc Dữ liệu JSON & Sao lưu ban đầu
- Tạo thư mục `d:\ArchitecturePortfolio\data\` và `data/backups/`.
- Tạo thư mục `d:\ArchitecturePortfolio\assets\images\uploads\`.
- Trích xuất dữ liệu văn bản của 5 trang web vào `data/site-content.json`.
- Chuyển đổi dữ liệu 8 đồ án mẫu từ `data.js` sang `data/projects.json`.
- Cập nhật `js/core/data.js` để đọc từ `projects.json` (có cơ chế fallback sẵn có để luôn an toàn).

### Bước 2: Nâng cấp `server.js` với API REST Cục bộ
- Bổ sung router xử lý `/api/content`, `/api/projects`, `/api/upload-image`, `/api/backups`, `/api/restore-backup`.
- Cài đặt cơ chế kiểm tra IP chỉ chấp nhận `127.0.0.1`.
- Cài đặt cơ chế ghi file nguyên tử kèm sao lưu tự động trước khi ghi.
- Khởi động lại server node và kiểm tra các API qua curl/PowerShell.

### Bước 3: Tích hợp Lớp ánh xạ Dữ liệu (Content Binder)
- Xây dựng module tự động quét các phần tử `[data-editable]` trên trang và điền nội dung từ `site-content.json`.
- Bảo đảm trang web tải cực nhanh, không gây hiện tượng chớp nháy giao diện (FOUC).

### Bước 4: Xây dựng Giao diện Visual Editor & Inline Editing
- Tạo `css/editor/visual-editor.css`: Thanh Dock, hiệu ứng viền chỉnh sửa, badge thay ảnh, toast thông báo trạng thái.
- Tạo `js/editor/visual-editor.js`: Quản lý trạng thái chỉnh sửa (`isEditMode`), xử lý sự kiện gõ phím, nút Lưu, nút Hoàn tác, phím tắt `Ctrl + E`, `Ctrl + S`.

### Bước 5: Xây dựng Tính năng Upload Ảnh & Modal Quản lý Dự án
- Xây dựng cơ chế upload ảnh từ máy tính và xem trước trực tiếp.
- Xây dựng Modal Quản lý 8 dự án (sắp xếp, ẩn/hiện, sửa thông số, thêm ảnh gallery).

### Bước 6: Kiểm thử Toàn diện & Báo cáo Nghiệm thu
- Thực hiện kiểm tra thực tế cả 10 kịch bản kiểm thử bắt buộc bằng Browser Agent.
- Rà soát kiểm tra hồi quy: GSAP Hero Scroll, Navbar, Mobile Drawer, Filter, Lightbox modal, Contact form... đảm bảo 100% chức năng đã nghiệm thu từ Phase 1–6 hoạt động hoàn hảo.

---

## 6. KẾ HOẠCH KIỂM THỬ (10 KỊCH BẢN BẮT BUỘC)

Sau khi hoàn thành lập trình, Browser Agent sẽ kiểm thử thực tế trực tiếp:

1. **Sửa tiêu đề trực tiếp:** Bật chế độ chỉnh sửa, sửa một tiêu đề trên trang About hoặc Home, bấm Lưu thay đổi.
2. **Kiểm tra độ bền vững:** Tải lại trang (F5 / hard reload) và kiểm tra nội dung mới vừa sửa vẫn được giữ nguyên vẹn từ file JSON.
3. **Thay ảnh trực tiếp:** Bấm "Thay ảnh" trên một khối ảnh, chọn file ảnh từ máy, kiểm tra ảnh mới được tải lên và lưu vào `assets/images/uploads/`.
4. **Chỉnh sửa dự án mẫu:** Mở Modal Quản lý dự án, sửa diện tích hoặc tên một công trình, xác nhận trang `projects.html` và `project.html?slug=...` cập nhật chính xác.
5. **Kiểm tra Gallery:** Đảm bảo Lightbox phóng to ảnh và chuyển tab bản vẽ vẫn hoạt động hoàn hảo sau khi cập nhật.
6. **Thử nghiệm Hoàn tác (Undo):** Sửa một đoạn văn bản nhưng không bấm Lưu, bấm "Hoàn tác", xác nhận văn bản khôi phục lại nội dung ban đầu.
7. **Kiểm tra Chế độ Xem trước (Preview Mode):** Chuyển sang Xem trước, xác nhận toàn bộ thanh công cụ và viền chỉnh sửa biến mất, website hoạt động như môi trường khách xem thực tế.
8. **Kiểm thử Đa thiết bị (Desktop & Mobile):** Kiểm tra thanh công cụ và giao diện chỉnh sửa hoạt động thuận tiện trên desktop (1440px) và thu gọn thông minh trên mobile (375px).
9. **Kiểm tra hồi quy Phase 1–6:** Xác nhận GSAP Hero Scroll 4 giai đoạn, Navbar cuộn, Mobile Drawer, và Form liên hệ Demo Notice không bị ảnh hưởng.
10. **Bảo mật API:** Xác nhận API chỉ có thể truy cập qua `127.0.0.1`, không mở cổng ghi file tùy ý ra bên ngoài.

---

## 7. ĐỀ XUẤT PHÊ DUYỆT

Kế hoạch này đảm bảo:
- **Đạt đúng mục tiêu 100%:** Chỉnh sửa văn bản và thay ảnh trực tiếp tại `localhost:3000`, bấm Lưu là dữ liệu được lưu bền vững vào file JSON.
- **Không phá vỡ website:** Giữ nguyên 100% HTML/CSS, hiệu ứng GSAP, font chữ và phong cách Living Blueprint.
- **Không dùng framework nặng:** Giữ vững kiến trúc Vanilla JS + Node.js native, không tạo ZIP, không tạo `.venv`.

**Kính mời bạn xem xét và phê duyệt kế hoạch trên. Ngay khi bạn đồng ý, tôi sẽ bắt đầu triển khai lập trình theo đúng các bước đã đề ra!**
