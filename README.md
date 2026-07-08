# TalentBridge

AI-Augmented SME Recruitment Platform for the Web Technologies course project.

TalentBridge streamlines SME hiring by helping teams draft job descriptions,
screen CVs against requirements, prepare interview questions, and draft offer letters
while keeping the candidate pipeline auditable and role-guarded.

## Monorepo layout

- backend/: NestJS API with authentication, domain entities, and database wiring
- frontend/: React 18 + TypeScript app built with Vite
- docs/: design notes and build log
- docker-compose.yml: container setup for local development

## Getting started

```bash
# Start the database
docker compose up -d db

# Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Notes

The project includes a build log in docs/BUILD_LOG.md that explains the implementation
phases and rationale for the current state of the application.
