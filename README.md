# ShortList

Hiring and applicant tracking web app with PDF resume parsing, AI evaluation, and real-time status updates.

*Formerly CogniHire.*

![ShortList Preview](docs/shortlist.png)

## About
ShortList is a full-stack applicant tracking system built to streamline recruitment workflows for hiring teams and candidates. Recruiters can post vacancies, review submitted applications, and track candidates across structured hiring stages. The backend validates uploaded PDF resumes, extracts text, and evaluates candidate qualifications against role requirements using Google Gemini (with an offline mock fallback for local testing). Candidates can browse open roles, apply with their resumes, and receive real-time notifications as their application progresses.

## Features
- **Job Management:** Recruiters can create, publish, and close job postings with defined skill requirements and salary bands.
- **Candidate Application Portal:** Applicants browse published vacancies, submit resumes, and monitor application status.
- **Secure File Upload & Extraction:** Enforces 5 MB upload limits, verifies `%PDF-` file magic bytes, and extracts resume text using `pdf-parse`.
- **AI Resume Scoring:** Evaluates candidate resumes against job descriptions using Google Gemini 1.5 Flash (or a built-in mock engine for local testing) to return a match score (0–100), key strengths, and missing skills.
- **Hiring Pipeline Tracking:** Transition applications through structured stages: Applied, Screened, Interview Scheduled, Offered, Hired, and Rejected.
- **Real-Time Notifications:** Socket.IO pushes live notifications for status changes and interview invitations using authenticated WebSocket connections.
- **Aggregated Job Analytics:** MongoDB aggregation pipelines calculate real-time applicant counts and stage distribution metrics per listing.
- **Security Protections:** NoSQL query sanitization, Helmet HTTP headers, `@nestjs/throttler` rate limiting, role-based route guards, and non-root Docker execution.
- **Automated Test Suite:** 24 Jest test suites with 133 unit and integration tests covering security middleware, guards, services, and controllers.

## Tech Stack
*Stack verified from `backend/package.json` and `frontend/package.json`.*

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 8, React Router 6, Zustand 5, Socket.io-client 4.8, Lucide React, Axios |
| **Backend API** | NestJS 10, Node.js 22, Express, Mongoose 8, Socket.IO 4.8, Passport, Passport JWT, Bcrypt, Helmet, pdf-parse |
| **Database & Cache** | MongoDB 7.0 (`mongo:7.0.14`), Mongoose ODM |
| **Containerization & CI** | Docker, Docker Compose, GitHub Actions (`.github/workflows/ci.yml`), CodeQL |

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Docker and Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/Mustafa-Hazard/ShortList.git
cd ShortList
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run with Docker Compose
```bash
docker compose up --build -d
```
Initialize the database with default accounts and sample data:
```bash
docker compose exec backend node dist/seed.js
```
The application will be accessible at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

### 4. Run Locally (Without Docker)
Ensure a local MongoDB server is running on port `27017` (or run `docker compose up -d db`).

**Start Backend:**
```bash
cd backend
npm install
npm run build
npm run seed
npm run start:dev
```

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

| Variable | Description | Example Placeholder |
|---|---|---|
| `PORT` | NestJS HTTP server port | `3000` |
| `FRONTEND_PORT` | Vite frontend server port | `5173` |
| `NODE_ENV` | Application environment mode | `production` |
| `CORS_ORIGIN` | Allowed web origin for cross-origin requests | `http://localhost:5173` |
| `MONGO_USER` | MongoDB administrative user | `shortlist` |
| `MONGO_PASSWORD` | MongoDB password | `your_mongo_password` |
| `MONGO_DB` | MongoDB database name | `shortlist` |
| `MONGODB_URI` | Full MongoDB connection string | `mongodb://user:password@localhost:27017/shortlist?authSource=admin` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens (>= 32 chars) | `your_access_token_secret_key_minimum_32_characters` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (>= 32 chars) | `your_refresh_token_secret_key_minimum_32_characters` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `AI_PROVIDER` | AI engine mode (`mock` or `gemini`) | `mock` |
| `GEMINI_API_KEY` | Google AI Studio API key (if `AI_PROVIDER=gemini`) | `your_gemini_api_key` |
| `GEMINI_MODEL` | Google Gemini model identifier | `gemini-1.5-flash` |
| `MAX_CV_SIZE_MB` | Maximum allowed CV upload size in megabytes | `5` |
| `UPLOAD_DIR` | Storage destination for uploaded PDF resumes | `/app/uploads/cvs` |

### Default Seed Accounts (For Local Development Only)
The seeder creates demo users with password `Password123!`:
- **Admin:** `admin@acme.com`
- **Recruiter:** `recruiter@acme.com`
- **Hiring Manager:** `hiring@acme.com`
- **Candidate:** `candidate@example.com`

## Running Tests
Run the automated test suite in the backend directory:
```bash
cd backend
npm test
```
*Executes 24 Jest test suites with 133 unit and integration tests covering authentication, sanitization, file magic-byte validation, and role guards.*

## Project Structure
```text
ShortList/
├── backend/            # NestJS API application
│   ├── src/            # Auth, jobs, applications, interviews, AI proxy
│   ├── test/           # Integration tests
│   └── package.json
├── frontend/           # React 18 single-page application
│   ├── src/            # Components, pages, router, Zustand store
│   └── package.json
├── docs/               # Architecture diagrams and security references
├── docker-compose.yml  # Multi-container production deployment
└── .env.example        # Environment variable template
```

## What I Learned & What I Would Improve
- Transitioned data layer from PostgreSQL to MongoDB, utilizing MongoDB aggregation pipelines for hiring stage statistics while maintaining schema integrity via Mongoose.
- Implemented defense-in-depth for file uploads by inspecting raw file buffer magic bytes (`%PDF-`) rather than relying solely on client-supplied MIME headers.
- Future improvements: integrate an asynchronous queue (e.g. BullMQ with Redis) for high-volume background resume processing and migrate resume storage to S3-compatible cloud object storage.

## Author
**Mustafa Muhammad Iqbal** — [GitHub](https://github.com/Mustafa-Hazard) · [LinkedIn](https://linkedin.com/in/mustafa642)
