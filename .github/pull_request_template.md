## Summary
<!-- Provide a brief description of the changes and the rationale behind them. -->

## Changes Made
- 

## Security & Quality Checks
- [ ] Non-root Docker execution verified (`USER node`)
- [ ] No hardcoded secrets or credentials committed (`gitleaks` clean)
- [ ] Unit & E2E tests passing
- [ ] Linter passing with zero errors (`npm run lint`)
- [ ] Input validation and NoSQL injection defenses verified
- [ ] Object-level authorization enforced

## How to Test
<!-- Include commands and steps to reproduce and verify this PR. -->
```bash
docker compose up --build -d
```
