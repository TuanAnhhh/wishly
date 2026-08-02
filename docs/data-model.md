# Data Model

PostgreSQL 16 schema managed by Prisma 6. 23 models capturing invitation lifecycle, guest management, orders, seating, check-in, post-event, and partner/B2B.

## Schema Conventions

- **23 models** with Prisma generator `prisma-client-js`, default output location
- **Zero `@map`/`@@map`** → Postgres identifiers are quoted camelCase (`"Invitation"."ownerId"`). Raw SQL always needs double quotes
- **String `@id @default(cuid())`** on 20/23 models (exceptions: `Plan.id`, `Template.id` caller-supplied slugs; `PartnerBrand.partnerId` shared PK/FK)
- **No `deletedAt`** anywhere — privacy via anonymise-on-schedule, not soft-delete
- **`@updatedAt` on only 3 models**: Invitation, PartnerBrand, AlbumUploadQuota
- **Nullable timestamp as flag + when idiom** pervasive: `claimedAt`, `publishedAt`, `bulkSentAt`, `consentAt`, `purgedAt`, `seatingLockedAt`, `checkedInAt`, `revokedAt`, `joinedAt`, `paidAt`, `confirmedAt`
- **Money always `Int`** (Vietnamese đồng)
- **Media always keys, never URLs** (generated server-side at read time)
- **Two orthogonal ownership axes** on Invitation: B2C (`ownerId`/`anonSessionId`), B2B (`partnerId`)
- **Distinct opaque secrets** per audience: `slug`, `Guest.token`, `Guest.passCode`, `StaffAccess.token`, `recapToken`, `inviteToken`, `Order.shortCode`

---

## Model Groups

### Identity & Catalog

**User** (identity provider)
- `id` (cuid, PK)
- `email?` (unique, nullable)
- `phone?` (nullable)
- `provider` (google | local)
- **No password, no updatedAt**

**Plan** (tier blueprint)
- `id` (String, PK — slug: free, basic, premium)
- `price` (Int, VND)
- `priceByEvent?` (Json) — per-eventType overrides (BIRTHDAY, BABY_MONTH discounted)
- `guestLimit` (Int?) — null = unlimited
- `features` (Json) — feature set (no Zod contract)
- **Seed data:** 3 plans

**Template** (invitation template metadata)
- `id` (String, PK — slug)
- `slug` (String, unique)
- `name` (Vietnamese name)
- `tier` (FREE | BASIC | PREMIUM)
- `thumbKey` (String, S3 key)
- `blocks` (Json)
- `eventType` (WEDDING | BIRTHDAY | BABY_MONTH | CORPORATE)
- `description?` (Json)
- `theme?` (Json)
- `content?` (Json) — **never seeded, no seed data**
- `active` (Boolean, default true)
- `sortOrder` (Int)
- **No FK from Invitation.templateId** (application-managed)
- **Dead?** — Template table has no usage in recent code; templates are registry-only

**Discount** (promo code ledger)
- `id` (cuid, PK)
- `code` (String, unique)
- `percent` (Int, 0–100)
- `maxUses?` (Int)
- `usedCount` (Int, default 0) — **incremented only on payment, not on pending order**
- **Seed data:** 1 discount (CUOI20, 20%, maxUses 100)

---

### Invitation (Aggregate Root)

**Invitation** (40 fields, heart of the system)

**Ownership:**
- `ownerId?` FK→User (SetNull) — B2C owner
- `anonSessionId?` (String) — anonymous draft session HMAC
- `claimedAt?` (DateTime) — when anon draft claimed to User

**Identity & Render:**
- `slug` (String, unique) — Vietnamese diacritic-folded
- `templateId` (String) — **no FK** (application-managed)
- `eventType` (EventType, enum: WEDDING | BIRTHDAY | BABY_MONTH | CORPORATE)
- `eventDate?` (DateTime) — actual event date (used for purge anchor, pass code year)
- `status` (InvStatus, enum: DRAFT | PUBLISHED | ENDED)
- `tier` (Tier, enum: FREE | BASIC | PREMIUM)
- `content` (Json) — versioned invitation structure (invitation-content.ts)
- `theme` (Json) — palette + font selections
- `blocks` (Json) — {key, enabled, order}[] state

**Media & OG:**
- `ogImageKey?` (String, S3 key) — published OG image
- `brandColor?` (String, hex) — partner brand override

**Quota & Metrics:**
- `guestLimit` (Int, default 30) — @default(30), UNLIMITED_GUESTS = 10_000
- `viewCount` (Int, default 0) — buffered by ViewBufferService
- `bulkSentAt?` (DateTime) — when bulk-guest-send occurred (refund-eligibility gate)

