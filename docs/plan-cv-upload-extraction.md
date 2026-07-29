# Plan: Upload CV & AI Extraction

## Tổng quan

Chức năng cho phép ứng viên upload CV (PDF/DOCX), hệ thống AI tự động phân tích và extract thông tin cá nhân, kỹ năng, kinh nghiệm, học vấn, dự án, chứng chỉ rồi cập nhật vào hồ sơ.

---

## Kiến trúc tổng thể

```
┌─────────────┐       ┌────────────────────┐       ┌────────────────────┐
│  Frontend   │─────▶│  Backend (NestJS)  │─────▶│  Supabase Storage  │
│  Upload UI  │       │  POST /resumes     │       │  bucket: resumes   │
└─────────────┘       └────────┬───────────┘       └────────────────────┘
                               │
                               │ publish: resume.analysis.requested
                               ▼
                      ┌────────────────────┐
                      │     RabbitMQ       │
                      │  topic exchange    │
                      └────────┬───────────┘
                               │
                               │ consume: resume_analysis_queue
                               ▼
                      ┌────────────────────┐       ┌─────────────────┐
                      │  AI Service        │─────▶│  Gemini / OpenAI │
                      │  (FastAPI worker)  │       │  LLM API        │
                      └────────┬───────────┘       └─────────────────┘
                               │
                               │ publish: resume.analysis.completed
                               ▼
                      ┌────────────────────┐
                      │  Backend listener  │
                      │  (update DB)       │
                      └────────────────────┘
```

---

## Infrastructure đã có sẵn

| Component | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| `SupabaseStorageService.uploadCandidateResume()` | ✅ Done | Upload file lên Supabase, validate PDF/DOCX, max 5MB |
| `buildResumeObjectPath()` | ✅ Done | Path: `candidates/{id}/resumes/{resumeId}/{filename}` |
| `RabbitMQService` | ✅ Done | Connected, topic exchange `ai_recruitment_events` |
| `RABBITMQ_ROUTING_KEYS` | ✅ Done | `resume.analysis.requested` / `completed` / `failed` |
| Prisma: `Resume`, `ResumeParsedData` | ✅ Done | Full schema với parsing status |
| `ResumesModule` | ⚠️ Empty shell | Cần build controller + service |
| AI Service | ⚠️ Skeleton | Chỉ có health endpoint |

---

## Phase 1: Backend — Resume Upload Endpoint

### Cần implement

| File | Nội dung |
|------|----------|
| `backend/src/modules/resumes/resumes.service.ts` | Validate → tạo Resume record (PENDING) → upload Supabase → publish message → set primaryResume |
| `backend/src/modules/resumes/resumes.controller.ts` | `POST /resumes/upload` (multipart/form-data) — nhận file từ candidate |
| `backend/src/modules/resumes/resumes.module.ts` | Wire controller + service + imports (PrismaModule, AuthModule, SupabaseModule, RabbitMQModule) |

### API Endpoint

```
POST /api/resumes/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  - file: (binary) PDF hoặc DOCX, max 5MB
```

Response:
```json
{
  "id": "resume-uuid",
  "originalFileName": "NguyenVanA_CV.pdf",
  "parsingStatus": "PENDING",
  "createdAt": "2026-07-28T..."
}
```

### Logic trong ResumesService

```typescript
async uploadResume(userId: string, file: Express.Multer.File) {
  // 1. Lấy candidate profile
  const profile = await getProfileByUserId(userId);

  // 2. Tạo Resume record (status = PENDING)
  const resume = await prisma.resume.create({
    data: {
      candidateId: profile.id,
      source: 'CANDIDATE_UPLOAD',
      originalFileName: file.originalname,
      storageBucket: 'resumes',
      objectPath: '', // sẽ update sau upload
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      parsingStatus: 'PENDING',
    }
  });

  // 3. Upload file lên Supabase Storage
  const result = await storageService.uploadCandidateResume(
    file.buffer, file.originalname, file.mimetype,
    { candidateProfileId: profile.id, resumeId: resume.id, fileName: file.originalname }
  );

  // 4. Update objectPath
  await prisma.resume.update({
    where: { id: resume.id },
    data: { objectPath: result.objectPath }
  });

  // 5. Set as primary resume
  await prisma.candidateProfile.update({
    where: { id: profile.id },
    data: { primaryResumeId: resume.id, status: 'PROCESSING' }
  });

  // 6. Publish message to RabbitMQ
  await rabbitMQService.publish('resume.analysis.requested', {
    resumeId: resume.id,
    candidateProfileId: profile.id,
    objectPath: result.objectPath,
    mimeType: file.mimetype,
    originalFileName: file.originalname,
    requestedAt: new Date().toISOString(),
  });

  // 7. Update status → PROCESSING
  await prisma.resume.update({
    where: { id: resume.id },
    data: { parsingStatus: 'PROCESSING' }
  });

  return resume;
}
```

