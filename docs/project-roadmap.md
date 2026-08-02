# Project Roadmap

Current state, tech debt, known issues, and next priorities. Last updated 2026-07-30.

## Current State

**Active development:** Wishly is feature-complete through P12 (partner/B2B channel). The product supports the full invitation lifecycle from creation through post-event album and partner reselling.

**Production readiness:** **Not deployed.** Local `docker-compose.yml` provides Postgres + MinIO only. Apps run on host via `nx serve`. No Dockerfile, no Kubernetes, no managed database. Deployment target is undocumented.

**Testing:** **Zero tests in repo.** Staged infrastructure exists (vitest.config.ts, Playwright, @testing-library/jest-dom) but no test targets. Visual verification of templates only via `tools/verify-template.ts`.

**CI/CD:** GitHub Actions workflow is **non-functional** — uses Nx Cloud features, npm in a pnpm workspace, and targets non-existent test/e2e tasks.

---

## Known Tech Debt

### 1. Duplication (Near-Term)

| Item | Impact | Effort | Priority |
|---|---|---|---|
| Two HTTP transports | FE code duplication, response shape inconsistency | Medium | High |
| Two ApiError classes | Maintenance burden, drift | Low | Medium |
| Template filter logic | DRY violation in web + studio | Low | Low |
| Palette hex in 2 places | Sync/verification risk | Low | High |
| `formatVnd`, `lib/media-url.ts` duplicated | Code duplication | Low | Low |

### 2. Incomplete Features

| Feature | Status | Unresolved |
|---|---|---|
| **Google OAuth** | Implemented | Optional; no fallback UI if disabled |
| **Notifications (email/ZNS)** | Stub only | SMTP provider not wired, Zalo OA not live |
| **MoMo payments** | Not implemented | `payUrl` hard-coded null; endpoint returns 503 |
| **Admin panel** | Not implemented | Partial routes exist (payments confirm/refund) |
| **Offline draft recovery** | Not implemented | `readLocalDraft()` has no callers |
| **Audit logging** | Partial | Seating only; check-in has no audit trail |

### 3. Data Model Inconsistencies

| Issue | Risk | Roadmap |
|---|---|---|
| **Enum-like String columns (15)** | Validation at app-level only, no DB enforcement | Migrate to Prisma enums (medium effort) |
| **Hand-duplicated enums** | EventType, Tier, InvStatus drift from Prisma | Derive from Prisma via code generation |
| **Missing FKs (13 scalars)** | Orphan risk, tenant isolation app-only | Add database FKs or reconsider design |
| **GiftAccount table** | Appears superseded by `Invitation.content.gift.accounts` | Safe to drop (verify no FK, no consumers) |
| **Template table** | Never seeded, no FK from Invitation | Safe to drop (verify old migrations) |
| **Invoice code generation** | Generated in 3 places without locks | Consolidate into service + advisory lock |

### 4. Security Issues

| Issue | Severity | Fix |
|---|---|---|
| Access/refresh tokens interchangeable | High | Separate `JWT_REFRESH_SECRET` or add `typ` claim |
| `access_token` maxAge hard-coded vs `JWT_ACCESS_TTL` env var | Medium | Read from env or sync via middleware |
| AdminGuard `!==` (not constant-time) | Medium | Use `timingSafeEqual` (like AnonSessionMiddleware) |
| StaffTokenGuard plaintext tokens | Medium | Hash tokens (bcrypt-10) + store hash |
| ConfigModule no validationSchema | Medium | Add strict validation, fail-fast at boot |
| GET /api requires JWT | Low | Add `@Public()` for health check |
| DEV_AUTH_BYPASS not gated on import.meta.env.DEV | Low | Server-side check is sufficient, but document |

---

## Roadmap: Prioritized Work

### Phase A: Foundation (Weeks 1–2)

**Goal:** Make the codebase maintainable and testable.

1. **Fix CI for pnpm without Nx Cloud**
   - Replace `npm ci` with `pnpm install --frozen-lockfile`
   - Remove `nx start-ci-run`, `nx record`, `nx fix-ci` steps
   - Replace `-t test e2e` with actual targets (pending phase B)
   - Status: ❌ Not started
   - Effort: 4 hours

2. **Establish test layer**
   - Decide: unit (vitest) first or integration (Playwright)?
   - Recommendation: vitest for services/utils, skip frontend tests for now
   - Enable `test` Nx target on libs + api
   - Write 5–10 core tests (auth, invitation publish, payment flow)
   - Status: ❌ Not started
   - Effort: 16–20 hours

### Phase B: Collapse Duplication (Weeks 3–4)

**Goal:** Single HTTP transport, consistent response shapes.

1. **Consolidate HTTP transports**
   - Migrate P01–P06 routes to enveloped shape
   - Single `@wishly/api-client` for all routes
   - Remove `apps/*/src/lib/api.ts` stubs
   - Status: ⚠️ In design phase
   - Effort: 12 hours
   - Risk: affects all FE code, needs careful coordination

2. **De-duplicate palette hex**
   - ✅ Consolidate to single source (templates) — palette-bridge.ts deleted 2026-07-30
   - OG now imports directly from `@wishly/templates/themes` via subpath export
   - Remaining task: Establish build-time sync between templates + libs/ui tokens (1 copy)
   - Status: 🚧 Partial (OG consolidation done; UI tokens still manual)
   - Effort: 2 hours (for build-time sync tool)

3. **Refactor response envelopes**
   - Finish cut-over from bare JSON to `{data}` + `{error}`
   - Remove convention #19 ambiguity
   - Document response shape contract in contracts lib
   - Status: 🚧 Partially in P07–P13
   - Effort: 8 hours

