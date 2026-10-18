<div align="center">

# 🧠 ShortList

Formerly CogniHire.

### *Next-Generation AI-Augmented SME Recruitment Engine*

[![Build & Tests](https://img.shields.io/badge/Build%20%26%20Tests-100%25%20Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/Mustafa-Hazard/ShortList)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%20v10-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%20v18%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20v5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%207.0-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

[Overview](#-overview) •
[Key Features](#-key-features) •
[AI Engine Architecture](#-ai-engine-architecture) •
[System Architecture](#-system-architecture--monorepo-layout) •
[RBAC Matrix](#-role-based-access-control-rbac-matrix) •
[Getting Started](#-getting-started) •
[API & Swagger](#-api-documentation--swagger) •
[Documentation Vault](#-documentation-vault)

</div>

---

## 📖 Overview

**ShortList** is an intelligent, full-stack recruitment platform engineered specifically to eliminate the slowest bottlenecks in SME (Small and Medium Enterprise) hiring.

In traditional SME recruitment, HR teams waste dozens of hours writing job listings, manually reading CVs, preparing generic interview questions, and drafting offer letters. **ShortList automates these tasks with an integrated Google Gemini 1.5 Flash AI Engine**, while enforcing a strict **multi-tenant role-based pipeline**, real-time **WebSocket updates**, and complete **data privacy compliance**.

---

## ✨ Key Features & Capabilities

```
                      ┌──────────────────────────────────────────────┐
                      │       ShortList Recruitment Lifecycle        │
                      └──────────────────────┬───────────────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      │                  │                   │                   │                  │
      ▼                  ▼                   ▼                   ▼                  ▼
┌───────────┐      ┌───────────┐       ┌───────────┐       ┌───────────┐      ┌───────────┐
│  APPLIED  │ ───► │ SCREENED  │  ───► │SHORTLISTED│  ───► │ INTERVIEW │ ───► │   OFFER   │
└───────────┘      └───────────┘       └───────────┘       └───────────┘      └───────────┘
      │                  │                   │                   │                  │
   PDF CV             AI Match          Role-Guarded         AI Question         AI Offer
 Upload &            Scorer &           Recruiter &           Suggester            Letter
 Extraction         Extraction          HM Review             & Schedule          Drafter
```

### 🤖 1. AI-Augmented HR Workflows (Google Gemini 1.5 Flash)
- 📝 **AI Job Description Generator:** Generates structured, bias-free job descriptions containing role summaries, key responsibilities, and skill requirements from minimal inputs.
- 🎯 **CV Parser & Match Scorer (0–100):** Extracts plain text from candidate CV PDFs using `pdf-parse` and evaluates skill fit against job criteria, producing an objective score, candidate strengths, and identified skill gaps.
- 💡 **Tailored Interview Question Suggester:** Generates candidate-specific technical, behavioral, and system design questions targeting candidate skill gaps, complete with *"what to listen for"* evaluation signals.
- ✉️ **Automated Offer Letter Drafter:** Drafts personalized, formal job offer letters incorporating candidate names, salaries, start dates, and benefits.

### 🛡️ 2. Multi-Tenant Governance & Security
- 🔐 **Role-Guarded Authorization:** Strict global `JwtAuthGuard` and `@Roles()` guards protecting backend routes across 4 distinct roles: **Admin**, **Recruiter**, **Hiring Manager**, and **Candidate**.
- 🔑 **Server-Side Session Revocation:** Hashed refresh token persistence (`refreshTokenHash`) in MongoDB ensuring instantaneous session revocation upon logout.

### ⚡ 3. Real-Time Pipeline Collaboration
- 📡 **Socket.io WebSockets:** Live event gateway emitting instant notifications across user dashboards when application stages transition (`APPLIED` → `SCREENED` → `SHORTLISTED` → `INTERVIEW` → `OFFER` → `HIRED`/`REJECTED`).

---

## 🧠 AI Engine Architecture

ShortList encapsulates all LLM interactions inside a decoupled `AiProxyModule` using a zero-lock-in `AiProvider` interface:

```text
               ┌───────────────────────────────────────────────────┐
               │                NestJS Service Layer               │
               │   (JdGenerator / CvScorer / QuestionSuggester)   │
               └─────────────────────────┬─────────────────────────┘
                                         │
                                         ▼
               ┌───────────────────────────────────────────────────┐
               │           AiProxyService (Resilience Proxy)       │
               │  - Exponential Backoff Retries (3 Attempts)       │
               │  - Structured JSON Regex Sanitization             │
               │  - Degrade-Don't-Block Fallback Defaults           │
               └─────────────────────────┬─────────────────────────┘
                                         │
                                         ▼
               ┌───────────────────────────────────────────────────┐
               │              AiProvider (Interface)               │
               └──────────┬─────────────────────────────┬──────────┘
                          │                             │
                          ▼                             ▼
            ┌───────────────────────────┐  ┌─────────────────────────┐
            │  Google Gemini Provider   │  │  OpenAI / Claude Provider│
            │  (gemini-1.5-flash API)   │  │  (One-File Swap Ready)  │
            └───────────────────────────┘  └─────────────────────────┘
```

---

## 🏗️ System Architecture & Monorepo Layout

```text
shortlist/
├── backend/                      # NestJS v10 REST & WebSocket API Engine
│   ├── src/
│   │   ├── ai-proxy/             # Gemini 1.5 LLM Integration & Provider Proxy
│   │   ├── applications/         # Hiring Pipeline State Machine & CV Scorer
│   │   ├── auth/                 # JWT Authentication & RBAC Guards
│   │   ├── companies/            # Multi-tenant Company Management
│   │   ├── cv/                   # PDF Upload & Server-side Text Extraction
│   │   ├── interviews/           # Interview Scheduling & AI Question Suggester
│   │   ├── jobs/                 # Job Posting CRUD & AI JD Generator
│   │   ├── notifications/        # WebSocket Gateway (Socket.io)
│   │   ├── offers/               # Offer Management & AI Letter Drafter
│   │   └── users/                # User Management & Role Access
│   ├── test/                     # Jest E2E & Integration Test Suites
│   └── Dockerfile                # Multi-stage Backend Container Dockerfile
│
├── frontend/                     # React 18 + TypeScript Client (Vite)
│   ├── src/
│   │   ├── api/                  # Axios HTTP Client & API Interceptors
│   │   ├── components/           # Reusable UI Design System & Cards
│   │   ├── pages/                # Admin, Recruiter, HM & Candidate Dashboards
│   │   └── store/                # Zustand Auth & Application State
│   └── vite.config.ts            # Vite Bundler & Dev Server Config
│
├── docs/                         # Architecture & Compliance Vault
│   ├── AI_INTEGRATION_REPORT.md  # Detailed Prompt Engineering & AI Architecture
│   ├── API_CONTRACT.md           # REST Endpoint Contracts & Payload Schemas
│   ├── BUILD_LOG.md              # Chronological Engineering Decision History
│   ├── DATA_PRIVACY.md           # GDPR & Resume Data Privacy Policies
│   └── ER_DIAGRAM.md             # MongoDB Entity Relationship Model
│
└── docker-compose.yml            # Multi-Container Orchestration (MongoDB + Backend)
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Feature / Action | Candidate | Hiring Manager | Recruiter | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Published Jobs** | 👁️ Public | 👁️ Company | 👁️ Company | ⚡ All |
| **Apply for Job & Upload CV** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Generate AI Job Description** | ❌ No | ✅ Yes | ✅ Yes | ⚡ All |
| **Screen CV & AI Match Scoring** | ❌ No | 👁️ Read-Only | ✅ Trigger/Manage | ⚡ All |
| **Schedule Interview & AI Questions** | ❌ No | ✅ Assigned | ✅ Full Control | ⚡ All |
| **Draft & Issue AI Offer Letter** | ❌ No | 👁️ Review | ✅ Draft & Issue | ⚡ All |
| **Manage Tenant & System Users** | ❌ No | ❌ No | ❌ No | ⚡ Admin Only |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x (v22 recommended)
- **Docker & Docker Compose** (recommended) or **MongoDB** >= 7.0
- **Google Gemini API Key** *(Optional: system includes a built-in mock provider for local development/testing)*

---

### Screenshot & Interface Preview

```
+-------------------------------------------------------------------------------+
|  SHORTLIST // TRANSIT STAGE CONTROL                                           |
|  [Dashboard] [Job Postings] [Candidates] [Applications] [Interviews] [Offers]  |
|                                                                               |
|  Pipeline: APPLIED ===> SCREENING ===> INTERVIEW ===> OFFER ===> HIRED        |
|  CV Match Score: 88% | Skills: TypeScript, NestJS, MongoDB, React, Docker    |
|                                                                               |
|  [Screenshot Placeholder: UI / Candidate Kanban Board & Real-Time Transit]    |
+-------------------------------------------------------------------------------+
```

---

### Option A: Quick Start with Hardened Docker Compose 🐳 (Recommended)

ShortList runs fully containerized under non-root users (`USER node`) with read-only filesystems and dropped privileges:

```bash
# 1. Clone repository
git clone https://github.com/Mustafa-Hazard/ShortList.git
cd ShortList

# 2. Configure environment with secure secrets
cp .env.example .env

# 3. Start all services in detached mode
docker compose up --build -d

# 4. Confirm containers are healthy and running as non-root (UID 1000)
docker compose ps
docker compose exec backend id
```

The application will be live at:
- 🌐 **Frontend Application:** `http://localhost:5173`
- ⚙️ **Backend REST API:** `http://localhost:3000/api`
- 📚 **Swagger API Documentation:** `http://localhost:3000/api/docs`
- 🩺 **Health Check:** `http://localhost:3000/api/health`

> **Note on MongoDB Network Isolation:** In the default `docker-compose.yml`, MongoDB is strictly isolated on the internal container bridge network and is not exposed to the host machine. To bind MongoDB to `127.0.0.1:27017` for local administration, run with the development overlay:
> ```bash
> docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
> ```

---

### Option B: Local Native Setup (Without Docker) 💻

```bash
# 1. Start Local MongoDB (running on default port 27017)
# Ensure MongoDB daemon is running locally:
mongod --dbpath /var/lib/mongodb

# 2. Configure Backend Environment
cp backend/.env.example backend/.env
# Verify JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are at least 32 characters long

# 3. Install & Start Backend
cd backend
npm ci
npm run seed
npm run start:dev

# 4. Install & Start Frontend (in a separate terminal)
cd ../frontend
npm ci
npm run dev
```

---

## 🔐 Environment Variables

| Variable | Description | Default / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | `production` / `development` / `test` |
| `PORT` | Backend HTTP listening port | `3000` |
| `MONGODB_URI` | Full MongoDB connection string | Required (`mongodb://user:pass@host:27017/db`) |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | Required (min 32 characters, fail-fast on startup) |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Required (min 32 characters, fail-fast on startup) |
| `JWT_ACCESS_EXPIRES_IN`| Lifetime of access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Lifetime of refresh token | `7d` |
| `CORS_ORIGIN` | Allowed web origins (comma-separated) | `http://localhost:5173` |
| `AI_PROVIDER` | AI Engine driver selection | `mock` or `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | Required if `AI_PROVIDER=gemini` |
| `GEMINI_MODEL` | Gemini LLM model identifier | `gemini-1.5-flash` |
| `MAX_CV_SIZE_MB` | Maximum CV upload size limit | `5` (enforced at gateway and parser) |
| `UPLOAD_DIR` | Temporary upload storage path | `/app/uploads/cvs` |

---

## 🛡️ Security Architecture & Hardening

ShortList has undergone extensive security hardening and verification:

1. **Non-Root & Principle of Least Privilege Containers:**
   - Both backend and frontend Dockerfiles employ multi-stage builds on pinned Alpine base images (`node:22-alpine3.24`, `mongo:7.0.14`).
   - Run strictly as non-root user `node` (`uid=1000 gid=1000`).
   - Dropped all Linux capabilities (`cap_drop: [ALL]`), `security_opt: [no-new-privileges:true]`, and read-only container filesystems with scoped tmpfs mounts.
2. **NoSQL Injection Defense:**
   - Custom middleware (`NoSqlSanitizeMiddleware`) recursively validates all incoming request bodies, queries, and URL parameters, actively stripping or rejecting keys beginning with `$` or containing dotted notation.
3. **Helmet Security Headers & Strict CORS:**
   - Helmet enforces strict HTTP response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
   - Strict CORS allow-list prevents unauthorized cross-origin requests, specifically prohibiting credentialed wildcards (`*`).
4. **Adaptive Rate Limiting:**
   - Global rate limiter via `@nestjs/throttler` (100 req/min default).
   - Stricter burst rate limits on authentication endpoints (`/api/auth/login`, `/api/auth/register`) set to 5 req/min to protect against brute-force attacks.
5. **CV File Upload Protection:**
   - Multi-layer defense: size limit (5MB), MIME type check (`application/pdf`), and binary magic byte inspection (`%PDF-` header check).
   - Instant unlinking of invalid or non-PDF files to prevent persistence of malicious payloads.
   - Filename sanitization stripping directory traversal (`../`) and control characters.
6. **Object-Level Authorization (BOLA Prevention):**
   - Candidate users cannot access, view, or download other candidates' applications, CVs, or offer letters (verified via strict ownership and stage checks returning 404).
7. **WebSocket Isolation:**
   - Socket.IO gateway connection is protected by JWT authentication.
   - Enforced room isolation: clients are restricted to subscribing only to their own private notifications (`user:<id>`).
8. **Information Leakage Prevention:**
   - Global `HttpExceptionFilter` intercepts unhandled exceptions in production, returning sanitized 500 responses without leaking database error strings or stack traces.
9. **Automated Secret Scanning & Dependency Audits:**
   - Full repository and git commit history scanned via `gitleaks` (0 secrets found across 51 commits).
   - Automated CI workflow with CodeQL static analysis, Dependabot weekly updates, and `npm audit --audit-level=high`.

---

## 🧪 Testing & Quality Assurance

ShortList features comprehensive unit, controller, and integration test suites:

```bash
# Run backend tests (24 suites, 133 tests passing)
cd backend
npm test

# Run linter
npm run lint

# Build production bundle
npm run build

# Run frontend build and type-check
cd ../frontend
npm run build
```

---

## 📚 Documentation Vault

Detailed system design and compliance specifications are located in `/docs`:

- 📊 **[Entity Relationship Diagram (docs/ER_DIAGRAM.md)](file://docs/ER_DIAGRAM.md):** Complete MongoDB database schema.
- 🔌 **[API Contract Specification (docs/API_CONTRACT.md)](file://docs/API_CONTRACT.md):** REST endpoints, headers, and response payloads.
- 🤖 **[AI Integration & Prompt Engineering Report (docs/AI_INTEGRATION_REPORT.md)](file://docs/AI_INTEGRATION_REPORT.md):** Prompt iteration logs and JSON schema enforcement.
- 📝 **[Engineering Build Log (docs/BUILD_LOG.md)](file://docs/BUILD_LOG.md):** Architecture decision record and phase progression.
- 🛡️ **[Data Privacy & GDPR Policy (docs/DATA_PRIVACY.md)](file://docs/DATA_PRIVACY.md):** Candidate CV text handling & data security policies.

---

## 📜 License


This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
