# TalentBridge — Data Privacy & AI Ethics Compliance

This document outlines the data protection architecture, candidate PII safeguards, and AI ethics commitments enforced across the TalentBridge platform.

---

## 1. Candidate PII & Resume Safeguards
- **Access Control:** Candidate CV documents (`CvData`) and extracted profiles (`aiExtraction`) are strictly scoped by company ownership (`companyId`). Recruiters and hiring managers can only view candidate records submitted to job postings within their assigned organization.
- **Data Minimization:** Only text extracted from uploaded resumes is processed by AI services. Sensitive personal attributes (such as age, gender, ethnicity, marital status, or photo metadata) are excluded from scoring inputs to maintain unbiased candidate evaluation.

---

## 2. Artificial Intelligence Ethics & Non-Training Assurances
- **No Third-Party Model Training:** Candidate CV text, contact details, and performance evaluations sent to the Gemini API via `AiProxyService` are processed statelessly under enterprise API data privacy agreements. Candidate data is **never used to train public foundation models**.
- **Human-in-the-Loop Oversight:** AI Feature outputs (CV Scores, Interview Questions, Drafted Offer Letters) serve as decision-support tooling. Stage transitions, candidate rejection decisions, and offer letter issuance **always require explicit human staff authorization**.
- **Approval Gating:** Offer letters drafted by AI (`draftedLetter`) remain hidden from candidates until a recruiter or hiring manager approves the letter (`letterApproved = true`).

---

## 3. Data Retention & Erasure
- **Candidate Right to Erasure:** In compliance with global privacy standards (GDPR / CCPA), candidate account deletion cascades through `Application`, `CvData`, `Interview`, and `Offer` records via database foreign key cascading (`ON DELETE CASCADE`).
- **Encrypted Transport:** All API communications, WebSocket event broadcasts, and database connections utilize TLS 1.3 encryption in transit.
