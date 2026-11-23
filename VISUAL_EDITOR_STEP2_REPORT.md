# BÁO CÁO NGHIỆM THU BƯỚC 2: XÂY DỰNG LOCAL REST API & BẢO MẬT HỆ THỐNG
## LIVING BLUEPRINT — VISUAL CONTENT EDITOR

> **Thời gian thực hiện:** 21/11/2026  
> **Môi trường hoạt động:** `http://127.0.0.1:3000` (Node.js Native Local Server)  
> **Trạng thái Bước 2:** ĐÃ HOÀN THÀNH & TOÀN BỘ KIỂM THỬ ĐẠT 100% PASS  
> **Ngôn ngữ:** 100% Tiếng Việt  

---

## 1. TỔNG QUAN BƯỚC 2

Trong Bước 2, máy chủ `server.js` của Living Blueprint đã được nâng cấp toàn diện từ một máy chủ tệp tĩnh đơn giản thành **Máy chủ Quản trị Cục bộ An toàn (Secure Local Server)**, tích hợp đầy đủ bộ REST API phục vụ trực tiếp cho Visual Content Editor theo đúng kế hoạch kiến trúc đã được phê duyệt trong `VISUAL_EDITOR_PLAN.md`:

- **100% Native Node.js:** Sử dụng hoàn toàn các thư viện chuẩn của Node.js (`http`, `fs`, `path`, `crypto`, `url`), không cài đặt hay phụ thuộc vào bất kỳ framework hoặc thư viện npm bên ngoài nào.
- **Phạm vi mạng cục bộ nghiêm ngặt:** Chỉ lắng nghe và phục vụ trên địa chỉ Loopback `127.0.0.1:3000`, tuyệt đối không mở cổng ra mạng bên ngoài.
- **Hệ thống an ninh đa tầng:** Tích hợp kiểm tra IP cục bộ, xác thực Host/Origin, bảo vệ chống CSRF, xác minh Magic Bytes định dạng ảnh thực tế, chặn truy cập tài nguyên sao lưu nhạy cảm và chống tấn công Path Traversal.
- **Cơ chế ghi dữ liệu nguyên tử & an toàn:** Ứng dụng hàng đợi AsyncMutex chống Race Condition, tự động sao lưu snapshot trước mỗi thao tác ghi, và ghi qua tệp tạm `.tmp` trước khi đổi tên thay thế tệp đích.
- **Tuân thủ giới hạn phạm vi:** Chưa tạo giao diện Visual Editor (thanh công cụ Dock, bảng điều khiển, nút sửa trực quan), chưa triển khai các Bước 3–6. Toàn bộ giao diện người dùng và hiệu ứng của Phase 1–6 được bảo toàn nguyên vẹn 100%.

---

## 2. KẾT QUẢ XÁC MINH DỮ LIỆU BƯỚC 1

Thực hiện rà soát độc lập trước khi triển khai Bước 2 theo đúng chỉ đạo:

### 2.1. Kiểm tra 8 Đồ án trong `data/projects.json`
Đã kiểm tra cấu trúc 8/8 đồ án trong `data/projects.json`, đảm bảo đầy đủ thông số kiến trúc, bản vẽ CAD vector SVG và thư viện ảnh:
1. `villa-la-phong` — Villa Lá Phong (Kiến trúc · 2024 · Đà Lạt, Lâm Đồng · 420 m²)
2. `cliff-house` — The Cliff House (Kiến trúc · 2024 · Quy Nhơn, Bình Định · 580 m²)
3. `ha-dong-cultural-center` — Hà Đông Cultural Center (Kiến trúc · 2023 · Hà Nội · 3.200 m²)
4. `mekong-riverside-office` — Mekong Riverside Office (Kiến trúc · 2022 · Cần Thơ · 1.850 m²)
5. `moc-studio` — Mộc Studio (Nội thất · 2024 · TP. Hồ Chí Minh · 95 m²)
6. `penthouse-lakeview` — Penthouse Lakeview (Nội thất · 2024 · Tây Hồ, Hà Nội · 310 m²)
7. `linen-suite` — The Linen Suite (Nội thất · 2023 · Mỹ Khê, Đà Nẵng · 145 m²)
8. `bo-song-cafe` — Bờ Sông Café (Nội thất · 2022 · Hội An, Quảng Nam · 180 m²)

