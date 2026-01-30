# app-template-backend

Secure Node.js + TypeScript backend API template built with **Fastify**, **Prisma**, and **PostgreSQL**.

## Features

- **Fastify 5** with TypeScript and Zod validation
- **PostgreSQL** with Prisma ORM, migrations, and seed data
- **Cookie-based sessions** (HttpOnly, Secure, SameSite) backed by PostgreSQL
- **CSRF protection** (double-submit cookie with HMAC signing)
- **Argon2id password hashing** with OWASP-recommended parameters
- **Rate limiting** (global + stricter auth endpoint limits)
- **Brute-force protection** with progressive account lockout
- **RBAC** (USER / ADMIN roles)
- **Audit logging** for all auth events (DB + structured logs)
- **OpenAPI 3.1 docs** auto-generated from Zod schemas
- **Optional 2FA** (TOTP + recovery codes, feature-flagged)
- **Docker Compose** for local development
- **GitHub Actions CI** with lint, typecheck, test, build, CodeQL, Dependabot

## Quick Start

### Prerequisites

- Node.js >= 20
- Docker and Docker Compose
- Git

### 1. Clone and install

```bash
git clone <your-repo-url>
cd app-template-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev with Docker)
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

The API is now running at `http://localhost:3000`.
OpenAPI docs are at `http://localhost:3000/docs`.

### Alternative: Full Docker setup

```bash
cp .env.example .env
docker compose up
```

This starts both PostgreSQL and the app with hot reload.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/login` | No | Login (rate limited) |
| `POST` | `/auth/logout` | Yes | Logout |
| `GET` | `/auth/csrf-token` | No | Get CSRF token |
| `GET` | `/me` | Yes | Get current user profile |
| `PATCH` | `/me` | Yes + CSRF | Update profile |
| `POST` | `/auth/2fa/setup` | Yes | Setup 2FA (if enabled) |
| `POST` | `/auth/2fa/verify` | Yes | Verify & enable 2FA |
| `POST` | `/auth/2fa/disable` | Yes | Disable 2FA |

### Seed users (development only)

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Admin123!` | ADMIN |
| `user@example.com` | `User123!` | USER |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests (requires Postgres) |
| `npm run db:migrate:dev` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
  config/          # Zod-validated environment config
  plugins/         # Fastify plugins (helmet, cors, rate-limit, session, csrf, swagger)
  middleware/      # Auth, authorization, error handling
  modules/
    health/        # GET /health
    auth/          # Login, logout, CSRF token
    user/          # User profile (GET/PATCH /me)
    totp/          # 2FA (feature-flagged)
  lib/             # Prisma client, password hashing, audit logger, crypto utils
  types/           # TypeScript type augmentations
prisma/
  schema.prisma    # Database schema
  seed.ts          # Database seeder
tests/
  unit/            # Unit tests (no DB required)
  integration/     # Integration tests (requires Postgres)
  helpers/         # Test utilities and fixtures
```

## Security Architecture

### Authentication Flow

1. Client sends `POST /auth/login` with email + password
2. Server verifies credentials with Argon2id
3. On success: creates server-side session in PostgreSQL, sets HttpOnly cookie
4. Client includes cookie automatically on subsequent requests
5. Protected routes check session via `requireAuth` middleware
6. `POST /auth/logout` destroys the server-side session

### CSRF Protection

State-changing endpoints (PATCH, POST that modify data) require a CSRF token:

1. Client calls `GET /auth/csrf-token` to get a token
2. Client sends the token in the `X-CSRF-Token` header on state-changing requests
3. Server validates the HMAC-signed double-submit cookie

### Rate Limiting & Brute Force

- **Global**: 100 requests/minute per IP
- **Auth endpoints**: 5 attempts per 15 minutes per IP
- **Account lockout**: After 5 failed logins → 15 min lock, 10 → 1 hour, 20 → 24 hours

### Audit Logging

All authentication events are logged to both the structured logger (pino) and the `audit_logs` database table:

- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_FAILED_LOCKED`
- `LOGOUT`, `PASSWORD_CHANGED`
- `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`
- `TOTP_ENABLED`, `TOTP_DISABLED`, `TOTP_RECOVERY_USED`

Sensitive data (passwords, tokens, secrets) is **never** included in audit logs.

## Threat Model Assumptions

This template assumes:

- **Transport security**: HTTPS is terminated at the reverse proxy / load balancer level (not within the app). In production, always deploy behind HTTPS.
- **Database trust boundary**: The Postgres connection is trusted (local Docker in dev, managed DB in prod). Connection encryption (SSL) should be enabled for production.
- **Session security**: Sessions are server-side in Postgres. Compromise of the database would expose session tokens. Mitigation: use encrypted DB connections and restrict DB user permissions.
- **CSRF scope**: CSRF protection covers browser-based attacks. API-only clients (mobile apps, server-to-server) may use alternative auth mechanisms (e.g., API keys) which are out of scope for this template.
- **Rate limiting**: IP-based rate limiting is effective for direct connections but can be bypassed via distributed attacks or shared IPs (NAT). For production, consider additional layers (WAF, Cloudflare, etc.).
- **2FA recovery codes**: Recovery codes are hashed with Argon2id. If a user loses both their TOTP device and recovery codes, an admin must manually intervene.

## Environment Variables

See [.env.example](.env.example) for all variables with documentation.

### Secret Rotation

- **SESSION_SECRET**: Rotating this invalidates all active sessions (users must re-login). Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **CSRF_HMAC_KEY**: Rotating this invalidates all issued CSRF tokens. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **DATABASE_URL**: Use a dedicated DB user with minimal permissions. Rotate credentials via your hosting provider's secrets manager.

## Production Hardening Checklist

- [ ] Generate cryptographically strong `SESSION_SECRET` (64+ random hex chars)
- [ ] Generate cryptographically strong `CSRF_HMAC_KEY` (32+ random hex chars)
- [ ] Set `NODE_ENV=production`
- [ ] Cookie `secure=true` (automatic when `NODE_ENV=production`)
- [ ] Configure `CORS_ORIGIN` to exact frontend domain (no wildcards)
- [ ] Enable HTTPS/TLS termination at reverse proxy
- [ ] Set `trustProxy=true` in Fastify (automatic when `NODE_ENV=production`)
- [ ] Use managed PostgreSQL with SSL (`sslmode=require` in `DATABASE_URL`)
- [ ] Run `npm audit` and resolve high/critical vulnerabilities
- [ ] Enable Dependabot alerts and security updates
- [ ] Enable CodeQL analysis in GitHub repo settings
- [ ] Enable GitHub secret scanning + push protection
- [ ] Review and tune rate limit values for expected traffic
- [ ] Review Argon2 memory/time parameters for server hardware
- [ ] Set up log aggregation (ELK, CloudWatch, Datadog, etc.)
- [ ] Configure database backups
- [ ] Set up uptime monitoring on `/health`
- [ ] Minimize database user permissions
- [ ] Enable connection pooling (PgBouncer or similar) for production
- [ ] Set appropriate session `maxAge` for your security requirements
- [ ] Review CSP headers for your frontend integration
- [ ] Never commit `.env` files (verify `.gitignore`)
- [ ] Set up GitHub branch protection rules for `main`
- [ ] Consider HSTS headers at the reverse proxy level
- [ ] Ensure Docker images run as non-root user (already configured in production Dockerfile)

## License

MIT
