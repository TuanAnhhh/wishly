# System Architecture

Runtime topology, request flows, authorization model, and core domain logic.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Client Layer                                                │
│ web (4200) ────┐  studio (4201) ────┐                      │
└────────────────┼────────────────────┼──────────────────────┘
                 │ VITE_API_URL       │ VITE_API_URL
                 │ (env or /api)      │ (env or /api)
                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│ API Layer (NestJS, port 3001)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Global Middleware: AnonSessionMiddleware (cookie HMAC)  │ │
│ │ Global Guards: JwtAuthGuard, ThrottlerGuard             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌──────────┬──────────┬────────────┬────────────────────┐   │
│ │ auth     │ media    │ invitations│ guests, orders,    │   │
│ │ controller│controller│ service    │ seating, checkin,  │   │
│ │          │          │ (auth gate)│ post-event, partner│   │
│ └──────────┴──────────┴────────────┴────────────────────┘   │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │ Prisma ORM
                        ▼
           PostgreSQL 16 + Advisory Locks
                        
           S3-compatible (MinIO locally)
           Presigned-PUT for media upload
```

**No authorization guards on routes.** Controllers call `assertCanAccess` inside services (thin-controller pattern).

---

## Authentication & Session Management

### Access & Refresh Tokens

Both signed with **the same secret** and **identical payload** (`{sub, email}`). They differ only in `expiresIn`:
- `JWT_ACCESS_TTL` (default 15m) → `access_token` cookie
- `JWT_REFRESH_TTL` (default 30d) → `refresh_token` cookie

**Security concern:** A stolen 30-day refresh token works as an access token (same secret, same payload).

Cookies: `httpOnly`, `sameSite: 'lax'`, `secure` (only in production).

**`access_token` maxAge hard-coded to 15 min** (not from env), while JWT honours `JWT_ACCESS_TTL` → they desynchronise if env var is changed.

No token revocation, no rotation, no `jti` claim.

### Anonymous Sessions

`anon_session` cookie = `id.HMAC-SHA256(id)` verified with `timingSafeEqual`, 16 random bytes when missing, 30-day expiry. Signs anonymous draft ownership and album upload quota.

### Google OAuth (Optional)

Registered only if `GOOGLE_CLIENT_ID` + `SECRET` set. Full-page redirect flow:
1. Web initiates redirect to `googleAuthUrl(returnTo)`
2. Returns to `GOOGLE_CALLBACK_URL` with code
3. Backend exchanges for token, creates/updates User, sets `access_token` + `refresh_token` cookies
4. If visiting from anonymous draft: `sessionStorage['wishly_pending_claim']` survives redirect, `?auth=1` triggers `api.claim()`

No automatic discovery via `GET /auth/me` — only called by studio's AccountAvatar to render initials.

### Auth State in Studio

**No login screen, no logout button.** 401 renders an `ErrorState` per page. No route protection. **Logout not implemented** (`api.logout()` exists but has zero callers).

---

## Authorization Model

**Single gate:** `InvitationsService.assertCanAccess(invitationId, user, anonSessionId, {write})`.

### Three-Branch Logic

1. **B2C Owner** — user created the invitation
   ```ts
   if (user?.id === invitation.ownerId) return
   ```

2. **Anonymous Draft** — unsigned invitation with matching session
   ```ts
   if (!invitation.ownerId && anonSessionId === invitation.anonSessionId) return
   ```

3. **Partner Member** — agency staff with role-based access
   ```ts
   evaluatePartnerAccess(member.role, action)
   // admin: full access
   // edit: only invitations where assignedMemberId === memberId
   // view: read-only
   // unknown: denied
   ```

Any other combo → 403 Forbidden.

**Write gate** (`{write: true}`) additionally blocks if `published && status !== DRAFT`.

---

## Invitation Lifecycle & Publish Pipeline

### State Machine

```
DRAFT ────→ PUBLISHED ────→ ENDED
  ↑            ↑              │
  └────────────┴──────────────┘
  (renew: re-open)