**Privacy (Nghị định 13/2023):**
- `consentAt?` (DateTime) — when consent given
- `consentBy?` (String) — consent giver identifier
- `retentionMonths` (Int, default 6) — ∈ {3, 6, 12}
- `purgeAt?` (DateTime) — computed: eventDate or publishedAt + retentionMonths
- `purgedAt?` (DateTime) — when guests were anonymised
- `passwordHash?` (String, bcrypt-10) — **paid tier only**
- `publicGuestbook` (Boolean, default true) — show guest list publicly?
- `hideGift` (Boolean, default false) — hide gift ledger publicly?

**Seating (P08):**
- `seatingLockedAt?` (DateTime) — when seating finalised
- `seatingLog?` (Json) — [{at, by, action}]

**Post-Event (P11):**
- `recapToken?` (String, unique, 12-char nanoid)
- `showGiftOnRecap` (Boolean, default false)

**Corporate (P10):**
- `lang?` (String) — vi | en (corporate-only bilingual)

**Partner (P12):**
- `partnerId?` FK→Partner (SetNull) — B2B owner
- `assignedMemberId?` (String) — **no FK** (application-managed)
- `clientCode?` (String, unique) — partner's internal reference

**Lifecycle:**
- `publishedAt?` (DateTime)
- `expiresAt?` (DateTime) — computed at publish: +1 year
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**FK relations:**
- Guest (CASCADE)
- SeatingTable (CASCADE)
- StaffAccess (CASCADE)
- Album (CASCADE)
- ThankYouSend (CASCADE)
- Rsvp (no FK, app-managed, deleted by hand)
- GuestbookEntry (no FK, app-managed, deleted by hand)
- GiftEntry (no FK, app-managed, deleted by hand)

---

### Guest Ecosystem

**Guest** (individual attendee)
- `id` (cuid, PK)
- `invitationId` FK→Invitation (CASCADE)
- `name` (String)
- `phone?` (String)
- `email?` (String)
- `group?` (String) — family group (used by deriveGuestRole)
- `token` (String, unique, 10-char nanoid) — **Zalo-shareable, not a secret**
- `passCode?` (String, unique) — check-in code
- `role?` (String) — honorific (cô/chú/anh/chị/bạn)
- `remindedCount` (Int, default 0) — **≤ 2 enforced by service**
- `partySize` (Int, default 1) — attendee count
- `partySizeManual` (Boolean, default false) — owner override?
- `tableId?` FK→SeatingTable (SetNull)
- `checkedInAt?` (DateTime) — check-in timestamp
- `checkedInBy?` (String) — staff member who checked in
- `walkIn` (Boolean, default false) — created during check-in
- `mealChoice?` (String) — CORPORATE-only (no enum)
- `allergyNote?` (String) — CORPORATE-only
- `lang?` (String) — vi | en, CORPORATE-only
- `title?` (String) — honorific override, CORPORATE-only
- `thanksPersona?` (String) — gift | came | absent | quiet (computed at send, overridable)
- `createdAt` (DateTime, @default(now()))
- **No updatedAt, no deletedAt**

**Rsvp** (append-only attendance record)
- `id` (cuid, PK)
- `guestId?` FK→Guest (SetNull) — **can be null after guest anonymised** (append-only concern)
- `invitationId` (String) — **no FK** (application-managed)
- `rsvpStatus` (yes | no | pending, default pending)
- `plusOnes` (Int, default 0)
- `createdAt` (DateTime, @default(now()))
- **No updatedAt** — append-only; edits append new rows

**GuestbookEntry** (moderated messages)
- `id` (cuid, PK)
- `invitationId` (String) — **no FK**
- `guestId?` (String) — creator (nullable)
- `guestName?` (String) — display name
- `message` (String)
- `status` (pending | approved | hidden, default pending)
- `createdAt` (DateTime, @default(now()))

**GiftEntry** (gift ledger)
- `id` (cuid, PK)
- `invitationId` (String) — **no FK**
- `guestId?` FK→Guest (SetNull) — can be null
- `giverName` (String) — cash envelope name
- `amount` (Int, VND)
- `side` (String) — groom or bride side (cultural)
- `receivedAt` (DateTime, default now())
- **No updatedAt**

**GiftAccount** (**appears dead**)
- `id` (cuid, PK)
- `invitationId` (String) — **no FK, no index**
- `holder` (String)
- (no relations, no other columns)
- **Superseded by `Invitation.content.gift.accounts`** (no schema contract)
- Safe to drop?

---

### Orders & Billing

