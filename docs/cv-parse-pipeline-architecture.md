# Kiến trúc Pipeline Parse CV — Đề xuất tái tổ chức

> Phiên bản: 1.0 — Ngày: 2026-08-03

---

## 1. Vấn đề của tổ chức hiện tại

### ai-service — các lớp trộn lẫn nhau

```
app/services/resume_parser.py   ← orchestrator nhưng không rõ ranh giới
app/services/text_extractor.py  ← I/O thuần (tốt)
app/services/llm_client.py      ← business logic + infra/Gemini SDK trộn nhau
app/workers/resume_worker.py    ← transport + retry logic + orchestration trộn nhau
app/schemas/resume_schemas.py   ← schema LLM output và schema RabbitMQ message trong cùng file
```

Hệ quả:
- Không thể unit test `resume_worker.py` mà không cần RabbitMQ thật.
- Không thể thay Gemini bằng model khác mà không sửa business logic.
- Không thể thêm step mới vào pipeline mà không đụng vào orchestrator.

### backend — resumes module thiếu tầng trung gian

```
resumes.service.ts          ← upload + publish + validation trộn nhau
resume-hydration.service.ts ← write toàn DB trong một file khổng lồ
resume-result.listener.ts   ← transport (subscribe) + routing + business logic trộn nhau
```

Hệ quả:
- `resume-hydration.service.ts` làm quá nhiều thứ: skill lookup, data cleanup,
  guard logic, transaction management.
- `resume-result.listener.ts` bắt lỗi ở sai tầng khiến nack bị nuốt.
- Không có nơi tập trung để thêm guard (primaryResumeId check, source protection).

---

## 2. Nguyên tắc thiết kế lại

1. **Transport ≠ Orchestration ≠ Domain logic** — mỗi lớp chỉ làm một việc.
2. **Pipeline là chuỗi Step tường minh** — dễ thêm/bỏ/test từng bước.
3. **Infra có thể swap** — Gemini, RabbitMQ, Supabase nằm sau interface.
4. **Lỗi nổi lên đúng tầng** — transport layer quyết định ack/nack, không phải business layer.
5. **Schema theo ngữ cảnh** — schema LLM output, schema message queue, schema DB tách biệt.

---

## 3. Kiến trúc đề xuất — ai-service

### Cây thư mục mục tiêu

```
ai-service/
├── app/
│   ├── main.py                         # FastAPI app (chỉ HTTP, không khởi worker)
│   │
│   ├── api/
│   │   └── routes/
│   │       ├── matching.py
│   │       └── health.py
│   │
│   ├── core/
│   │   ├── config.py                   # Settings (không thay đổi)
│   │   └── logging.py
│   │
│   ├── domain/                         ← MỚI: thuần business logic, không import infra
│   │   └── resume/
│   │       ├── pipeline.py             # Orchestrator — gọi các step theo thứ tự
│   │       ├── steps/                  # Mỗi step là một function/class độc lập
│   │       │   ├── __init__.py
│   │       │   ├── file_validator.py   # Magic bytes, MIME check, size/page limit
│   │       │   ├── text_extractor.py   # PDF/DOCX → raw text (moved từ services/)
│   │       │   ├── text_preprocessor.py # Clean, normalize, truncate
│   │       │   ├── llm_extractor.py    # Gọi LLM port (interface), parse, validate
│   │       │   ├── date_calculator.py  # Tính total_years_experience từ intervals
│   │       │   └── result_builder.py   # Assemble ParsedResumeOutput từ các bước
│   │       ├── models.py               # Domain models (không phải Pydantic RPC)
│   │       └── exceptions.py          # TransientError, PermanentError, ValidationError
│   │
│   ├── ports/                          ← MỚI: abstract interfaces (dependency inversion)
│   │   ├── llm_port.py                 # Protocol: extract(text) -> LLMRawOutput
│   │   └── storage_port.py             # Protocol: download(path, url?) -> bytes
│   │
│   ├── adapters/                       ← MỚI: concrete implementations của ports
│   │   ├── gemini_llm.py               # implements llm_port (toàn bộ Gemini SDK ở đây)
│   │   └── supabase_storage.py         # implements storage_port
│   │
│   ├── schemas/
│   │   ├── llm_output.py               # Pydantic: output Gemini (ResumeExtractionResult)
│   │   └── mq_messages.py              # Pydantic: RabbitMQ request/response messages
│   │
│   ├── transport/                      ← MỚI: tất cả I/O không phải HTTP ở đây
│   │   └── rabbitmq/
│   │       ├── consumer.py             # Nhận message, decode, gọi pipeline, quyết định ack/nack
│   │       ├── publisher.py            # Gửi completed/failed
│   │       └── retry_policy.py         # Phân loại lỗi, backoff, DLQ logic
│   │
│   └── workers/
│       └── resume_worker.py            # Entry point: kết nối RabbitMQ, gọi consumer
│
├── worker_main.py                      ← MỚI: entry point riêng, không qua FastAPI
├── Dockerfile                          # Multi-stage: web target + worker target
└── tests/
    ├── unit/
    │   ├── domain/                     # Test từng step thuần Python, không cần infra
    │   │   ├── test_file_validator.py
    │   │   ├── test_text_preprocessor.py
    │   │   ├── test_date_calculator.py
    │   │   └── test_llm_extractor.py   # Mock llm_port
    │   └── transport/
    │       └── test_retry_policy.py
    ├── integration/
    │   └── test_pipeline_integration.py # Test full pipeline với mock adapters
    └── fixtures/
```

