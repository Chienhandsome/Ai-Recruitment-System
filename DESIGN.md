# Design System & Functional Specification: SmartRecruit AI — Recruiter Workspace

## 1. Visual Read & Atmosphere (Skill Directives)
Reading this as: Recruiter SaaS Workspace for SmartRecruit AI System, with a Modern Corporate Minimalist + Bento Grid visual language, leaning toward crisp light slate canvas (#F8FAFC) + signature Hiring Blue (#2563EB) primary accent + Satoshi/Geist font pairing + JetBrains Mono for AI data metrics.

- **Visual Density:** 4/10 (Airy, data-functional cockpit)
- **Design Variance:** 7/10 (Asymmetric Bento Grid structure)
- **Motion Intensity:** 6/10 (Spring physics stiffness 100, damping 20)

## 2. Color Calibration & Roles (Stitch Project Tone + Anti-Slop Rules)
Aligned with the original Stitch project identity (#2563EB) and strict anti-slop rules:

- **Primary Accent (Hiring Blue):** `#2563EB` — Main CTAs, active states, active tab indicators, primary focus rings.
- **Canvas Base:** `#F8FAFC` (Slate-50) — Primary application background canvas.
- **Pure Surface:** `#FFFFFF` — Card containers, elevated Bento tiles, input fields with 1px subtle separation.
- **Deep Ink Text:** `#0F172A` (Slate-900) — Primary high-contrast headings and body text.
- **Muted Metadata:** `#64748B` (Slate-500) — Secondary labels, timestamps, helper text.
- **Whisper Divider:** `#E2E8F0` (Slate-200) — Ultra-subtle 1px card boundaries (No heavy black lines).
- **AI Match High (Emerald):** `#10B981` — Scores >= 85%, Hired status badges.
- **AI Match Mid (Amber):** `#D97706` — Scores 70-84%, Screening / Review status.
- **AI Risk / Reject (Rose):** `#E11D48` — High skill gap or Rejected status.

## 3. Typography Architecture (Skill Directives)
- **Headlines & UI:** Satoshi / Geist Sans — Track-tight (`-0.02em`), weight-driven hierarchy (`font-semibold` / `font-bold`), crisp readable geometry.
- **Body & Paragraphs:** Geist Regular — Relaxed leading (`leading-relaxed`), max 65ch width for candidate summaries and JD requirements.
- **AI Data Metrics (Mono):** JetBrains Mono — For AI Match % (`94%`), match breakdown scores, processing durations, and dates.
- **Banned:** Inter (banned for creative/premium context), generic system serifs.

## 4. Component Stylings (Anti-Slop Rules)
- **Bento Tiles:** `16px` (`1rem`) rounded radius, `#E2E8F0` whisper border, `shadow-sm` light shadow. Hover lift (`hover:-translate-y-[2px]`).
- **Buttons:** Flat Hiring Blue (`#2563EB`) with white text. Active tactile push feedback (`scale-[0.98]`). No neon glow.
- **AI Match Badges:** High-contrast pill badges (`bg-blue-50 text-blue-700 font-mono`).
- **Inputs & Filters:** Top-labeled, crisp placeholder in Slate-400. Focus ring in `#2563EB`. No floating labels.
- **Skeletal Loaders:** Layout-dimensioned shimmer for AI parsing states.

---

## 5. Chi Tiết Từng Chức Năng Của Recruiter (Detailed Functional Breakdown)

### Chức năng 1: HR/Recruiter Overview Dashboard (Trang Chủ Tổng Quan)
- **Bố cục (Layout):** Bento Grid 12 cột.
- **Hero Stats Bar (4 Bento Tiles):**
  - Tile 1: Tin tuyển dụng đang mở (14 Roles, +2 vị trí mới).
  - Tile 2: CV đã xử lý tự động hôm nay (128 Resumes, AI Parsed 100%).
  - Tile 3: Tỷ lệ AI Match % trung bình (87.4% Match Rate - Mono Badge).
  - Tile 4: Phỏng vấn tuần này (6 Lịch phỏng vấn sắp tới).
- **Vùng làm việc chính (Row 2):**
  - **Top Candidate AI Match Snapshot (8Cols):** Top 5 ứng viên hàng đầu theo AI Score với điểm kỹ năng chính và hành động nhanh (Xem báo cáo AI / Lên lịch phỏng vấn).
  - **AI Hiring Insights & Quick Action (4Cols):** Cảnh báo ứng viên phù hợp cao mới nộp, nút bấm nhanh "Tạo bài tuyển dụng bằng AI Assistant".

### Chức năng 2: Quản Lý Tin Tuyển Dụng (Job Postings & Management)
- **Bố cục:** Bảng Bento đa tầng kèm bộ lọc trạng thái (Đang mở, Tạm dừng, Đã đóng).
- **Mỗi thẻ Job Card:** Tên vị trí, phòng ban, điểm AI Match trung bình của bể ứng viên, số lượng ứng viên nộp/được lọc, ngày hết hạn.
- **Thao tác:** 1-Click bật/tắt bài đăng, xem danh sách ứng viên của riêng job đó, chỉnh sửa trọng số AI.

### Chức năng 3: Quy Trình Tạo Bài Tuyển Dụng & Cấu Hình Tiêu Chí AI (Create Job & AI Criteria Config)
- **Bước 1 (Thông tin chung):** Tên công việc, phòng ban, mức lương, địa điểm, cấp bậc.
- **Bước 2 (Nội dung JD bằng AI):** AI Assistant tự động đề xuất JD chi tiết dựa trên tên vị trí. Recruiter có thể tùy chỉnh hoặc bấm "Regenerate".
- **Bước 3 (Cấu hình Trọng số AI Match):**
  - Slider điều chỉnh trọng số: % Kỹ năng chuyên môn (Hard Skills), % Số năm kinh nghiệm, % Học vấn & Chứng chỉ, % Văn hóa & Soft Skills.
  - Thiết lập kỹ năng bắt buộc (Must-have Skills) và kỹ năng điểm cộng (Nice-to-have Skills).

### Chức năng 4: Sàng Lọc & Bảng Xếp Hạng Ứng Viên AI (Candidate AI Ranking & Screening)
- **Bảng danh sách Ứng viên (Ranking Table):**
  - Cột ứng viên: Họ tên, ảnh avatar, vị trí ứng tuyển.
  - Cột AI Match Score: Badge điểm số dạng Monospace (`94%`, `88%`, `65%`) có mã màu trực quan (Xanh lá >=85%, Vàng 70-84%, Đỏ <70%).
  - Cột Phân tích Kỹ năng (Skills Fit): Các pill tag kỹ năng tương ứng với điểm match (React 98%, TS 92%).
  - Cột AI Tóm tắt (AI Summary): 1 câu tóm tắt điểm mạnh nổi bật của ứng viên.
  - Cột Thao tác: Shortlist, Từ chối, Lên lịch phỏng vấn, Xem báo cáo chi tiết.
- **Bộ lọc đa chiều (Advanced Filters):** Lọc theo khoảng điểm AI Match, số năm kinh nghiệm, vị trí, từ khóa CV.

### Chức năng 5: Xem Báo Cáo AI Chi Tiết & Phân Tích CV (AI Resume Breakdown & Candidate Detail)
- **Bảng tổng hợp hồ sơ:**
  - Điểm match tổng quan & Biểu đồ radar phân tích 4 khía cạnh (Skills, Experience, Education, Culture Fit).
  - AI Pros & Cons Breakdown: Danh sách các điểm mạnh vượt trội và các điểm rủi ro/thiếu sót cần làm rõ khi phỏng vấn.
  - Trích xuất dữ liệu CV tự động (Parsed Resume Data): Kinh nghiệm làm việc, lịch sử học tập, dự án đã làm.
  - File CV gốc PDF tích hợp trình xem trực tiếp bên cạnh báo cáo AI.

### Chức năng 6: Lên Lịch Phỏng Vấn & Smart AI Interview Assistant (Schedule & Notes)
- **Lịch phỏng vấn (Calendar View):** Hiển thị theo ngày/tuần các ca phỏng vấn.
- **Tạo buổi phỏng vấn mới:** Chọn ứng viên, người phỏng vấn (Interviewer), thời gian, hình thức (Google Meet / Trực tiếp).
- **AI Interview Copilot:**
  - Tự động sinh Bộ câu hỏi phỏng vấn gợi ý (Interview Questions) dựa trên CV ứng viên và JD.
  - Vùng ghi chú phỏng vấn (Interview Notes) hỗ trợ AI tự động tổng hợp kết quả sau phỏng vấn.
