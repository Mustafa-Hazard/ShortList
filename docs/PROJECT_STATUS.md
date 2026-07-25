# TalentBridge — Project Status & Context Anchor

> **Purpose:** Paste this into a new Claude/Antigravity conversation any time context has drifted, to re-ground on what's built, what's next, and how we work. This reflects the actual state as of **July 26, 2026, ~3:30 AM**, verified by real terminal output — not the plan, the plan minus what's actually confirmed working.

---

## 1. What's Completed & Confirmed Working

### Environment (WSL2 Ubuntu)
- Node.js via `nvm`, npm, NestJS CLI, Docker Engine (native, not Desktop), `postgresql-client`
- Repo: `https://github.com/Mustafa-Hazard/TalentBridge`
- Working copy: `~/Eden/Project/talentbridge`
- **New this session:** Antigravity IDE installed and working — see §6 below for the full workflow-tooling story.

### Database
- Postgres 15-alpine via `docker compose up -d db`, confirmed healthy
- Migration `Init1783545985543` run — 9 tables confirmed via `\dt`

### Backend — Auth Module ✅ merged to `main`
- All 5 routes (`register`, `login`, `refresh`, `logout`, `me`) verified end-to-end
- 10/10 unit tests passing
- Committed directly to `main` as `e8752e8` (before the branch/PR workflow was adopted)

### Backend — Job Postings Module ✅ merged to `main` (PR #1, `513e5f2`)
- Full CRUD scoped to creating user's company; `Draft → Published → Closed → Archived` lifecycle via dedicated endpoints
- Candidates see published postings across all companies (404, not 403, for anything non-published); staff see their own company's postings
- `/jobs/:id/stats` — total applications, per-stage counts, days open
- Tests: 27/27 passing. Controller 100% statement coverage, service 96.82% statements / 80% branch
- **Not yet wired in:** AI Feature 1 (JD Generator) — `JdGeneratorService` is scaffolded (see §2, this is the next task)

### Backend — Applications / Candidate Pipeline Module ✅ merged to `main` (PR #2, `4ee8313`)
- Stage state machine with per-edge role gating, duplicate application → 409, `bulkTransition()` per-id reporting
- Shortlist listing defaults to `aiScore DESC NULLS LAST` — ready for AI Feature 2
- Tests: 24/24 passing. Controller 100%, service 100% statements / 91.3% branch

### Backend — CV Upload & Text Extraction ✅ merged to `main` (PR #3, `5b3c7d3`)
- `multer` (disk storage, UUID filename, 5MB limit) + `pdf-parse@2.4.5`'s class-based `PDFParse` API
- Duplicate upload → 400 with file cleanup via `unlink`; non-PDF rejected by extension **and** mimetype
- Extraction failure (corrupt/scanned/encrypted PDF) degrades gracefully: file stored, `extractedText: null`
- `pageJoiner: ''` passed to `getText()` to suppress `-- N of M --` page markers
- Manually verified via real `curl` + hand-built PDF (upload, duplicate rejection, non-PDF rejection, byte-identical download via `diff`)
- Tests: 9/9 passing. Controller 100% statement coverage, service 90.69% statements / 63.63% branch

### Backend — AI Proxy Module ✅ merged to `main` (PR #4, `8a86df6`)
- `AiProxyService.generateContent()` is the **sole** point of contact with the Gemini API per spec §5.1 — no direct frontend calls, no API keys outside this service
- Retry with exponential backoff on 429/500/502/503/504, configurable `maxRetries`/`timeoutMs`
- Typed errors (`AiProxyRateLimitError`, `AiProxyUnavailableError`, `AiProxyError`) so callers can implement their own degrade-don't-block fallback
- Handles Gemini safety blocks (`promptFeedback.blockReason`) and empty responses as errors, not silent garbage
- **Manually verified against the live Gemini API**, not just mocks, before committing
- Tests: 7/7 passing. 89.47% statements / 86.95% branch coverage

### What's scaffolded but NOT wired in yet
- **`JdGeneratorService`** (`backend/src/jobs/jd-generator.service.ts` + `.spec.ts`) — builds the JD prompt from `JobPosting`'s existing structured fields (title, department, type, salary, requiredSkills, responsibilities, cultureNotes), calls `AiProxyService`. Unit-tested standalone (3 tests) but **not yet imported into `JobsService`/`JobsController`/`JobsModule`** — that integration is the next task. Not committed to git yet.

### What's scaffolded but NOT functional at all
| Module | State |
|---|---|
| Interviews, Offers, Notifications | Entity only — no service/controller/module |
| WebSocket Gateway | Does not exist yet |
| Frontend | Default Vite/React scaffold only |