### Luồng dữ liệu trong ai-service

```
transport/rabbitmq/consumer.py
    │  nhận message, decode ResumeAnalysisRequest
    ▼
domain/resume/pipeline.py  (ResumeParsingPipeline.run(request))
    │
    ├─▶ steps/file_validator.py     (check magic bytes, mime, size, pages)
    ├─▶ adapters/supabase_storage   (download bytes qua storage_port)
    ├─▶ steps/text_extractor.py     (pdf/docx → raw text, OCR fallback)
    ├─▶ steps/text_preprocessor.py  (unicode, dedupe, truncate)
    ├─▶ steps/llm_extractor.py      (gọi llm_port → validate → date check)
    ├─▶ steps/date_calculator.py    (tính total_years từ intervals)
    └─▶ steps/result_builder.py     (assemble ParsedResumeOutput)
    │
    ▼  trả về ParsedResumeOutput hoặc raise TransientError/PermanentError
transport/rabbitmq/consumer.py
    │  TransientError → nack + requeue (retry_policy quyết định)
    │  PermanentError → publish failed + nack
    └─▶ publish completed
```

---

## 4. Kiến trúc đề xuất — backend/resumes module

### Cây thư mục mục tiêu

```
backend/src/modules/resumes/
│
├── resumes.module.ts
├── resumes.controller.ts               # HTTP endpoints (không thay đổi nhiều)
│
├── application/                        ← MỚI: use-case layer
│   ├── upload-resume.use-case.ts       # Upload + validate + publish (tách khỏi service)
│   ├── get-resume-status.use-case.ts
│   └── retry-stuck-resumes.use-case.ts # Cron job tìm PENDING > 10 phút
│
├── domain/                             ← MỚI: thuần business rules
│   ├── resume-guard.service.ts         # isPrimaryResume(), canHydrate(), canFail()
│   └── skill-normalizer.service.ts     # normalizeSkillName() — tách riêng, dễ test
│
├── hydration/                          ← Tách từ resume-hydration.service.ts khổng lồ
│   ├── resume-hydration.service.ts     # Orchestrator: gọi các writer theo thứ tự
│   ├── writers/
│   │   ├── experience-writer.ts        # deleteMany + createMany cho WorkExperience
│   │   ├── education-writer.ts
│   │   ├── project-writer.ts
│   │   ├── certificate-writer.ts
│   │   ├── skill-writer.ts             # Upsert skill, bảo vệ MANUAL, cleanup cũ
│   │   └── profile-writer.ts           # Update CandidateProfile status/summary
│   └── skill-resolver.service.ts      # findOrCreate skill, UnrecognizedSkill queue
│
├── transport/                          ← MỚI: tách transport khỏi business
│   └── resume-result.listener.ts      # Subscribe RabbitMQ, decode, route, ack/nack
│
└── resumes.service.ts                  # Còn lại: getStatus, getMyResumes + facade
```

