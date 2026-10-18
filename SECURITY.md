# Security Policy

## Supported Versions

The ShortList team provides active security updates and vulnerability patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ShortList and candidate data very seriously. If you discover a security vulnerability, please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Send an email to **security@shortlist.dev** (or submit a private vulnerability advisory via GitHub Security Advisories).
3. Include the following details to help us triage quickly:
   - Type of vulnerability (e.g., NoSQL injection, Broken Object Level Authorization, SSRF).
   - Step-by-step instructions or proof-of-concept payload.
   - Impact assessment on candidate PII or company data.

### Response Timelines
- **Initial Acknowledgement:** Within 24 hours.
- **Triage & Severity Assessment:** Within 48 hours.
- **Patch Release & Advisory:** Within 7 business days for high/critical vulnerabilities.

## Hardening Features Implemented

ShortList incorporates production-grade defenses:
- **Defense in Depth Containerization:** Multi-stage slim Docker images running as non-root (`USER node`), read-only root filesystems, drop all Linux capabilities (`cap_drop: [ALL]`), and `no-new-privileges:true`.
- **NoSQL Injection Defenses:** Deep sanitization middleware rejecting `$`-prefixed operator keys and dotted notation on all request bodies, queries, and parameters.
- **Strict Network & CORS Isolation:** MongoDB is isolated on an internal Docker bridge network without host port binding in default production. CORS enforces strict origin allow-lists with credentials.
- **Rate Limiting:** Global rate limiting via `@nestjs/throttler` with strict 5-request burst limits on authentication routes (`login` and `register`).
- **File Upload Protection:** Strict 5MB file limit, MIME type verification, PDF magic byte validation (`%PDF-`), and path traversal sanitization.
- **WebSocket Isolation:** Authenticated connection via JWT and strict room-level isolation preventing cross-tenant event snooping.
- **Information Leakage Prevention:** Global exception filtering in production masking internal database errors and stack traces.
