# Talent Pool: test local trong một lượt

## Khởi động lại khi cần

Chạy từ thư mục gốc repo, mỗi khối ở một terminal PowerShell riêng. Cấu hình hiện tại dùng RabbitMQ cloud; không cần bật Docker để tạo thêm broker local.

```powershell
cd ai-service
.\.venv-local\Scripts\python.exe service_main.py
```

Lệnh trên chạy cả HTTP API, worker phân tích CV và worker đánh giá application. Chờ log `SentenceTransformer model loaded successfully` và cả hai queue báo `Worker listening`. Chỉ chạy FastAPI không đủ để xử lý queue.

```powershell
cd backend
$env:AI_SERVICE_URL = 'http://127.0.0.1:8000'
npm run start:dev
```

Biến này chỉ áp dụng cho terminal hiện tại, không sửa `.env` hay cấu hình deploy. Dùng `127.0.0.1` vì trên Windows `localhost` có thể trỏ IPv6 trong khi Python chỉ lắng nghe IPv4.

```powershell
cd frontend
npm run dev
```

Kiểm tra từ thư mục gốc:

```powershell
node scripts/check-talent-pool-local.cjs
```

Tất cả mục phải `PASS`, đặc biệt cả queue phân tích CV/đánh giá và hai queue kết quả đều phải có consumer. HTTP AI khỏe không tự chứng minh worker đang chạy. Script chỉ đọc trạng thái, không tạo dữ liệu hay gửi message.

## Chuẩn bị

- Mở hai phiên trình duyệt riêng: một HR, một ứng viên để tránh ghi đè session.
- HR có gói cho phép Talent Pool, còn ít nhất một lượt mở khóa; có một job `PUBLISHED`, còn hạn và chưa đầy hồ sơ/chỉ tiêu tuyển.
- Ứng viên có Candidate Pro/Premium còn hạn, profile đủ vị trí mong muốn và giới thiệu nghề nghiệp.
- Chuẩn bị một CV PDF có nội dung đọc được; cần CV khác để thử thay đổi CV chính.
- Dùng job chưa từng được ứng viên này ứng tuyển để kiểm tra nhánh tạo application mới. Nhánh hồ sơ đã tồn tại sẽ cố ý giữ CV/source/AI cũ.

## Kịch bản chính

| Bước | Thao tác | Kết quả cần thấy |
|---|---|---|
| 1 | Ứng viên vào Hồ sơ, upload PDF, chờ xử lý xong | Profile được cập nhật; CV chính ở trạng thái `PARSED` |
| 2 | Đồng ý chia sẻ rồi bật Tìm việc chủ động | Hiện `Đang tìm việc · Đang hiển thị` và thời hạn |
| 3 | HR vào Kho ứng viên, lọc theo vị trí/kỹ năng | Tìm được hồ sơ; tên rút gọn; chưa thấy liên hệ/CV gốc |
| 4 | Mở `Xem hồ sơ đầy đủ` | Đúng các mục profile; nội dung có email/điện thoại cũng bị ẩn trước mở khóa |
| 5 | HR mở khóa một lần, tải lại trang | Hiện liên hệ và metadata CV; chỉ trừ một lượt, xem lại không trừ thêm |
| 6 | Xem PDF rồi tải CV gốc | Đúng tên/nội dung file hiện tại; DOCX chỉ có tải gốc |
| 7 | HR bấm Mời ứng tuyển, chọn job mới và gửi | Inbox HR có lời mời chờ; không trừ thêm lượt |
| 8 | Ứng viên mở Lời mời hoặc notification, chọn `Tải lại` nếu inbox đang mở | Nhận đúng job/HR/lời nhắn/thời hạn |
| 9 | Chọn CV đã xử lý, tick xác nhận và ứng tuyển | Lời mời `Đã ứng tuyển`; tạo đúng một application, nguồn `TALENT_POOL_INVITE` |
| 10 | Bấm Mở hồ sơ ứng tuyển ở cả hai tài khoản | HR vào đúng application; ứng viên vào danh sách lọc đúng application, không phụ thuộc phân trang |
| 11 | Chờ worker; tải lại dashboard/inbox khi cần | Application chuyển từ đang xử lý sang hoàn tất, HR thấy điểm và giải thích AI, nhận thông báo kết quả |

## Ba nhánh cần thử tiếp

1. **Đã ứng tuyển trước:** gửi lời mời cho job khác rồi ứng viên ứng tuyển trực tiếp. Đóng/để đầy job và mở lại lời mời. Nút mở phải dẫn đến application cũ; CV, source, stage và kết quả AI giữ nguyên; không tạo thêm/chấm lại. Trong hộp chọn job, job đã có hồ sơ vẫn được liệt kê với nhãn `Đã ứng tuyển` dù đóng/đầy.
2. **Đổi CV/tắt chia sẻ:** upload CV mới. Trong lúc CV chính chưa xử lý xong, không tải nhầm CV cũ. Khi xử lý xong, Talent Pool tải CV mới; application trước đó giữ CV đã nộp. Tắt tìm việc rồi tải lại bên HR: profile không còn truy cập được, không cấp link CV mới. Link đã cấp có thể còn hiệu lực tối đa 60 giây; file đã tải không thể thu hồi.
3. **Lời mời đóng:** từ chối hoặc HR thu hồi rồi thử phản hồi lại. Không tạo application mới. Nếu đã có application từ trước, link hồ sơ vẫn mở được mà không đổi lời mời sang accepted.

## Khi có lỗi

- `Không tìm thấy hồ sơ`: kiểm tra bật chia sẻ, hạn gói ứng viên, trạng thái profile và quyền gói HR.
- Không có job để chọn: kiểm tra chủ job, trạng thái `PUBLISHED`, hạn nhận hồ sơ và quota. Job mới cần chưa có application để kiểm tra nhánh tạo mới.
- CV kẹt xử lý: kiểm tra consumer `resume_analysis_queue`, key Gemini/quota của dịch vụ và log AI. Không chỉ nhìn `/health`.
- Application kẹt chấm điểm: kiểm tra consumer `evaluation_queue` và `evaluation_queue_result`; giữ nguyên application để retry, không bấm tạo lại. Model cần khởi động xong trước khi test.
- CV không mở trong trình duyệt: thử `Mở PDF ở tab mới` hoặc `Tải CV gốc`. Với link hết hạn, đóng preview rồi xin link mới.

Automated regression và preflight không thay thế bước nghiệm thu hai tài khoản với CV thật. Không tự bật gói, chỉnh hạn mức hay gửi lời mời trên tài khoản người dùng để dựng dữ liệu test.