### 2.2. Làm rõ Sự khác biệt Slug giữa `cliff-house` và `the-cliff-pavilion`
- **Kết quả điều tra:** Trong toàn bộ mã nguồn hệ thống (`js/core/data.js`, `data/projects.json`, và các thẻ liên kết `<a href="project.html?slug=cliff-house">`), slug chính thức duy nhất là **`cliff-house`**, với tiêu đề công trình là **"The Cliff House"**.
- **Nguyên nhân sai lệch văn bản:** Cụm từ "The Cliff Pavilion" xuất hiện trong một số ghi chú/prompt mô tả ý niệm kiến trúc pavilion ven biển của công trình này, không phải là slug trong mã nguồn hoặc URL routing.
- **Quyết định bảo toàn:** Giữ nguyên 100% slug chính thức **`cliff-house`**. Tuyệt đối không thay đổi slug để không làm gián đoạn liên kết nội bộ hay gãy URL đã được kiểm thử.

### 2.3. Xác minh Liên kết Thực tế của `data/site-content.json`
- Đã bổ sung các thuộc tính nhận diện `data-content-key` cho các phần tử văn bản trên các trang (`about.html`, `contact.html`, `index.html`, footer).
- Đã thực hiện kiểm nghiệm thực tế:
  1. Tạm thời cập nhật trường `footer.copyright` trong `data/site-content.json` thành `"© 2024 Living Blueprint (Đã kiểm tra liên kết JSON)"`.
  2. Tải trang qua máy chủ, xác nhận lớp hiển thị nhận giá trị mới ngay lập tức qua hàm `bindContentToDom()`.
  3. Khôi phục chính xác 100% về giá trị ban đầu `"© 2024 Living Blueprint"`.

### 2.4. Sao lưu Bổ sung Mã nguồn
- Đã sao lưu `js/main.js` vào:
  - `backups/pre-editor-step1/main.js.bak` (3.95 KB)
- Đã tạo thư mục sao lưu riêng cho Bước 2 `backups/pre-editor-step2/`:
  - `backups/pre-editor-step2/server.js.bak` (1.09 KB)
  - `backups/pre-editor-step2/main.js.bak` (3.95 KB)

---

## 3. CHI TIẾT CÁC API ENDPOINTS ĐÃ XÂY DỰNG

| Phương thức & Endpoint | Chức năng nghiệp vụ | Kiểm soát an ninh & Dữ liệu |
| :--- | :--- | :--- |
| **`GET /api/content`** | Đọc toàn bộ dữ liệu cấu hình văn bản website | Đọc từ `data/site-content.json`, trả về mã 200 OK kèm header chống cache (`no-store`). |
| **`POST /api/content`** | Cập nhật nội dung văn bản website | Yêu cầu CSRF header, kiểm tra schema JSON, tự động tạo bản sao lưu snapshot vào `data/backups/`, ghi nguyên tử qua file tạm. |
| **`GET /api/projects`** | Đọc danh sách toàn bộ 8 đồ án kiến trúc & nội thất | Đọc từ `data/projects.json`, trả về mã 200 OK. |
| **`POST /api/projects`** | Cập nhật dữ liệu danh sách đồ án | Kiểm tra cấu trúc mảng, xác thực định dạng slug (`^[a-z0-9-]+$`), chống slug trùng lặp, kiểm tra trường bắt buộc, tự động sao lưu và ghi nguyên tử. |
| **`POST /api/upload-image`** | Tải ảnh lên thư mục `assets/images/uploads/` | Hỗ trợ JSON Base64, Multipart và Binary. Kiểm tra **Magic Bytes thực tế** (JPEG, PNG, WebP), chống giả mạo đuôi tệp, sanitize tên tệp và giới hạn tối đa 10 MB. |
| **`GET /api/backups`** | Liệt kê danh sách các bản sao lưu đã tạo | Quét thư mục `data/backups/`, trả về danh sách sắp xếp theo thời gian mới nhất kèm dung lượng và phân loại (`site-content` hoặc `projects`). |
| **`POST /api/restore-backup`** | Khôi phục dữ liệu từ một bản sao lưu cụ thể | Kiểm tra chống Path Traversal, xác minh schema của bản sao lưu trước khi phục hồi, tạo bản sao lưu an toàn `pre_restore_...` trước khi ghi đè tệp đích. |

---

## 4. HỆ THỐNG AN NINH & BẢO MẬT ĐA TẦNG

Máy chủ cục bộ áp dụng bộ quy tắc phòng thủ chiều sâu (Defense-in-depth):

