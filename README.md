# 🌉 TalentBridge

<div align="center">

![TalentBridge Banner](https://img.shields.io/badge/TalentBridge-AI--Augmented%20Recruitment-indigo?style=for-the-badge&logo=rocket)

**Next-Generation AI-Augmented SME Recruitment Platform**

[![NestJS](https://img.shields.io/badge/Backend-NestJS%20v10-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%20v18%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%20v6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeORM](https://img.shields.io/badge/ORM-TypeORM%20v1.0-FE0803?style=flat-square&logo=typeorm)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google-gemini)](https://ai.google.dev/)
[![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-010101?style=flat-square&logo=socketdotio)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

[Key Features](#-key-features) •
[Architecture](#-architecture--monorepo-structure) •
[Tech Stack](#-tech-stack) •
[AI Engine](#-ai-layer--prompt-engineering) •
[Getting Started](#-getting-started) •
[API & Swagger](#-api-documentation--swagger) •
[Docs Index](#-project-documentation)

</div>

---

## 📖 Overview

**TalentBridge** is a full-stack, enterprise-grade hiring platform designed specifically for Small and Medium Enterprises (SMEs). Hiring in SMEs is often slowed down by manual resume screening, generic interview prep, and disjointed offer letter drafting. 

TalentBridge accelerates and standardizes every phase of the hiring lifecycle using an **AI-augmented pipeline**, robust **Role-Based Access Control (RBAC)**, and **real-time WebSocket updates** — while ensuring human-in-the-loop auditability and data privacy.

---

## ✨ Key Features

### 🤖 1. AI-Powered Recruitment Engine
- **AI Job Description Generator:** Automatically crafts structured, inclusive, and role-tailored job descriptions from minimal inputs (Title, Department, Skills).
- **CV Parser & Match Scorer:** Server-side PDF parsing (`pdf-parse`) and LLM evaluation producing an objective score (0–100), key candidate extractions, candidate strengths, and identified skill gaps.
- **Tailored Interview Question Suggester:** Generates domain-specific technical, behavioral, and system design interview questions directly targeting each candidate's identified skill gaps, complete with "what to listen for" candidate evaluation signals.
- **Automated Offer Letter Drafter:** Drafts personalized, compliant, and professional job offer letters incorporating candidate-specific details, role titles, start dates, and compensation packages.

### 👥 2. Enterprise Governance & Multi-Tenant Pipeline
- **Role-Guarded Portals:** Tailored user interfaces and strict API guards (`JwtAuthGuard`, `RolesGuard`) for **Admins**, **Recruiters**, **Hiring Managers**, and **Candidates**.
- **Kanban Candidate Pipeline:** Stage transitions (`APPLIED` → `SCREENED` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `OFFER` → `HIRED` / `REJECTED`) with automated triggers and cached AI scores.
- **Secure File Uploads & Extraction:** PDF processing with size/type validation, disk persistence, and text extraction for resume evaluation.

### ⚡ 3. Real-Time Collaboration & Analytics
- **Live Notifications:** WebSocket gateway (`Socket.io`) broadcasting candidate stage shifts, interview reminders, and pipeline events instantly across team dashboards.
- **Admin & HR Analytics:** Visual dashboards offering metrics on candidate funnel conversion, hiring velocity, AI score distribution, and role activity.

---

## 🏗️ Architecture & Monorepo Structure

```text
talentbridge/
├── backend/                  # NestJS 10 REST & WebSocket API Gateway
│   ├── src/
│   │   ├── ai-proxy/         # AI Proxy Module (Google Gemini 1.5 Integration)
│   │   ├── applications/     # Candidate Application & State Machine Logic
│   │   ├── auth/             # JWT Authentication & Role-Based Access Control
│   │   ├── companies/        # Tenant & SME Company Management
│   │   ├── cv/               # PDF Parsing & Resume Management
│   │   ├── interviews/       # Scheduling & AI Question Suggestion
│   │   ├── jobs/             # Job Posting Management & AI Description Generation
│   │   ├── notifications/    # WebSocket Gateway & Notification Service
│   │   ├── offers/           # Offer Management & AI Draft Generation
│   │   └── users/            # Account Management & User Roles
│   ├── test/                 # E2E & Integration Test Suites
│   └── Dockerfile            # Production Multi-stage Container Dockerfile
│
├── frontend/                 # React 18 + TypeScript Client Application (Vite)
│   ├── src/
│   │   ├── api/              # Axios HTTP Clients & API Interceptors
│   │   ├── components/       # Reusable UI Design System & Cards
│   │   ├── pages/            # Role-Based Dashboard Views & Portals
│   │   └── store/            # State Management (Zustand)
│   └── vite.config.ts        # Vite Bundler Configuration
│
├── docs/                     # System Design & Governance Documentation
│   ├── AI_INTEGRATION_REPORT.md  # Detailed Prompt Engineering & AI Architecture
│   ├── API_CONTRACT.md           # Comprehensive REST Endpoint Contracts
│   ├── BUILD_LOG.md              # Chronological Engineering Decision Log
│   ├── DATA_PRIVACY.md           # GDPR & Privacy Compliance Specification
│   └── ER_DIAGRAM.md             # Complete Database Entity Relationship Model
│
└── docker-compose.yml        # Orchestration for Database & Backend Services
```

---

## 🛠️ Tech Stack

### **Frontend**
| Library / Technology | Description |
| :--- | :--- |
| **React v18** | UI component architecture with strict functional patterns |
| **TypeScript** | End-to-end static type safety |
| **Vite v6** | Next-generation instant development & build server |
| **React Router v6** | Declarative client-side routing & route guards |
| **Zustand** | Lightweight, high-performance global state management |
| **Lucide React** | Modern iconography design system |
| **Socket.io Client** | Real-time WebSocket channel communication |

### **Backend**
| Component / Library | Description |
| :--- | :--- |
| **NestJS v10** | Enterprise Node.js framework with modular architecture |
| **TypeORM v1.0** | Robust ORM for PostgreSQL with migration support |
| **PostgreSQL 15** | Relational database engine |
| **Passport JWT** | Secure access token & refresh token session control |
| **Swagger / OpenAPI** | Auto-generated interactive REST API documentation |
| **PDF-Parse** | High-speed server-side document text extraction |
| **Socket.io** | Bidirectional WebSocket event gateway |

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Action / Endpoint Area | Candidate | Hiring Manager | Recruiter | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Job Listings** | 👁️ Public | 👁️ Company | 👁️ Company | ⚡ All |
| **Apply for Job / Upload CV** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Generate AI Job Description** | ❌ No | ✅ Yes | ✅ Yes | ⚡ All |
| **Screen CV & AI Scoring** | ❌ No | 👁️ Read-Only | ✅ Trigger/Manage | ⚡ All |
| **Schedule Interview & AI Questions**| ❌ No | ✅ Assigned | ✅ Full Control | ⚡ All |
| **Draft & Issue AI Offer Letter** | ❌ No | 👁️ Review | ✅ Draft & Issue | ⚡ All |
| **Manage Company & Users** | ❌ No | ❌ No | ❌ No | ⚡ Admin Only |

---

## 🧠 AI Layer & Prompt Engineering

The AI core is encapsulated in the backend `AiProxyModule`, abstracting Gemini API interactions behind an internal `AiProvider` interface.

```
                  ┌─────────────────────────────────────┐
                  │          NestJS Controller          │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          AiProxyService             │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      AiProvider (Interface)         │
                  └──────────┬──────────────────────┬───┘
                             │                      │
                             ▼                      ▼
               ┌────────────────────────┐  ┌─────────────────┐
               │ Google Gemini Provider │  │ OpenAI Provider │ (Swappable)
               │ (gemini-1.5-flash)     │  │ (Future Swap)   │
               └────────────────────────┘  └─────────────────┘
```

### Architectural Guarantees:
1. **Zero-Lock-in Abstraction:** Swapping Gemini with OpenAI (GPT-4o) or Anthropic (Claude) requires modifying a single provider file (`backend/src/ai-proxy/providers/`).
2. **Structured JSON Enforcement:** Prompts demand JSON matching strict schemas. Response output undergoes regex sanitization and markdown fence stripping (` ```json `).
3. **Resilience & Graceful Degradation:** Automatic exponential backoff retries (3 attempts with jitter) handle transient 429/503 limits. Operations degrade gracefully if LLM endpoints are unreachable.
4. **Cost & Latency Optimization:** AI outputs are cached directly on database entity records (`JobPosting`, `Application`, `Interview`, `Offer`), preventing redundant LLM calls.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker & Docker Compose** (Recommended for quick database setup)
- **Google Gemini API Key** (Free tier available at [Google AI Studio](https://ai.google.dev))

---

### Environment Configuration

#### Backend Setup (`backend/.env`)
Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
PORT=3000
NODE_ENV=development

# Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=talentbridge
DB_PASSWORD=talentbridge
DB_NAME=talentbridge

# JWT Authentication
JWT_SECRET=super_secret_jwt_access_key_2026
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_2026
JWT_REFRESH_EXPIRATION=7d

# Google Gemini AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### Quick Start with Docker (Recommended)

Run the database and backend seamlessly using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/Mustafa-Hazard/TalentBridge.git
cd TalentBridge

# 2. Start PostgreSQL database container
docker compose up -d db

# 3. Initialize & Run Backend
cd backend
npm install
npm run migration:run
npm run start:dev

# 4. In a new terminal, run Frontend
cd ../frontend
npm install
npm run dev
```

The application will be accessible at:
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`
- **Swagger Documentation:** `http://localhost:3000/api`

---

## 🧪 Testing & Quality Assurance

TalentBridge contains comprehensive unit and end-to-end (E2E) testing suites.

```bash
# Run unit tests
cd backend
npm run test

# Run tests with code coverage report
npm run test:cov

# Run E2E tests (Requires running database)
npm run test:e2e
```

---

## 📚 Project Documentation

For exhaustive technical specifications, architectural diagrams, and compliance documents, consult the `/docs` directory:

- 📊 **[Entity Relationship Diagram (docs/ER_DIAGRAM.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/ER_DIAGRAM.md):** Comprehensive database schema and relationships.
- 🔌 **[API Contract Specification (docs/API_CONTRACT.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/API_CONTRACT.md):** Complete REST endpoint descriptions, request bodies, and responses.
- 🤖 **[AI Integration & Prompt Report (docs/AI_INTEGRATION_REPORT.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/AI_INTEGRATION_REPORT.md):** In-depth prompt evolution, schema enforcement, and cost optimization details.
- 📝 **[Engineering Build Log (docs/BUILD_LOG.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/BUILD_LOG.md):** Step-by-step development history and design rationale.
- 🛡️ **[Data Privacy & Compliance (docs/DATA_PRIVACY.md)](file:///home/mustafa_muhammad/Eden/Project/talentbridge/docs/DATA_PRIVACY.md):** Resume data handling, AI processing ethics, and privacy policies.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">
Built with ❤️ for SME Recruitment Excellence.
</div>
