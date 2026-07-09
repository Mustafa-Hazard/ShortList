# TalentBridge

AI-Augmented SME Recruitment Platform — Web Technologies course project.

TalentBridge automates the slowest parts of SME hiring: writing job descriptions,
screening CVs against requirements, preparing interviewers with tailored questions,
and (bonus) drafting offer letters — while keeping a fully auditable, role-guarded
candidate pipeline with real-time updates.

## Monorepo layout

```
talentbridge/
├── backend/     NestJS API (REST + WebSocket + AI proxy)
├── frontend/    React 18 + TypeScript (Vite)
├── docs/        System design docs, ER diagram, API contract, AI report
└── docker-compose.yml
```

## Stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, React Router v6, Zustand |
| Backend    | NestJS, TypeScript, Passport JWT          |
| ORM        | Prisma                                    |
| Database   | PostgreSQL 15 (Docker)                    |
| Real-time  | Socket.io (NestJS WebSocket gateway)      |
| AI         | Google Gemini API (free tier) via an internal AI proxy module — swappable |
| Docs       | Swagger (auto-generated at `/api`)        |
| Testing    | Jest + Supertest                          |

## Why Gemini for the AI layer

The spec allows any LLM provider behind the NestJS AI proxy. This project uses the
**Google Gemini API free tier** (via [Google AI Studio](https://ai.google.dev)) because
it's the most generous no-credit-card option available and returns clean structured
JSON, which the CV scorer and extraction features rely on. The AI proxy is written
against a small internal interface (`AiProvider`), so swapping in OpenAI or Anthropic
later is a one-file change — see `backend/src/ai/providers/`.

## Getting started

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Backend
cd backend
cp .env.example .env        # fill in GEMINI_API_KEY, JWT secrets
npm install
npx prisma migrate dev
npm run start:dev           # http://localhost:3000, Swagger at /api

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Build log

This project is being built commit-by-commit, in the order the modules depend on
each other. See git log / commit messages for the running build order, and
`docs/BUILD_LOG.md` for a running log with rationale per phase (useful for the
individual viva and the reflection report).
