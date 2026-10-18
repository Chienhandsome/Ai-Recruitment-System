# Tìm việc chủ động và kho ứng viên

## Phạm vi bản đầu

- Candidate Pro, Premium và gói Test có quyền `jobSeekingAccess`.
- Trong `/candidate/profile`, ứng viên xem phạm vi chia sẻ, đồng ý rồi bật tìm việc. Mua gói không tự công khai hồ sơ.
- HR có quyền `talentPoolAccess` truy cập `/recruiter/talent-pool`, lọc theo từ khóa, vị trí mong muốn, kỹ năng và phân trang.
- HR xem hồ sơ có tên rút gọn và khu vực. Liên hệ chỉ trả về khi HR đã mở khóa; mỗi hồ sơ chỉ trừ quota một lần theo cơ chế hiện có.
- Bản đầu chia sẻ hồ sơ có cấu trúc; không cung cấp tải file CV hoặc gửi lời mời ứng tuyển.

## Quyền hiển thị

Một hồ sơ chỉ xuất hiện khi đồng thời bật `isProfilePublic`, bật `jobSeekingEnabled`, có thời điểm đồng ý, còn `jobSeekingUntil`, có vị trí và giới thiệu nghề nghiệp, trạng thái hồ sơ READY/NEEDS_REVIEW, và entitlement đã dùng để bật vẫn ACTIVE, còn hạn, đúng audience CANDIDATE, có `jobSeekingAccess`.

Điều kiện được dùng chung cho tìm kiếm, đếm, xem chi tiết và mở khóa. Không cần chờ cron hoặc ứng viên đăng nhập để ngừng hiển thị khi hết hạn. Gia hạn/mua gói mới không tự mở lại hồ sơ: ứng viên phải xác nhận bật lại. Nếu nâng cấp thay thế entitlement đang dùng, cần xác nhận lại quyền chia sẻ.

Ứng viên luôn được tắt chia sẻ kể cả khi hết gói. Việc tắt không thay đổi đơn ứng tuyển đã gửi. Những thông tin HR đã đọc hoặc lưu bên ngoài trước đó không thể thu hồi bằng việc tắt.

Xóa vị trí mong muốn hoặc giới thiệu nghề nghiệp (null, chuỗi rỗng hoặc chỉ có khoảng trắng) cũng thu hồi chia sẻ. Bổ sung lại thông tin không tự bật tìm việc; ứng viên cần xác nhận bật lại.

## API

- `GET /api/candidates/me/job-seeking`: trạng thái hiển thị thực tế, quyền bật, độ đầy đủ hồ sơ, thời hạn gói.
- `PATCH /api/candidates/me/job-seeking`: `{ "enabled": true, "consent": true }` để bật, `{ "enabled": false }` để tắt. Chỉ tài khoản CANDIDATE truy cập.
- API sửa profile cũ từ chối `isProfilePublic: true`; `false` vẫn cho phép thu hồi chia sẻ.
- API HR giữ nguyên đường dẫn `/api/billing/talent-pool`, `/api/billing/talent-pool/:id`, `/api/billing/talent-pool/:id/unlock`.

## Migration

Trong thư mục `backend`:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Migration `20261018100000_add_candidate_job_seeking` bổ sung quyền cho các gói ứng viên trả phí, entitlement ACTIVE còn hạn và đơn PENDING trước khi ra mắt. Mọi hồ sơ có trạng thái tìm việc mặc định tắt; không cần chạy seed lại hay reset database.

## Kiểm tra thủ công

1. Candidate Free gọi API bật bị 403; vẫn được ứng tuyển như trước.
2. Candidate Pro/Premium có CV đã phân tích, vị trí mong muốn và giới thiệu: tích đồng ý, bật; hồ sơ xuất hiện cho HR có quyền.
3. HR lọc và phân trang; API không trả email/điện thoại trước khi mở khóa.
4. HR mở khóa, kiểm tra quota giảm đúng một lần; xem lại không giảm thêm.
5. Ứng viên tắt: tìm kiếm, chi tiết bằng ID cũ và mở khóa đều không trả hồ sơ.
6. Hết hạn hoặc entitlement bị thay thế/thu hồi: hồ sơ bị ẩn; mua gói mới vẫn cần xác nhận lại.
7. HR hết quyền: mọi API talent pool bị chặn; quản lý đơn ứng tuyển vẫn giữ nguyên.
8. Ứng viên đang hiển thị xóa vị trí/giới thiệu rồi lưu: chia sẻ bị tắt; điền lại thông tin vẫn tắt cho đến khi chủ động bật lại.

Test thứ tự phản hồi mạng của công tắc tìm việc, trong thư mục `frontend`:

```powershell
npm run test:job-seeking
```