### Phase C: Security Hardening (Week 5)

**Goal:** Fix high/medium severity issues.

1. **Separate JWT secrets**
   - Add `JWT_REFRESH_SECRET` (or `JWT_REFRESH_TTL` + separate signing logic)
   - Rotate refresh token → new access token on use
   - Status: ❌ Not started
   - Effort: 6 hours

2. **Token hashing**
   - Hash StaffAccess tokens (bcrypt-10)
   - Hash refresh tokens optional (depends on secret separation)
   - Status: ❌ Not started
   - Effort: 4 hours

3. **ConfigModule validation**
   - Add strict `validationSchema` to ConfigModule (class-validator or simpler)
   - Fail-fast at boot, not at request time
   - Status: ❌ Not started
   - Effort: 4 hours

### Phase D: Data Model Cleanup (Weeks 6–7)

**Goal:** Reduce orphan risk, strengthen invariants.

1. **Migrate 15 String enums to Prisma enums**
   - Create new enum columns
   - Backfill data
   - Drop old columns
   - Status: ❌ Not started
   - Effort: 12 hours

2. **Add missing FKs (or restructure)**
   - Decide: add FKs to `Rsvp.invitationId`, `GiftEntry.invitationId`, etc., or
   - Split into separate schema with explicit FK requirements
   - Status: ❌ Waiting on team decision
   - Effort: 20+ hours

3. **Drop dead tables**
   - Verify `GiftAccount` unused: grep codebase, check FKs
   - Verify `Template` table unused (seed-only)
   - Create migration to drop
   - Update contracts if any reference
   - Status: ❌ Not started
   - Effort: 2 hours (if safe to drop)

### Phase E: Feature Completeness (Weeks 8–10)

**Goal:** Wire up placeholder features.

1. **Email provider integration**
   - Choose provider (SendGrid, Mailgun, Braze)
   - Wire SMTP or API client
   - Test digest + consent-required emails
   - Status: ❌ Not started
   - Effort: 8 hours

2. **Optional: Zalo OA / message auto-send**
   - Zalo OA requires business registration + approval
   - Scope: 3–6 month waiting period + setup
   - Defer until email + SMS working
   - Status: ❓ Out of scope for now

3. **Optional: MoMo payment**
   - Currently returns 503 (not implemented)
   - Integrate MoMo merchant API
   - Test payment flow
   - Status: ❓ Lower priority than VietQR

### Phase F: Operational Readiness (Weeks 11–12)

**Goal:** Deploy to staging/production.

1. **Containerization**
   - Write Dockerfile (multi-stage: build → runtime)
   - Document image build + push
   - Status: ❌ Not started
   - Effort: 6 hours

2. **Database migration strategy**
   - Document schema versioning + rollback
   - Test migration on staging
   - Status: ❌ Not started
   - Effort: 4 hours

3. **Monitoring & logging**
   - Choose provider (Sentry, DataDog, etc.)
   - Instrument error tracking, performance
   - Status: ❌ Not started
   - Effort: 8 hours

4. **Production env-var secrets**
   - Rotation strategy (no `.env` in repo)
   - Secure storage (HashiCorp Vault, AWS Secrets, etc.)
   - Status: ❌ Not started
   - Effort: 4 hours

---

## Known Unresolved Questions

1. **Multi-instance deployment in scope?** Affects ViewBufferService + throttler storage externalisation (Redis/PostgreSQL).
2. **Access/refresh token rotation?** Is refresh-token-→-new-access-token-on-use intended, or separate secrets only?
3. **Full envelope migration?** Is bare JSON P01–P06 legacy, or intentional coexistence?
4. **GiftAccount/Template tables safe to drop?** Needs verification against migrations + consumers.
5. **Enum-like columns in Prisma enums?** Full migration or selective?
6. **Audit logging scope?** Seating has it; should check-in, edits, refunds also audit?
7. **Admin panel scope?** Payments confirm/refund exist; full CRUD dashboard needed?
8. **Offline draft recovery?** `readLocalDraft()` has no callers — is this unfinished or deliberately deferred?
9. **Deployment target?** What is the canonical production environment (AWS EC2, K8s, serverless)?
10. **Test-first priority?** Unit (vitest) or integration (Playwright) first?

---

## Metrics & Success Criteria

### Development Velocity

- **Current:** Anecdotal (10 phases in ~21h design sprint)
- **Desired:** Track via PR size, review time, cycle time per feature
- **Action:** Establish GitHub project board with story points

### Quality

- **Current:** Zero tests, no coverage metrics, visual verification only (templates)
- **Desired:** ≥70% coverage on services + API routes, Playwright smoke tests for key flows
- **Action:** Establish baseline after phase B (test layer)

### Production Readiness

- **Current:** Not deployed
- **Desired:** 99.5% uptime SLA, <5s p99 response time, <1h recovery from outage
- **Action:** Post-deployment monitoring setup (phase F)

---

## Next 30 Days (Current Priority)

1. ✅ **Initial docs** (this file, system architecture, code standards)
2. 🚧 **Fix CI** (pnpm + remove Nx Cloud)
3. 🚧 **First 10 tests** (vitest: auth, invitations service, privacy)
4. 📋 **Security audit** (detailed report + mitigation timeline)
5. 📋 **Consolidate HTTP transports** (design + planning phase)

See [**Code Standards**](code-standards.md) and [**System Architecture**](system-architecture.md) for current implementation details.

