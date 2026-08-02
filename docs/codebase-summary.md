# Codebase Summary

Overview of each project in the Wishly monorepo, its purpose, public surface, and dependencies.

## Dependency Direction

```
apps/web  ─┐
           ├─→ libs/api-client ──→ libs/contracts ─→ (rest consumed via env-vars)
apps/studio┤
           └─→ libs/ui, libs/templates
           
apps/api ──→ libs/db ──→ PostgreSQL
          ──→ libs/contracts
          ──→ @aws-sdk (S3)
```

All imports use workspace package names (`@wishly/*`), TS project references, and the custom condition `@wishly/source` for consuming unbuilt source. No `@/` or `~/` path aliases.

---

## apps/api — NestJS REST Backend

**Purpose:** Core business logic, data persistence, external service integration (S3, bank VietQR), scheduled jobs.

**Tech:** NestJS 11, Express, Prisma ORM, Passport auth, AWS SDK S3 client, node-schedule.

**Port:** 3001 (dev) / `API_PORT` env var

**Structure:**
- `src/main.ts` — bootstrap (helmet, cookie-parser, CORS, global prefix `/api`, guards: Throttler + JwtAuth)
- `src/app/` — root controller (health check — **currently requires JWT auth, unusable as health endpoint**)
- `src/common/` — plumbing (Zod validation pipe, Zod DTO factory, advisory-lock helper, decorators, guards, middleware)
- `src/{domain}/` — 15 feature modules (flat layout): `auth`, `media`, `plans`, `invitations`, `guests`, `public`, `orders`, `seating`, `checkin`, `post-event`, `partner`, `notifications`, `og`

**Key files:**
- `src/invitations/invitations.service.ts` — single authorization gate (`assertCanAccess`) for B2C + B2B + anonymous drafts
- `src/invitations/partner-access.ts` — pure function evaluating partner member roles (admin/edit/view)
- `src/prisma/prisma.service.ts` — Prisma client singleton with HMR guard
- `src/common/advisory-lock.ts` — `withAdvisoryLock` wrapper (pg_try_advisory_lock)
- `src/notifications/` — stub mailers (logs only)

