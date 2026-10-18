<div align="center">

# 🧠 CogniHire

### *Next-Generation AI-Augmented SME Recruitment Engine*

[![Build & Tests](https://img.shields.io/badge/Build%20%26%20Tests-100%25%20Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/Mustafa-Hazard/CogniHire)
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

**CogniHire** is an intelligent, full-stack recruitment platform engineered specifically to eliminate the slowest bottlenecks in SME (Small and Medium Enterprise) hiring.

In traditional SME recruitment, HR teams waste dozens of hours writing job listings, manually reading CVs, preparing generic interview questions, and drafting offer letters. **CogniHire automates these tasks with an integrated Google Gemini 1.5 Flash AI Engine**, while enforcing a strict **multi-tenant role-based pipeline**, real-time **WebSocket updates**, and complete **data privacy compliance**.

---

## ✨ Key Features & Capabilities

```
                      ┌──────────────────────────────────────────────┐
                      │       CogniHire Recruitment Lifecycle        │
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

CogniHire encapsulates all LLM interactions inside a decoupled `AiProxyModule` using a zero-lock-in `AiProvider` interface:

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
cognihire/
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
- **Node.js** >= 18.x
- **MongoDB** >= 15.x *(or Docker)*
- **Google Gemini API Key** *(Free tier available at [Google AI Studio](https://ai.google.dev))*

---

### Option A: Quick Start with Docker Compose 🐳

```bash
# 1. Clone the repository
git clone https://github.com/Mustafa-Hazard/CogniHire.git
cd CogniHire

# 2. Configure Backend Environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY

# 3. Start MongoDB and Backend Containers
docker compose up -d

# 4. In a second terminal, start Frontend
cd frontend
npm install
npm run dev
```

---

### Option B: Local Native Setup (Without Docker) 💻

```bash
# 1. Start Local MongoDB Service & Create Database
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE cognihire;"
sudo -u postgres psql -c "CREATE USER cognihire WITH PASSWORD 'cognihire';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cognihire TO cognihire;"
sudo -u postgres psql -d cognihire -c "GRANT ALL ON SCHEMA public TO cognihire;"

# 2. Start Backend
cd backend
npm install
npm run seed
npm run start:dev

# 3. Start Frontend (New Terminal Window)
cd frontend
npm install
npm run dev
```

The application will be running at:
- 🌐 **Frontend Application:** `http://localhost:5173`
- ⚙️ **Backend REST API:** `http://localhost:3000`
- 📚 **Interactive Swagger API Docs:** `http://localhost:3000/api`

---

## 🧪 Testing & Quality Assurance

CogniHire features comprehensive unit, controller, and E2E test suites with 100% pass rates:

```bash
# Run backend unit & integration tests (145 passing tests)
cd backend
npm run test

# Run tests with coverage report
npm run test:cov

# Run backend & frontend linters
cd backend && npm run lint
cd frontend && npm run lint
```

---

## 📚 Documentation Vault

Detailed system design and compliance specifications are located in `/docs`:

- 📊 **[Entity Relationship Diagram (docs/ER_DIAGRAM.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/ER_DIAGRAM.md):** Complete MongoDB database schema.
- 🔌 **[API Contract Specification (docs/API_CONTRACT.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/API_CONTRACT.md):** REST endpoints, headers, and response payloads.
- 🤖 **[AI Integration & Prompt Engineering Report (docs/AI_INTEGRATION_REPORT.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/AI_INTEGRATION_REPORT.md):** Prompt iteration logs and JSON schema enforcement.
- 📝 **[Engineering Build Log (docs/BUILD_LOG.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/BUILD_LOG.md):** Architecture decision record and phase progression.
- 🛡️ **[Data Privacy & GDPR Policy (docs/DATA_PRIVACY.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/DATA_PRIVACY.md):** Candidate CV text handling & data security policies.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">

**Built with ❤️ by [Mustafa Muhammad Iqbal](https://github.com/Mustafa-Hazard)**

</div>
