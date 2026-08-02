# Project Overview & Product Development Requirements

## Product Identity

**Wishly / Thiệp Việt** — A Vietnamese digital invitation platform serving weddings, birthdays, baby full-month celebrations, and corporate events. The product combines invitation design, guest management, RSVP collection, giftbook, event-day check-in, post-event album, and gift tracking into one cohesive platform.

**Market:** Vietnamese primary (all UI/emails/templates in Vietnamese). B2C for invitation owners, B2B for partner agencies and studios doing white-label reselling.

**Positioning:** Replace paper invitations and SMS coordination with a unified platform that respects Vietnamese conventions (honorifics, Nghị định 13/2023 compliance, cultural naming) and Vietnamese payment norms (bank transfer via VietQR, no payment processing).

---

## Product Phases (Feature Evolution)

The codebase narrative spans 10 database migrations (P01–P12), reflecting the product's iterative build:

| Phase | Migration | Focus | Key Feature |
|---|---|---|---|
| **P01** | `init` | MVP | Invitations, RSVP, guestbook (9 tables) |
| **P02** | `guest_gift_entry` | Giftbook | Gift entries ledger, guest created tracking |
| **P03** | `orders_discount` | Payments | Manual VietQR bank transfer, discount codes |
| **P04** | `p07_lifecycle_privacy` | Legal | Nghị định 13/2023: retention months, purge schedule, guest consent |
| **P05** | `p07b_guest_role_reminded` | Polish | Honorifics (cô/chú/anh/chị), reminder tracking |
| **P06** | `p08_seating` | Events | Table assignments, floor-plan editing, seating lock |
| **P07** | `p09_checkin` | Ops | Staff app, QR code scanning, offline roster, pass codes |
| **P08** | `p10_corporate` | B2B | Corporate event type, meal choices, bilingual support |
| **P09** | `p11_post_event` | Retention | Photo album (S3 quota), thank-you notes, recap page |
| **P10** | `p12_partner` | Reseller | Partner/agency billing, brand customization, member roles |

**Narrative:** B2C MVP → gift tracking → manual payments → legal compliance + privacy → cultural polish → event-day operations → corporate vertical → post-event engagement loop → agency channel.

---

## Customer Segments & Tiers

### B2C (Invitation Owners)

End-users creating and managing invitations for personal events.

**Free Tier (`free`)** — $0
- 30 guests max
- Features: invitation design, RSVP, guestbook, guest list download
- No: gift tracking, analytics, password protection
- Branding: Thiệp Việt watermark on all public surfaces

**Basic Tier (`basic`)** — 199,000₫ (~$8)
- 150 guests max
- Features: all Free + gift tracking + guest list password
- Event-type pricing: Birthday & Baby-month discounted to 99,000₫
- Branding: remove watermark

**Premium Tier (`premium`)** — 499,000₫ (~$20)
- Unlimited guests
- Features: all Basic + priority support
- Branding: remove watermark

### B2B (Partner/Agency)

Agencies and studios reselling Wishly under their own brand.

**Studio Tier** — 990,000₫/month
- 20 invitation slots (DRAFT+PUBLISHED count; ENDED free a slot)
- Features: full editor, team member management, brand customization
- Billing: monthly subscription + per-invitation charges

**Agency Tier** — 2,490,000₫/month
- 50 invitation slots
- Features: all Studio + API access, custom domain, advanced analytics

Status tracking: `active` (charges apply, white-label brand used) → `past_due` (after 7-day grace) → `cancelled`. **Live invitations never taken down**, even if past due (product rule: "Thiệp đang chạy vẫn mở bình thường" — "Running invitations stay live normally").

---

## Key Constraints & Rules

### Legal & Regulatory

**Nghị định 13/2023** (Vietnamese Personal Data Protection Decree) is first-class design:
- **Consent required** before first guest-list write (`giveConsent` = "I accept data collection")
- **Retention bounds**: owner selects 3, 6, or 12-month retention
- **Purge schedule**: guests anonymise (not delete) when `purgeAt` passes
- **Data-subject rights without login**: token-gated self-service (`GET/PATCH/DELETE guests/public/:token/me`)

### Payment & Banking

