# SmartRecruit AI

SmartRecruit AI is an AI-assisted recruitment platform for candidates, recruiters, and administrators. The monorepo combines a Vietnamese Next.js web application, a NestJS business API, and a Python AI service for asynchronous resume parsing and candidate-job matching.

## Current capabilities

- Supabase authentication with email/password, email OTP, password recovery, and Google OAuth.
- Role-based access for `CANDIDATE`, `RECRUITER`, and `ADMIN` accounts.
- Candidate profile and skill management, public job browsing, and job detail pages.
- Resume upload to private Supabase Storage (`PDF` or `DOCX`, up to 5 MB).
- Asynchronous resume parsing through RabbitMQ, including retry/dead-letter handling, Gemini extraction, OCR fallback for scanned PDFs, and profile hydration.
- Recruiter profile, dashboard statistics, and job posting CRUD/status management.
- Admin dashboards for users, jobs, skills, aliases, and unrecognized skills.
- Candidate-job evaluation by skills, experience, education, and projects.
- Prisma schema and migrations for the broader recruitment domain.

> [!NOTE]
> Applications, screenings, interviews, and notifications have database models/module scaffolding but are not yet complete end-to-end workflows. Some public landing-page content still uses mock data; authenticated candidate job browsing uses the backend API.

## Architecture

```mermaid
flowchart LR
    USER["Candidate / Recruiter / Admin"] --> WEB["Next.js frontend"]
    WEB --> AUTH["Supabase Auth"]
    WEB --> API["NestJS API"]
    API --> DB["Supabase PostgreSQL"]
    API --> STORAGE["Private Supabase Storage"]
    API -- "resume.analysis.requested" --> MQ["RabbitMQ"]
    MQ --> WORKER["Python resume worker"]
    WORKER --> STORAGE
    WORKER --> GEMINI["Gemini API"]
    WORKER -- "completed / failed" --> MQ
    MQ -- "result events" --> API
    API -. "health check" .-> AIHTTP["FastAPI matching service"]
```

The Python service has two separate processes:

- The FastAPI process exposes health and matching endpoints.
- The RabbitMQ worker downloads resumes, parses them, calls Gemini, and publishes result events for the backend to persist.

## Technology stack

| Layer | Main technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase SSR, React Hook Form, Zod |
| Backend | NestJS 11, TypeScript, Prisma 6, Supabase, RabbitMQ, Swagger |
| AI service | FastAPI, Pydantic, Google GenAI, pypdf, python-docx, Tesseract OCR, RapidFuzz |
| Infrastructure | Supabase PostgreSQL/Auth/Storage, RabbitMQ, Docker Compose |

## Repository structure

```text
.
|-- frontend/                 # Next.js application and role-based dashboards
|   `-- src/
|       |-- app/              # App Router pages and route handlers
|       |-- components/       # UI and feature components
|       `-- lib/              # API clients and Supabase helpers
|-- backend/                  # NestJS REST API
|   |-- prisma/               # Schema, migrations, and seed data
|   `-- src/
|       |-- database/         # Prisma integration
|       |-- infrastructure/   # RabbitMQ and Supabase Storage
|       `-- modules/          # Auth and recruitment domains
|-- ai-service/               # FastAPI app and resume worker
|   |-- app/
|   |   |-- domain/resume/    # Resume parsing pipeline
|   |   |-- services/matching/# Candidate-job scoring engine
|   |   `-- transport/        # RabbitMQ consumer/publisher
|   `-- tests/                # Unit, integration, property, regression, performance
|-- docs/                     # Resume pipeline architecture and plans
|-- documents/                # Database, storage, and Supabase Auth guides
|-- scripts/                  # Local infrastructure helpers
`-- docker-compose.yml        # RabbitMQ for local development
```

## Prerequisites

- Node.js 20+ and npm.
- Python 3.10+.
- Docker Desktop or another Docker Compose-compatible runtime.
- A Supabase project.
- A Gemini API key for resume extraction.
- Optional for scanned-PDF OCR: Poppler and Tesseract installed and available on `PATH`.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/Chienhandsome/Ai-Recruitment-System.git
cd Ai-Recruitment-System
```

### 2. Configure Supabase

Create a Supabase project, then collect:

- Project URL and publishable key.
- Server-side secret/service-role key.
- Transaction Pooler URL for `DATABASE_URL`.
- Direct or Session Pooler URL on port `5432` for `DIRECT_URL` and migrations.

Configure the authentication site URL, redirect URLs, email provider, and Google OAuth provider by following [documents/supabase-auth-setup.md](documents/supabase-auth-setup.md).

### 3. Start RabbitMQ

The Docker Compose defaults are `guest` / `guest` and should only be used locally.

```bash
docker compose up -d rabbitmq
```

