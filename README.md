# Living Blueprint
## Architecture & Interiors Portfolio

**Version:** Phase 0 — Foundation Complete  
**Type:** Static HTML/CSS/JavaScript  
**No build step required** — open `index.html` directly in a browser.

---

## 🚀 Chạy website

### Cách 1: Mở trực tiếp
```
Nhấp đúp vào index.html
```
> Lưu ý: `project.html?slug=...` cần HTTP server vì dùng ES Modules.

### Cách 2: HTTP Server (khuyến nghị)

**Python (nếu đã cài):**
```bash
cd d:\ArchitecturePortfolio
python -m http.server 3000
```
Truy cập: http://localhost:3000

**Node.js / npx:**
```bash
cd d:\ArchitecturePortfolio
npx serve .
```

**VS Code — Live Server extension:**  
Nhấn chuột phải `index.html` → Open with Live Server

---

## 📁 Cấu trúc thư mục

```
d:\ArchitecturePortfolio\
│
├── index.html                ← Trang chủ
├── projects.html             ← Thư viện dự án
├── project.html              ← Chi tiết dự án (?slug=villa-la-phong)
├── about.html                ← Giới thiệu & Quy trình
├── contact.html              ← Liên hệ
│
├── css/
│   ├── reset.css             ← Normalize, box-sizing
│   ├── variables.css         ← Design tokens (màu, font, spacing)
│   ├── typography.css        ← Font scale, heading/body/label styles
│   ├── layout.css            ← Container, grid, flex utilities
│   ├── components/           ← Phase 1+ (navbar, cards, filters...)
│   └── pages/                ← Phase 2+ (home, projects, detail...)
│
├── js/
│   ├── main.js               ← Global init
│   ├── core/
│   │   ├── utils.js          ← Helpers (debounce, mapRange, etc.)
│   │   └── data.js           ← 8 dự án minh họa
│   ├── components/           ← Phase 1+ (navbar, cursor, loader)
│   ├── animations/           ← Phase 2+ (hero-scroll, reveal)
│   └── pages/                ← Phase 2+ (home, projects, detail)
│
└── assets/
    ├── svg/
    │   ├── logo.svg          ← Monogram LB
    │   ├── hero/             ← Sketch & blueprint SVG layers (Phase 2)
    │   └── icons/            ← menu, close, arrow, grid-2, grid-4
    └── images/
        └── projects/         ← Thư mục cho ảnh thực tế (Phase 4+)
```

---

## 🗓️ Giai đoạn triển khai

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **0** | Foundation — Tokens, Typography, Grid, Data, HTML shells | ✅ Hoàn thành |
| **1** | Global Components — Navbar, Drawer, Cursor, Footer, Loader | ⏳ Chờ |
| **2** | Home Page — Hero 4-stage scroll (GSAP), Featured, Services | ⏳ Chờ |
| **3** | Projects Page — Filter 2-tier, Masonry grid 2/4 col | ⏳ Chờ |
| **4** | Project Detail — Full-bleed hero, Meta panel, Image story | ⏳ Chờ |
| **5** | About & Contact — Timeline, Form validation | ⏳ Chờ |
| **6** | Polish — Responsive QA, Performance, Accessibility | ⏳ Chờ |

---

## 🎨 Design Tokens

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--color-bg` | `#F5F3EF` | Nền trang (kem ấm) |
| `--color-ink` | `#1A1916` | Chữ chính |
| `--color-accent` | `#A8865C` | Nút CTA, hover, số thứ tự |
| `--color-blueprint-bg` | `#0A1628` | Hero Stage 2 background |
| `--font-heading` | Cormorant Garamond | Heading serif |
| `--font-ui` | Inter | UI, body text |
| `--font-mono` | Space Mono | Labels, tech data |

---

## 📄 Dữ liệu dự án (8 mẫu)

| Slug | Tên | Category | Năm |
|---|---|---|---|
| `villa-la-phong` | Villa Lá Phong | Architecture | 2024 |
| `cliff-house` | The Cliff House | Architecture | 2024 |
| `ha-dong-cultural-center` | Hà Đông Cultural Center | Architecture | 2023 |
| `mekong-riverside-office` | Mekong Riverside Office | Architecture | 2022 |
| `moc-studio` | Mộc Studio | Interior | 2024 |
| `penthouse-lakeview` | Penthouse Lakeview | Interior | 2024 |
| `linen-suite` | The Linen Suite | Interior | 2023 |
| `bo-song-cafe` | Bờ Sông Café | Interior | 2022 |

Truy cập chi tiết: `project.html?slug=villa-la-phong`

---

## ⚠️ Disclaimer

> All projects, names, locations, descriptions, and images shown in this portfolio are
> **fictional and for demonstration purposes only**.
> They do not represent real architectural commissions, existing buildings,
> or works by any real person or firm.
> 
> Images are CSS gradient placeholders. Replace with properly licensed photography
> before any public use.

---

## 📦 Dependencies (CDN — Phase 2+)

| Thư viện | Version | Dùng cho |
|---|---|---|
| GSAP + ScrollTrigger | 3.x | Hero scroll effect, reveal animations |
| Lenis | 1.x | Smooth scroll |
| Google Fonts | — | Cormorant Garamond, Inter, Space Mono |

*Không dùng framework. Không cần build step.*

---

*Living Blueprint · Architecture & Interiors · Illustration Portfolio*
