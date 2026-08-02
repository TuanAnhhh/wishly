# Wishly / Thiệp Việt

Vietnamese digital invitation platform for weddings, birthdays, baby full-month, and corporate events. Wishly is a comprehensive event invitation solution combining invitation design, guest management, RSVP collection, giftbook, check-in, post-event album, and gift tracking.

## About Wishly

**Thiệp Việt** (Vietnamese Invitations) is a Vietnamese-first product. All user-facing copy, spreadsheet headers, email/ZNS message templates, and invitation content are in Vietnamese. The product is built for Vietnamese conventions including honorifics (cô/chú/anh/chị), Nghị định 13/2023 consent + retention compliance, VietQR bank transfer (no payments processed through our servers), and Zalo/ZNS messaging (200-char budget with manual paste).

Wishly is a B2C platform with a B2B partner/agency channel (Thiệp Việt Studio) allowing white-label reselling and tiered SaaS billing.

## Monorepo Structure

Nx 23.1.0 monorepo with 8 projects consuming a private npm workspace.

| Project | Path | Technology | Purpose |
|---|---|---|---|
| **web** | `apps/web` | React 19, Vite, TypeScript | Public guest surface — landing, template preview, create invitation, RSVP, guestbook, album, recap |
| **studio** | `apps/studio` | React 19, Vite, TypeScript | Authenticated owner/partner editor — invitation composition, guest management, seating, check-in, post-event |
| **api** | `apps/api` | NestJS 11, Express, TypeScript | REST API backend with Passport auth, Prisma ORM, AWS S3 integration, scheduled jobs |
| **db** | `libs/db` | Prisma 6, PostgreSQL | Data model, migrations, seed, client singleton |
| **contracts** | `libs/contracts` | Zod 4 validation | Single source of truth for API schemas — shared FE+BE |
| **ui** | `libs/ui` | shadcn/ui, Tailwind 4, React | Design system with 26 L1 primitives + L2 props-first facades + custom components |
| **templates** | `libs/templates` | React, TypeScript | Invitation template definitions, renderers, palettes (14 templates) |
| **api-client** | `libs/api-client` | TypeScript, Zod | Envelope-aware HTTP client + React Query key factory |

Cross-project dependency direction: `apps` → `libs` → `contracts` + `db`. All imports via workspace package names (`@wishly/*`).

## Prerequisites

- **Node.js** 24+ (tested 24.0.0)
- **pnpm** 10.26.2 (workspace lockfile + hoisting)
- **Docker** + **Docker Compose** (Postgres 16, MinIO S3)
- **Git**

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd wishly
pnpm install
```

### 2. Start Local Infrastructure

```bash
docker compose up -d
```

Brings up:
- **PostgreSQL 16** at `localhost:5432` (user/pass/db: `wishly`)
- **MinIO** S3 API at `localhost:9000` (user/pass: `minioadmin`)
- **MinIO Console** at `localhost:9001`

### 3. Database Setup

```bash
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run pending migrations
pnpm prisma:seed          # Seed 3 Plans + 1 Discount
```

### 4. Templates & Verification

```bash
pnpm sync:templates        # Upsert 14 templates to DB
pnpm verify:templates      # Visual glyph/contrast/overflow gate (optional, needs dev studio running)
```

### 5. Start All Services

```bash
pnpm start:all
```

Services will be available at:
- **Web** (guest surface) — `http://localhost:4200`
- **Studio** (editor) — `http://localhost:4201`
- **API** — `http://localhost:3001/api`

Individual services can be started with `pnpm start:{api,web,studio}`.

## Available Scripts

Via `pnpm` or `npm exec nx`:

| Script | Purpose |
|---|---|
| `pnpm start` | Start API only |
| `pnpm start:api` | Start API only |
| `pnpm start:web` | Start web app (port 4200) |
| `pnpm start:studio` | Start studio app (port 4201) |
| `pnpm start:all` | Start all three apps in parallel |
| `pnpm prisma:generate` | Generate Prisma client from schema |
| `pnpm prisma:migrate` | Run pending database migrations |
| `pnpm prisma:seed` | Seed database with Plans and Discount |
| `pnpm sync:templates` | Sync template registry to DB |
| `pnpm verify:templates` | Playwright-based visual verification of templates |
| `pnpm gitnexus:serve` | Start GitNexus code-intelligence server |