Windows PowerShell users can instead run:

```powershell
.\scripts\start-rabbitmq.ps1
```

RabbitMQ will listen on `localhost:5672`; its management UI is available at [http://localhost:15672](http://localhost:15672).

### 4. Configure and start the backend

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Update `backend/.env` before running migrations. The checked-in template documents all backend variables; the minimum full-stack configuration is:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_SITE_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<server-side-secret-key>
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json

DATABASE_URL=<transaction-pooler-url>
DIRECT_URL=<direct-or-session-pooler-url-on-port-5432>

SUPABASE_STORAGE_BUCKET=resumes
SUPABASE_SIGNED_URL_EXPIRES_IN=300
MAX_RESUME_FILE_SIZE_MB=5
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 5. Configure and start the AI service

From `ai-service`, create `.env` with:

```env
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=8000
RABBITMQ_URL=amqp://guest:guest@localhost:5672

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>
SUPABASE_STORAGE_BUCKET=resumes

GEMINI_API_KEY=<gemini-api-key>
LLM_MODEL=gemini-2.5-flash
RESUME_PROMPT_VERSION=2.0
RESUME_PARSER_VERSION=2.0
```

Install the Python dependencies:

```powershell
cd ai-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start the HTTP API and resume worker in separate terminals:

```powershell
# Terminal 1: FastAPI
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: RabbitMQ worker
python worker_main.py
```

### 6. Configure and start the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Then start Next.js:

```bash
cd frontend
npm ci
npm run dev
```

## Local endpoints

| Service | URL |
| --- | --- |
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:3001/api](http://localhost:3001/api) |
| Backend health | [http://localhost:3001/api/health](http://localhost:3001/api/health) |
| Swagger UI | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) |
| AI service | [http://localhost:8000](http://localhost:8000) |
| AI service docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Matching endpoint | `POST http://localhost:8000/api/v1/matching/evaluate` |
| RabbitMQ management | [http://localhost:15672](http://localhost:15672) |

Configured deployments:

- Frontend: [https://ai-recruitment-system-test-deploy-1.vercel.app](https://ai-recruitment-system-test-deploy-1.vercel.app)
- Backend: [https://ai-recruitment-system-test-deploy.onrender.com/api](https://ai-recruitment-system-test-deploy.onrender.com/api)

## First administrator

After migrations and seeding, create a user in Supabase Authentication, copy its UUID, and run this from `backend`:

```powershell
$env:ADMIN_USER_ID="<supabase-auth-user-uuid>"
npm run auth:bootstrap-admin
Remove-Item Env:ADMIN_USER_ID
```

The bootstrap script verifies the Supabase user, creates the application user, assigns the `ADMIN` role, and writes an audit log. Existing admins can invite additional admins through the protected API.

## Testing and quality checks

Run each command from the corresponding service directory.

```bash
# Backend
cd backend
npm test
npm run test:e2e
npm run build

# Frontend
cd ../frontend
npm run lint
npm run build

# AI service
cd ../ai-service
python -m pytest tests -m "not slow"
python -m ruff check app tests
```

With all local services running, check the aggregated infrastructure status:

```bash
node scripts/check-infrastructure.js
```

## Resume processing flow

1. An authenticated candidate uploads a PDF or DOCX resume to `POST /api/resumes/upload`.
2. The backend validates the file, stores it in the private `resumes` bucket, creates a database record, and publishes a RabbitMQ event.
3. The Python worker validates the real file type, extracts text (with OCR fallback where available), and asks Gemini for structured resume data.
4. The worker publishes either a completed or failed result. Transient errors are retried; exhausted/permanent failures are dead-lettered.
5. The backend consumes the result and hydrates the candidate profile, skills, experience, education, projects, and certificates.

See [docs/cv-parse-pipeline-architecture.md](docs/cv-parse-pipeline-architecture.md) for the detailed design.

## Security notes

> [!CAUTION]
> - Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or database credentials to the frontend.
> - Never commit `.env` or `.env.local` files.
> - Keep the `resumes` storage bucket private and use short-lived signed URLs.
> - Do not persist signed URLs; they expire.
> - Replace RabbitMQ default credentials outside local development.
> - Use a dedicated SMTP provider and restricted production redirect URLs before a production launch.

## Additional documentation

- [Database schema](documents/database-schema.md)
- [Database conventions](documents/database-conventions.md)
- [Storage conventions](documents/storage-conventions.md)
- [Supabase infrastructure](documents/infrastructure-supabase.md)
- [Supabase Auth setup](documents/supabase-auth-setup.md)
- [CV parsing architecture](docs/cv-parse-pipeline-architecture.md)
- [CV parsing improvement plan](docs/cv-parse-pipeline-improvement-plan.md)