### Endpoint lấy status

```
GET /api/resumes/:id/status
```

Response:
```json
{
  "id": "resume-uuid",
  "parsingStatus": "PROCESSING",
  "parsingErrorMessage": null
}
```

---

## Phase 2: AI Service — Resume Parser Worker

### Cần implement

| File | Nội dung |
|------|----------|
| `ai-service/app/services/text_extractor.py` | Extract text từ PDF (PyPDF2) và DOCX (python-docx) |
| `ai-service/app/services/llm_client.py` | Wrapper gọi Gemini/OpenAI với structured output |
| `ai-service/app/services/resume_parser.py` | Orchestrate: download file → extract text → gọi LLM → return structured data |
| `ai-service/app/workers/resume_worker.py` | RabbitMQ consumer: listen queue → gọi parser → publish result |
| `ai-service/app/schemas/resume_schemas.py` | Pydantic models cho request/response |

### Dependencies cần thêm (requirements.txt)

```
pika>=1.3.0              # RabbitMQ client
google-generativeai      # Gemini API (hoặc openai)
pypdf>=4.0.0             # PDF text extraction
python-docx>=1.1.0       # DOCX text extraction
supabase>=2.0.0          # Download file từ storage
```

### Message nhận từ RabbitMQ

```json
{
  "resumeId": "uuid",
  "candidateProfileId": "uuid",
  "objectPath": "candidates/abc/resumes/def/cv.pdf",
  "mimeType": "application/pdf",
  "originalFileName": "NguyenVanA_CV.pdf",
  "requestedAt": "2026-07-28T09:00:00Z"
}
```

### LLM Extraction Prompt Strategy

1. Extract raw text từ file
2. Gửi LLM prompt yêu cầu trả về **JSON structure** theo schema cố định
3. Parse output, validate bằng Pydantic
4. Publish kết quả lên RabbitMQ

### LLM Output Schema

```json
{
  "summary": "Tóm tắt hồ sơ ứng viên",
  "desiredTitle": "Full-stack Developer",
  "totalYearsExperience": 3.5,
  "skills": [
    {
      "name": "React.js",
      "proficiencyLevel": "ADVANCED",
      "yearsExperience": 2.5
    },
    {
      "name": "Node.js",
      "proficiencyLevel": "INTERMEDIATE",
      "yearsExperience": 1.5
    },
    {
      "name": "PostgreSQL",
      "proficiencyLevel": "BEGINNER",
      "yearsExperience": 1.0
    }
  ],
  "workExperiences": [
    {
      "companyName": "FPT Software",
      "positionTitle": "Frontend Developer",
      "startDate": "2023-06",
      "endDate": null,
      "isCurrent": true,
      "description": "Phát triển giao diện web app bằng React..."
    }
  ],
  "educations": [
    {
      "schoolName": "Đại học Bách Khoa TP.HCM",
      "major": "Khoa học Máy tính",
      "degree": "Cử nhân",
      "startDate": "2019-09",
      "endDate": "2023-06"
    }
  ],
  "projects": [
    {
      "projectName": "E-commerce Platform",
      "projectRole": "Lead Frontend",
      "description": "Xây dựng nền tảng thương mại điện tử...",
      "technologies": ["React", "Node.js", "PostgreSQL"],
      "projectUrl": "https://github.com/user/project"
    }
  ],
  "certificates": [
    {
      "certificateName": "AWS Solutions Architect Associate",
      "issuingOrganization": "Amazon Web Services",
      "issueDate": "2024-03",
      "expiryDate": "2027-03"
    }
  ]
}
```

