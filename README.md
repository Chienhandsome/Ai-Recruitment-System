# AI Recruitment System

An advanced recruitment system powered by Artificial Intelligence, structured as a clean monorepo. This repository contains the scaffolding for the frontend interface, the core business backend, and a specialized Python-based AI service.

---

## Architecture Overview & Core Services

The system is split into three main components:

1. **Frontend (`/frontend`)**: 
   * Built with **Next.js**, **TypeScript**, and **Tailwind CSS**.
   * Responsible for the user experience, candidate application flows, recruiter dashboards, and resume uploading.
2. **Backend (`/backend`)**:
   * Built with **NestJS**, **TypeScript**, **Prisma ORM**, **Supabase Storage**, and **RabbitMQ client**.
   * Serves as the central gateway orchestrating business rules, authentication, user data, job postings, object storage, event queue management, and serving Swagger documentation.
3. **AI Service (`/ai-service`)**:
   * Built with **FastAPI**, **Pydantic**, and **Uvicorn** using Python.
   * Dedicated engine for parsing CVs, matching profiles, and generating insights using large language models.

---

## Directory Structure

```text
ai-recruitment-system/
├── frontend/                     # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                  # App Router Pages (Home, Layout, CSS)
│   │   ├── components/           # Reusable UI components
│   │   ├── services/             # API request wrappers / hooks communication
│   │   ├── hooks/                # Custom React hooks
│   │   ├── types/                # TS type declarations
│   │   ├── utils/                # Utility helpers
│   │   └── config/               # App configuration files
│   ├── .env.example              # Frontend environment template
│   └── tsconfig.json             # TS Config (Strict mode enabled)
├── backend/                      # NestJS Core Backend API
│   ├── prisma/
│   │   └── schema.prisma         # Prisma Schema (Supabase PostgreSQL)
│   ├── src/
│   │   ├── common/               # Shared guards, interceptors, and filters
│   │   ├── config/               # App configuration schemas
│   │   ├── database/             # Prisma database service & module
│   │   ├── infrastructure/       # Storage (Supabase) & Message Queue (RabbitMQ)
│   │   ├── modules/              # Domain-specific modules (auth, users, jobs, cvs)
│   │   ├── main.ts               # Main bootstrap (global prefix, validation, CORS, Swagger)
│   │   └── app.module.ts         # Root module with Global ConfigModule
│   └── .env.example              # Backend environment template
├── ai-service/                   # FastAPI Python AI Service
│   ├── app/
│   │   ├── api/routes/           # API routes endpoints (health checks, models)
│   │   ├── core/                 # Core configs and settings
│   │   ├── schemas/              # Request/response validation schemas
│   │   ├── services/             # Business services (AI analysis, parsing placeholders)
│   │   ├── workers/              # Background queue processing tasks
│   │   └── main.py               # Main Uvicorn bootstrap & entry point
│   ├── tests/                    # Service tests folder
│   ├── requirements.txt          # Python packages list
│   └── pyproject.toml            # Ruff linter/formatter config
├── infrastructure/               # Infrastructure configs (Docker Compose)
├── documents/                    # Documentation, specifications, and architecture notes
│   ├── infrastructure-supabase.md
│   ├── storage-conventions.md
│   └── week-01-report.md
├── scripts/                      # System-wide helper scripts (RabbitMQ, DB/Storage checks)
├── docker-compose.yml            # Docker Compose configuration (RabbitMQ)
├── .gitignore                    # Monorepo gitignore
├── .env.example                  # Master environment variables template
└── README.md                     # Master Readme (this file)
```

---

## Supabase & Infrastructure Setup (Phase 2)

### 1. Supabase Project Configuration
Follow these steps to obtain real Supabase parameters:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new Supabase Project.
3. In **Project Settings > API**, copy:
   * **Project URL** (`SUPABASE_URL`)
   * **Project Reference**
   * **Publishable Key** (`SUPABASE_PUBLISHABLE_KEY`)
   * **Secret Key** (`SUPABASE_SECRET_KEY`) *(Keep secret!)*
4. In **Project Settings > Database > Connection String**, copy:
   * **Transaction Pooler URL** (`DATABASE_URL` with `pgbouncer=true` on port `6543`).
   * **Direct Connection URL** (`DIRECT_URL` on port `5432`).
5. Create each service environment file from its own template:
   * Root `.env.example` → `.env` for local Docker infrastructure.
   * `frontend/.env.example` → `frontend/.env.local`.
   * `backend/.env.example` → `backend/.env`.
   * `ai-service/.env.example` → `ai-service/.env`.
6. The backend will automatically create the private bucket `resumes` on startup via `SupabaseStorageService.ensureResumeBucket()`.