- **No money flows through our servers** — VietQR QR-code only (customer scans → transfers to venue/owner bank account directly)
- **Manual confirmation flow**: customer claims payment → admin confirms in dashboard → system unlocks tier upgrade
- **Refund policy**: ≤7 days old AND < 20 views AND no bulk-send yet
- **Discount tracking**: codes track usage at payment time (not increment on pending order)

### Messaging & Notifications

- **Zalo/ZNS budget**: max 200 characters (Vietnamese names are long)
- **No auto-send**: all messages returned for manual paste into Zalo (OA not live yet)
- **Email stub**: mailer logs only in dev; no SMTP provider wired in production

### Naming & Internationalization

- **Honorifics required**: `deriveGuestRole(group)` → `cô|chú|bạn|anh/chị` (wrong role is a real social error)
- **Diacritics preserved**: NFD + Vietnamese glyph coverage validated at template publish time
- **Slugs**: Vietnamese diacritic folding (đ→d), 48-char cap, auto-suffix on collision, 22 reserved slugs
- **Bilingual support**: only for corporate event **content** (vi/en, not UI)

---

## Core Business Flows

### Invitation Lifecycle

```
DRAFT → PUBLISHED → ENDED
```

- **DRAFT**: owner or anonymous builder editing
- **PUBLISHED**: live, accepting RSVPs, accepting guests (after consent), collectible
- **ENDED**: read-only (expiresAt passed OR manually ended); **deliberately never 404s** (keepsake rule)

**Publish is a locked 6-step sequence:**
1. Validate required blocks enabled + populated (cover, invite, party)
2. Re-parse each block with its Zod schema
3. Check slug availability + apply diacritic folding
4. Render OG PNG (satori → resvg) and upload to S3
5. Atomic: set status/publishedAt/expiresAt(+1y)/ogImageKey
6. Create idempotent album + recap token + pass codes

### Anonymous Draft → Claim Identity

- Guest creates invitation without account (anonymous draft via `anon_session` cookie)
- At signup/OAuth, caller invokes `claim([id])` — links draft to newly-created user
- **Resume after OAuth:** `sessionStorage` survives redirect, `?auth=1` triggers claim

### Payment & Upgrade

- Customer selects plan during invite creation or upgrade flow
- Generates VietQR code (BANK_BIN + BANK_ACCOUNT_NO + shortCode `TV-XXXX`)
- Customer transfers (exact amount, includes shortCode in memo)
- Customer manually confirms payment in UI (`claimPaid`)
- Admin approves (`confirm` in admin panel) inside a transaction:
  - Order → `paid`, `refundable`
  - Invitation → tier upgrade, guest-limit expansion
  - Discount → `usedCount++`
  - Receipt email (outside transaction)

---

## Non-Functional Requirements

| Requirement | Spec | Rationale |
|---|---|---|
| **Response times** | Not specified in code | Assumption: < 500ms p99 on invitation editor save |
| **Availability** | Not specified | Local docker-compose only; no production deployment target |
| **Scalability** | Per-instance in-memory state | `ViewBufferService` + throttler storage — multi-instance deployment story undecided |
| **Test coverage** | Zero (staged infrastructure only) | Roadmap: establish layer first; see Project Roadmap |
| **Backwards compatibility** | API v1; schema migrations hand-written | No breaking-change policy documented |
| **Accessibility** | WCAG 2.1 AA not verified | Touch targets ≥44px enforced by design; no screen-reader testing |

---

## Success Metrics (To Be Defined)

- **Engagement**: invitations created per week, RSVP rate
- **Conversion**: free → paid tier upgrade rate, plan mix
- **Retention**: invitation reopening after event, alumni features
- **Partner satisfaction**: Studio signup → invitations created, repeat customer rate
- **Operational**: mean time to resolve consent issues, refund request rate

---

## Known Open Questions

1. Is a multi-instance deployment in scope? (affects state externalisation)
2. What is the story for the coexisting two HTTP response shapes?
3. Should access/refresh tokens be distinct (separate secrets/expires)?
4. Is `GiftAccount` and `Template` tables safe to drop?
5. Should enum-like `String` columns become Prisma enums?
6. Is auth enforcement via upstream proxy intended, or "401 → ErrorState" the design?

See [**Project Roadmap**](project-roadmap.md) for prioritization and [**System Architecture**](system-architecture.md) for implementation details.
