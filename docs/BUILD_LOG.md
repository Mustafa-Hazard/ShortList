# Build Log

A running log of each build phase, the decisions made, and why. Keeping this
up to date as you go is what makes the individual viva painless — you can
point at a specific entry instead of trying to remember why you did something
three weeks ago.

## Phase 0 — Monorepo scaffold

- `backend/`: NestJS (Nest CLI default scaffold, TypeScript).
- `frontend/`: React 18 + TypeScript via Vite.
- Root `docker-compose.yml` brings up Postgres 15 + the backend with one
  command (spec 5.1).
- Root `README.md` documents the stack and how to run everything locally.

**Decision — ORM: TypeORM, not Prisma.**
The spec allows either. Prisma's CLI needs to download native query-engine
binaries from `binaries.prisma.sh` at `generate`/`migrate` time; that domain
wasn't reachable in the build environment, so schema and migrations couldn't
be generated or verified. TypeORM only needs packages from the npm registry
(`typeorm`, `pg`), so the whole backend — entities, guards, services, tests —
could actually be compiled and unit-tested end-to-end while building it,
instead of writing code against Prisma that nobody had run once. TypeORM
1.0.0 (released May 2026) is used — the first stable major release after
several years on 0.3.x.

**Decision — AI provider: Google Gemini API (free tier), not GPT-4o/Claude.**
As of mid-2026 neither OpenAI nor Anthropic offers a genuinely free API tier
(OpenAI dropped its new-account credit; both require a card on file). Gemini's
free tier via Google AI Studio needs no card, returns clean structured JSON
(important for the CV scorer/extractor), and is generous enough for a course
project (~1,500 requests/day on Gemini 2.5 Flash). The AI proxy module is
written against a small internal `AiProvider` interface, so this is a
one-file swap if you later want to point it at GPT-4o or Claude instead —
see `backend/src/ai/providers/`.

## Phase 1 — Domain model

Entities added (`backend/src/**/*.entity.ts`): `Company`, `User`,
`JobPosting`, `Application`, `Cv`, `Interview`, `Offer`, `Notification`.

`Application` is the core of the candidate pipeline state machine
(`ApplicationStage`: applied → screened → shortlisted →
interview_scheduled → offer → hired / rejected). It also caches the AI
Feature 2 (CV Screening & Scorer) output directly on the row — score,
extraction, strengths, gaps — so the shortlist can sort by score without
re-calling the AI on every page load.

Migrations aren't generated yet — TypeORM generates migrations by diffing
against a **live** database, which the build environment didn't have. Run
this once you have Postgres up locally:

```bash
docker compose up -d db
cd backend && npm run migration:generate -- src/migrations/Init
npm run migration:run
```

## Phase 2 — Auth & role guards

- JWT access + refresh tokens (`@nestjs/jwt`, `passport-jwt`).
- Refresh tokens are stored server-side as a bcrypt hash on the `User` row
  (`refreshTokenHash`), so logout actually revokes the session instead of
  the token just being valid until it expires on its own.
- `JwtAuthGuard` is registered globally (`APP_GUARD`) — every route requires
  a valid token by default. Routes opt out individually with `@Public()`.
- `RolesGuard` (also global) enforces `@Roles(...)` where present; routes
  with no `@Roles()` just require *some* authenticated user.
- Registration: candidates self-register with no company. Admins register
  with a `companyName` (bootstraps a new `Company`). Recruiters and hiring
  managers must supply an existing `companyId`.
- Tests: `auth.service.spec.ts` (unit, mocked repositories, runs without a
  DB — 10/10 passing) and `test/auth.e2e-spec.ts` (Supertest, needs a live
  DB — run it after `docker compose up -d db`).

## Next phases (not started yet)

3. Job posting module (CRUD + Draft→Published→Closed→Archived + AI Feature 1)
4. Candidate pipeline / applications module (stage transitions, bulk actions)
5. CV upload + server-side PDF text extraction
6. AI proxy module + AI Feature 2 (CV Screening & Scorer)
7. Interview scheduler + AI Feature 3 (Question Suggester)
8. Offer management + AI Feature 4 bonus (Offer Letter Drafter)
9. WebSocket notification gateway
10. React frontend: auth pages, role-based routing
11. React frontend: role dashboards + AI-powered components
12. Admin analytics dashboard (4+ chart types)
13. Remaining deliverables: ER diagram, API contract, AI integration report