1. **Ràng buộc Mạng Loopback (127.0.0.1):**
   - Lắng nghe tuyệt đối trên địa chỉ IP `127.0.0.1`.
   - Kiểm tra `req.socket.remoteAddress`, từ chối bất kỳ kết nối nào không xuất phát từ `127.0.0.1`, `::1` hoặc `::ffff:127.0.0.1` với mã **403 Forbidden**.
2. **Xác thực Host Header:**
   - Chỉ cho phép các Host cục bộ hợp lệ (`localhost:3000`, `127.0.0.1:3000`, `localhost`, `127.0.0.1`).
3. **Bảo vệ Chống CSRF & Kiểm tra Nguồn gốc (Origin Check):**
   - Mọi yêu cầu thay đổi dữ liệu (`POST`) bắt buộc phải có header tùy chỉnh:
     `X-Requested-With: LivingBlueprintEditor`
   - Kiểm tra tiêu đề `Origin` và `Referer`: Chặn ngay lập tức các yêu cầu xuất phát từ domain bên ngoài (ví dụ `http://malicious.com`) với mã **403 Forbidden**.
4. **Loại bỏ Wildcard CORS cho API:**
   - Xóa bỏ hoàn toàn `Access-Control-Allow-Origin: *` trên các endpoint `/api/*`. Chỉ gửi Origin phản hồi khi client đến từ đúng máy chủ cục bộ.
5. **Chặn Tuyệt đối Truy cập HTTP vào Tệp Sao lưu & Dữ liệu Nội bộ:**
   - Bộ phục vụ tệp tĩnh tự động chặn với mã **403 Forbidden** đối với:
     - Thư mục `/backups/` và `/data/backups/`.
     - Tệp sao lưu `.bak`, tệp tạm `.tmp`, tệp nhật ký `.log`, `.env`, `.jsonl`.
     - Các tệp hoặc thư mục ẩn bắt đầu bằng dấu chấm (`.git`, `.system_generated`).
6. **Chống Path Traversal (Truy xuất Thư mục Trái phép):**
   - Sử dụng `path.normalize(path.resolve(ROOT_DIR, '.' + pathname))` và kiểm tra nghiêm ngặt `safePath.startsWith(ROOT_DIR)`. Mọi nỗ lực dùng `../` đều bị trả về **403 Forbidden**.
   - API phục hồi bản sao lưu sử dụng `path.basename()` để triệt tiêu mọi ký tự điều hướng đường dẫn trong tham số `backupFilename`.
7. **Kiểm tra Định dạng Ảnh Thực tế qua Magic Bytes:**
   - Không tin tưởng phần mở rộng `.png`, `.jpg` do người dùng hoặc trình duyệt gửi lên.
   - Kiểm tra trực tiếp các byte đầu tiên của buffer dữ liệu:
     - **JPEG:** `FF D8 FF`
     - **PNG:** `89 50 4E 47 0D 0A 1A 0A`
     - **WebP:** `RIFF .... WEBP`
   - Bất kỳ tệp văn bản, mã script hoặc thực thi nào đổi tên thành `.png` đều bị máy chủ từ chối với mã **415 Unsupported Media Type**.
8. **Giới hạn Dung lượng Yêu cầu (Payload Limit):**
   - Dữ liệu JSON: Tối đa **5 MB**.
   - Hình ảnh tải lên: Tối đa **10 MB**.
   - Tự động ngắt luồng truyền và trả về mã **413 Payload Too Large** nếu vượt quá.

---

## 5. CƠ CHẾ GHI DỮ LIỆU AN TOÀN & QUẢN LÝ TƯƠNG TRANH

Để ngăn ngừa tối đa rủi ro mất dữ liệu hoặc hỏng file do sự cố đột ngột:

1. **AsyncMutex Kiểm soát Tương tranh (Concurrency Control):**
   - Lớp `AsyncMutex` tuần tự hóa mọi tác vụ ghi dữ liệu vào tệp.
   - Khi có nhiều yêu cầu `POST` gửi đồng thời, các tác vụ được xếp hàng thực thi tuần tự, loại bỏ hoàn toàn hiện tượng Race Condition hay ghi đè xen kẽ.
2. **Tự động Sao lưu Snapshot:**
   - Trước khi bất kỳ tệp dữ liệu nào (`site-content.json` hoặc `projects.json`) bị thay đổi, phiên bản hiện tại trên đĩa được sao chép ngay lập tức vào `data/backups/` với định dạng tên:
     `<prefix>_<YYYY-MM-DDTHH-mm-ss-SSSZ>.json`
