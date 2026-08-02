# Deployment Guide

**CURRENT STATE:** Only local development deployment (docker-compose + host) is available. No production deployment target exists. This guide documents the local setup and lists blockers for production deployment.

---

## Local Development Setup

### Prerequisites

- **Docker** + **Docker Compose** (for Postgres 16 + MinIO)
- **Node.js** 24+ (tested 24.0.0)
- **pnpm** 10.26.2
- **Git**

### 1. Start Infrastructure

```bash
docker compose up -d
```

Brings up:

| Service | Image | Port | Credentials | Notes |
|---|---|---|---|---|
| **postgres** | postgres:16-alpine | 5432 | user/pass/db: `wishly` | `postgres_data` volume, healthcheck 5s/5s/10s |
| **minio** | minio/minio:latest | 9000 (API), 9001 (console) | minioadmin/minioadmin | `minio_data` volume |
| **minio-init** | minio/mc:latest | — | — | One-shot: creates `wishly` bucket + public read policy |

**Verify:**
```bash
# Check Postgres
psql postgresql://wishly:wishly@localhost/wishly -c "SELECT 1"

# Access MinIO console
open http://localhost:9001  # user: minioadmin, pass: minioadmin
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (from apps/api/schema.prisma)
pnpm prisma:migrate

# Seed 3 Plans + 1 Discount
pnpm prisma:seed
```

**Schema location:** `libs/db/prisma/schema.prisma` (not root `prisma/` which is untracked stray artifact).

### 4. Sync Templates

```bash
pnpm sync:templates
```

Upserts 14 invitation templates (7 wedding, 2 birthday, 2 baby-month, 2 corporate) to the database from the registry.

### 5. Start Services

```bash
pnpm start:all
```

Or individually:
- `pnpm start:api` (3001)
- `pnpm start:web` (4200)
- `pnpm start:studio` (4201)

**Wait for compilation.** First build takes 30–60s.

### 6. Access Applications

- **Web** (public guest surface) — `http://localhost:4200`
- **Studio** (editor) — `http://localhost:4201`
- **API** — `http://localhost:3001/api`
- **MinIO Console** — `http://localhost:9001`

---

## Environment Variables

### All Environment Variables (Complete Matrix)

**Server-side only** (`.env` file or shell variables):