**Order** (purchase transaction)
- `id` (cuid, PK)
- `userId?` FK→User (SetNull) — purchaser
- `invitationId?` FK→Invitation (SetNull) — **deliberately** to preserve invoices across event deletion (10-year accounting retention)
- `planId?` (String) — **no FK** (application-managed)
- `planSnapshot` (Json) — plan state at purchase time (no Zod contract)
- `shortCode` (String, unique) — TV-XXXX, for VietQR memo
- `status` (pending | paid | cancelled) — plain String
- `provider` (vietqr | momo, default vietqr) — plain String
- `raw?` (Json) — provider-specific response (no schema)
- `refundable` (Boolean) — ≤7 days AND viewCount<20 AND bulkSentAt==null
- `claimedAt?` (DateTime) — customer claimed payment
- `confirmedBy?` (String) — admin staff member
- `confirmedAt?` (DateTime) — admin confirmed payment
- `paidAt?` (DateTime) — set by confirmPaid transaction
- `createdAt` (DateTime, @default(now()))

---

### Seating

**SeatingTable** (event floor plan)
- `id` (cuid, PK)
- `invitationId` FK→Invitation (CASCADE)
- `kind` (round | long | stage) — plain String
- `capacity` (Int, 0–40)
- `x` (Int, 0–4000) — floor-plan coord
- `y` (Int, 0–4000) — floor-plan coord
- `createdAt` (DateTime, @default(now()))
- **No label, auto-labels stage as "Sân khấu"**

---

### Check-in

**StaffAccess** (event-day staff credentials)
- `id` (cuid, PK)
- `invitationId` FK→Invitation (CASCADE)
- `token` (String, unique, 16-char nanoid) — **returned once, not retrievable**
- `expiresAt` (DateTime, required) — eventDate+24h or now+7d
- `revokedAt?` (DateTime) — manual revocation
- `lastSeenAt?` (DateTime) — last scan timestamp
- `createdAt` (DateTime, @default(now()))
- **No hashing** (tokens stored plaintext)

---

### Post-Event

**Album** (photo collection)
- `id` (cuid, PK)
- `invitationId` FK→Invitation (CASCADE, unique) — 1:1 relation

**AlbumPhoto** (individual upload)
- `id` (cuid, PK)
- `albumId` FK→Album (CASCADE)
- `mediaKey` (String) — S3 key
- `status` (pending | ok | hidden) — plain String
- `byteSize?` (Int)
- `createdAt` (DateTime, @default(now()))

**AlbumUploadQuota** (per-session limit: 10 photos)
- `id` (cuid, PK)
- `albumId` FK→Album
- `sessionId` (String) — anon_session cookie
- `@@unique([albumId, sessionId])`
- `uploadedCount` (Int, default 0)
- `updatedAt` (DateTime, @updatedAt)

**ThankYouSend** (idempotency ledger)
- `id` (cuid, PK)
- `invitationId` FK→Invitation (CASCADE)
- `guestId?` FK→Guest (SetNull) — **can be null**
- `persona` (gift | came | absent | quiet) — plain String
- `sentAt?` (DateTime) — when thank-you sent
- `@@unique([invitationId, guestId])` — one thank-you per guest

---

### Partner / B2B

**Partner** (agency/studio)
- `id` (cuid, PK)
- `slug` (String, unique) — for brand subdomain
- `planTier` (studio | agency) — plain String (no enum)
- `slotLimit` (Int) — concurrent DRAFT+PUBLISHED invitations
- `status` (active | past_due | cancelled) — plain String
- `createdAt` (DateTime, @default(now()))

**PartnerBrand** (white-label branding)
- `partnerId` String, @id, FK→Partner — **PK is the FK, true 1:1**
- `subdomain?` (String, unique) — custom domain (foo.thiepviet.vn)
- `domainStatus` (pending | verified | failed) — plain String
- `updatedAt` (DateTime, @updatedAt)

**PartnerMember** (team member)
- `id` (cuid, PK)
- `partnerId` FK→Partner (CASCADE)
- `userId?` (String) — **no FK** (application-managed)
- `email` (String)
- `role` (admin | edit | view) — plain String
- `inviteToken?` (String, unique, 24-byte hex) — 7-day join invite
- `joinedAt?` (DateTime) — when member accepted invite
- `@@unique([partnerId, email])`
- `createdAt` (DateTime, @default(now()))

**PartnerTemplate** (agency template library)
- `id` (cuid, PK) — prefix `ptpl_` / `pt_`
- `partnerId` FK→Partner (CASCADE)
- `data` (Json) — template definition (stripped of personal content)
- `createdAt` (DateTime, @default(now()))

**PartnerSubscription** (billing period)
- `id` (cuid, PK)
- `partnerId` FK→Partner (CASCADE)
- `planTier` (studio | agency)
- `periodStart` (DateTime)
- `periodEnd` (DateTime)
- `status` (active | past_due | cancelled) — plain String
- `createdAt` (DateTime, @default(now()))