### Luồng dữ liệu trong backend

```
HTTP POST /resumes/upload
    │
    ▼
application/upload-resume.use-case.ts
    ├── validate (mime, size)
    ├── prisma.resume.create (PENDING)
    ├── storage.upload()
    ├── prisma.resume.update (objectPath)
    ├── prisma.candidateProfile.update (primaryResumeId)   ← set primary trước
    ├── rabbitMQ.publish(analysis.requested)
    └── nếu published: prisma.candidateProfile.update (PROCESSING)
        nếu failed:    trả về status=PENDING + warning

RabbitMQ message: resume.analysis.completed / failed
    │
    ▼
transport/resume-result.listener.ts
    ├── decode message
    ├── route → handleCompleted() hoặc handleFailed()
    │    └── KHÔNG try/catch — lỗi nổi lên để layer này xử lý
    ├── nếu thành công: channel.ack()
    └── nếu lỗi transient: channel.nack(requeue=true)
        nếu lỗi permanent: channel.nack(requeue=false) → DLQ

handleCompleted()
    │
    ▼
domain/resume-guard.service.ts
    └── isPrimaryResume(resumeId, candidateProfileId) → nếu false: SUPERSEDED, return

hydration/resume-hydration.service.ts (orchestrator)
    ├── skill-resolver.service.ts       (pre-resolve ngoài transaction)
    └── prisma.$transaction([
            experience-writer.ts        (chỉ xóa EXTRACTED của resumeId này)
            education-writer.ts
            project-writer.ts
            certificate-writer.ts
            skill-writer.ts             (bảo vệ MANUAL, cleanup EXTRACTED cũ)
            profile-writer.ts
        ])

handleFailed()
    │
    ▼
domain/resume-guard.service.ts
    └── isPrimaryResume() → chỉ set profile FAILED nếu đây vẫn là primary
```

---

## 5. Ranh giới trách nhiệm — ma trận

### ai-service

| Tầng | Thư mục | Được phép import | KHÔNG được import |
|---|---|---|---|
| Transport | `transport/` | `domain/`, `schemas/mq_messages`, `adapters/` | FastAPI, HTTP |
| Orchestration | `domain/resume/pipeline.py` | `domain/steps/`, `ports/` | `adapters/` trực tiếp |
| Steps | `domain/resume/steps/` | `domain/models.py`, `ports/` | `adapters/`, `transport/` |
| Ports | `ports/` | Python stdlib | bất cứ thứ gì |
| Adapters | `adapters/` | `ports/`, SDK ngoài (genai, supabase) | `domain/` |
| Schemas | `schemas/` | Pydantic | business logic |

### backend

| Tầng | Thư mục | Trách nhiệm |
|---|---|---|
| Transport | `transport/` | Subscribe queue, decode, ack/nack |
| Application | `application/` | Orchestrate use case, không biết DB |
| Domain | `domain/` | Guards, normalizers — thuần logic |
| Hydration | `hydration/` | DB writes — biết Prisma |
| Infrastructure | `../../infrastructure/` | RabbitMQ, Supabase — không thay đổi |

---

## 6. Sơ đồ toàn pipeline end-to-end

