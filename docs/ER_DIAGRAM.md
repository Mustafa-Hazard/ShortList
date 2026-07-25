# TalentBridge — Entity Relationship (ER) Diagram

This document contains the relational database schema diagram and entity specifications for the TalentBridge recruitment platform.

```mermaid
erDiagram
    COMPANIES ||--o{ USERS : "employs staff"
    COMPANIES ||--o{ JOB_POSTINGS : "publishes"
    USERS ||--o{ APPLICATIONS : "submits (Candidate)"
    USERS ||--o{ INTERVIEWS : "proposes / conducts (Staff)"
    USERS ||--o{ OFFERS : "issues (Staff)"
    USERS ||--o{ NOTIFICATIONS : "receives"
    JOB_POSTINGS ||--o{ APPLICATIONS : "receives"
    APPLICATIONS ||--o{ INTERVIEWS : "schedules"
    APPLICATIONS ||--o| OFFERS : "grants"
    APPLICATIONS ||--o| CV_DATA : "contains"

    COMPANIES {
        uuid id PK
        string name
        string domain
        datetime createdAt
        datetime updatedAt
    }

    USERS {
        uuid id PK
        uuid companyId FK "nullable"
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role "candidate | recruiter | hiring_manager | admin"
        datetime createdAt
        datetime updatedAt
    }

    JOB_POSTINGS {
        uuid id PK
        uuid companyId FK
        string title
        string department
        enum type "full-time | part-time | contract"
        enum status "draft | published | archived"
        text description
        text responsibilities
        jsonb requiredSkills
        int salaryMin
        int salaryMax
        datetime createdAt
        datetime updatedAt
    }

    APPLICATIONS {
        uuid id PK
        uuid jobPostingId FK
        uuid candidateId FK
        enum stage "applied | screened | shortlisted | interview_scheduled | offer | hired | rejected"
        text coverLetter
        int yearsOfExperience
        int salaryExpectation
        int aiScore "nullable"
        jsonb aiExtraction "nullable"
        jsonb aiStrengths "nullable"
        jsonb aiGaps "nullable"
        datetime createdAt
        datetime updatedAt
    }

    CV_DATA {
        uuid id PK
        uuid applicationId FK UK
        string originalFilename
        string mimeType
        int fileSizeBytes
        text rawTextContent
        datetime createdAt
    }

    INTERVIEWS {
        uuid id PK
        uuid applicationId FK
        uuid proposedById FK "nullable"
        uuid hiringManagerId FK "nullable"
        enum type "screening | technical | behavioral | executive"
        enum status "proposed | confirmed | completed | cancelled"
        timestamp_array proposedSlots
        timestamp confirmedSlot "nullable"
        jsonb questions "nullable"
        text notes "nullable"
        datetime createdAt
        datetime updatedAt
    }

    OFFERS {
        uuid id PK
        uuid applicationId FK UK
        uuid issuedById FK "nullable"
        string roleTitle
        int salary
        date startDate
        text benefitsSummary
        enum status "issued | accepted | rejected | negotiating"
        text candidateResponse "nullable"
        text draftedLetter "nullable"
        boolean letterApproved
        datetime createdAt
        datetime updatedAt
    }

    NOTIFICATIONS {
        uuid id PK
        uuid userId FK
        enum type "application_stage_changed | interview_proposed | interview_confirmed | interview_reminder | offer_issued | offer_responded"
        jsonb payload
        boolean read
        datetime createdAt
    }
```