**PartnerInvoice** (billing record)
- `id` (cuid, PK)
- `partnerId` FK→Partner (CASCADE)
- `code` (String, unique) — HD-YYYY-MM-NNNN (**generated in 3 places, not collision-safe**)
- `amount` (Int, VND)
- `status` (pending | paid | overdue | cancelled) — plain String
- `dueDate` (DateTime)
- `paidAt?` (DateTime)
- `createdAt` (DateTime, @default(now()))

---

## Enums (Only 3)

```prisma
enum EventType { WEDDING, BIRTHDAY, BABY_MONTH, CORPORATE }
enum Tier { FREE, BASIC, PREMIUM }
enum InvStatus { DRAFT, PUBLISHED, ENDED }
```

**15 other enum-like columns are plain `String`** with allowed values in trailing comments, validated only in Zod + service code:
- `Order.status`, `Order.provider`
- `GuestbookEntry.status`, `AlbumPhoto.status`
- `SeatingTable.kind`, `Guest.mealChoice`, `Guest.lang`, `Guest.thanksPersona`
- `ThankYouSend.persona`
- `Partner.status`, `Partner.planTier`, `PartnerMember.role`, `PartnerBrand.domainStatus`, `PartnerSubscription.status`, `PartnerInvoice.status`

---

## Referential Integrity

### Real Foreign Keys (17)

| Parent | Child | Rule |
|---|---|---|
| Invitation | Guest | CASCADE |
| Invitation | SeatingTable | CASCADE |
| Invitation | StaffAccess | CASCADE |
| Invitation | Album | CASCADE |
| Invitation | ThankYouSend | CASCADE |
| Guest | Rsvp | SET NULL |
| Guest | AlbumPhoto | SET NULL |
| Guest | GiftEntry | SET NULL |
| Guest | AlbumUploadQuota | SET NULL |
| SeatingTable | Guest | SET NULL |
| Album | AlbumPhoto | CASCADE |
| Album | AlbumUploadQuota | CASCADE |
| Partner | PartnerMember | CASCADE |
| Partner | PartnerBrand | CASCADE |
| Partner | PartnerTemplate | CASCADE |
| Partner | PartnerSubscription | CASCADE |
| Partner | PartnerInvoice | CASCADE |
| User | Invitation | SET NULL |
| User | Order | SET NULL |
| Partner | Invitation | SET NULL |

### FK-Shaped Scalars with NO Database FK (Orphan Risk)

**Tenant isolation rests entirely on app-level `invitationId` filtering:**
- `Rsvp.invitationId` (no index)
- `GuestbookEntry.invitationId` (no index)
- `GiftAccount.invitationId` (no index, dead table)
- `GiftEntry.invitationId` (no index)
- `PartnerMember.userId`
- `PartnerTemplate.partnerId` — FKs present
- `Invitation.templateId`
- `Invitation.assignedMemberId`
- `Order.userId`
- `Order.planId`
- `AlbumUploadQuota.albumId` — FK present

**deleteEvent** deletes these by hand and flags as tech debt (§5.2 in scout report).

---

## Migration Narrative

10 migrations (init → p12_partner), all within ~21h wall-clock (phase-driven scaffold):

1. **init** — 9 tables, MVP (invitations, guests, rsvps, guestbook)
2. **guest_gift_entry** — gift ledger + FK additions
3. **orders_discount** — manual VN payments + discount codes
4. **p07_lifecycle_privacy** — Nghị định 13/2023: retention + purge + consent
5. **p07b_guest_role_reminded** — honorifics + reminder tracking
6. **p08_seating** — floor-plan + table assignments
7. **p09_checkin** — pass codes + staff app + offline sync
8. **p10_corporate** — corporate event type + bilingual support
9. **p11_post_event** — album + thanks + recap
10. **p12_partner** — B2B reseller channel (6 partner tables)

Authoring inconsistent: #2–#3 idempotent, #1/#4 Prisma-generated, #5–#10 hand-written non-idempotent.

---

## Seed Data

**Idempotent upserts** in `libs/db/prisma/seed.ts`:

| Name | ID | Price | Guests | Features |
|---|---|---|---|---|
| **Free** | free | 0đ | 30 | watermark, slugRandom |
| **Basic** | basic | 199,000đ | 150 | remove watermark, priceByEvent: {BIRTHDAY:99k, BABY_MONTH:99k} |
| **Premium** | premium | 499,000đ | unlimited | prioritySupport, remove watermark |

| Name | Code | Discount | Max Uses |
|---|---|---|---|
| **CUOI20** | CUOI20 | 20% | 100 |

**No Templates, Users, Invitations seeded** (managed by sync/admin).

