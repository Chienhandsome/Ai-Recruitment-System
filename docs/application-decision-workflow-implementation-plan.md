# Kế hoạch triển khai Application Decision Workflow v1

## 1. Bối cảnh

Luồng hiện tại đã hỗ trợ:

1. Candidate ứng tuyển bằng CV đã parse.
2. Backend tạo `Application` và snapshot bất biến tại thời điểm ứng tuyển.
3. AI service chấm điểm bất đồng bộ qua RabbitMQ.
4. Backend lưu `AiMatchingResult` và cập nhật `processingStatus`.
5. Recruiter xem danh sách ứng viên của từng job, điểm tổng, breakdown và giải thích.

Khoảng trống hiện tại:

- `ApplicationsController` chỉ có endpoint tạo application.
- Recruiter chưa có API riêng để lọc, phân trang và đọc application.
- Chưa có API chuyển stage hoặc ghi quyết định HR.
- Các nút shortlist/reject/hire và Kanban chưa được nối với dữ liệu thật.
- Candidate chưa có trang theo dõi toàn bộ đơn ứng tuyển.
- `ApplicationStatusHistory` đã có trong schema nhưng chưa được sử dụng.
- `JobDetailView` đang tải toàn bộ application qua job detail, lọc và sort ở client.

Schema hiện tại đã có đủ entity cốt lõi:

- `Application.currentStage`
- `Application.hrDecision`
- `Application.hrNotes`
- `Application.updatedAt`
- `ApplicationStatusHistory`
- `AiMatchingResult`

Vì vậy v1 không cần tạo bảng nghiệp vụ mới.

---

## 2. Mục tiêu

Hoàn thiện một vertical slice cho phép:

1. Recruiter xem và lọc application trong phạm vi được phép.
2. Recruiter chuyển application qua các stage hợp lệ.
3. Mọi thay đổi stage được lưu lịch sử, người thực hiện và ghi chú.
4. Hai recruiter thao tác đồng thời không âm thầm ghi đè nhau.
5. UI cập nhật từ API thật và không còn phụ thuộc danh sách mock.
6. Candidate xem được trạng thái các đơn đã nộp.
7. Quyết định HR luôn là thao tác của con người; điểm AI chỉ là dữ liệu tham khảo.

### Không thuộc phạm vi v1

- Tự động shortlist/reject dựa trên ngưỡng điểm.
- Tạo lịch phỏng vấn và quản lý interviewer.
- Gửi email, push hoặc in-app notification.
- Candidate rút đơn (`WITHDRAWN`).
- Chấm điểm phỏng vấn.
- Tự động hiệu chỉnh trọng số AI từ quyết định HR.
- Bulk update nhiều application trong một request.

Các chức năng trên được triển khai sau khi decision workflow v1 ổn định.

---

## 3. Nguyên tắc nghiệp vụ

### 3.1 Phân biệt hai loại trạng thái

- `processingStatus`: trạng thái kỹ thuật của AI pipeline, ví dụ `QUEUED`,
  `MATCHING`, `COMPLETED`, `FAILED`.
- `currentStage`: trạng thái nghiệp vụ tuyển dụng, ví dụ `RECEIVED`,
  `SCREENING`, `SHORTLISTED`, `OFFERED`, `HIRED`, `REJECTED`.

Frontend không được dùng chung một nhãn `status` cho hai khái niệm này.

### 3.2 AI không phải điều kiện bắt buộc để HR thao tác

Recruiter vẫn có thể review, shortlist hoặc reject khi AI evaluation đang chờ
hoặc thất bại. UI phải hiển thị rõ trạng thái AI nhưng không khóa quyết định HR.

### 3.3 Quyền truy cập

Policy phải nhất quán với `JobsService` hiện tại:

- Recruiter có `companyId`: được thao tác application thuộc job của mọi recruiter
  trong cùng company.