```
┌──────────────────────────────────────────────────────────────────────┐
│  USER BROWSER                                                        │
│  POST /api/resumes/upload  (multipart file)                          │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND (NestJS)                                                    │
│                                                                      │
│  ResumesController                                                   │
│       │                                                              │
│       ▼                                                              │
│  UploadResumeUseCase                                                 │
│  ├── validate file (mime, magic bytes, size)                        │
│  ├── Resume.create(PENDING)                                          │
│  ├── Supabase.upload()                                               │
│  ├── CandidateProfile.setPrimary(resumeId)                           │
│  ├── RabbitMQ.publish(resume.analysis.requested)                     │
│  └── nếu OK: Profile.setStatus(PROCESSING)                          │
│                                                                      │
│  ResumeResultListener  ◄─────────────────────────────────────────┐  │
│  ├── decode message                                               │  │
│  ├── ResumeGuard.isPrimary? → nếu không: SUPERSEDED, skip        │  │
│  ├── HydrationOrchestrator.hydrate()                             │  │
│  │   ├── ExperienceWriter (chỉ EXTRACTED của resumeId này)       │  │
│  │   ├── EducationWriter                                         │  │
│  │   ├── ProjectWriter                                           │  │
│  │   ├── CertificateWriter                                       │  │
│  │   ├── SkillWriter (bảo vệ MANUAL, cleanup cũ)                │  │
│  │   └── ProfileWriter (status → READY)                         │  │
│  └── ack / nack (lỗi transient → nack+requeue, DLQ nếu hết retry)  │
└──────────────────────────────────────────────────────────────────────┘
         │ RabbitMQ: resume.analysis.requested                     ▲
         ▼                                                         │
┌──────────────────────────────────────────────────────────────────────┐
│  AI-SERVICE (FastAPI — HTTP)    AI-WORKER (process riêng)            │
│                                                                      │
│  [web]              │          [worker]                              │
│  /health            │          RabbitMQConsumer                      │
│  /api/v1/matching   │              │                                 │
│                     │              ▼                                 │
│                     │          ResumeParsingPipeline.run()           │
│                     │          ├── FileValidator                     │
│                     │          │   (magic bytes, mime, size, pages)  │
│                     │          ├── StorageAdapter.download()         │
│                     │          │   (signed URL hoặc service key)     │
│                     │          ├── TextExtractor                     │
│                     │          │   (pypdf → OCR fallback nếu ít text)│
│                     │          │   (DOCX paragraphs + tables + hdr)  │
│                     │          ├── TextPreprocessor                  │
│                     │          │   (unicode, dedupe, truncate 15k)   │
│                     │          ├── LLMExtractor                      │
│                     │          │   (GeminiAdapter, response_schema,  │
│                     │          │    date validate, injection guard)  │
│                     │          ├── DateCalculator                    │
│                     │          │   (total_years từ intervals)        │
│                     │          └── ResultBuilder                     │
│                     │              (assemble + confidence + version) │
│                     │              │                                 │
│                     │              ▼ TransientError → nack+backoff   │
│                     │              ▼ PermanentError → publish failed │
│                     │              ▼ OK → publish completed ─────────┘
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE                                                      │
│  RabbitMQ (topic exchange)  ←→  DLQ (resume.analysis.dead)         │
│  Supabase Storage                                                    │
│  PostgreSQL (Prisma)                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Các thay đổi file cụ thể (mapping hiện tại → mục tiêu)

### ai-service

| File hiện tại | Việc cần làm | File mục tiêu |
|---|---|---|
| `app/services/text_extractor.py` | Move + thêm OCR, table, magic bytes, size limit | `app/domain/resume/steps/file_validator.py` + `text_extractor.py` |
| `app/services/llm_client.py` | Tách Gemini SDK → adapter, giữ business logic trong step | `app/adapters/gemini_llm.py` (SDK) + `app/domain/resume/steps/llm_extractor.py` (logic) |
| `app/services/resume_parser.py` | Đổi thành pipeline orchestrator | `app/domain/resume/pipeline.py` |
| `app/workers/resume_worker.py` | Tách transport ra consumer, giữ entry point | `app/transport/rabbitmq/consumer.py` + `app/transport/rabbitmq/retry_policy.py` + `worker_main.py` |
| `app/schemas/resume_schemas.py` | Tách thành 2 file theo ngữ cảnh | `app/schemas/llm_output.py` + `app/schemas/mq_messages.py` |
| `app/main.py` | Xóa startup_event khởi worker | Chỉ giữ HTTP app |
| _(chưa có)_ | Tạo mới | `app/ports/llm_port.py`, `app/ports/storage_port.py` |
| _(chưa có)_ | Tạo mới | `app/adapters/supabase_storage.py` |
| _(chưa có)_ | Tạo mới | `app/domain/resume/steps/text_preprocessor.py` |
| _(chưa có)_ | Tạo mới | `app/domain/resume/steps/date_calculator.py` |
| _(chưa có)_ | Tạo mới | `app/domain/resume/exceptions.py` |
| _(chưa có)_ | Tạo mới | `worker_main.py` |

### backend/resumes

| File hiện tại | Việc cần làm | File mục tiêu |
|---|---|---|
| `resumes.service.ts` | Tách upload logic ra use case | `application/upload-resume.use-case.ts` + `resumes.service.ts` (facade nhỏ hơn) |
| `resume-hydration.service.ts` | Tách writer, guard, normalizer | `hydration/resume-hydration.service.ts` + `hydration/writers/*.ts` + `domain/resume-guard.service.ts` + `domain/skill-normalizer.service.ts` + `hydration/skill-resolver.service.ts` |
| `resume-result.listener.ts` | Move vào transport/, bỏ try/catch sai tầng | `transport/resume-result.listener.ts` |
| _(chưa có)_ | Tạo mới | `application/retry-stuck-resumes.use-case.ts` |

---

## 8. Thứ tự refactor an toàn

Mỗi bước phải xanh (test pass, không regression) trước khi sang bước tiếp.

```
Bước 1  Tạo domain/resume-guard.service.ts + test
         → Thêm guard vào hydrateProfile() và handleFailure() (sửa bug critical trước)

Bước 2  Tách resume-hydration.service.ts → hydration/writers/*.ts
         → Mỗi writer là class nhỏ, dễ test riêng

Bước 3  Sửa transport/resume-result.listener.ts
         → Bỏ try/catch sai tầng, để lỗi nổi lên đúng chỗ

Bước 4  Tạo ports/llm_port.py + adapters/gemini_llm.py
         → Tách Gemini SDK khỏi business logic

Bước 5  Tạo domain/resume/steps/*.py (từng step một, có unit test)
         → file_validator → text_preprocessor → llm_extractor → date_calculator

Bước 6  Tạo domain/resume/pipeline.py
         → Orchestrate các step, gọi qua ports

Bước 7  Tạo transport/rabbitmq/consumer.py + retry_policy.py
         → Tách khỏi resume_worker.py

Bước 8  Tạo worker_main.py, cập nhật Dockerfile multi-stage
         → Tách web và worker process

Bước 9  Tạo application/upload-resume.use-case.ts
         → Refactor resumes.service.ts

Bước 10 Thêm test pipeline end-to-end với mock adapters
```

---

## 9. Lợi ích sau refactor

| Trước | Sau |
|---|---|
| Test worker cần RabbitMQ thật | Test domain step chỉ cần Python thuần |
| Thay Gemini phải sửa business logic | Tạo adapter mới, swap trong DI |
| Thêm OCR phải sửa orchestrator | Chỉ thêm/sửa `text_extractor.py` step |
| Lỗi hydration bị nuốt bởi try/catch sai tầng | Lỗi nổi lên đúng transport layer |
| `resume_worker.py` 160 dòng, khó đọc | Consumer, retry, pipeline mỗi file < 80 dòng |
| Skill/experience bị xóa khi parse CV mới | Guard + writer bảo vệ MANUAL data |
| CV cũ có thể ghi đè hồ sơ mới | Guard kiểm tra primaryResumeId trước khi hydrate |
