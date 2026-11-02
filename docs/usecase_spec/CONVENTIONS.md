# Quy ước quản lý Use Case — SmartRecruit AI

Format nội dung từng UC nằm trong [STANDARD.md](STANDARD.md). Danh mục và nguồn truy vết nằm trong [00-module.md](00-module.md).

## 1. Nguồn sự thật

- Đặc tả hiện trạng dựa trên controller/guard, service/use-case, DTO, schema và test trong repository. Frontend xác nhận luồng UI; có endpoint không đồng nghĩa đã có UI hoặc đã chạy thành công trên production.
- Schema Prisma xác nhận dữ liệu/trạng thái, không tự chứng minh nghiệp vụ đã triển khai. README, prototype và kế hoạch là nguồn bổ trợ; khi lệch code phải ghi rõ chênh lệch.
- Luật đã kiểm chứng có nguồn code đi kèm. Yêu cầu mới hoặc hành vi chưa rõ phải ghi là đề xuất/OQ, không trình bày như hiện trạng.
- Thay đổi nghiệp vụ phải cập nhật rule, UC, sơ đồ và nguồn truy vết liên quan cùng lúc.

## 2. Actor và ranh giới

- **Khách:** chưa đăng nhập, tham gia đăng ký/đăng nhập và nội dung công khai mà route cho phép.
- **Ứng viên (`CANDIDATE`):** hồ sơ, CV, tìm việc, ứng tuyển, phỏng vấn, phản hồi offer/hợp đồng, quyền hiển thị trong talent pool và gói ứng viên.
- **Nhà tuyển dụng (`RECRUITER`):** tin tuyển dụng, hồ sơ ứng tuyển trong phạm vi được cấp, phỏng vấn, offer/hợp đồng, talent pool, lời mời và gói nhà tuyển dụng.
- **Quản trị viên (`ADMIN`):** chức năng quản trị theo guard và phạm vi service.
- **Hệ thống ngoài:** Supabase Auth, Google OAuth, PayOS, nhà cung cấp email/AI/speech khi trực tiếp tham gia luồng. Chỉ đưa thành participant khi cần diễn đạt tương tác.
- Next.js, NestJS, Prisma, PostgreSQL, Supabase Storage, RabbitMQ và AI worker là thành phần kỹ thuật. Interview Service là subsystem riêng có API/callback; không tạo actor người dùng mới chỉ vì khác tiến trình.

## 3. Module và mã

Module chia theo năng lực nghiệp vụ; bảng prefix/thư mục chính thức nằm trong `00-module.md`, đồng bộ với `PREFIX_TO_MODULE` trong `docs/tools/usecase_flow/build.py`.

- UC: `<MODULE>-UC-<NNN>`, đúng ba chữ số, tăng riêng theo module, ví dụ `CV-UC-001`, `APP-UC-001`.
- File: `<MODULE>-UC-<NNN>_<slug>.md`; heading đầu dùng cùng mã.
- Rule: `BR-<MODULE>-<NNN>`; xuyên module dùng `BR-SRA-<NNN>`.
- OQ: `OQ-<MODULE>-<NNN>`; câu hỏi chung dùng `OQ-SRA-<NNN>`.
- Mã duy nhất, ổn định; không tái sử dụng mã đã bỏ/gộp. Khi thêm module phải sửa cả danh mục và mapping trong tool.

## 4. Xác định Use Case

Một UC mô tả một mục tiêu của actor và kết quả quan sát được. Không tách publish RabbitMQ, hydrate hồ sơ, webhook, retry hoặc hàm nội bộ thành UC riêng nếu chúng chỉ phục vụ mục tiêu đó. Các bước tạo/lưu hồ sơ có thể nằm trong cùng UC; tách khi actor có mục tiêu độc lập.

UC thuộc module sở hữu mục tiêu, không phụ thuộc số lượng class hay màn hình. Cùng một mục tiêu nhiều actor phải ghi rõ quyền và nhánh của từng actor. Với xử lý nền, tách kết quả yêu cầu được tiếp nhận khỏi kết quả xử lý đã hoàn tất.

## 5. Một nguồn cho mỗi nội dung

| Nội dung | Nguồn chính |
|---|---|
| Actor, thuật ngữ, module, danh mục và trạng thái đặc tả | `00-module.md` |
| Rule xuyên module | `00-module.md` |
| Rule module/feature và nguồn code | `rules.md` ở module/feature sở hữu |
| OQ, giới hạn, trạng thái rà soát | README module/feature |
| Điều kiện và luồng UC | File UC |
| Activity/Sequence | File `.act`/`.seq` cùng mã UC |

Định nghĩa rule theo cú pháp `**BR-CV-001:** nội dung`. Tham chiếu bằng `{{ref: BR-CV-001}}`. UC được tham chiếu phải có trong danh mục hoặc có file nguồn; rule phải thực sự được định nghĩa, không chỉ nhắc mã.

## 6. Trạng thái và truy vết

- **Có nguồn đặc tả:** đã có file UC chi tiết; `list` cho biết có Markdown/Activity/Sequence nào.
- **Đã đăng ký:** đã cấp mã/mục tiêu trong danh mục, chưa có đặc tả chi tiết.
- **Đề xuất:** chưa có bằng chứng triển khai; không gộp vào hiện trạng.

Trạng thái trên nói về tài liệu. Kết luận triển khai phải nêu bằng chứng riêng; kết luận đã kiểm thử cần lệnh và kết quả thực tế. Khi đổi rule phải rà mọi tham chiếu UC/sơ đồ. Khi OQ được giải quyết, cập nhật nguồn chính và bỏ câu hỏi khỏi danh sách mở.
