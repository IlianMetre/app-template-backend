# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue.
2. Email your findings to [security@yourproject.com] (replace with your actual security contact).
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if any)

We aim to acknowledge reports within 48 hours and provide a fix timeline within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Security Measures

This template implements the following security controls:

- **Password hashing**: Argon2id with 64MB memory, 3 iterations, 4 parallelism
- **Session management**: Server-side sessions stored in PostgreSQL, HttpOnly/Secure/SameSite cookies
- **CSRF protection**: Double-submit cookie pattern with HMAC-signed tokens
- **Rate limiting**: Global rate limiting + stricter auth endpoint limits
- **Brute-force protection**: Progressive account lockout (15min / 1hr / 24hr)
- **Input validation**: Zod schema validation on all request inputs
- **Secure headers**: Helmet (CSP, X-Content-Type-Options, X-Frame-Options, etc.)
- **SQL injection**: Protected via Prisma ORM parameterized queries
- **Audit logging**: All auth events logged to database (no secrets in logs)
- **Dependency scanning**: Dependabot + npm audit + CodeQL
- **Secret scanning**: GitHub secret scanning recommended (enable in repo settings)

## GitHub Repository Settings

Enable these in your repository settings for full protection:

1. **Settings > Code security and analysis**:
   - Enable Dependabot alerts
   - Enable Dependabot security updates
   - Enable Secret scanning
   - Enable Secret scanning push protection
   - Enable CodeQL analysis

2. **Settings > Branches > Branch protection rules** (for `main`):
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Do not allow force pushes