---

## 2. What's Left — Priority Order

1. **Wire `JdGeneratorService` into the Jobs module** (this session left off here — see the exact task spec in §6, "Antigravity prompt for the next task")
   - Auto-generate `description` on `create()` if blank, degrade-don't-block on AI failure
   - New `POST /jobs/:id/generate-description` endpoint for explicit regeneration (fails loudly — recruiter explicitly asked)
   - Update `jobs.service.spec.ts` / `jobs.controller.spec.ts` for both paths
   - Branch, commit, PR, merge (same flow as CV/AI Proxy modules)
2. **AI Feature 2 (CV Screening & Scorer)** — depends on CV module (done) + AI proxy (done); populates `Application.aiScore`/`aiExtraction`/`aiStrengths`/`aiGaps`, which the Applications module already sorts by. Follow the same "own the prompt, share the proxy" pattern as JD Generator.
3. **Interview Scheduler + AI Feature 3 (Question Suggester)**
4. **Offers module + AI Feature 4 (Offer Letter Drafter, bonus)**
5. **WebSocket notification gateway** — emits on every pipeline stage transition
6. **Frontend: auth pages + role-based routing**
7. **Frontend: role dashboards + AI-powered components**
8. **Admin analytics dashboard** (4+ chart types)
9. **Remaining deliverables**: ER diagram, full API contract doc, AI integration report (prompt templates, ≥2 documented iterations w/ rationale per AI feature — JD Generator's iteration log is already written as a code comment in `jd-generator.service.ts`, reuse that pattern), data privacy paragraph

**Grading-relevant, don't lose sight of:** ≥60% controller test coverage (comfortably clear on all 4 shipped modules), Jest+Supertest on every role-protected route, Swagger accuracy, at least one AI feature with real fallback/degradation behavior (CV module + now the AI Proxy module itself both satisfy this — reuse the same pattern for JD Generator and CV Scorer), zero API keys in frontend code.

---

## 3. How We Work Together

- **Repo root:** `~/Eden/Project/talentbridge`, backend at `~/Eden/Project/talentbridge/backend`
- **File writes:** `cat > file << 'EOF' ... EOF` heredocs for creating/overwriting whole files (when working via terminal/chat)
- **Targeted edits:** `grep -n` first to confirm a match is unique before any `sed -i` substitution; multi-line/structural changes get a full heredoc rewrite instead of chained `sed`
- **Inspection:** `find`, `ls -la`, `cat` before assuming a file's contents or directory structure — never guess
- **Skills learned this/prior sessions:**
  - Always verify a third-party package's *actual* API from its own bundled `.d.ts`/`.d.cts` before writing code against it (bit us with `pdf-parse` v2's `@types` mismatch)
  - `rootDir` in `jest` config changes what `collectCoverageFrom` patterns are relative to
  - Test the actual happy-path + edge cases with real `curl`/live-API calls before trusting mocked unit tests — caught the `pageJoiner` bug, and confirmed the AI Proxy module actually round-trips against Gemini
  - **Gemini model IDs drift fast and don't match marketing names.** `gemini-2.5-flash` (originally in `.env.example`) moved to paid-only in April 2026. Always confirm via the live `ListModels` API against your actual key rather than trusting a blog post or search result — that's how we landed on `gemini-3.5-flash` as the current free-tier default (non-preview, stable) over `gemini-3.6-flash` (newer, `-preview`-adjacent risk).
- **Build → test → commit → push → PR flow** (unchanged from prior sessions):
  1. Write module → `npm run build` → `npm run start:dev` (confirm clean boot)
  2. For I/O-heavy or external-API modules: manual `curl`/live verification *before* trusting mocked unit tests
  3. Jest unit tests matching established mocking style
  4. `npx jest <module> --coverage --collectCoverageFrom='<module>/**/*.ts'` (no `src/` prefix — `rootDir: "src"`) — confirm >60% before proceeding
  5. `git checkout -b feat/<module>-name` → `git add` only intended files → `git status` to confirm nothing stray staged → conventional commit → `git push -u origin <branch>`
  6. `gh pr create` with Summary/Testing/Next structure → `gh pr merge <branch> --squash --delete-branch`
  7. `git checkout main && git pull origin main` to confirm the merge landed
- **Repo state:** `main` is current through PR #4 (`8a86df6`). `JdGeneratorService` exists locally but is **uncommitted**, not yet wired into Jobs module.

---

## 4. Environment Setup From Fresh

