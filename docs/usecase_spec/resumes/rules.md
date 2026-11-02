# Business rule — CV

Đường dẫn nguồn tính từ gốc repository.

**BR-CV-001:** Upload yêu cầu phiên hợp lệ và CandidateProfile của người gọi tồn tại. Thiếu file bị từ chối; file chỉ nhận MIME PDF/DOCX và kích thước tối đa 5 × 1024 × 1024 byte. Nguồn: `backend/src/modules/resumes/resumes.controller.ts`, `application/upload-resume.use-case.ts` cùng module. Worker còn kiểm tra nội dung file thực tế trong pipeline; MIME hợp lệ chưa bảo đảm parse thành công.

**BR-CV-002:** Backend tạo Resume `PENDING`, lưu file vào private Supabase Storage, cập nhật bucket/objectPath và đặt primaryResumeId trước khi publish. Nguồn: `backend/src/modules/resumes/application/upload-resume.use-case.ts`.

**BR-CV-003:** Publish thành công thì cập nhật Resume và CandidateProfile sang `PROCESSING`; phản hồi trả ID, tên file, trạng thái và thời điểm tạo. Không chờ phân tích hoàn tất. Nếu publish đã thành công nhưng cập nhật trạng thái lỗi, phản hồi trả `PENDING` kèm cảnh báo đang đồng bộ; không đổi CV thành `FAILED` vì worker vẫn có thể hoàn tất. Nguồn: `backend/src/modules/resumes/application/upload-resume.use-case.ts`.

**BR-CV-004:** Khi tạo signed URL/publish lỗi hoặc publish trả false, file đã lưu vẫn giữ `PENDING`, phản hồi có cảnh báo chưa đưa vào hàng đợi. Scheduler kiểm tra mỗi phút các CV tồn đọng từ 10 phút theo điều kiện code, không bảo đảm hoàn thành trong thời gian cố định. Nguồn: `application/upload-resume.use-case.ts`, `application/retry-stuck-resumes.use-case.ts` trong module resumes.

**BR-CV-005:** Lỗi upload/cập nhật lưu trữ trong khối xử lý tương ứng đánh dấu Resume `FAILED` và trả lỗi tải CV. Không xem đây là đã tiếp nhận thành công; lỗi profile/file xảy ra trước lưu trữ không tạo CV thành công. Nguồn: `backend/src/modules/resumes/application/upload-resume.use-case.ts`.

**BR-CV-006:** Chỉ CV chính được hydrate hồ sơ; kết quả CV không còn là primary bị bỏ qua và đánh dấu `SUPERSEDED` theo guard. Xem danh sách/trạng thái chỉ lấy CV thuộc CandidateProfile của người gọi. Nguồn: `backend/src/modules/resumes/domain/resume-guard.service.ts`, `resumes.service.ts`. Quy tắc này phục vụ UC theo dõi kết quả, không biến upload thành xử lý đồng bộ.
