# Thông báo kết quả AI

## Lưu nhất quán

Thông báo nằm trong PostgreSQL nên được ghi trực tiếp cùng transaction cập nhật đơn ứng tuyển và kết quả AI:

- Khi chấm xong: lưu kết quả, trạng thái COMPLETED, lịch sử chuyển RECEIVED → SCREENING và thông báo cho HR/ứng viên.
- Khi hết lượt thử: lưu FAILED và cảnh báo cho HR trong cùng transaction. Cron xử lý đơn bị kẹt dùng cùng cơ chế.
- Nếu ghi bất kỳ thông báo nào lỗi, transaction rollback. Consumer trả lỗi cho cơ chế retry RabbitMQ hiện có. Cron sẽ tìm lại đơn bị kẹt trong lần chạy tiếp theo.
- Bản ghi thông báo chỉ phát sự kiện Supabase Realtime sau khi transaction commit. Không cần cấu hình publication mới.

## Chống trùng

`notifications.event_key` là cột nullable có unique index. Khóa cho các sự kiện AI gồm applicationId, evaluationAttempts và loại/người nhận sự kiện. INSERT dùng ON CONFLICT DO NOTHING:

- Nhận lại cùng kết quả hoặc cảnh báo không tạo thêm thông báo, không đặt lại READ thành UNREAD.
- Một lần đánh giá mới tăng evaluationAttempts có thể tạo thông báo HR mới.
- Chỉ lần thực sự chuyển RECEIVED → SCREENING tạo thông báo chuyển trạng thái cho ứng viên.
- Thông báo cũ chưa có event_key được giữ nguyên; khóa chống trùng áp dụng cho thông báo được tạo bằng cơ chế mới.

## Cập nhật môi trường khác

Trong thư mục `backend`, chạy migration trước khi chạy backend mới:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Migration: `20261018140000_add_notification_event_key`.

## Kiểm tra

```powershell
npx jest --runInBand modules/applications/application-notifications.spec.ts modules/notifications/notifications.service.spec.ts modules/applications/retry-application-evaluations.use-case.spec.ts
```

Test bao phủ message trùng, xử lý đồng thời, giữ trạng thái đã đọc, lần đánh giá mới, lỗi khi ghi từng người nhận, rollback và gửi lại, cảnh báo hết lượt thử, lỗi cron và kết quả đến muộn. Test mô phỏng transaction; kiểm tra Supabase Realtime xuyên suốt cần chạy ứng dụng với RabbitMQ.