```

- **DRAFT:** Owner/anonymous builder editing. No RSVPs accepted. Anonymous draft after 30 days deleted by cron.
- **PUBLISHED:** Live. Accepting RSVPs, guests, giftbook entries. Status set by explicit publish action.
- **ENDED:** Read-only. ExpiresAt passed OR manually ended. **Deliberately never 404s** (keepsake rule: invitations are heirlooms, not ephemeral resources).

### Publish: Locked 6-Step Sequence

Atomic within a transaction. All steps must succeed or entire operation rolls back.

1. **Validate required blocks** — cover, invite, party must be enabled + populated
2. **Re-parse blocks** — each block's content against its Zod schema (skip on failure)
3. **Slug availability** — Vietnamese diacritic folding (đ→d, NFD strip), 48-char cap, auto-suffix numeric loop on collision, reject reserved slugs (22 reserved)
4. **Render OG PNG** — satori (TS → SVG) → `@resvg/resvg-js` (SVG → PNG), upload to S3 under `og/` prefix
5. **Atomic update** — set `status='PUBLISHED'`, `publishedAt=now`, `expiresAt=now+1y`, `ogImageKey`, `purgeAt` (derived from eventDate or publishedAt + retentionMonths)
6. **Idempotent side-effects** — create Album (if missing), create recapToken, generate pass codes with clash-retry loops

**Rollback on any failure.** Frontend tracks publish progress via `LoadingSkeleton variant="publish" publishStep={0..4}` with artificial 400ms beats.

### Slug Rules

- Vietnamese diacritic folding via NFD + manual `đ→d` mapping
- 48-character cap
- Numeric suffix on collision (`{slug}`, `{slug}-2`, `{slug}-3`, etc.)
- 22 reserved slugs rejected (e.g., `create`, `templates`, `api`, etc.) — auto-generate appends `-thiep`
- User input hard-rejects reserved slugs

---

## Privacy & Legal Compliance (Nghị định 13/2023)

Vietnamese Personal Data Protection Decree is first-class design.

### Consent & Data Minimization

- **One consent per event:** `giveConsent()` gate. `GuestsService.assertConsent` blocks **all** guest-list writes with `code: 'CONSENT_REQUIRED'` until present.
- **Consent acceptance** required before any import/add (Vietnamese users must actively accept collection).

### Retention Schedule

Owner selects `retentionMonths ∈ {3, 6, 12}` at privacy settings. System calculates:
```
purgeAt = eventDate (if known) else publishedAt + retentionMonths
```

Cron at 3:30 AM daily anonymises guests (`[đã xoá]` Vietnamese, respects wedding delays where eventDate hasn't occurred yet).

**Anonymise, never delete.** Preserves "N khách đã đến" aggregate on recap without corruptive null FKs.

### Data-Subject Rights (Without Login)

Token-gated access via 10-char `Guest.token` (Zalo-shareable, explicitly not a secret):

| Endpoint | Function |
|---|---|
| `GET guests/public/:token/me` | Retrieve self with masked phone |
| `PATCH guests/public/:token/me` | Update self (appends new Rsvp row — append-only history) |
| `DELETE guests/public/:token/me` | Anonymise immediately (no 72h wait) |

### Password Protection

`Invitation.passwordHash` (bcrypt-10) is **paid tier only** (`BASIC` + `PREMIUM`). FREE tier cannot set password.

---

## Orders & Payment Flow

Manual Vietnamese bank transfer — **no payment processing through Wishly servers.**

### VietQR QR Code

Generated from:
- `BANK_BIN` (24 NAPAS aliases in contracts)
- `BANK_ACCOUNT_NO`
- `BANK_ACCOUNT_HOLDER`
- `shortCode = 'TV-' + 4 Crockford-ish chars`

Customer scans QR → transfers amount to venue/owner bank account → manually enters payment confirmation in UI.

### Claim & Confirm Flow

1. **Claim** (`claimPaid`) — customer marks payment as claimed (sets `claimedAt` only), admin sent notification
2. **Confirm** (admin dashboard) — inside transaction:
   - Order → `paid=true`, `confirmedAt=now`, `refundable` calculated
   - Invitation → tier upgrade, `guestLimit` expansion
   - Discount → `usedCount++` (only on payment, not on pending order)
   - Receipt email (outside transaction — failure doesn't break the order)

### Refund Policy

Refundable if:
- ≤ 7 days old (payment date)
- AND `viewCount < 20` (not widely shared)
- AND `bulkSentAt == null` (not bulk-sent to guests)

---

## Guests & Guest Roles (Honorifics)

**Honorifics are culturally critical.** Wrong role in a wedding invite is a real social error.

### Guest Role Derivation

`deriveGuestRole(group)` accent-insensitive matching against `DEFAULT_GUEST_GROUPS` (5 Vietnamese groups):
- "parents" → `cô/chú` (aunt/uncle)
- "family" → `anh/chị` (older sibling honorific)
- "friends" → `bạn` (friend)
- "colleagues" → `chị/anh` (professional honorific)
- "other" → defaults to `bạn`

Rendered in invitation guest list: "Cô Hương", "Anh Huy", etc.

### RSVP & Party Size

RSVP accepted only on `PUBLISHED` invitations. `partySize = 1 + plusOnes` synced **only when `partySizeManual === false`** (owner override wins).

Corporate-only fields: `mealChoice`, `allergyNote`, `lang` (vi/en), `title` (honorific override).

**Plus-ones capped at 2 for corporate**, unlimited for personal events.

### Reminders

`remindedCount` server-enforced `<= 2` (two reminders max per guest). ZNS ≤ 200 chars via `compactPlace`/`compactTime`/`compactDate` helpers. **All messages returned for manual paste** (Zalo OA not live).

---

## Seating & Check-in

### Seating Tables

`SeatingTable` with `kind ∈ {round, long, stage}` and `DEFAULT_TABLE_CAPACITY` (round 10, long 14, stage 0). Floor-plan `x`/`y` coords (0–4000). Capacity 0–40.

**Seating lock** (`seatingLockedAt`) prevents further edits. Audit log (`seatingLog: {at, by, action}[]`) written **only after lock** — pre-lock edits intentionally unlogged (allows brainstorming without history).

Deleting a table nulls `Guest.tableId` on its rows first. Progress counts **people, not rows** (includes plus-ones).

**Optimistic updates in studio** (React Query `onMutate` snapshot + rollback on error).

### Check-in

Staff terminal (`apps/web/src/app/checkin`) hardcoded dark UI. QR scanning via BarcodeDetector (native, 250ms polling on `<video>`) falling back to dynamically-imported `@zxing/browser`.

**Offline-first**: roster + queue in localStorage, flushed by `checkinApi.sync` every 10s + on `online` event. **Idempotent offline sync keeps earliest `checkedInAt`.** Diacritic-insensitive search (NFD strip, capped 40 results).

**Pass codes** format: `formatPassCode(passCodePrefix(slug), year, seq)` with clash-retry loops. Check-in result triad: `'invalid' | 'dup' | 'ok'` (unknown codes deliberately not 404).

**Walk-in** creates Guest with `walkIn: true`, fresh passCode + token, `checkedInAt=now`.

**Staff links** — 16-char nanoid, expires `eventDate + 24h` or `now + 7d`, returned **once** (not retrievable again).

---

## Post-Event: Album & Thanks

### Album Upload

Quota: **10 photos per `anon_session`** tracked in `AlbumUploadQuota` (album + session = unique). Checked at presign **and** upload.

**Key-confinement**: every `mediaKey` must start with `album/<invitationId>/`. Keys never exposed to public — URL generation happens server-side.

ZIP download via `archiver` level 5 with `X-Estimated-Bytes` header.

Album window: `opensAt <= now < closesAt` (opens at eventDate, closes +30 days). Distinct messages for "chưa mở" (not yet) vs "đã đóng — vẫn xem và tải được" (closed but still viewable).

### Thank-You Notes

`computePersona({hasGift, attending, override})` → persona ∈ {gift, came, absent, quiet}:
- `hasGift` matched by relation, guestId, **or case-insensitive name match** against `GiftEntry.giverName`
- `attending` from check-in (`checkedInAt > 0`) or RSVP fallback
- `override` from explicit persona assignment

`ThankYouSend` unique `(invitationId, guestId)` serves as idempotency ledger (send once per guest).

### Recap & Public Sharing

`recapToken` = 12-char nanoid, unique per invitation. Public recap (`GET public/recap/:shareToken`) shows:
- Attended count (check-in preferred over RSVP)
- Gift total (gated by `showGiftOnRecap` on public route only)
- Guest list (gated by `publicGuestbook`)
- Photo highlights (first N from album)

---

## Partner / B2B (Agency Channel)

### Subscription & Slot Accounting

Partner billing: monthly subscription + per-invitation charges.

**Slot accounting**: `countSlots` counts `DRAFT` + `PUBLISHED` (ENDED frees a slot). Exceeding limit → HTTP **402** `code: 'SLOT_LIMIT'`.

**Past-due grace**: create **locked** only after `periodEnd + 7 days` (no account suspension during trial). *"Thiệp đang chạy vẫn mở bình thường"* — live invitations never taken down for non-payment.

### White-Label Branding

Brand applied to public invitations **only while `partner.status === 'active'`**. Past-due restores Thiệp Việt watermark.

`Brand` has `subdomain?` (unique) and `domainStatus` enum.

### Member Invites

24-byte hex token, 7-day TTL. Case-insensitive email match. `assertNotLastAdmin` prevents removing the sole admin.

### Partner Templates

**Data-only** ("Code templates live in FE registry `@wishly/templates`"). `saveTemplate` runs `stripPersonalContent` (removes embedded names, dates, personal details). Templates are `ptpl_` prefixed.

---

## Scheduled Jobs (Cron)

All wrapped in `withAdvisoryLock` (PostgreSQL `pg_try_advisory_lock`).

| Cron | Lock | Job |
|---|---|---|
| Every day 3:00 AM | 42100 | Delete anon `DRAFT`s (`ownerId: null`) older than 30 days |
| 3:15 AM | 42101 | `PUBLISHED → ENDED` on `expiresAt` passed (never deletes) |
| 3:30 AM | 42102 | Anonymise guest PII past `purgeAt` → `[đã xoá]`, set `purgedAt` |
| 4:00 AM | 42103 | 4 owner-only reminders (album pending, thanks nudge, album closing, anniversary) — **never sends to guests** |
| Every day 3:00 AM | 42104 | `markPastDue` + `renewPeriods` (partner billing) |

---

## Notifications & Messaging

### Messages

Single source of truth in `@wishly/contracts#messages.ts`:
- `MessageKey` — 18 keys (8 ZNS, 10 email)
- `renderMessage`/`renderSubject` — parametric templates
- `ZNS_MAX_CHARS = 200`
- `znsCharCount()` — returns char length respecting Vietnamese rules

