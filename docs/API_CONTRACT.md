# CogniHire — API Contract Specification

This document details the REST API endpoints, WebSocket gateway events, request DTOs, response schemas, and authentication rules for CogniHire.

---

## 1. Authentication (`/api/auth`)

### `POST /auth/register/candidate`
- **Access:** Public
- **Body:** `{ email, password, firstName, lastName }`
- **Response:** `{ accessToken, user: { id, email, firstName, lastName, role: 'candidate' } }`

### `POST /auth/register/recruiter`
- **Access:** Public
- **Body:** `{ email, password, firstName, lastName, companyName }`
- **Response:** `{ accessToken, user: { id, email, firstName, lastName, role: 'recruiter', companyId } }`

### `POST /auth/login`
- **Access:** Public
- **Body:** `{ email, password }`
- **Response:** `{ accessToken, user }`

### `GET /auth/me`
- **Access:** Authenticated
- **Response:** User object with company scope.

---

## 2. Job Postings (`/api/jobs`)

### `GET /jobs`
- **Access:** Authenticated (Candidates see `published` jobs; Staff see company jobs)
- **Response:** `Array<JobPosting>`

### `POST /jobs`
- **Access:** `RECRUITER`, `ADMIN`
- **Body:** `{ title, department, type, requiredSkills, description?, salaryMin?, salaryMax? }`
- **Behavior:** Auto-invokes `JdGeneratorService` if `description` is omitted.

### `POST /jobs/generate-description`
- **Access:** `RECRUITER`, `HIRING_MANAGER`, `ADMIN`
- **Body:** `{ title, department, requiredSkills }`
- **Response:** `{ description: string }`

---

## 3. Applications (`/api/applications`)

### `POST /applications`
- **Access:** `CANDIDATE`
- **Body:** `{ jobPostingId, coverLetter?, yearsOfExperience?, salaryExpectation? }`

### `GET /applications/me`
- **Access:** `CANDIDATE`
- **Response:** Candidate's applications array with pipeline stage and relations.

### `GET /applications`
- **Access:** `RECRUITER`, `HIRING_MANAGER`, `ADMIN`
- **Query Params:** `jobPostingId`, `stage`
- **Response:** Applications array sorted by `aiScore` DESC.

### `POST /applications/:id/score`
- **Access:** `RECRUITER`, `ADMIN`
- **Response:** Updated Application with `aiScore`, `aiExtraction`, `aiStrengths`, `aiGaps`.

### `PATCH /applications/:id/stage`
- **Access:** Role-gated per transition matrix
- **Body:** `{ targetStage: ApplicationStage }`
- **Emits:** `APPLICATION_STAGE_CHANGED` notification via WebSocket & DB.

---

## 4. CV Upload & Extraction (`/api/cv`)

### `POST /cv/upload`
- **Access:** `CANDIDATE`
- **Form Data:** `file` (PDF), `applicationId`
- **Response:** `{ id, applicationId, originalFilename, fileSizeBytes }`

---

## 5. Interviews (`/api/interviews`)

### `POST /interviews`
- **Access:** `RECRUITER`, `ADMIN`
- **Body:** `{ applicationId, type, proposedSlots: string[] }`
- **Emits:** `INTERVIEW_PROPOSED` notification to candidate.

### `POST /interviews/:id/confirm`
- **Access:** `CANDIDATE`
- **Body:** `{ confirmedSlot: string }`
- **Emits:** `INTERVIEW_CONFIRMED` notification to recruiter.

### `POST /interviews/:id/generate-questions`
- **Access:** `RECRUITER`, `HIRING_MANAGER`, `ADMIN`
- **Response:** `{ questions: Array<{ question, category, listenFor }> }`

---

## 6. Offers (`/api/offers`)

### `POST /offers`
- **Access:** `RECRUITER`, `ADMIN`
- **Body:** `{ applicationId, roleTitle, salary, startDate, benefitsSummary }`
- **Behavior:** Auto-invokes `OfferDrafterService` (AI Feature 4) for draft letter body.

### `POST /offers/:id/approve`
- **Access:** `RECRUITER`, `HIRING_MANAGER`, `ADMIN`
- **Behavior:** Sets `letterApproved = true` and emits `OFFER_ISSUED` to candidate.

### `POST /offers/:id/respond`
- **Access:** `CANDIDATE` (Requires `letterApproved = true`)
- **Body:** `{ status: 'accepted' | 'rejected' | 'negotiating', candidateResponse? }`
- **Emits:** `OFFER_RESPONDED` to recruiter.

---

## 7. Notifications & WebSocket Gateway (`/api/notifications` & `ws://`)

### `GET /notifications/me`
- **Access:** Authenticated
- **Response:** `Array<Notification>`

### WebSocket Gateway (`Socket.IO`)
- **Connect Query:** `?userId=<userId>`
- **Room Joining:** Client joins `user:<userId>` room.
- **Event Emitted:** `'notification'`
  ```json
  {
    "type": "application_stage_changed | interview_proposed | interview_confirmed | offer_issued | offer_responded",
    "payload": { ... },
    "timestamp": "2026-07-26T04:15:00.000Z"
  }
  ```
