# Danh mục module và Use Case — SmartRecruit AI

Đối chiếu repository ngày 01/11/2026. Đây là danh mục mục tiêu theo code, không phải kết quả kiểm thử triển khai và không thay thế đặc tả chi tiết.

## Ranh giới, actor và thuật ngữ

Hệ thống gồm `frontend` (Next.js), `backend` (NestJS/Prisma), `ai-service` (FastAPI/worker), `interview-service` và `interview-web`. Dữ liệu nghiệp vụ chính dùng Supabase PostgreSQL; CV dùng private Storage; xử lý CV/đánh giá ứng tuyển đi qua RabbitMQ. Interview Service có persistence riêng và hợp đồng API/callback với backend.

Actor chính: Khách, Ứng viên (`CANDIDATE`), Nhà tuyển dụng (`RECRUITER`, UI có thể gọi HR) và Quản trị viên (`ADMIN`). Dịch vụ ngoài gồm Supabase Auth, Google OAuth, PayOS và nhà cung cấp AI/email/speech tùy luồng/cấu hình.

- **CV/Resume:** file và dữ liệu phân tích, khác hồ sơ ứng viên đã được hydrate.
- **Application:** hồ sơ ứng tuyển gắn ứng viên, CV và tin tuyển dụng; giai đoạn tuyển dụng khác trạng thái đánh giá AI.
- **Interview process/round:** quy trình/vòng phỏng vấn; phân biệt lịch phỏng vấn với phiên phỏng vấn AI hoặc mock interview.
- **Offer / Contract:** thư mời nhận việc và hợp đồng, có vòng đời riêng.
- **Entitlement / quota:** quyền lợi/hạn mức theo gói; không cố định số lượng trong tài liệu khi cấu hình có thể thay đổi.
- **Talent pool:** tìm hồ sơ theo điều kiện hiển thị/quyền truy cập; mở khóa hồ sơ khác quyền xem/tải CV.

## Module đã đăng ký

Đường dẫn code dưới đây tính từ gốc repository; đường dẫn thư mục nguồn đặc tả tính từ `docs/usecase_spec/`. Các thư mục đặc tả chưa có nội dung sẽ được tạo khi viết UC.

| Prefix | Thư mục đặc tả | Phạm vi | Nguồn code đối chiếu |
|---|---|---|---|
| AUTH | auth | Đăng ký, xác thực, phiên và khôi phục tài khoản | `frontend/src/app/{register,login,verify-email,forgot-password,update-password,auth,complete-registration}`; `backend/src/modules/auth` |
| CAN | candidates | Hồ sơ, kỹ năng, trạng thái tìm việc/đồng ý hiển thị | `backend/src/modules/candidates`; `frontend/src/app/candidate/profile` |
| REC | recruiters | Hồ sơ và dashboard nhà tuyển dụng | `backend/src/modules/recruiters`; `frontend/src/app/recruiter/dashboard` |
| CV | resumes | Tải CV, theo dõi phân tích/hydration | `backend/src/modules/resumes`; `ai-service/app/domain/resume`; `ai-service/app/transport` |
| JOB | jobs | Tìm/xem tin, đăng/sửa/quản lý quota và hạn tin | `backend/src/modules/jobs`; `frontend/src/app/candidate/jobs`; `frontend/src/app/recruiter/jobs` |
| APP | applications | Ứng tuyển, đánh giá AI, quản lý giai đoạn | `backend/src/modules/applications`; `backend/src/modules/evaluation`; `frontend/src/app/candidate/applications` |
| INT | interviews | Lịch, phản hồi, quy trình nhiều vòng, phỏng vấn AI | `backend/src/modules/interviews`; `interview-service`; `interview-web` |
| INS | candidate-insights | Phân tích độ phù hợp JD và luyện phỏng vấn | `backend/src/modules/candidate-insights` |
| OFF | offers | Gửi/sửa/thu hồi và phản hồi offer | `backend/src/modules/offers` |
| CTR | contracts | Hợp đồng, duyệt/sửa, ký, xác minh và bảo hành | `backend/src/modules/contracts`; `frontend/src/app/verify-contract` |
| BILL | billing | Gói dịch vụ, đơn hàng, thanh toán, quyền lợi | `backend/src/modules/billing`; `frontend/src/app/candidate/billing`; `frontend/src/app/recruiter/billing` |
| TAL | talent-pool | Tìm/mở khóa hồ sơ và truy cập CV | `backend/src/modules/billing/talent-pool.service.ts`; `backend/src/modules/billing/talent-resume.service.ts`; `frontend/src/app/recruiter/talent-pool` |
| INV | talent-invitations | Gửi, rút và phản hồi lời mời ứng tuyển | `backend/src/modules/talent-invitations`; `frontend/src/app/candidate/invitations`; `frontend/src/app/recruiter/talent-invitations` |
| NOT | notifications | Xem thông báo, số chưa đọc, đánh dấu đã đọc | `backend/src/modules/notifications` |
| ADM | admin | Người dùng, tin, kỹ năng/alias, gói, chính sách | `backend/src/modules/admin`; `backend/src/modules/skills`; `backend/src/modules/policies`; `frontend/src/app/admin` |
| DSP | disputes | Mở tranh chấp, bằng chứng, trao đổi và xử lý | `backend/src/modules/disputes`; `frontend/src/app/admin/disputes` |
| POL | policies | Tra cứu chính sách công khai | `backend/src/modules/policies`; `frontend/src/app/terms`; `frontend/src/app/privacy` |

