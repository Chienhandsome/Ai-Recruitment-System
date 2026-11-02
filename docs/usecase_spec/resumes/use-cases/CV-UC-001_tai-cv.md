### CV-UC-001_Tải CV để phân tích hồ sơ

### Mô tả use case CV-UC-001

| Trường | Nội dung |
|---|---|
| Use case: | CV-UC-001_Tải CV để phân tích hồ sơ |
| Mục đích: | Gửi CV để hệ thống phân tích và cập nhật hồ sơ ứng viên |
| Mô tả: | Lưu CV, đặt CV chính và yêu cầu xử lý nền; UC kết thúc ở phản hồi tiếp nhận, không chờ kết quả AI |
| Actor: | Ứng viên |
| Tiền điều kiện: | Ứng viên có phiên đăng nhập hợp lệ<br>CandidateProfile của người gọi đã tồn tại |
| Hậu điều kiện: | CV được lưu và đặt làm CV chính<br>Luồng chính đã gửi yêu cầu xử lý và trả PROCESSING; kết quả phân tích được theo dõi riêng |

### Luồng sự kiện chính

| Ứng viên | Hệ thống |
|---|---|
| 1. Chọn file CV và gửi yêu cầu tải lên | 2. Kiểm tra phiên, hồ sơ người gọi và file {{ref: BR-CV-001}} |
| | 3. Tạo bản ghi CV, lưu file và đặt CV chính {{ref: BR-CV-002}} |
| | 4. Tạo quyền tải tạm thời và gửi yêu cầu phân tích vào hàng đợi |
| | 5. Cập nhật trạng thái xử lý và trả thông tin CV; kết thúc UC {{ref: BR-CV-003}} |

### Luồng sự kiện phụ

| Ứng viên | Hệ thống |
|---|---|
| | 2.1. Nếu phiên không hợp lệ, từ chối yêu cầu; kết thúc UC {{ref: BR-SRA-001}} |
| | 2.2. Nếu không có hồ sơ ứng viên, trả lỗi không tìm thấy; kết thúc UC {{ref: BR-CV-001}} |
| | 2.3. Nếu thiếu file, MIME không hỗ trợ hoặc quá giới hạn, trả lỗi; kết thúc UC để ứng viên chọn lại file {{ref: BR-CV-001}} |
| | 3.1. Nếu lưu file hoặc cập nhật lưu trữ lỗi trong khối xử lý upload, đánh dấu FAILED và trả lỗi tải CV; kết thúc UC {{ref: BR-CV-005}} |
| | 4.1. Nếu không tạo được URL tạm hoặc chưa publish được, giữ CV đã lưu ở PENDING và trả cảnh báo; kết thúc UC, scheduler có thể thử lại {{ref: BR-CV-004}} |
| | 5.1. Nếu đã publish nhưng cập nhật trạng thái lỗi, trả PENDING kèm cảnh báo đang đồng bộ; kết thúc UC, không đánh dấu FAILED {{ref: BR-CV-003}} |

### Biểu đồ

Activity: `../diagrams/CV-UC-001_activity.act`

Sequence: `../diagrams/CV-UC-001_sequence.seq`
