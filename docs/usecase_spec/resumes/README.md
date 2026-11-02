# CV và phân tích hồ sơ

| Mã | Mục tiêu | Nguồn |
|---|---|---|
| CV-UC-001 | Tải CV để phân tích hồ sơ | [Use Case](use-cases/CV-UC-001_tai-cv.md), [Activity](diagrams/CV-UC-001_activity.act), [Sequence](diagrams/CV-UC-001_sequence.seq) |
| CV-UC-002 | Xem danh sách CV và kết quả/trạng thái phân tích | Đã đăng ký, chưa có đặc tả chi tiết |

UC tải CV kết thúc khi nhận phản hồi tiếp nhận; không chờ Gemini hoặc hydrate hồ sơ. Xem [rules.md](rules.md) và các nguồn code dưới đây cho phần xử lý nền.

## Nguồn đối chiếu (từ gốc repository)

- `backend/src/modules/resumes/resumes.controller.ts`: upload multipart `file`, giới hạn kích thước, status và danh sách của chủ sở hữu.
- `backend/src/modules/resumes/application/upload-resume.use-case.ts`: kiểm tra profile/file, lưu file, primary resume, dispatch và cảnh báo.
- `backend/src/modules/resumes/application/upload-resume.use-case.spec.ts`: các nhánh publish thất bại, đồng bộ trạng thái thất bại, upload và thứ tự primary pointer.
- `backend/src/modules/resumes/application/retry-stuck-resumes.use-case.ts` và `.spec.ts`: khôi phục tác vụ tồn đọng và bỏ qua CV cũ.
- `backend/src/modules/resumes/domain/resume-guard.service.ts`: kiểm tra CV chính trước hydrate.
- `backend/src/modules/resumes/resumes.service.ts`: lọc danh sách/trạng thái theo hồ sơ sở hữu.

## Giới hạn

Controller upload dùng SupabaseAuthGuard, chưa gắn RolesGuard/`@Roles('CANDIDATE')` riêng; service yêu cầu CandidateProfile tồn tại. Actor nghiệp vụ vẫn là ứng viên, nhưng không mô tả rằng endpoint có role guard nếu code chưa có.

Sơ đồ mô tả luồng nghiệp vụ qua adapter lưu trữ; không cam kết toàn bộ chuỗi DB/Storage/RabbitMQ là một transaction. Lỗi hạ tầng ngoài các nhánh đã xử lý trả lỗi theo API; không hứa tự phục hồi cho mọi lỗi.