*(unchanged from prior sessions — Node via nvm, NestJS CLI, Docker Engine native in WSL, Postgres client, `gh` CLI; see git history of this doc if you need the full fresh-install block)*

### Known gotchas already solved — don't rediscover these
1–11: *(unchanged — nvm/EACCES, Windows-binary CLI resolution, Docker WSL pause, systemd, `df -h` WSL quirk, duplicate migrations, README-says-Prisma, `docker-compose.yml` version warning, don't `npm audit fix --force`, Jest `rootDir` coverage gotcha, GitHub repo capitalization change)*
12. **`pdf-parse@2.4.5`'s real API differs from the separately-installed `@types/pdf-parse` package** — always check the package's own bundled `.d.cts`.
13. **`pdf-parse`'s default `pageJoiner` pollutes extracted text** — pass `{ pageJoiner: '' }` to `getText()`.
14. **`gh pr merge --delete-branch` only deletes your local branch if you're on it** — otherwise `git branch -d`/`-D` manually.
15. **`.env` was already correctly gitignored (line 12 of `backend/.gitignore`) — don't blindly re-add it** without checking first; a duplicate `.gitignore` line is harmless but sloppy.
16. **Gemini free-tier model IDs change often and don't match blog/marketing names.** Verify via `curl "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}"` against your real key before trusting any written guide, including this one — free-tier availability shifts month to month.
17. **Antigravity IDE under WSLg (running the Linux `.deb`/`.tar.gz` build directly inside WSL2) has a known Electron window-sizing bug** — the app launches and runs (confirmed via `ps aux` and `xwininfo`) but its window renders at a stuck 10x10px, unfixable via `wmctrl`/`xdotool` external resize (Electron's own Ozone platform layer controls it internally, and WSLg's Weston compositor doesn't support `_NET_CLIENT_LIST`, so `wmctrl` fails outright). **Fix: don't run the GUI IDE inside WSL2 directly.** Install the **Windows-native** Antigravity build instead, launch it normally, then `Ctrl+Shift+P` → "Remote-WSL: Connect to WSL" (works even without the marketplace extension, despite it showing "not compatible") → Open Folder → your WSL2 project path. This is now the confirmed-working setup — see §6.

---

## 5. What To Ask First In The New Chat

Paste this file, then say:

> "Pick up where we left off — wire `JdGeneratorService` into the Jobs module (auto-fill `description` on create if blank, degrade-don't-block on AI failure; new `POST /jobs/:id/generate-description` endpoint that fails loudly on explicit request). Update the Jobs module's tests to match. Show me the diff and real test output before committing anything."

If the dev server isn't running (new terminal session):
```bash
cd ~/Eden/Project/talentbridge
docker compose ps        # confirm db is healthy
cd backend
npm run start:dev
```

---

## 6. Tooling — Antigravity IDE Setup (new this session)

**What changed:** This session's coding work happened via a terminal-relay pattern (Claude gives commands → paste output back → repeat). That works but has real friction, so we set up **Google Antigravity IDE** as an agentic coding tool with direct filesystem/terminal access — no more copy-paste relay needed going forward.

**Confirmed working setup:**
- Windows-native Antigravity IDE (not the Linux build — see gotcha #17 above for why)
- Connected via `Ctrl+Shift+P` → "Remote-WSL: Connect to WSL" → project open at `talentbridge [WSL: Ubuntu]`
- Onboarding: "Review-driven development" mode selected (agent proposes diffs, pauses for approval — good default while still building trust with it on this codebase)
- Model in use: `Gemini 3.6 Flash (High)` (swappable to Claude Sonnet via the model dropdown in the Agent panel if preferred)

**Prompt pattern for giving Antigravity a task** (this replaces "paste this md file into Claude"):
1. First message in a new Antigravity conversation: point it at this file's path and tell it to read it for context, explicitly noting that the "paste output back" workflow no longer applies since it has direct access — but every other convention (coding patterns, git workflow gating, testing bar) still applies exactly as written.
2. Ask it to confirm by quoting 2-3 specific facts from the doc back to you (verifies it actually read the file rather than guessing).
3. Give the actual task as a separate, scoped prompt: state the goal, name exact files/patterns to follow, specify the test/coverage bar, and explicitly say **"don't run git add/commit/push — show me the diff and test results first"** until you're confident in its judgment on this repo.

**Still-open question:** whether to keep using Claude-in-chat for planning/architecture decisions (like this doc, or "should JD Generator auto-fill or require explicit trigger") and hand off only the mechanical implementation to Antigravity, or move the whole workflow over. No decision made yet — whichever's working better after JD Generator ships is probably the answer.