`TAL` là ranh giới nghiệp vụ, dù code hiện nằm trong module billing. Không tạo UC độc lập cho bảng Companies/Departments/Users/Roles hoặc module Screenings chỉ vì có schema/module; `screenings.module.ts` hiện chưa có controller/provider.

## Danh mục UC

**Có nguồn đặc tả**: đã có file chi tiết. **Đã đăng ký**: có mã/mục tiêu để tiếp tục đặc tả theo code; chưa có file UC. Danh mục này nhóm thao tác khi cùng mục tiêu, không tương ứng một UC cho mỗi endpoint.

| Mã | Mục tiêu | Actor chính | Trạng thái đặc tả |
|---|---|---|---|
| AUTH-UC-001 | Đăng ký và hoàn tất tài khoản ứng viên/nhà tuyển dụng | Khách | Đã đăng ký |
| AUTH-UC-002 | Đăng nhập bằng mật khẩu hoặc Google | Khách | Đã đăng ký |
| AUTH-UC-003 | Đăng xuất | Người dùng đã đăng nhập | Đã đăng ký |
| AUTH-UC-004 | Khôi phục/cập nhật mật khẩu | Khách / người dùng | Đã đăng ký |
| CAN-UC-001 | Cập nhật hồ sơ và kỹ năng | Ứng viên | Đã đăng ký |
| CAN-UC-002 | Quản lý đồng ý hiển thị và trạng thái tìm việc | Ứng viên | Đã đăng ký |
| REC-UC-001 | Cập nhật hồ sơ nhà tuyển dụng | Nhà tuyển dụng | Đã đăng ký |
| REC-UC-002 | Theo dõi dashboard và phân tích tuyển dụng | Nhà tuyển dụng | Đã đăng ký |
| CV-UC-001 | Tải CV để phân tích hồ sơ | Ứng viên | Có nguồn đặc tả |
| CV-UC-002 | Xem danh sách CV và kết quả/trạng thái phân tích | Ứng viên | Đã đăng ký |
| JOB-UC-001 | Tìm kiếm và xem chi tiết việc làm | Ứng viên | Đã đăng ký |
| JOB-UC-002 | Tạo/cập nhật tin tuyển dụng | Nhà tuyển dụng | Đã đăng ký |
| JOB-UC-003 | Quản lý quota, hạn và xóa tin tuyển dụng | Nhà tuyển dụng | Đã đăng ký |
| APP-UC-001 | Nộp hồ sơ ứng tuyển | Ứng viên | Đã đăng ký |
| APP-UC-002 | Theo dõi hồ sơ đã ứng tuyển | Ứng viên | Đã đăng ký |
| APP-UC-003 | Xem hồ sơ ứng tuyển và đánh giá AI | Nhà tuyển dụng | Đã đăng ký |
| APP-UC-004 | Chuyển giai đoạn xử lý hồ sơ | Nhà tuyển dụng | Đã đăng ký |
| INT-UC-001 | Lập/cập nhật lịch và ghi nhận phản hồi phỏng vấn | Nhà tuyển dụng | Đã đăng ký |
| INT-UC-002 | Xem và phản hồi lịch phỏng vấn | Ứng viên | Đã đăng ký |
| INT-UC-003 | Thiết lập và điều phối quy trình nhiều vòng | Nhà tuyển dụng | Đã đăng ký |
| INT-UC-004 | Tạo phiên, xem kết quả/video và quyết định phỏng vấn AI | Nhà tuyển dụng | Đã đăng ký |
| INT-UC-005 | Xác minh email và tham gia phiên phỏng vấn AI | Ứng viên | Đã đăng ký |
| INS-UC-001 | Phân tích độ phù hợp CV với JD và xem lịch sử | Ứng viên | Đã đăng ký |
| INS-UC-002 | Khởi tạo luyện phỏng vấn | Ứng viên | Đã đăng ký |
| OFF-UC-001 | Tạo/cập nhật/thu hồi offer | Nhà tuyển dụng | Đã đăng ký |
| OFF-UC-002 | Xem và chấp nhận/từ chối offer | Ứng viên | Đã đăng ký |
| CTR-UC-001 | Soạn, gửi và cập nhật hợp đồng | Nhà tuyển dụng | Đã đăng ký |
| CTR-UC-002 | Duyệt hoặc yêu cầu sửa hợp đồng | Ứng viên | Đã đăng ký |
| CTR-UC-003 | Ký OTP hoặc tải bản ký theo luồng hỗ trợ | Nhà tuyển dụng / Ứng viên | Đã đăng ký |
| CTR-UC-004 | Tra cứu xác minh hợp đồng | Khách | Đã đăng ký |
| CTR-UC-005 | Gửi yêu cầu bảo hành và phản hồi | Nhà tuyển dụng / Ứng viên | Đã đăng ký |
| CTR-UC-006 | Kiểm tra hợp đồng và xử lý yêu cầu bảo hành | Quản trị viên | Đã đăng ký |
| BILL-UC-001 | Xem gói, quyền lợi và lịch sử đơn/giao dịch | Ứng viên / Nhà tuyển dụng | Đã đăng ký |
| BILL-UC-002 | Mua và thanh toán gói dịch vụ | Ứng viên / Nhà tuyển dụng | Đã đăng ký |
| TAL-UC-001 | Tìm và xem hồ sơ trong talent pool | Nhà tuyển dụng | Đã đăng ký |
| TAL-UC-002 | Mở khóa hồ sơ và yêu cầu xem/tải CV | Nhà tuyển dụng | Đã đăng ký |
| INV-UC-001 | Gửi/theo dõi/rút lời mời ứng tuyển | Nhà tuyển dụng | Đã đăng ký |
| INV-UC-002 | Xem và phản hồi lời mời ứng tuyển | Ứng viên | Đã đăng ký |
| NOT-UC-001 | Xem và đánh dấu thông báo đã đọc | Người dùng đã đăng nhập | Đã đăng ký |
| ADM-UC-001 | Quản lý người dùng và mời admin | Quản trị viên | Đã đăng ký |
| ADM-UC-002 | Quản lý tin tuyển dụng | Quản trị viên | Đã đăng ký |
| ADM-UC-003 | Quản lý kỹ năng, alias và kỹ năng chưa nhận diện | Quản trị viên | Đã đăng ký |
| ADM-UC-004 | Cấu hình gói dịch vụ và chính sách | Quản trị viên | Đã đăng ký |
| ADM-UC-005 | Theo dõi thống kê quản trị | Quản trị viên | Đã đăng ký |
| DSP-UC-001 | Mở tranh chấp, cung cấp bằng chứng và trao đổi | Ứng viên / Nhà tuyển dụng | Đã đăng ký |
| DSP-UC-002 | Giải quyết, ghi nhận xác nhận và đóng tranh chấp | Quản trị viên / bên liên quan | Đã đăng ký |
| POL-UC-001 | Xem chính sách sử dụng và quyền riêng tư | Khách | Đã đăng ký |

## Rule dùng chung

**BR-SRA-001:** Thao tác được bảo vệ cần phiên Supabase hợp lệ; quyền theo role và phạm vi tài nguyên được kiểm tra ở guard/service tương ứng. Không suy ra quyền chỉ từ việc có menu UI. Nguồn: `backend/src/modules/auth/guards`, controller và access service của từng module.

## Giới hạn khi đặc tả tiếp

- Không dùng ghi chú README gốc rằng applications/interviews/notifications chỉ là scaffold để phủ định các controller/service hiện có.
- Quyết định tuyển dụng theo state machine và service; không cho chuyển trực tiếp OFFERED/HIRED chỉ vì enum có trạng thái đó. Nguồn: `applications/application-stage-machine.ts`, `applications/applications.service.ts`, offers/contracts service.
- Giá, hạn mức, TTL và chính sách hoàn tiền/bảo hành phải truy code/config/policy; không sao chép quy tắc booking từ dự án khác.
- Mock checkout, Interview demo/fallback và endpoint xóa application phục vụ test không được trình bày như bảo đảm vận hành production.
- Provider AI, speech, OTP và thanh toán có thể khác giữa local/deployment; ghi điều kiện cấu hình trong UC liên quan.