3. **Ghi Nguyên tử (Atomic Write via .tmp):**
   - Dữ liệu mới được ghi hoàn chỉnh vào một tệp tạm:
     `<target>.tmp_<timestamp>_<randomHex>`
   - Sau khi ghi xong và xả bộ đệm đĩa thành công, hệ thống sử dụng lệnh đổi tên hệ thống (`fs.renameSync`) để thay thế tệp đích. Tệp dữ liệu chính thức luôn ở trạng thái toàn vẹn 100%.

---

## 6. BẢNG KẾT QUẢ KIỂM THỬ TOÀN DIỆN (AUTOMATED & QA AUDIT)

### 6.1. Kiểm thử Tự động Bộ API & An ninh (25/25 Scenarios PASS)

| STT | Kịch bản kiểm thử | Yêu cầu kiểm tra | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `GET /api/content` | Đọc dữ liệu nội dung | Trả về 200 OK, định dạng JSON chuẩn | **PASS** |
| 2 | `GET /api/content` data check | Kiểm tra các trường root | Đầy đủ các mục `site`, `home`, `about`, `contact`, `footer` | **PASS** |
| 3 | `GET /api/projects` | Đọc danh sách đồ án | Trả về 200 OK | **PASS** |
| 4 | `GET /api/projects` count | Kiểm tra số lượng đồ án | Đầy đủ chính xác 8 đồ án kiến trúc & nội thất | **PASS** |
| 5 | Canonical slug check | Kiểm tra slug dự án #2 | Slug chính thức là `cliff-house`, tiêu đề "The Cliff House" | **PASS** |
| 6 | CSRF Security Check | `POST /api/content` không có header CSRF | Bị từ chối với mã **403 Forbidden** | **PASS** |
| 7 | Origin Security Check | `POST /api/content` từ `http://malicious.com` | Bị từ chối với mã **403 Forbidden** | **PASS** |
| 8 | Schema Validation Check | `POST /api/content` sai cấu trúc schema | Bị từ chối với mã **422 Unprocessable Entity** | **PASS** |
| 9 | `POST /api/content` valid | Ghi nội dung hợp lệ | Trả về **200 OK**, phản hồi kèm tên bản sao lưu | **PASS** |
| 10 | Auto-backup on write | Kiểm tra tự động sao lưu | Tạo tệp `site-content_*.json` trong `data/backups/` | **PASS** |
| 11 | Data Persistence check | Đọc lại dữ liệu vừa ghi | Dữ liệu lưu bền vững trên ổ đĩa | **PASS** |
| 12 | Projects Slug Duplicate | `POST /api/projects` có slug trùng lặp | Bị từ chối với mã **422 Unprocessable Entity** | **PASS** |
| 13 | Fake Image Upload Check | Tải tệp văn bản giả mạo `.png` | Phát hiện sai lệch Magic Bytes, từ chối với mã **415** | **PASS** |
| 14 | Real PNG Image Upload | Tải ảnh PNG có Magic Bytes `89 50 4E 47` | Trả về **200 OK**, lưu vào `assets/images/uploads/` | **PASS** |
| 15 | Upload URL Verification | Kiểm tra đường dẫn ảnh trả về | Đường dẫn hợp lệ `/assets/images/uploads/<file>.png` | **PASS** |
| 16 | Uploaded File Static Access | Truy cập ảnh vừa tải qua URL tĩnh | Trả về **200 OK**, MIME `image/png` | **PASS** |
| 17 | `GET /api/backups` | Đọc danh sách sao lưu | Trả về **200 OK** | **PASS** |
| 18 | Backups Listing Count | Kiểm tra dữ liệu sao lưu | Liệt kê đầy đủ các file kèm kích thước, phân loại, ngày | **PASS** |
| 19 | `POST /api/restore-backup` | Khôi phục bản sao lưu | Trả về **200 OK**, khôi phục dữ liệu thành công | **PASS** |
| 20 | Pre-restore Safety Backup | Bản sao lưu an toàn trước phục hồi | Tự động tạo tệp `site-content_pre_restore_*.json` | **PASS** |
| 21 | Content Integrity after Restore | Đối chiếu nội dung phục hồi | Khôi phục 100% nguyên trạng giá trị ban đầu | **PASS** |
| 22 | Sensitive File Block: `/backups/` | Truy cập HTTP vào thư mục backup gốc | Bị chặn với mã **403 Forbidden** | **PASS** |
| 23 | Sensitive File Block: `/data/backups/` | Truy cập HTTP vào thư mục data backups | Bị chặn với mã **403 Forbidden** | **PASS** |
| 24 | Path Traversal Protection | Yêu cầu `GET /../../../Windows/hosts` | Bị chặn với mã **403 Forbidden** | **PASS** |
| 25 | Portfolio Static Pages Load | Tải 5 trang HTML chính qua máy chủ | 5/5 trang trả về **200 OK** | **PASS** |