**Response shapes:** Two conventions coexist (#19 in code comments). P01–P06 routes return bare JSON. P07–P13 routes opt-in to `ResponseEnvelopeInterceptor` (wraps in `{data}`) and `HttpExceptionEnvelopeFilter` (wraps errors in `{error:{code,message,details}}`). Both interceptor/filter explicitly say "never register globally."

**Validation:** Zod only (zero `class-validator`). Schemas in `@wishly/contracts`. Two patterns: (1) `ZodValidationPipe(Schema)` on `@Body()` + `body as never` cast (dominant), (2) `createZodDto` for a class with static `.schema` property (15 DTOs, only 3 imported).

**Env vars used:** 24 required/optional (see `ANON_SESSION_SECRET`, `JWT_SECRET`, S3 vars fail-fast at DI). Missing validation: no `ConfigModule.validationSchema`.

**Zero tests.** Infrastructure: `vitest.config.ts` exists but no `test` Nx target.

---

## apps/web — React Public Guest Surface

**Purpose:** Landing page, template preview/gallery, create invitation (anonymous), RSVP, guestbook, guest self-service (privacy), album upload, recap.

**Tech:** React 19, Vite, React Router (flat routes), React Query, Tailwind 4.

**Port:** 4200 (dev) / `WEB_ORIGIN` env var

**Structure:**
- `src/main.tsx` — entry (StrictMode, QueryClientProvider, BrowserRouter)
- `src/app/` — routes (no lazy loading, no Suspense, no route guards)
  - `/` Landing
  - `/templates` + `/templates/:slug` Preview gallery
  - `/create` 4-step anonymous create flow
  - `/guest/:token` Guest self-service (RSVP, guestbook, gift entry, privacy)
  - `/checkin` Staff terminal — hardcoded dark UI with offline-first roster + QR scanning
  - `/album/:slug` Album upload (presigned-PUT)
  - `/recap/:shareToken` Public recap
  - `/:slug` Invitation page (public, last route)
  - `*` NotFound
- `src/components/` — reusable components (PascalCase, deep paths)
- `src/lib/` — helpers (api.ts, qr-scanner.ts, guest-files.ts, format helpers)

**Notable features:**
- **Checkin page** (603 L) — offline-first. BarcodeDetector (native) falling back to dynamically-imported `@zxing/browser`. Roster + queue in localStorage. Idem-sync every 10s + on `online` event. Diacritic-insensitive search (NFD strip).
- **Create flow** (595 L) — 4 steps, 2200ms minimum loading beat (deliberate), Google OAuth redirect.
- **Templates page** (584 L) — heuristic style/color filtering from slug/palette matching.
- **Album page** — presigned-PUT workflow, per-file progress, 8MB cap.

**Auth:** HttpOnly cookie (no token in storage). Anonymous draft → Google OAuth → `?auth=1` → `api.claim()`. No logout, no login screen.

**HTTP transport:** `src/lib/api.ts` (188 L) — custom fetch wrapper, not `@wishly/api-client` (P01–P06 routes return bare JSON). Declares `ApiError`, `AuthUser`, etc. locally (drift vs studio).

---

## apps/studio — React Authenticated Editor

**Purpose:** Invitation editor (core product), guest list management, seating, check-in staff links, post-event album/thanks/recap, partner dashboard.

**Tech:** React 19, Vite, React Router data router, Zustand store, React Query, Tailwind 4.

**Port:** 4201 (dev) / `STUDIO_ORIGIN` env var

**Structure:**
- `src/app/` — data router with declarative `RouteHandle` pattern (per-route chrome config: title, crumb, maxWidth, header right button, fullBleed, sticky)
- `src/features/` — domain-organized (editor, guests, seating, checkin, post-event, partner) with `components/`, `hooks/`, `stores/`, `helpers/` subdirs
- `src/components/` — layout, shared UI

**Editor state:** Zustand store with revision counter (bumped by mutating actions, not hydration). Autosave subscribes to revision. Persists draft to `localStorage['wishly:draft:{id}']` immediately (no debounce), with 800ms debounce for server sync. `flush()` awaits before publish/FREE→upgrade.

**Seating:** optimistic updates with rollback in React Query `onMutate`/`onError` (only true optimistic pattern in FE codebase).

**Auth:** Cookie-based. No login screen, no logout button. `GET /auth/me` called only by AccountAvatar.

**HTTP transport:** `src/lib/api.ts` (383 L) — similar to web's but with more domain re-exports (plans, orders, invitations). Duplicates `ApiError`, `InvitationRecord`, `AuthUser` with drift vs web.

**Zero tests.**

---

## libs/db — Data Model & Prisma Client

**Purpose:** Single Postgres schema source, migrations, seed script, Prisma client singleton.

**Schema:** `libs/db/prisma/schema.prisma` (23 models). **No `@map`/`@@map`** → Postgres identifiers are quoted camelCase.

**Public surface:** 2 lines in `src/index.ts`:
```ts
export { prisma, PrismaClient }
export type { Prisma }
```

**Client:** `src/lib/prisma.ts` singleton with `globalThis` HMR guard.

**Models grouped:**
- **Identity/catalog:** User, Plan, Template, Discount
- **Aggregate root:** Invitation (40 fields, all domains stacked)
- **Guests:** Guest, Rsvp (append-only), GuestbookEntry, GiftEntry
- **Orders:** Order (planSnapshot, shortCode, refundable logic)
- **Seating:** SeatingTable
- **Check-in:** StaffAccess (token + expiry + revoke)
- **Post-event:** Album, AlbumPhoto, AlbumUploadQuota, ThankYouSend
- **Partner:** Partner, PartnerBrand (1:1), PartnerMember, PartnerTemplate, PartnerSubscription, PartnerInvoice

**Referential integrity:**
- 17 FKs with CASCADE or SET NULL
- **Orphan risk:** 13 FK-shaped scalars with NO database FK (`Rsvp.invitationId`, `GiftEntry.invitationId`, `GiftAccount.invitationId` etc.) — tenant isolation via app-level filtering
- No soft-delete (`deletedAt`), anonymise-on-schedule instead (`purgeAt` → `purgedAt`)

**Seed:** 3 Plans + 1 Discount (no Users/Invitations/Templates).

**10 migrations** (hand-written idempotent #2–#3, Prisma-generated #1/#4, hand-written non-idempotent #5–#10).

---

## libs/contracts — Zod Validation Schemas

**Purpose:** Single source of truth for API contracts, shared FE+BE, consumed unbuilt via TS source.

**Tech:** Zod 4, ESM, project reference + custom condition `@wishly/source`.

**Core exports:**
- **Dual schema pattern:** `InvitationContentSchema` (strict, `.min(1)`) + `DraftInvitationContentSchema` (lenient, `.default('')`) — allows mid-edit autosave while publish enforces strictness
- **Block system:** 11 keys (cover, invite, story, album, party, rsvp, gift, guestbook, agenda, practical, entry-pass), per-block content schemas with caps, `DEFAULT_BLOCK_ORDER` + `CORPORATE_BLOCK_ORDER`
- **Guest & domain schemas:** `ImportGuestsSchema` (≤200k chars, consent gate), `CheckinSyncBatchSchema` (≤200 rows), `PartnerPlanTier` enum, etc.
- **Messages:** `MessageKey` (18 keys for ZNS/email), `renderMessage`/`renderSubject`, `ZNS_MAX_CHARS = 200`
- **Helpers:** `deriveGuestRole`, `passcode` formatting, `vietQrImageUrl`, `MediaKeySchema` (keys only, never URLs)

**Hand-duplicated enums:** EventType, Tier, InvStatus (from Prisma, no derived source).

**Contract ↔ Prisma divergences:** Enums duplicated, `GiftContentSchema.accounts[].owner` vs `GiftAccount.holder`, missing contracts for Plan.features/priceByEvent/Template/Discount/GiftAccount/seatingLog/Order.planSnapshot, validation rules absent from DB (remindedCount≤2, partySize≤20, capacity≤40).

---

## libs/ui — Design System

**Purpose:** Shadcn/ui component library (60 L1 primitives), L2 props-first facades, Tailwind 4 CSS tokens.

**Structure (4 layers):**
- `src/components/ui/` — **L1 Origin** shadcn primitives (kebab-case, Radix), 22 using Heroicons instead of lucide (60 total, no `lucide-react` dependency)
- `src/components/patterns/` — **L2 Complete** props-first facades, prefix `Base` (BaseTextField, BaseTextAreaField, BaseSelectField, BaseSwitchField, BaseCheckboxField, BaseConfirmDialog, BaseDropdownMenu, BaseDatePicker, BaseDatePickerTime, BaseDropzone). `Field*` compound sống ở `ui/field.tsx` (L1, không prefix).
- `src/components/brand/` — **Brand** (SectionLabel, DiamondRule, Wordmark, RingStat)
- `src/components/states/` — **States** (EmptyState, ErrorState, OfflineBanner, LoadingSkeleton)
- `src/styles/` — three-layer CSS (tokens.css → theme.css `@theme inline` → base.css)
- `src/fonts.ts` — self-hosted @fontsource (4 families: Be Vietnam Pro, Cormorant Garamond, Playfair Display, Lora)

**Tokens:**
- Colors: primary (#B04A3A), background (#F6F1E7), border, semantic (success, warning, destructive)
- Radii: sharp (2px), default (3px), card (4px), pill (999px)
- Fonts: sans, serif, serif-display, serif-read (loaded side-effect-only via fonts.ts)
- Motion: 140ms duration (→ 0ms under reduced-motion)
- Touch targets: 44px hit-min, 48px hit, 56px hit-lg

**No dark mode.** Single light "cream" theme.

**Barrel:** explicit named re-exports with `.js` extensions (NodeNext). Subpath exports for `./globals.css`, `./fonts`. **Does NOT declare `@wishly/source` condition** (inconsistency with templates/api-client).

---

## libs/templates — Invitation Templates & Renderers

**Purpose:** 14 template definitions (pure data), `InvitationRenderer.tsx` for editor + public-page rendering, 8 palettes with themeable CSS vars. OG images are a **separate** satori-based render path (`apps/api/src/og/og.service.ts`) that shares the same palette/font source via `@wishly/templates/themes` but does not use `InvitationRenderer` (satori doesn't run React).

**Templates:**
- **Wedding** (8): co-ngu, ao-dai, sen-ha, giay-trang, sai-gon, tra-chieu, son-mai, vang-cat
- **Birthday** (2): sinh-nhat-tra, sinh-nhat-giay
- **Baby-month** (2): day-thang-cat, day-thang-sen
- **Corporate** (2): cong-ty-tat-nien, cong-ty-hoi-nghi

Template = `{meta, theme, blocks: {key,enabled,order}[], content: Record}` (pure data, no React components).

**11 block renderers:** cover, invite, story, album, party, rsvp (~358 L), gift, guestbook, agenda, practical, entry-pass (lazy corporate blocks).

**InvitationRenderer.tsx** — single source of truth. Parses content, filters enabled blocks, skips on schema failure, renders `<article data-invitation-renderer>` with resolved CSS vars inline. Emits watermark on FREE tier.

**Palettes:** 8 authoritative in `palettes.ts`, `derivePalette(brandColor)` runtime 9th. **Hex values exist in 2 independent places** (templates, libs/ui tokens) — no verification. (`apps/api/src/og/palette-bridge.ts` was deleted 2026-07-30; OG now imports from `@wishly/templates/themes` instead.)

**Fonts:** 4 presets, only `be-cormorant` is `verified: true` (glyph coverage + contrast gate via `tools/verify-template.ts`).

**Verification:** Playwright-based (`tools/verify-template.ts`) — Vietnamese glyph coverage, contrast ≥4.5:1, no horizontal overflow, font load verification. WEDDING templates only.

---

## libs/api-client — HTTP Client & React Query Keys

**Purpose:** Envelope-aware fetch wrapper + React Query key factory for P07–P13 new endpoints only.

**Single 50-line fetch wrapper:** `http<T>()` with envelope awareness (204 → undefined; error → ApiError; `{data}` → unwrap; bare JSON → return as-is). Credentials: include (no auth header, no token refresh).

**Exports:** `http`, `ApiError`, `queryKeys` (nested factory), 7 domain API objects (privacyApi, seatingApi, checkinApi, albumApi, thanksApi, recapApi, partnerApi) with hand-written response types.

**No React Query hooks.** Only key factory; hooks wiring in apps.

**Barrel uses `export *` with extensionless specifiers.** Unlike libs/ui.

---

## tools/

**sync-templates.ts** — reads `TEMPLATE_REGISTRY` from source, upserts to DB by meta.id. One-directional registry → DB. Writes only `slug, name, tier, thumbKey, blocks, active, sortOrder`.

**verify-template.ts** — Playwright/chromium visual gate. Needs dev route `GET /_dev/templates/verify?slug=`. Enforces:
1. Vietnamese stress strings present
2. Hard glyph coverage (17 hard Vietnamese diacritics) + `document.fonts.check()` pass
3. No horizontal overflow
4. Contrast ≥4.5:1
5. `document.fonts.ready` awaited

Exits 1 on failure. WEDDING templates only.

---

## Git & CI

- **Root scripts:** `start*`, `prisma:*`, `verify:templates`, `sync:templates`, `gitnexus:serve`
- **Nx config:** `neverConnectToCloud: true`, `analytics: false`, plugins infer all targets
- **CI:** `.github/workflows/ci.yml` is **non-functional** (uses Nx Cloud, npm in pnpm workspace, test targets don't exist)

See [**Deployment Guide**](deployment-guide.md) for issues and [**Project Roadmap**](project-roadmap.md) for CI fix plan.

