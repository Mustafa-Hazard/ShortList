# CogniHire — AI Integration & Prompt Engineering Report

This report documents the architectural design, prompt iteration evolution, JSON schema enforcement, error handling, and cost/latency optimizations across all 4 AI Features in CogniHire powered by Google Gemini API.

---

## 1. Architectural Overview

CogniHire encapsulates Gemini API interactions inside a centralized `AiProxyModule` (`AiProxyService`).

### Key Capabilities:
1. **Model Selection:** `gemini-1.5-flash` for high-throughput extraction/scoring; `gemini-1.5-pro` capability fallback.
2. **Error Recovery & Retries:** Built-in exponential backoff retries (up to 3 attempts with jitter) handling HTTP 429 (Rate Limit) and HTTP 503 (Overloaded).
3. **Structured JSON Enforcement:** Automatic stripping of markdown code fences (` ```json `), regex sanitization, and fallback default generation.
4. **Degrade-Don't-Block Pattern:** Implicit creation flows (e.g., job creation without description) degrade gracefully to null/placeholder if AI service is temporarily unreachable, preserving core database write transactions.

---

## 2. Feature Analysis & Prompt Iteration Log

### AI Feature 1: Job Description Generator (`JdGeneratorService`)
- **Purpose:** Generates comprehensive, bias-free job descriptions based on title, department, and required skills.
- **Prompt Evolution Log:**
  - **v1:** *"Write a job description for {title} requiring {skills}"* — Resulted in unstructured wall of text without clear responsibilities or technical qualifications.
  - **v2 (Current):** System-prompted instructions demanding structured markdown headings (`About the Role`, `Key Responsibilities`, `Requirements & Technical Skills`, `Why Join Us`), neutral inclusion tone, and bullet points.

---

### AI Feature 2: Candidate CV Screening & Scorer (`CvScorerService`)
- **Purpose:** Evaluates parsed CV text against job requirements and outputs structured JSON containing `aiScore` (0-100), `aiExtraction` (experience, education, skills), `aiStrengths`, and `aiGaps`.
- **Prompt Evolution Log:**
  - **v1:** *"Rate this candidate from 1 to 100 for this job"* — Resulted in arbitrary scores without justification or standard format.
  - **v2 (Current):** Strict JSON schema prompt enforcing exact JSON keys (`aiScore`, `extraction`, `strengths`, `gaps`). Instructions dictate objective scoring criteria: skill overlap (50%), experience depth (30%), domain match (20%). Includes explicit requirement to identify at least 2 candidate strengths and 2 potential gaps for recruiter verification.

---

### AI Feature 3: Tailored Interview Question Suggester (`QuestionSuggesterService`)
- **Purpose:** Generates 4 to 6 interview questions specifically targeting identified candidate skill gaps and job requirements.
- **Prompt Evolution Log:**
  - **v1:** *"Give me interview questions for a backend engineer"* — Returned generic surface-level questions like "What is OOP?".
  - **v2 (Current):** Context-aware prompt injecting `candidateGaps` and `requiredSkills`. For each question, requires outputting a `category` (Technical, Behavioral, System Design) and a concrete `listenFor` key signal indicating what a strong answer should demonstrate.

---

### AI Feature 4 (Bonus): Offer Letter Drafter (`OfferDrafterService`)
- **Purpose:** Drafts formal, personalized job offer letter bodies based on candidate name, role title, compensation, start date, and benefits.
- **Prompt Evolution Log:**
  - **v1:** *"Write an offer letter for {roleTitle}"* — Returned generic templates full of bracketed placeholders (`[Candidate Name]`, `[Date]`).
  - **v2 (Current):** Direct candidate data injection into prompt, explicit prohibition of placeholder tags, warm professional tone, and 4-paragraph letter structure suitable for instant recruiter review and issuance.

---

## 3. Cost & Latency Optimizations
- **Persistence Pattern:** AI generated artifacts (`description`, `aiScore`, `questions`, `draftedLetter`) are saved directly on TypeORM entities (`JobPosting`, `Application`, `Interview`, `Offer`). This prevents repeated expensive LLM calls during candidate listing or dashboard refresh.
- **Temperature Tweak:** Controlled temperature settings (`0.2` for CV Scorer JSON output; `0.4` for JD and Offer Letter generation) ensure low variance and predictable schema formatting.
