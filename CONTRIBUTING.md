# Contributing to ShortList

Thank you for contributing to ShortList! We maintain high standards of code quality, security hygiene, and testing.

## Code Standards
1. **Conventional Commits:** All commit messages must follow the Conventional Commits specification:
   - `feat:` New features
   - `fix:` Bug fixes
   - `build:` Build system, Docker, or dependency updates
   - `ci:` CI/CD workflow changes
   - `docs:` Documentation improvements
   - `refactor:` Code refactoring without behavior changes
   - `test:` Adding or updating tests
   - `chore:` Routine tasks, maintenance, formatting

2. **Security Ground Rules:**
   - Never commit API keys, passwords, or tokens. Run `gitleaks` prior to pushing.
   - All HTTP endpoints accepting input must be validated via DTOs and sanitized against NoSQL injection.
   - Role-based authorization and object-level ownership checks must be applied to every route.
   - File uploads must validate both MIME type and binary magic bytes.

3. **Testing Requirements:**
   - Every bug fix or security feature must include unit or integration test coverage.
   - Before opening a PR, ensure all tests pass:
     ```bash
     cd backend && npm run lint && npm test
     cd ../frontend && npm run build
     ```