### Mailer Status

**Stub implementation.** `SmtpMailer` logs only ("until provider wired"). `ConsoleMailer` warns loudly in production. `safeSend` swallows all errors — mail never breaks a request. Emails masked in logs (`ab***@domain`).

### RSVP Digest

Threshold: 10 RSVPs per calendar day. Past it, only the first over-threshold RSVP sends email (summary-only digest thereafter).

---

## Media & Object Storage

### S3 Integration

S3-compatible (MinIO locally). **Media stored as keys, never URLs.** Key namespacing:
- `og/<slug>.png` — OG images
- `album/<invitationId>/<photoId>.jpg` — album photos
- `templates/<slug>/thumb.jpg` — template thumbnails

### Presigned PUT

Client requests presign → backend generates signed URL (S3 SDK) → client PUTs directly to S3. Server never sees file contents.

**Key-confinement** enforced app-side: album photos must be under `album/<invitationId>/`, OG under `og/`.

---

## In-Memory State & Multi-Instance Concerns

### ViewBufferService

Per-instance in-memory Map (flushed every 30s via `setInterval().unref()` + on destroy). Buffers view count increments before flushing to DB.

**Multi-instance concern:** Each instance has its own buffer, so view counts may undercount in a distributed deployment.

### Throttler Storage

Default storage is in-memory. **Multi-instance concern:** rate limits don't coordinate across instances.

---

## Security & Known Issues

See [**Project Roadmap**](project-roadmap.md) → "Security review" and [**Code Standards**](code-standards.md) → section 13 in the scout report.

Key concerns:
- Access + refresh tokens interchangeable (same secret)
- AdminGuard uses `!==` (not constant-time) vs timingSafeEqual in AnonSessionMiddleware
- StaffTokenGuard stores plaintext tokens (no hashing)
- ConfigModule no validationSchema (fail-late at request time)
- GET /api requires JWT (unusable as health check)
- DEV_AUTH_BYPASS not gated on `import.meta.env.DEV` (server-side only)

---

## Continuation

- See [**Data Model**](data-model.md) for Prisma schema, table relationships, and invariants.
- See [**Design Guidelines**](design-guidelines.md) for CSS architecture and component system.
- See [**Deployment Guide**](deployment-guide.md) for local setup and env vars.