---

## Infrastructure Component Details

### Database Architecture
```text
NestJS Backend → Prisma ORM (v6.4.0) → Supabase PostgreSQL
```
- Multi-string datasource configured using `DATABASE_URL` (Pooler) and `DIRECT_URL` (Direct).
- Health check executes light `SELECT 1` queries via `PrismaService.checkHealth()`.

### Storage Architecture
```text
Frontend → NestJS Backend → Supabase Storage (Private 'resumes' Bucket)
```
- Bucket is strictly **PRIVATE** (`public: false`).
- Maximum file size: 5 MB (`MAX_RESUME_FILE_SIZE_MB`).
- Permitted MIME types: PDF (`application/pdf`) and DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- Download access uses short-lived **Signed URLs** (`SUPABASE_SIGNED_URL_EXPIRES_IN=300`).

### RabbitMQ Message Broker
```text
RabbitMQ Broker (Local Docker Container)
```
- Managed via `docker-compose.yml`.
- AMQP port: `5672` | Management UI port: `15672`.

---

## Important Local & Service URLs

### Production

* **Frontend**: [https://ai-recruitment-system-test-deploy.vercel.app](https://ai-recruitment-system-test-deploy.vercel.app)
* **NestJS Backend API**: [https://ai-recruitment-system-test-deploy.onrender.com/api](https://ai-recruitment-system-test-deploy.onrender.com/api)
* **System Health Check**: [https://ai-recruitment-system-test-deploy.onrender.com/api/health](https://ai-recruitment-system-test-deploy.onrender.com/api/health)

### Local

* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **NestJS Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
* **System Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
* **Swagger Documentation**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
* **RabbitMQ Management UI**: [http://localhost:15672](http://localhost:15672) *(Credentials: guest / guest)*
* **AI Service (FastAPI)**: [http://localhost:8000](http://localhost:8000)
* **Supabase Dashboard**: Accessible directly via your Supabase account.

---

## Security Warnings

> [!CAUTION]
> 1. **NEVER** expose or pass `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) to the Next.js frontend app. It must remain strictly in backend environment variables.
> 2. **NEVER** commit `.env` files or secret credentials to Git.
> 3. **DO NOT** toggle the `resumes` bucket to public mode.
> 4. **DO NOT** store signed URLs in the database permanently because they expire.
> 5. **DO NOT** use default development passwords (`guest` / `postgres`) in production.

---

## Setup & Running Instructions

Each component owns its environment variables. Do not move backend secrets into the
root or frontend environment files.

### 1. Prerequisites
* **Node.js** (v18+ recommended) & `npm`
* **Python** (v3.10+)
* **Docker Desktop** (for RabbitMQ container)

### 2. Running RabbitMQ
Start the RabbitMQ container via script or Docker Compose:
```bash
# Using PowerShell script (Windows)
.\scripts\start-rabbitmq.ps1

# Or using Docker Compose directly
docker compose up -d rabbitmq
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### 5. AI Service Setup
```bash
cd ai-service
# Khởi tạo môi trường ảo (Windows)
py -m venv venv
.\venv\Scripts\activate

# Cài đặt thư viện
pip install -r requirements.txt

# [QUAN TRỌNG] Đăng nhập Hugging Face (Chỉ cần thiết nếu Model của bạn để Private)
# Chạy lệnh dưới đây và nhập Access Token (Write/Read) của bạn:
huggingface-cli login

# Khởi chạy AI Service (Sẽ mất vài phút ở lần đầu tiên để tải mô hình Embedding ~500MB từ HF Hub)
python app/main.py
```

---

## Project Status

### Completed in Phase 1:
- Monorepo folder organization, root config, and Next.js / NestJS / FastAPI scaffolding.

### Completed in Phase 2:
- Supabase PostgreSQL setup with Prisma ORM (`schema.prisma`, `PrismaService`, `PrismaModule`).
- Supabase Storage setup with private `resumes` bucket (`SupabaseStorageService`, dev test endpoints).
- RabbitMQ setup via Docker Compose and NestJS client (`RabbitMQService`).
- Aggregated system-wide health check at `GET /api/health`.
- Infrastructure scripts (`scripts/start-rabbitmq.ps1`, `check-supabase-database.js`, `check-supabase-storage.js`, `check-infrastructure.js`).
- Documentation files in `documents/`.

### Out of Scope (Phase 3+ Roadmap):
- Full Prisma ERD schema (Users, Roles, Jobs, Applications).
- Database migrations (`npx prisma migrate dev`) & seeding.
- Authentication & Authorization (JWT, Role Guards).
- Complete recruitment business workflows & AI processing.