- Recruiter không có `companyId`: chỉ được thao tác application thuộc job do
  chính recruiter đó tạo.
- Application ngoài scope trả `404`, không tiết lộ rằng ID tồn tại.
- Candidate chỉ đọc được application có `candidate.userId` bằng user hiện tại.

### 3.4 Dữ liệu candidate khi review

- Danh sách có thể dùng tên, email và avatar hiện tại để tìm kiếm/nhận diện.
- Nội dung được AI chấm phải lấy từ `profileSnapshot`/`inputSnapshot`, không âm
  thầm thay bằng kinh nghiệm hoặc kỹ năng candidate cập nhật sau khi ứng tuyển.
- `hrNotes` và note trong history là dữ liệu nội bộ, tuyệt đối không trả về API
  dành cho candidate.

---

## 4. State machine v1

### 4.1 Transition recruiter được phép

| Stage hiện tại | Stage đích được phép trong v1 | Điều kiện |
|---|---|---|
| `RECEIVED` | `SCREENING`, `SHORTLISTED`, `REJECTED` | `REJECTED` bắt buộc có note |
| `SCREENING` | `SHORTLISTED`, `REJECTED` | `REJECTED` bắt buộc có note |
| `SHORTLISTED` | `SCREENING`, `OFFERED`, `REJECTED` | Reject hoặc đưa ngược về screening phải có note |
| `OFFERED` | `HIRED`, `SHORTLISTED`, `REJECTED` | Chuyển ngược/reject phải có note |
| `REJECTED` | `SCREENING` | Reopen bắt buộc có note |
| `HIRED` | Không có | Terminal trong v1 |

`INTERVIEW_SCHEDULED` và `INTERVIEWED` được giữ trong enum để phục vụ feature
phỏng vấn sau này, nhưng chưa expose thành action mới trong UI v1. Nếu database
đã có dữ liệu ở hai stage này, service cho phép:

- `INTERVIEW_SCHEDULED -> INTERVIEWED | REJECTED`
- `INTERVIEWED -> OFFERED | REJECTED`

### 4.2 Transition hệ thống

Khi AI evaluation hoàn tất:

- Nếu application vẫn đang ở `RECEIVED`, hệ thống chuyển sang `SCREENING` và
  tạo history với `changedByUserId = null`.
- Nếu recruiter đã chuyển stage trước đó, consumer chỉ cập nhật
  `processingStatus`; không được ghi đè stage.

Transition tự động phải dùng compare-and-set trong cùng transaction với việc lưu
kết quả AI.

### 4.3 Mapping `hrDecision`

`hrDecision` được suy ra tập trung ở backend để không tạo tổ hợp mâu thuẫn:

| `currentStage` mới | `hrDecision` |
|---|---|
| `RECEIVED` | `PENDING` |
| `SCREENING` | `CONSIDER` |
| `SHORTLISTED` | `ACCEPTED` |
| `OFFERED` | `ACCEPTED` |
| `HIRED` | `ACCEPTED` |
| `REJECTED` | `REJECTED` |

Các stage phỏng vấn giữ `ACCEPTED`. Client không được gửi trực tiếp
`hrDecision` trong endpoint chuyển stage.

---

## 5. API contract

### 5.1 Recruiter: danh sách application

```http
GET /api/applications
Authorization: Bearer <recruiter-token>
```

Query:

| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `jobId` | UUID? | null | Lọc theo job thuộc scope recruiter |
| `stage` | `ApplicationStage`? | null | Lọc stage nghiệp vụ |
| `hrDecision` | `HrDecision`? | null | Lọc quyết định HR |
| `processingStatus` | `ApplicationProcessingStatus`? | null | Lọc trạng thái AI |
| `minScore` | number? | null | 0–100 |
| `maxScore` | number? | null | 0–100, phải >= `minScore` |
| `search` | string? | null | Tên hoặc email candidate |
| `sortBy` | enum | `AI_SCORE` | `AI_SCORE`, `APPLIED_AT`, `UPDATED_AT` |
| `sortOrder` | enum | `DESC` | `ASC`, `DESC` |
| `page` | integer | 1 | >= 1 |
| `limit` | integer | 20 | 1–100 |