### Nx Tasks

All projects support the following Nx targets (inferred by plugins, not defined in `project.json`):

- `nx build <project>` — Build project
- `nx serve <project>` — Serve with live reload (apps only)
- `nx lint <project>` — ESLint check
- `nx typecheck <project>` — TypeScript check without emit
- `nx format:check` — Prettier check
- `nx graph` — Visualize project dependencies

Example: `nx build api` or `pnpm nx lint web`

## Environment Variables

See [**Deployment Guide**](docs/deployment-guide.md) for the complete env-var matrix. Key ones:

**Required for local dev:**
- `DATABASE_URL` — PostgreSQL connection (default: `postgresql://wishly:wishly@localhost/wishly`)
- `JWT_SECRET` — Token signing key
- `ANON_SESSION_SECRET` — Anonymous draft session HMAC key
- `S3_*` — MinIO credentials (provided by docker-compose defaults)

**Optional:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — Google OAuth (omit to disable)
- `DEV_AUTH_BYPASS` — Skip auth in dev (e.g., `DEV_AUTH_BYPASS=true npm run start`)

Copy `.env.example` to `.env` and fill in values, or set them in your shell.

## Documentation

- **[Project Overview & PDR](docs/project-overview-pdr.md)** — Product vision, feature phases, tiers, constraints
- **[Codebase Summary](docs/codebase-summary.md)** — Per-project tour, API surface, dependencies
- **[Code Standards](docs/code-standards.md)** — File naming, conventions, TypeScript idioms, validation patterns
- **[System Architecture](docs/system-architecture.md)** — Request lifecycle, authorization, data model, scheduled jobs
- **[Design System](docs/design-guidelines.md)** — CSS architecture, tokens, components, palettes, fonts
- **[Project Roadmap](docs/project-roadmap.md)** — Current status, tech debt, next priorities
- **[Deployment Guide](docs/deployment-guide.md)** — Local bring-up, env vars, CI/CD issues

## Testing

**Current state:** No tests exist in the repo. There is staged-but-unused infrastructure (`vitest.config.ts`, Playwright, `@testing-library/jest-dom`) with zero test targets. Visual verification of invitation templates is available via `pnpm verify:templates` (Playwright-based glyph/contrast/overflow gate).

See [**Project Roadmap**](docs/project-roadmap.md) → "Establish test layer" for planned work.

## CI/CD

The GitHub Actions workflow at `.github/workflows/ci.yml` is **non-functional**. See [**Deployment Guide**](docs/deployment-guide.md) → "CI Issues" for details. This is a roadmap priority.

## Key Conventions

1. **No alias paths** — cross-project imports use workspace package names (`@wishly/ui`, etc.) + TS project references
2. **Validation via Zod only** — contracts drive FE+BE validation; no class-validator
3. **Two HTTP transports currently coexist** (bare JSON for P01–P06, enveloped for P07+) — see [Code Standards](docs/code-standards.md)
4. **Authorization via `assertCanAccess` in services** — thin controllers delegate to service-level checks
5. **Invitation lifecycle is read-only after ENDED** — deliberately not deleted (keepsake rule)
6. **No dark mode** — single "cream" light theme
7. **Vietnamese-only UI copy** — no i18n framework; bilingual support only for corporate event content

## Development Workflow

1. **Read the codebase:** See [Codebase Summary](docs/codebase-summary.md)
2. **Understand the data model:** See [System Architecture](docs/system-architecture.md) → Data Model
3. **Follow code standards:** See [Code Standards](docs/code-standards.md)
4. **Check design rules:** See [Design Guidelines](docs/design-guidelines.md)
5. **Run tests:** (future — none yet)

## Team

Private MIT repository maintained by Checker Solutions.

---

For issues, questions, or contributions, see the [Project Roadmap](docs/project-roadmap.md) and check [Code Standards](docs/code-standards.md) for conventions to follow.