### Message publish khi hoàn thành

**Thành công (`resume.analysis.completed`):**
```json
{
  "resumeId": "uuid",
  "candidateProfileId": "uuid",
  "parsedData": { ...schema ở trên... },
  "completedAt": "2026-07-28T09:01:30Z"
}
```

**Thất bại (`resume.analysis.failed`):**
```json
{
  "resumeId": "uuid",
  "candidateProfileId": "uuid",
  "errorMessage": "Unable to extract text from PDF",
  "failedAt": "2026-07-28T09:01:30Z"
}
```

---

## Phase 3: Backend — Result Listener & Profile Hydration

### Cần implement

| File | Nội dung |
|------|----------|
| `backend/src/modules/resumes/resume-result.listener.ts` | RabbitMQ subscriber cho `completed` / `failed` |
| `backend/src/modules/resumes/resume-hydration.service.ts` | Logic upsert data vào DB từ parsed result |

### Logic khi nhận `resume.analysis.completed`

```typescript
async handleAnalysisCompleted(payload: ResumeAnalysisCompletedPayload) {
  const { resumeId, candidateProfileId, parsedData } = payload;

  await prisma.$transaction(async (tx) => {
    // 1. Update Resume status
    await tx.resume.update({
      where: { id: resumeId },
      data: { parsingStatus: 'PARSED' }
    });

    // 2. Save raw parsed data
    await tx.resumeParsedData.upsert({
      where: { resumeId },
      create: {
        resumeId,
        summary: parsedData.summary,
        totalYearsExperience: parsedData.totalYearsExperience,
        educationData: parsedData.educations,
        experienceData: parsedData.workExperiences,
        certificateData: parsedData.certificates,
        projectData: parsedData.projects,
        rawParsedJson: parsedData,
      },
      update: { ...same fields... }
    });

    // 3. Upsert CandidateSkills (source = EXTRACTED, link resumeId)
    for (const skill of parsedData.skills) {
      const dbSkill = await findOrCreateSkill(skill.name);
      await tx.candidateSkill.upsert({
        where: { candidateId_skillId: { candidateId: candidateProfileId, skillId: dbSkill.id } },
        create: {
          candidateId: candidateProfileId,
          skillId: dbSkill.id,
          resumeId,
          proficiencyLevel: skill.proficiencyLevel,
          yearsExperience: skill.yearsExperience,
          source: 'EXTRACTED',
        },
        update: {
          proficiencyLevel: skill.proficiencyLevel,
          yearsExperience: skill.yearsExperience,
          resumeId,
          source: 'EXTRACTED',
        }
      });
    }

    // 4. Upsert WorkExperiences
    // Xóa cũ (từ lần parse trước) rồi tạo mới
    await tx.workExperience.deleteMany({ where: { candidateProfileId } });
    await tx.workExperience.createMany({ data: parsedData.workExperiences.map(...) });

    // 5. Upsert Educations
    await tx.education.deleteMany({ where: { candidateProfileId } });
    await tx.education.createMany({ data: parsedData.educations.map(...) });

    // 6. Upsert Projects
    await tx.project.deleteMany({ where: { candidateProfileId } });
    await tx.project.createMany({ data: parsedData.projects.map(...) });

    // 7. Upsert Certificates
    await tx.certificate.deleteMany({ where: { candidateProfileId } });
    await tx.certificate.createMany({ data: parsedData.certificates.map(...) });

    // 8. Update CandidateProfile
    await tx.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        status: 'READY',
        professionalSummary: parsedData.summary,
        desiredTitle: parsedData.desiredTitle,
      }
    });
  });
}
```

### Logic khi nhận `resume.analysis.failed`

```typescript
async handleAnalysisFailed(payload: ResumeAnalysisFailedPayload) {
  await prisma.resume.update({
    where: { id: payload.resumeId },
    data: {
      parsingStatus: 'FAILED',
      parsingErrorMessage: payload.errorMessage,
    }
  });

  await prisma.candidateProfile.update({
    where: { id: payload.candidateProfileId },
    data: { status: 'FAILED' }
  });
}
```

