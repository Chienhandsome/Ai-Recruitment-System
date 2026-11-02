# Đặc tả Use Case — SmartRecruit AI

Bộ tài liệu mô tả hệ thống tuyển dụng AI trong repository hiện tại. Phạm vi được đối chiếu với code ngày 01/11/2026; không dùng kế hoạch của dự án khác làm căn cứ.

## Bắt đầu từ đâu

1. Đọc [00-module.md](00-module.md) để xem actor, module, danh mục UC và nguồn code đối chiếu.
2. Đọc [CONVENTIONS.md](CONVENTIONS.md) về mã UC/BR/OQ và quản lý nguồn.
3. Dùng [STANDARD.md](STANDARD.md) khi viết UC; xem mẫu chạy được [CV-UC-001](resumes/use-cases/CV-UC-001_tai-cv.md).
4. Chạy công cụ tại [../tools/usecase_flow](../tools/usecase_flow/README.md) để kiểm tra và sinh đầu ra.

## Phạm vi hiện tại

- Tài khoản Candidate, Recruiter, Admin; Supabase Auth với email/password, xác minh email/OTP, Google OAuth và khôi phục mật khẩu.
- Hồ sơ ứng viên, kỹ năng, tải CV và phân tích bất đồng bộ; hồ sơ và dashboard nhà tuyển dụng.
- Tin tuyển dụng, ứng tuyển, đánh giá AI và quản lý giai đoạn tuyển dụng.
- Lịch/phản hồi phỏng vấn, quy trình nhiều vòng và phỏng vấn AI qua Interview Service; phân tích JD và luyện phỏng vấn cho ứng viên.
- Offer, hợp đồng, ký OTP, bảo hành tuyển dụng và tranh chấp.
- Gói dịch vụ, đơn hàng, PayOS/mock theo cấu hình, quyền lợi và hạn mức; talent pool, mở khóa hồ sơ và lời mời ứng tuyển.
- Thông báo; quản trị người dùng, tin tuyển dụng, kỹ năng, gói và chính sách.

Danh mục ghi nhận chức năng có code, không khẳng định mọi luồng đã được kiểm thử trên môi trường triển khai. Module chỉ có schema/scaffold không được coi là chức năng hoàn thiện. Một số README cũ ở gốc có thể chậm hơn code; dùng nguồn truy vết trong danh mục.

## Cấu trúc

```text
usecase_spec/
  README.md
  CONVENTIONS.md
  STANDARD.md
  00-module.md
  resumes/
    README.md
    rules.md
    use-cases/CV-UC-001_tai-cv.md
    diagrams/CV-UC-001_activity.act
    diagrams/CV-UC-001_sequence.seq
```

Các module khác đã được đăng ký trong danh mục, chưa có file UC chi tiết. Chỉ tạo thư mục khi có nội dung; không tạo hàng loạt file rỗng. Trạng thái đặc tả khác với trạng thái triển khai.

## Quy trình cập nhật

1. Đọc controller, service/use-case, DTO/schema và test liên quan; đối chiếu UI nếu mô tả thao tác từ giao diện.
2. Đăng ký mục tiêu actor và mã UC trong `00-module.md`; gắn nguồn code tương ứng.
3. Ghi rule có căn cứ trong `rules.md`; ghi quyết định chưa rõ thành OQ, phân biệt hành vi hiện tại và đề xuất.
4. Viết UC, Activity và Sequence cùng nhánh thành công/lỗi, đặc biệt trạng thái chờ và xử lý nền.
5. Chạy `python docs/tools/usecase_flow/build.py check`; sau đó build nếu cần bàn giao.

Markdown, `.act`, `.seq` là nguồn chỉnh sửa. Đầu ra tự sinh nằm ở `docs/build/usecase-flow/`; không sửa tay. `check` chỉ xác minh cấu trúc và cú pháp, không thay thế rà soát nghiệp vụ hay kiểm thử hệ thống.