Response:

```json
{
  "data": [
    {
      "id": "application-id",
      "job": {
        "id": "job-id",
        "jobCode": "JOB-2608-1234",
        "title": "Backend Engineer"
      },
      "candidate": {
        "id": "candidate-id",
        "fullName": "Nguyen Van A",
        "email": "candidate@example.com",
        "avatarUrl": null,
        "desiredTitle": "Backend Engineer"
      },
      "currentStage": "SCREENING",
      "hrDecision": "CONSIDER",
      "processingStatus": "COMPLETED",
      "latestAiResult": {
        "overallScore": 82.4,
        "matchLevel": "HIGH",
        "confidenceScore": 0.87,
        "version": 1
      },
      "appliedAt": "2026-08-17T10:00:00.000Z",
      "updatedAt": "2026-08-17T10:05:00.000Z",
      "allowedTransitions": ["SHORTLISTED", "REJECTED"]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

Không trả `profileSnapshot`, evidence đầy đủ hoặc history trong list response.

### 5.2 Recruiter: chi tiết application

```http
GET /api/applications/:id
Authorization: Bearer <recruiter-token>
```

Response gồm:

- Summary của job và candidate.
- `currentStage`, `hrDecision`, `hrNotes`.
- `processingStatus` và `evaluationError`.
- Latest `AiMatchingResult` đầy đủ.
- Application-time profile snapshot phục vụ review.
- History mới nhất, mặc định 20 bản ghi.
- `allowedTransitions` do backend tính.

Không tải toàn bộ application qua `GET /jobs/:id` sau khi frontend đã migrate.
Trong một release chuyển tiếp có thể giữ field `applications` để tránh breaking
change, sau đó bỏ bằng một PR cleanup riêng.

### 5.3 Recruiter: chuyển stage

```http
PATCH /api/applications/:id/stage
Authorization: Bearer <recruiter-token>
Content-Type: application/json
```

Request:

```json
{
  "targetStage": "SHORTLISTED",
  "expectedStage": "SCREENING",
  "note": "Đủ kỹ năng bắt buộc, chuyển sang vòng tiếp theo.",
  "hrNotes": "Ưu tiên liên hệ trong tuần này."
}
```

Validation:

- `targetStage` và `expectedStage` phải là enum hợp lệ.
- `targetStage` phải khác `expectedStage`.
- `note`: trim, tối đa 1000 ký tự.
- `hrNotes`: trim, tối đa 5000 ký tự.
- Note bắt buộc cho reject, reopen hoặc chuyển ngược stage.
- Client không được gửi `hrDecision`, `changedByUserId` hoặc timestamps.

Response:

```json
{
  "id": "application-id",
  "previousStage": "SCREENING",
  "currentStage": "SHORTLISTED",
  "hrDecision": "ACCEPTED",
  "hrNotes": "Ưu tiên liên hệ trong tuần này.",
  "updatedAt": "2026-08-17T10:10:00.000Z",
  "allowedTransitions": ["SCREENING", "OFFERED", "REJECTED"],
  "historyEntry": {
    "id": "history-id",
    "note": "Đủ kỹ năng bắt buộc, chuyển sang vòng tiếp theo.",
    "changedByUserId": "recruiter-user-id",
    "createdAt": "2026-08-17T10:10:00.000Z"
  }
}
```

HTTP errors:

- `400`: DTO hoặc note không hợp lệ.
- `404`: application không tồn tại hoặc ngoài recruiter scope.
- `409`: `expectedStage` đã cũ hoặc transition không còn hợp lệ.
- `422`: transition không được state machine cho phép.

### 5.4 Candidate: danh sách application của tôi

```http
GET /api/applications/me?page=1&limit=20&stage=SCREENING
Authorization: Bearer <candidate-token>
```

Response candidate-safe:

```json
{
  "data": [
    {
      "id": "application-id",
      "job": {
        "id": "job-id",
        "title": "Backend Engineer",
        "company": { "id": "company-id", "name": "Example Co" },
        "location": "Ho Chi Minh City"
      },
      "currentStage": "SCREENING",
      "processingStatus": "COMPLETED",
      "appliedAt": "2026-08-17T10:00:00.000Z",
      "updatedAt": "2026-08-17T10:05:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

Candidate response không chứa:

- `hrDecision`
- `hrNotes`
- history note
- recruiter identity thực hiện quyết định
- điểm hoặc reasoning nội bộ của AI

### 5.5 Sửa contract job detail cho candidate

Field `application.status` hiện đang mang `processingStatus`, dễ gây nhầm. Đổi
thành hai field rõ nghĩa:

```json
{
  "application": {
    "id": "application-id",
    "processingStatus": "COMPLETED",
    "currentStage": "SCREENING",
    "appliedAt": "2026-08-17T10:00:00.000Z"
  }
}
```

Frontend candidate phải được cập nhật cùng release.

---

## 6. Thiết kế backend

### 6.1 File mới đề xuất

```text
backend/src/modules/applications/
├── application-access.service.ts
├── application-presenter.ts
├── application-stage-machine.ts
├── dto/
│   ├── query-recruiter-applications.dto.ts
│   ├── query-my-applications.dto.ts
│   └── update-application-stage.dto.ts
└── ...
```

Trách nhiệm:

- `application-access.service.ts`: tính recruiter scope và truy vấn application
  đã scope; không lặp policy ở list/detail/update.
- `application-stage-machine.ts`: transition map, note rules, mapping
  `hrDecision`, `allowedTransitions`; không đặt rule trong controller/frontend.
- `application-presenter.ts`: tạo recruiter-safe và candidate-safe response.

### 6.2 Controller

Cập nhật `ApplicationsController`:

```text
POST  /applications             CANDIDATE  tạo application
GET   /applications             RECRUITER  list/filter/ranking
GET   /applications/me          CANDIDATE  list application của chính mình
GET   /applications/:id         RECRUITER  application detail
PATCH /applications/:id/stage   RECRUITER  chuyển stage
```

Khai báo route `/me` trước `/:id`. Dùng `ParseUUIDPipe` cho `:id`.

### 6.3 Transaction chuyển stage

Một lần chuyển stage phải thực hiện atomically:

1. Resolve recruiter scope.
2. Tìm application trong scope.
3. Kiểm tra `expectedStage`.
4. Kiểm tra transition và note rule bằng state machine.
5. `updateMany` với điều kiện `id + currentStage = expectedStage` để
   compare-and-set.
6. Nếu update count bằng 0, trả `409 Conflict`.
7. Tạo `ApplicationStatusHistory` với previous/new stage, user và note.
8. Commit transaction.
9. Đọc response mới hoặc trả dữ liệu đã select trong transaction.

Không cập nhật application trước rồi mới tạo history ngoài transaction.

### 6.4 Idempotency

- Nếu request lặp lại có `targetStage` bằng stage hiện tại và
  `expectedStage` cũng bằng stage hiện tại, trả `409`; không tạo history rỗng.
- Frontend sau `409` refresh application và hiển thị “Trạng thái đã được người
  khác cập nhật”.
- V1 chưa cần idempotency key riêng vì compare-and-set đã chặn double write.

### 6.5 List query và score sorting

Prisma không hỗ trợ thuận tiện việc paginate `Application` rồi order theo field
của latest record trong quan hệ one-to-many. Không được paginate trước rồi mới
sort trong client vì thứ hạng sẽ sai giữa các trang.

Giải pháp v1:

1. Query một projection nhẹ theo recruiter scope gồm application ID, candidate
   identity, timestamps và latest AI score.
2. Áp dụng score range, sort và pagination ở service trước khi hydrate detail của
   page hiện tại.
3. `limit` tối đa 100.
4. Ghi metric/log số application được scan cho mỗi query.

Khi một job thường xuyên vượt 500 application, chuyển sang read model có
`latestOverallScore` trên `Application` hoặc query SQL đã benchmark. Không thêm
denormalized score trong v1 khi chưa có dữ liệu chứng minh cần thiết.

### 6.6 Consumer AI

Cập nhật `ApplicationsConsumer` trong transaction lưu AI result:

- Đọc application hiện tại.
- Nếu stage là `RECEIVED`, compare-and-set sang `SCREENING`.
- Khi compare-and-set thành công, cập nhật `hrDecision = CONSIDER` theo mapping
  tập trung của state machine.
- Chỉ tạo system history khi compare-and-set thành công.
- Không thay đổi `hrDecision`/stage nếu recruiter đã thao tác.
- AI failure không tự chuyển application sang `REJECTED`.

### 6.7 Index migration

Không thêm bảng/cột mới. Tạo migration index nhỏ sau khi kiểm tra index thực tế:

```prisma
model Application {
  @@index([jobId, currentStage, appliedAt])
  @@index([candidateId, appliedAt])
}

model ApplicationStatusHistory {
  @@index([applicationId, createdAt])
}
```

Giữ các index đơn hiện tại trong migration đầu tiên; chỉ xóa index dư sau khi đã
đo query plan trên môi trường test.

---

## 7. Thiết kế frontend recruiter

### 7.1 API client và types

Mở rộng `frontend/src/lib/recruiter-api.ts`:

- Thay `applications?: any[]` bằng types cụ thể.
- Thêm `getRecruiterApplications`.
- Thêm `getRecruiterApplicationDetail`.
- Thêm `updateApplicationStage`.
- Chuẩn hóa parsing lỗi API để hiển thị `409`/`422` thân thiện.

Tạo shared frontend constants:

```text
frontend/src/lib/application-stage.ts
```

Chỉ chứa label/màu/icon. Rule transition vẫn lấy từ `allowedTransitions` của
backend, không copy state machine sang client.

### 7.2 Refactor màn hình job detail

`JobDetailView` không tiếp tục nhận toàn bộ applications từ `GET /jobs/:id`.

Tách thành:

```text
components/recruiter/applications/
├── ApplicationFilters.tsx
├── ApplicationRankingList.tsx
├── ApplicationDetailPanel.tsx
├── ApplicationStageActions.tsx
└── ApplicationNoteDialog.tsx
```

Luồng UI:

1. Mở tab candidates của job.
2. Fetch `GET /applications?jobId=...`.
3. Chọn một item thì fetch detail riêng.
4. Search/filter thay đổi query; debounce search 300–400 ms.
5. Stage action mở dialog xác nhận và note.
6. Trong lúc PATCH: disable action cho application đó.
7. Thành công: cập nhật list item + detail theo response server.
8. `409`: refresh item/detail và thông báo có thay đổi đồng thời.
9. Lỗi khác: giữ dữ liệu cũ, hiển thị error, không giả lập thành công.

### 7.3 Action UI

Các action hiển thị theo `allowedTransitions`:

- `SHORTLISTED`: “Đưa vào shortlist”.
- `REJECTED`: “Từ chối hồ sơ”, bắt buộc nhập lý do nội bộ.
- `OFFERED`: “Đã gửi đề nghị”.
- `HIRED`: “Xác nhận tuyển dụng”, cần confirm lần hai.
- `SCREENING`: “Đưa về xem xét”, bắt buộc note nếu reopen/rollback.

Không hiển thị nút “Hire” trực tiếp cho application ở `RECEIVED` hoặc
`SCREENING`.

### 7.4 Global candidate ranking

Tab “Xếp hạng Ứng viên AI” trong `RecruiterWorkspace` hiện dùng mảng rỗng. Thay
bằng cùng `ApplicationRankingList`, gọi endpoint không truyền `jobId` và hiển thị
thêm job title.

Kanban v1 có thể dùng cùng endpoint với filter stage. Drag-and-drop nếu giữ lại
phải gọi `PATCH /applications/:id/stage`; khi transition không hợp lệ phải snap
card về cột cũ. Nếu thời gian hạn chế, ưu tiên action buttons trước drag-and-drop.

### 7.5 Cleanup

Sau khi flow mới hoạt động:

- Xóa hoặc migrate `CandidateDetailModal`/`Candidate360Modal` không còn được dùng.
- Xóa `MOCK_CANDIDATES` và `MOCK_JOBS`.
- Không giữ hai implementation candidate detail song song.
- Bỏ `applications` khỏi `JobPostingData` khi backend compatibility window kết
  thúc.

---

## 8. Thiết kế frontend candidate

### 8.1 Route mới

```text
frontend/src/app/candidate/applications/page.tsx
```

Trang hiển thị:

- Tên job, company, location.
- Ngày ứng tuyển.
- Stage nghiệp vụ với label tiếng Việt.
- Trạng thái AI theo cách trung tính, ví dụ “Đang xử lý hồ sơ” hoặc “Đã tiếp
  nhận”, không hiển thị lỗi kỹ thuật RabbitMQ/Gemini.
- Link quay lại job detail.
- Pagination và filter stage đơn giản.

### 8.2 Label candidate-safe

| Stage | Label candidate |
|---|---|
| `RECEIVED` | Đã tiếp nhận |
| `SCREENING` | Đang xem xét |
| `SHORTLISTED` | Đã qua vòng hồ sơ |
| `INTERVIEW_SCHEDULED` | Đã lên lịch phỏng vấn |
| `INTERVIEWED` | Đã phỏng vấn |
| `OFFERED` | Đã gửi đề nghị |
| `HIRED` | Đã tuyển dụng |
| `REJECTED` | Chưa phù hợp |
| `WITHDRAWN` | Đã rút hồ sơ |

Không hiển thị note reject nội bộ trong v1.

### 8.3 Candidate API client

Mở rộng `candidate-api.ts`:

- `getMyApplications`.
- Type riêng cho `currentStage` và `processingStatus`.
- Sửa `CandidateJobDetail.application` để không còn field `status` mơ hồ.
- Thêm liên kết “Đơn ứng tuyển” vào navigation candidate.

---

## 9. Test strategy

### 9.1 Backend unit tests

`application-stage-machine.spec.ts`:

1. Mỗi transition hợp lệ trong matrix.
2. Transition bị cấm.
3. `HIRED` terminal.
4. Reject/reopen/rollback thiếu note.
5. Mapping `hrDecision` cho từng stage.
6. `allowedTransitions` nhất quán với validation.

`application-access.service.spec.ts`:

1. Recruiter đọc application job của chính mình.
2. Recruiter cùng company đọc được application của peer.
3. Recruiter khác company nhận not found.
4. Recruiter không có company chỉ truy cập job của mình.
5. Candidate chỉ đọc application của chính mình.

`applications.service.spec.ts` bổ sung:

1. List áp dụng đúng filter, search và pagination.
2. Score sorting đúng qua nhiều page.
3. Detail chỉ trả latest AI result.
4. Transition cập nhật application và tạo history trong một transaction.
5. History có đúng `changedByUserId` và note.
6. `expectedStage` cũ trả conflict và không tạo history.
7. Transition invalid không mutation.
8. Candidate response không leak `hrNotes`, score hoặc history notes.

`applications.consumer.spec.ts` bổ sung:

1. Completed evaluation tự chuyển `RECEIVED -> SCREENING`.
2. Tạo system history đúng một lần.
3. Không ghi đè stage đã được recruiter thay đổi.
4. Retry/duplicate AI message không tạo duplicate stage history.

### 9.2 Controller/validation tests

1. Candidate không gọi được recruiter endpoints.
2. Recruiter không gọi được `/applications/me` với candidate semantics.
3. UUID, enum, score range, page và limit validation.
4. Whitelist loại bỏ field client không được phép gửi.

### 9.3 Frontend verification

Nếu chưa bổ sung test runner cho frontend, tối thiểu phải có:

1. `npm run lint` cho các file thay đổi.
2. `npm run build`.
3. Test thủ công bằng hai account recruiter cùng company.
4. Test hai tab/browser PATCH cùng application để xác nhận `409`.
5. Test score pending, completed và failed.
6. Test empty/loading/error/pagination states.
7. Test mobile layout của ranking và action dialog.

Ưu tiên thêm React Testing Library cho:

- Action buttons theo `allowedTransitions`.
- Note bắt buộc khi reject.
- UI rollback/refresh khi API trả `409`.

### 9.4 E2E workflow

```text
Candidate apply
→ application RECEIVED
→ AI completed
→ application SCREENING + system history
→ recruiter SHORTLISTED + recruiter history
→ candidate thấy “Đã qua vòng hồ sơ”
→ recruiter OFFERED
→ recruiter HIRED
```

E2E thứ hai:

```text
Candidate apply
→ AI failed
→ recruiter vẫn mở detail
→ recruiter REJECTED với note
→ candidate thấy “Chưa phù hợp”
→ candidate không thấy note nội bộ
```

---

## 10. Thứ tự triển khai

### Phase 0 — Contract và baseline

- Chốt transition matrix và label.
- Ghi fixture response hiện tại của `GET /jobs/:id` và candidate job detail.
- Chạy backend tests, frontend build/lint hiện tại để phân biệt lỗi có sẵn.
- Kiểm tra migration/index trên database test.

### Phase 1 — State machine và access policy

- Tạo stage machine thuần, không phụ thuộc Prisma.
- Tạo application access service.
- Viết unit tests trước khi mở controller.

### Phase 2 — Recruiter read APIs

- DTO query.
- `GET /applications`.
- `GET /applications/:id`.
- Presenter và response types.
- Filter, pagination, score sorting và ownership tests.

### Phase 3 — Recruiter mutation

- DTO update stage.
- Transaction compare-and-set.
- Tạo history và mapping HR decision.
- Swagger contract và unit/controller tests.

### Phase 4 — System transition từ AI

- Auto `RECEIVED -> SCREENING` khi AI completed.
- System history.
- Tests chống ghi đè và duplicate.

### Phase 5 — Recruiter UI

- API client types.
- Refactor application list/detail khỏi job response.
- Filter, pagination và search.
- Stage actions + note dialog + concurrent update handling.
- Nối global ranking; action button trước, Kanban sau.

### Phase 6 — Candidate tracking

- `GET /applications/me`.
- Sửa candidate job detail contract.
- Trang `/candidate/applications`.
- Candidate-safe presenter và privacy tests.

### Phase 7 — Cleanup và rollout

- Migration index.
- Bỏ mock/dead UI.
- Backend test/build.
- Frontend lint/build.
- Chạy E2E trên test deployment.
- Giữ job detail compatibility trong một release rồi loại bỏ applications
  payload.

---

## 11. Work breakdown

```text
T01 Chốt transition matrix, note rules và mapping hrDecision
T02 Tạo application-stage-machine.ts + unit tests
T03 Tạo application-access.service.ts + ownership tests
T04 Tạo recruiter/candidate presenters
T05 Tạo QueryRecruiterApplicationsDto
T06 Implement GET /applications
T07 Implement GET /applications/:id
T08 Tạo UpdateApplicationStageDto
T09 Implement PATCH /applications/:id/stage bằng transaction/CAS
T10 Bổ sung ApplicationStatusHistory và conflict tests
T11 Auto RECEIVED -> SCREENING trong AI consumer
T12 Thêm index migration và verify query plan
T13 Thêm typed recruiter application API client
T14 Tách ApplicationRankingList và ApplicationDetailPanel
T15 Thêm filters, pagination, search và loading/error states
T16 Thêm ApplicationStageActions + note dialog
T17 Xử lý 409 concurrent update
T18 Nối global recruiter candidate ranking với API thật
T19 Implement GET /applications/me
T20 Tạo trang candidate applications
T21 Sửa candidate job detail status contract và candidate navigation
T22 Xóa mock và component candidate detail dư thừa
T23 Chạy backend regression, frontend lint/build
T24 Chạy hai E2E workflow và kiểm tra privacy
T25 Deploy backend trước, frontend sau, rồi bỏ compatibility payload
```

Ước lượng tương đối cho một developer đã quen codebase: 7–10 ngày làm việc,
không bao gồm interview/notification.

---

## 12. Acceptance criteria

- [ ] Recruiter list được application trong đúng company/owner scope.
- [ ] Filter theo job, stage, trạng thái AI, score và search hoạt động đúng.
- [ ] Score sort và pagination không sai thứ hạng giữa các page.
- [ ] Recruiter ngoài scope không đọc hoặc update được application.
- [ ] Chỉ transition hợp lệ mới được commit.
- [ ] Reject/reopen/rollback bắt buộc note.
- [ ] Mỗi transition thành công tạo đúng một history entry.
- [ ] History ghi đúng previous stage, new stage và user thực hiện.
- [ ] Hai thao tác đồng thời không âm thầm ghi đè nhau.
- [ ] AI completed chỉ tự chuyển stage nếu application vẫn `RECEIVED`.
- [ ] AI failed không tự reject candidate.
- [ ] Frontend dùng `allowedTransitions` từ backend.
- [ ] Recruiter ranking không còn dùng mock data.
- [ ] Candidate xem được danh sách và stage của application của chính mình.
- [ ] Candidate không thấy HR notes, history notes hoặc AI reasoning nội bộ.
- [ ] Backend tests/build pass.
- [ ] Frontend build pass; file mới/sửa không tạo thêm lint error.
- [ ] Hai E2E workflow ở mục 9.4 pass trên môi trường test.

---

## 13. Rủi ro và giảm thiểu

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Hai recruiter cập nhật đồng thời | Mất quyết định mới hơn | `expectedStage` + compare-and-set + `409` |
| Frontend tự copy transition rule | UI và backend lệch nhau | Backend trả `allowedTransitions` |
| Job detail payload quá lớn | Chậm khi nhiều ứng viên | List/detail application endpoints riêng |
| Sort score sau pagination | Ranking sai | Sort trước khi slice; test cross-page |
| Lộ HR note cho candidate | Vi phạm riêng tư | Presenter riêng + negative tests |
| AI consumer ghi đè HR stage | Mất quyết định thủ công | CAS chỉ khi stage còn `RECEIVED` |
| Cho phép hire quá sớm | Workflow thiếu kiểm soát | State machine không cho `RECEIVED/SCREENING -> HIRED` |
| Dữ liệu hồ sơ thay đổi sau apply | Review lệch dữ liệu đã chấm | Detail dùng application-time snapshot |
| Scan nhiều application để score sort | Tăng latency | Projection nhẹ, log scan count, read model khi >500/job |

---

## 14. Definition of Done

```text
Scoped recruiter read APIs
+ deterministic state machine
+ atomic stage update
+ application history
+ concurrency protection
+ live recruiter ranking/actions
+ candidate application tracking
+ privacy tests
+ regression/build verification
= Application Decision Workflow v1 Done
```

Interview scheduling và notification chỉ bắt đầu sau khi các acceptance criteria
trên đã đạt trên test deployment.