---

## Phase 4: Frontend — Upload UI

### Cần implement

| File | Nội dung |
|------|----------|
| `frontend/src/lib/candidate-api.ts` | Thêm `uploadResume(token, file)` và `getResumeStatus(token, resumeId)` |
| `frontend/src/components/candidate/resume-upload.tsx` | Component upload: drag-drop, progress, trạng thái parsing |
| Tích hợp vào `profile-form.tsx` | Thay thế placeholder upload hiện tại |

### UX Flow

```
1. User kéo/chọn file (PDF/DOCX, max 5MB)
     │
     ▼
2. Upload lên server → hiển thị progress bar
     │
     ▼
3. Upload xong → hiện trạng thái "Đang phân tích CV..."
   (frontend polling GET /resumes/:id/status mỗi 3 giây)
     │
     ▼
4. Parse thành công (status = PARSED)
   → Auto-refresh trang
   → Hiện thông tin + skill mới được extract
     │
     ▼
5. Nếu FAILED → Hiện thông báo lỗi, cho phép upload lại
```

### API Functions

```typescript
// Upload CV file
export async function uploadResume(token: string, file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/resumes/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// Poll resume parsing status
export async function getResumeStatus(token: string, resumeId: string) {
  const res = await fetch(`${API_URL}/resumes/${resumeId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

---

## Phase 5: Polling / Realtime Status

| Option | Mô tả | Khi nào dùng |
|--------|--------|--------------|
| **A: Polling** | Frontend gọi `GET /resumes/:id/status` mỗi 3s | MVP — đơn giản, không cần setup thêm |
| **B: Supabase Realtime** | Subscribe thay đổi trên table `resumes` | V2 — mượt hơn, giảm request |

**Khuyến nghị:** Dùng Option A cho MVP.

---

## Thứ tự triển khai

| Step | Task | Estimate |
|------|------|----------|
| 1 | Backend: `ResumesController` + `ResumesService` (upload + tạo record + publish queue) | ~2h |
| 2 | AI Service: Text extraction (PyPDF2 + python-docx) | ~1h |
| 3 | AI Service: LLM structured extraction (Gemini prompt + Pydantic validation) | ~2h |
| 4 | AI Service: RabbitMQ worker (consume queue → parse → publish result) | ~1.5h |
| 5 | Backend: Result listener (subscribe completed/failed → hydrate profile) | ~2h |
| 6 | Frontend: Upload component + API integration | ~1.5h |
| 7 | Frontend: Polling status + auto-refresh khi parse xong | ~1h |
| 8 | Testing end-to-end | ~1.5h |

**Tổng ước tính: ~12.5 giờ**

---

## Rủi ro & Mitigation

| Rủi ro | Xác suất | Mitigation |
|--------|----------|------------|
| LLM trả output sai format | Trung bình | Validate bằng Pydantic, retry 1 lần với prompt chặt hơn |
| File CV scan (ảnh, không có text) | Thấp | Thêm OCR layer (Tesseract) hoặc trả lỗi rõ ràng |
| RabbitMQ downtime | Thấp | Graceful fallback: gọi AI Service trực tiếp (sync) nếu queue unavailable |
| Upload file quá lớn/sai format | Thấp | Validate ở cả frontend (client-side) và backend (Multer + StorageService) |
| AI Service timeout (LLM chậm) | Trung bình | Set timeout 60s, retry 1 lần, mark FAILED nếu vẫn fail |

---

## Environment Variables cần thêm

### AI Service (.env)
```
RABBITMQ_URL=amqp://guest:guest@localhost:5672
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
GEMINI_API_KEY=xxx          # hoặc OPENAI_API_KEY
LLM_MODEL=gemini-2.0-flash  # hoặc gpt-4o-mini
```

### Backend (.env) — đã có
```
RABBITMQ_URL=amqp://...     # ✅ đã config
SUPABASE_URL=...            # ✅ đã config
SUPABASE_SECRET_KEY=...     # ✅ đã config
```