| Var | Default | Required | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | `development` | No | Node environment (dev \| production) |
| `API_PORT` | 3001 | No | API server port |
| `PORT` | (fallback from API_PORT) | No | Alternative port name |
| `DATABASE_URL` | `postgresql://wishly:wishly@localhost/wishly` | Yes | Postgres connection string |
| `JWT_SECRET` | — | **Yes (fail-fast)** | Token signing key, min 32 bytes |
| `JWT_ACCESS_TTL` | 15m | No | Access token expiration |
| `JWT_REFRESH_TTL` | 30d | No | Refresh token expiration |
| `ANON_SESSION_SECRET` | — | **Yes (fail-fast)** | Anonymous session HMAC key, min 32 bytes |
| `GOOGLE_CLIENT_ID` | — | No | Google OAuth client ID (omit to disable) |
| `GOOGLE_CLIENT_SECRET` | — | No | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` | No | OAuth redirect URL |
| `WEB_ORIGIN` | `http://localhost:4200` | No | Web app CORS origin, OAuth returnTo allowlist |
| `STUDIO_ORIGIN` | `http://localhost:4201` | No | Studio app CORS origin |
| `PUBLIC_WEB_URL` | `http://localhost:4200` | No | Public web URL (used in OG/email redirects) |
| `PUBLIC_STUDIO_URL` | `http://localhost:4201` | No | Public studio URL (used in partner invites) |
| `PUBLIC_API_URL` | `http://localhost:3001/api` | No | Public API URL (used in OG HTML) |
| `STUDIO_URL` | `http://localhost:4201` | No | Internal studio URL (from API's perspective) |
| `S3_ENDPOINT` | `http://localhost:9000` | No | S3-compatible endpoint |
| `S3_REGION` | `us-east-1` | No | S3 region |
| `S3_BUCKET` | `wishly` | No | S3 bucket name |
| `S3_ACCESS_KEY_ID` | `minioadmin` | **Yes (fail-fast)** | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `minioadmin` | **Yes (fail-fast)** | S3 secret key |
| `S3_PUBLIC_URL` | `http://localhost:9001/wishly` | No | Public URL for S3 objects (for media display) |
| `S3_FORCE_PATH_STYLE` | `true` | No | Force path-style S3 URLs (for MinIO compatibility) |
| `BANK_BIN` | — | No | Bank BIN code (for VietQR generation) |
| `BANK_ACCOUNT_NO` | — | No | Bank account number |
| `BANK_ACCOUNT_HOLDER` | — | No | Account holder name (Vietnamese) |
| `BANK_NAME` | — | No | Bank name (Vietnamese) |
| `MAIL_DRIVER` | `console` | No | Mail provider (console \| smtp \| stub) |
| `SMTP_HOST` | — | No | SMTP server host (if MAIL_DRIVER=smtp) |
| `SMTP_PORT` | 587 | No | SMTP port |
| `SMTP_USER` | — | No | SMTP username |
| `SMTP_PASS` | — | No | SMTP password |
| `MOMO_PARTNER_CODE` | — | No | MoMo merchant code (not implemented) |
| `ADMIN_SECRET` | — | No | Admin panel secret (`x-admin-secret` header) |
| `DEV_AUTH_BYPASS` | `false` | No | Bypass auth in dev (server-side only, not in `import.meta.env`) |

**Frontend vars** (Vite, `import.meta.env.*`):

| Var | Default | Used By |
|---|---|---|
| `VITE_API_URL` | `/api` (Vite proxy) | Both apps |
| `VITE_PUBLIC_API_URL` | (not used) | — |
| `VITE_PUBLIC_WEB_URL` | `http://localhost:4200` | — |
| `VITE_WEB_URL` | `http://localhost:4200` | web app |
| `VITE_STUDIO_URL` | `http://localhost:4201` | studio app |
| `VITE_S3_PUBLIC_URL` | `http://localhost:9001/wishly` | Both apps (for presigned URLs) |

### Fail-Fast Variables (Boot-Time)

If missing at startup, the app fails immediately (not at request time):

| Var | Consumer | Error Message |
|---|---|---|
| `JWT_SECRET` | NestJS ConfigService | Missing `JWT_SECRET` |
| `ANON_SESSION_SECRET` | NestJS ConfigService | Missing `ANON_SESSION_SECRET` |
| `S3_ACCESS_KEY_ID` | S3Client constructor | Missing `S3_ACCESS_KEY_ID` |
| `S3_SECRET_ACCESS_KEY` | S3Client constructor | Missing `S3_SECRET_ACCESS_KEY` |
| `S3_BUCKET` | S3Client constructor | Missing `S3_BUCKET` |
| `GOOGLE_*` (if set) | Passport GoogleStrategy | Incomplete Google OAuth config |

**Configuration module has no `validationSchema`** — other vars fail late at request time.

### Setup Example

Create `.env` in repo root:

```bash
# Server
NODE_ENV=development
API_PORT=3001
DATABASE_URL=postgresql://wishly:wishly@localhost/wishly
JWT_SECRET=your-secret-key-min-32-bytes-random-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
ANON_SESSION_SECRET=another-secret-key-min-32-bytes
WEB_ORIGIN=http://localhost:4200
STUDIO_ORIGIN=http://localhost:4201
PUBLIC_WEB_URL=http://localhost:4200
PUBLIC_STUDIO_URL=http://localhost:4201
PUBLIC_API_URL=http://localhost:3001/api

# S3
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=wishly
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_PUBLIC_URL=http://localhost:9001/wishly
S3_FORCE_PATH_STYLE=true

# Mail (stub for now)
MAIL_DRIVER=console

# Bank (optional for VietQR)
BANK_BIN=970422
BANK_ACCOUNT_NO=1234567890
BANK_ACCOUNT_HOLDER=Nguyễn Văn A
BANK_NAME=Techcombank

# Optional
DEV_AUTH_BYPASS=true
```

Load with:
```bash
source .env
pnpm start:all
```

Or skip creating `.env` and rely on defaults (works locally only).

---

## Local Workflow

### Create Test Invitation

1. Visit `http://localhost:4200/create`
2. Follow 4-step wizard
3. Enter name (e.g., "Nguyễn & Hương")
4. Select template + guest count → Free tier
5. Click "Create" → signs you up + redirects to studio

### Edit & Publish

1. Studio opens to draft editor (`/edit/:id`)
2. Add cover, invite, party blocks (required)
3. Click "Publish" (6-step pipeline, artificial 400ms beats per step)
4. Publishes to live URL: `http://localhost:4200/<slug>`

### Guest RSVP

1. Share `http://localhost:4200/<slug>` with guests
2. Click "RSVP" → `http://localhost:4200/guest/:token`
3. Enter name + phone + RSVP status
4. Back in studio `/edit/:id/guests` → see count update

### Check-in

1. Visit `http://localhost:4200/checkin`
2. Enter staff token (from `/edit/:id/staff`)
3. Scan QR code or search guest
4. Confirm check-in (stores in localStorage, syncs every 10s)
5. Offline roster survives browser refresh

---

## Docker Compose Details

### postgres Service

```yaml
image: postgres:16-alpine
environment:
  POSTGRES_USER: wishly
  POSTGRES_PASSWORD: wishly
  POSTGRES_DB: wishly
volumes:
  - postgres_data:/var/lib/postgresql/data
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U wishly"]
  interval: 5s
  timeout: 5s
  retries: 10
```

**Data persists** in `postgres_data` volume. To reset:
```bash
docker compose down -v
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
```

### minio Service

```yaml
image: minio/minio:latest
environment:
  MINIO_ROOT_USER: minioadmin
  MINIO_ROOT_PASSWORD: minioadmin
volumes:
  - minio_data:/data
```

**Access console:** `http://localhost:9001` (user/pass: minioadmin/minioadmin).

**Data persists** in `minio_data` volume.

### minio-init Service

One-shot job:
```bash
mc mb -p local/wishly
mc anonymous set download local/wishly
```

Creates bucket `wishly` + sets public read policy (allows S3_PUBLIC_URL access).

---

## CI/CD Issues

### Current State: Non-Functional

`.github/workflows/ci.yml` cannot pass. Four blockers:

1. **`npm ci` in pnpm workspace**
   - Repo declares `packageManager: pnpm@10.26.2`
   - Lockfile is `pnpm-lock.yaml`
   - `.gitignore` excludes `package-lock.json`
   - But CI runs `npm ci` → fails immediately
   - **Fix:** Add `pnpm/action-setup` + `pnpm install --frozen-lockfile`

2. **Nx Cloud steps contradict `neverConnectToCloud`**
   - `nx.json` has `neverConnectToCloud: true`
   - But CI calls `nx start-ci-run`, `nx record`, `nx fix-ci` (Nx Cloud features)
   - **Fix:** Remove Cloud steps, use `nx run-many` directly

3. **Non-existent test/e2e targets**
   - CI calls `nx run-many -t lint test build typecheck e2e`
   - No `test` target defined (no `vitest.config` on projects, `unitTestRunner: "none"`)
   - No `e2e` target anywhere
   - **Fix:** Either (a) add test targets + write tests, or (b) remove from CI for now

4. **Wrong cache strategy**
   - `actions/setup-node` with `cache: 'npm'` (wrong for pnpm)
   - **Fix:** Use `cache: 'pnpm'` and `pnpm/action-setup`

### Roadmap Fix (Weeks 1–2)

1. Replace `npm ci` → `pnpm install --frozen-lockfile`
2. Add `pnpm/action-setup` before install
3. Remove `nx start-ci-run`, `nx record`, `nx fix-ci` steps
4. Replace `cache: 'npm'` with `cache: 'pnpm'`
5. Change `-t test e2e` to `-t lint build typecheck` (skip missing targets)
6. Test locally: `pnpm nx lint && pnpm nx build && pnpm nx typecheck`

---

## Production Deployment (Blockers)

**Not currently possible.** Missing:

1. **Dockerfile** — no container image exists
2. **Deployment target** — no documented environment (AWS, K8s, etc.)
3. **Database backup strategy** — no automated backup plan
4. **Secrets management** — no Vault/Secrets Manager integration
5. **Load balancing** — single app instance only
6. **Multi-instance coordination** — ViewBufferService + throttler are in-memory
7. **Monitoring/logging** — no Sentry/DataDog/ELK integration
8. **CDN** — media served directly from MinIO (no CloudFront)

**Timeline:** Estimate 4–6 weeks for production-ready setup (containerization, secrets, monitoring, database, DNS).

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
API_PORT=3002 pnpm start:api
```

### Docker Postgres Not Responding

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs postgres

# Restart
docker compose restart postgres
```

### S3 Connection Refused

```bash
# Verify MinIO is running
curl http://localhost:9000/minio/health/live

# Reinitialize bucket
docker compose restart minio minio-init
```

### Stale Node Modules

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm prisma:generate
```

### Database Migration Conflict

```bash
# Check migrations
psql postgresql://wishly:wishly@localhost/wishly -c "SELECT * FROM _prisma_migrations"

# Reset (if safe)
pnpm prisma migrate reset
pnpm prisma:seed
```

---

## Known Issues (Local Dev)

- **First build slow:** TypeScript compilation + Tailwind JIT takes 30–60s
- **Autosave polling:** Studio editor polls `/api/invitations/:id` every 800ms (check browser devtools Network tab)
- **localStorage persistence:** Draft state persists across reloads; to reset: `localStorage.clear()` then refresh
- **No hot reload for API routes:** Restart `pnpm start:api` after code changes
- **CORS may block locally:** If accessing from different origin, check `WEB_ORIGIN` + `STUDIO_ORIGIN` env vars