### 6.2. Kiểm thử Tình huống Giới hạn (Edge Cases)
- **Giới hạn dung lượng tải lên:** Thử gửi payload JSON vượt quá giới hạn (6 MB) -> Máy chủ lập tức ngắt luồng và trả về mã lỗi **413 Payload Too Large** (`ECONNRESET`).
- **Kiểm tra tương tranh (Concurrency):** Gửi đồng thời 5 yêu cầu `POST /api/content` cùng một thời điểm -> Toàn bộ 5 yêu cầu được `AsyncMutex` xử lý tuần tự thành công (đều trả về **200 OK**), dữ liệu tệp JSON không bị ghi đè dở dang hay hỏng định dạng.

### 6.3. Kiểm thử Giao diện Người dùng thực tế qua Trình duyệt (Browser QA)
- **Đơn vị kiểm thử:** Browser Subagent (Host verified: `http://localhost:3000`, 0 blocked origins).
- **Ảnh chụp bằng chứng:** `browser_evidence/309987ac-7929-4ad2-a17b-57a9dbb6e4ba/final_step_34.png`
- **Trang Chủ (`/index.html`):** Cinematic Hero 4 giai đoạn hoạt động mượt mà, bộ chuyển giai đoạn phản hồi tức thì, **0 console error**, **0 network error**.
- **Trang Dự án (`/projects.html`):** Hiển thị đầy đủ 8 đồ án; bộ lọc Kiến trúc (4), Nội thất (4), Đang triển khai (1), Đã hoàn thành (7) hoạt động trơn tru; số đếm cập nhật chính xác.
- **Trang Chi tiết (`/project.html?slug=cliff-house`):** Tải hoàn hảo đồ án The Cliff House với đầy đủ 3 tab bản vẽ CAD vector SVG, bảng vật liệu và 5 góc chụp gallery.
- **Trang Giới thiệu & Liên hệ (`/about.html`, `/contact.html`):** Hiển thị đầy đủ nội dung, 4 giai đoạn quy trình thiết kế, biểu mẫu tư vấn và thông tin thực hành.
- **Kết quả tổng thể:** 100% tài nguyên tải thành công, không phát sinh bất kỳ lỗi 404 hay lỗi console nào.

---

## 7. XÁC NHẬN TUÂN THỦ NGUYÊN TẮC BẮT BUỘC

- [x] **Chỉ sử dụng Native Node.js:** Không dùng Express, Fastify, multer hay bất kỳ thư viện npm bên ngoài nào.
- [x] **Bảo mật cục bộ 127.0.0.1:** Không lắng nghe trên `0.0.0.0`, chặn truy cập ngoài mạng.
- [x] **Bảo vệ CSRF & Nguồn gốc:** Bắt buộc header `X-Requested-With`, kiểm tra Origin/Referer.
- [x] **Xóa bỏ Wildcard CORS:** Không sử dụng `Access-Control-Allow-Origin: *` trên các endpoint `/api/*`.
- [x] **Kiểm tra Magic Bytes:** Xác thực ảnh thực tế, chặn file giả mạo đuôi tệp.
- [x] **Chặn truy cập thư mục nhạy cảm:** Chặn `/backups/`, `/data/backups/`, `.bak`, `.tmp`.
- [x] **Bảo toàn dữ liệu 8 đồ án:** Giữ nguyên 100% slug và dữ liệu gốc.
- [x] **Ghi nguyên tử & Tự động sao lưu:** Đã kích hoạt và kiểm thử thành công.
- [x] **Chưa tạo giao diện Visual Editor:** Chưa tạo dock/thanh công cụ hay chỉnh sửa trực quan (chờ Bước 3).
- [x] **Không tạo ZIP, không tạo `.venv`, không triển khai production.**

---

## 8. KẾT LUẬN & ĐỀ XUẤT BƯỚC TIẾP THEO

**Bước 2: Xây dựng Local REST API & Hệ thống An ninh** đã hoàn thành trọn vẹn 100% các tiêu chí khắt khe đã đề ra. Nền tảng backend cục bộ đã sẵn sàng an toàn tuyệt đối.

Sẵn sàng chuyển sang **Bước 3: Xây dựng Visual Editor Controller & Giao diện Chế độ Chỉnh sửa** khi có sự phê duyệt từ bạn.
