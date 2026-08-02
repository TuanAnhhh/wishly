# Code Standards & Conventions

Conventions **actually observed** in the codebase, not aspirational. If you're writing code, follow these patterns to stay consistent.

## File Naming

Role-based split applied consistently:

| Type | Pattern | Examples |
|---|---|---|
| **shadcn primitives** | kebab-case | `button.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx` |
| **Reusable React components** | PascalCase | `SectionLabel.tsx`, `GuestTable.tsx`, `InvitationRenderer.tsx` |
| **Routes/pages** | kebab-case | `page.tsx`, `detail-page.tsx`, `create-page.tsx` |
| **Non-component modules** | kebab-case | `qr-scanner.ts`, `guest-files.ts`, `resolve-theme.ts` |
| **NestJS backend** | kebab-case, dot-suffix by role | `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`, `*.cron.ts` |
| **NestJS helpers** | kebab-case | `passcode-assign.ts`, `apply-paid-order.ts`, `advisory-lock.ts` |
| **Hooks** | `use*.ts` | `useAutosave.ts`, `useSeating.ts` (in `hooks/` subdirectory) |
| **Stores** | `<Name>Store.ts` | `editorStore.ts` (in `stores/` subdirectory) |
| **Helpers** | `<name>.ts` | `format-vnd.ts` (in `helpers/` subdirectory) |

---

## Directory Layout

**apps/web** (flat):
```
src/
  app/           # Routes (page.tsx per route)
  components/    # Reusable components
  lib/           # Helpers (api.ts, qr-scanner.ts, etc.)
  main.tsx
  index.html
```

**apps/studio** (domain-organized):
```
src/
  app/           # Routes
  features/
    editor/      # Domain: editor, guests, seating, post-event, partner, checkin
      components/
      hooks/
      stores/
      helpers/
      page.tsx
    guests/
      components/
      ...
  components/    # Shared layout/UI
  lib/           # Helpers
  main.tsx
```

**apps/api** (flat feature folders):
```
src/
  common/        # Plumbing (guards, pipes, decorators, middleware)
  app/           # Root controller
  {domain}/      # Feature module: auth, media, invitations, guests, orders, etc.
    {domain}.module.ts
    {domain}.controller.ts
    {domain}.service.ts
    {helper}.ts
  main.ts
```

**libs/** (one public `src/index.ts`):
```
src/
  index.ts       # Single barrel (explicit named re-exports)
  components/
  lib/
  hooks/
  stores/
  helpers/
```

---

## Imports & Module Resolution

**No TS path aliases** (`@/`, `~/`, `paths` in `tsconfig.base.json`).

Cross-project resolution via:
1. **Workspace package names:** `@wishly/ui`, `@wishly/contracts`, `@wishly/db`, `@wishly/templates`, `@wishly/api-client`
2. **TS project references** (auto-maintained by `nx sync`)
3. **Custom condition `@wishly/source`** for consuming unbuilt TS source (contracts, templates, api-client)

Example:
```ts
// ✓ Correct
import { invitationSchema } from '@wishly/contracts'
import { prisma } from '@wishly/db'
import { Button } from '@wishly/ui'

// ✗ Wrong
import { invitationSchema } from '@wishly/contracts/src/invitation'
import button from '@/components/button'
```

**Within a lib:** relative imports are fine for internal use. Barrels enforce what's public.

---

## Barrels (Index Files)

**Apps:** No barrels. Every import is a deep relative path.

**Libs:** Exactly one `src/index.ts` per lib, with **explicit named re-exports** only (no `export *` except in api-client). NodeNext modules use `.js` extensions in import specifiers:

```ts
// ✓ libs/ui/src/index.ts
export { Button } from './components/ui/button.js'
export { SectionLabel } from './components/section-label.js'
export * from './types.js'

// ✓ Consuming code (workspace package)
import { Button, SectionLabel } from '@wishly/ui'

// ✗ Wrong in libs
export * from './components'
```

**api-client exception:** Uses `export *` from submodules (legacy).

---

## TypeScript Idioms

**Strict mode enabled** (`strict: true`). Observed patterns:

| Pattern | Example | Why |
|---|---|---|
| **Boolean guard + non-null** | `enabled: Boolean(id) && id!` in React Query | Satisfies strict null checks |
| **`as const` on literals** | `const ROLES = ['admin', 'edit', 'view'] as const` | Type-safe string unions |
| **`Record<string, unknown>` for JSON** | Invitation `content` field, cast at read sites | Flexible structure without losing type safety |
| **`Awaited<ReturnType<fn>>` for derived types** | Deriving response row type | Single source of truth |
| **Consistent `import type`** | Always `import type { Prisma }` | Clarifies type-only imports |
| **Named `export function`** | `export function X() {}` not `export const X = () => {}` | Stack traces, hoisting |
| **Explicit return types** | `function getName(): string` | Catches errors at definition, not call site |

No `any`. `unknown` for deserialised JSON.

---

## Validation

**Zod only.** Zero `class-validator`. All runtime validation via `@wishly/contracts` schemas.

**Two patterns in controllers:**

1. **Direct validation pipe** (dominant):
   ```ts
   @Body(new ZodValidationPipe(CreateInvitationSchema)) body: unknown
   // ...then cast
   const parsed = body as CreateInvitation
   ```

2. **DTO class with static schema** (15 DTOs, only 3 imported):
   ```ts
   export class CreateInvitationDto extends CreateZodDto(CreateInvitationSchema) {}
   
   @Body() body: CreateInvitationDto  // Auto-validated
   ```

**Dual schema pattern** (contracts):
- `InvitationContentSchema` — strict for publish (`version: z.literal(1)`, fields `.min(1)`)
- `DraftInvitationContentSchema` — lenient for autosave (same shape, `.default('')` everywhere)

Schemas are **parsed at read time**, not at definition time. Failures skip gracefully (e.g., rendering blocks fall back to empty on schema error).

---

## Component Style

**React:**

Named export + redundant default:
```ts
export function MyComponent(props: Props) { ... }
export default MyComponent
```

Props as local type:
```ts
type Props = {
  items: Item[]
  onSelect: (item: Item) => void
  disabled?: boolean
}
```

**State management:**
- **apps/studio:** Zustand store with `devtools` in DEV only
- **apps/web:** React Query + component-local `useState` (no Redux, no Context overuse)
- **No form library:** hand-written controlled forms + Zod validation

**Styling:**
- Tailwind 4 (zero-config, no `tailwind.config.*`)
- **Semantic tokens** (`bg-background`, `text-foreground`, `border-border-strong`, `shadow-card`)
- **No dark mode** (zero `dark:` variants)
- **Mobile-first:** `min-h-9` (36px) / `min-h-11` (44px) touch targets, `h-dvh` instead of `h-screen`, bottom `Sheet`s on mobile
- **Per-component `style` + CSS vars** for invitation renderer (OG-safe, not Tailwind)

---

## Comments & Documentation

**JSDoc blocks** (`/** */`) encode **why**, frequently citing:
- Product/plan identifiers: P01–P13 (phase markers)
- External specs: "Nghị định 13/2023", "privacy-data.md §04", "system-messages.md §02"
- Architectural decisions: "convention #19", "keepsake rule"

Example:
```ts
/**
 * Invitation lifecycle is DRAFT → PUBLISHED → ENDED.
 * ENDED invitations are read-only but **never 404** — a keepsake rule
 * (P01–P13 product decision, not a tech compromise).
 * Purge anonymises guests on schedule per Nghị định 13/2023 §04.
 */
async deleteEvent(id: string) { ... }
```

**Inline comments** explain **what** only when not obvious:
```ts
// Diacritic-insensitive search (NFD + \p{M} strip, capped 40 results)
const results = search(query)
```

---

## Error Handling

**Backend (NestJS):** Custom exception classes extending `HttpException`, caught by `HttpExceptionEnvelopeFilter` (opt-in per route). Domain errors carry `code` (e.g., `CONSENT_REQUIRED`, `GUEST_LIMIT`, `SLOT_LIMIT`), always with Vietnamese `message`.

**Frontend:** No global error boundary in studio (by design). web has `AppErrorBoundary` at routes level. 401 responses render an `ErrorState` per page (no redirect, no login screen).

**Try-catch:** Used sparingly. Mailer swallows all errors (`safeSend`) — mail never breaks a request.

---

## Response Shapes

**Two conventions coexist** (convention #19). No cut-over plan documented.

| Era | Routes | Shape | Pattern |
|---|---|---|---|
| **P01–P06** | auth, plans, media, orders, invitations CRUD, guests CRUD, public RSVP | Bare JSON | `{"slug":"...","status":"DRAFT"}` |
| **P07–P13** | seating, checkin, partner, post-event, privacy, delete, renew, consent | Wrapped | `{"data":{...}}` or `{"error":{"code":"...","message":"...","details":{...}}}` |

Interceptor/filter are **opt-in per controller** with explicit "never register globally" comments.

---

## Authorization

**Single gate:** `InvitationsService.assertCanAccess(id, user, anonSessionId, {write})` — controllers call this in services, not in guards.

**Three-branch logic:**
1. B2C owner: `user.id === ownerId`
2. Anonymous draft: `!ownerId && anonSessionId` match
3. Partner member: delegated to `evaluatePartnerAccess(role)` (admin/edit/view)

**Guards (NestJS):** `JwtAuthGuard` (global), `OptionalJwtAuthGuard`, `GoogleAuthGuard`, `StaffTokenGuard`, `AdminGuard`, `PartnerContextGuard`, `PartnerRoleGuard`.

**Decorators:** `@Public()`, `@CurrentUser()`, `@CurrentPartner()`, `@Staff()`, `@PartnerRoles(...)`.

---

## Async & Concurrency

**No advisory locks in the FE** (not applicable). **Backend advisory locks** (PostgreSQL) via `withAdvisoryLock(lockId, fn)` for 5 cron jobs (lock keys 42100–42104).

**Optimistic updates (FE):** True pattern only in seating (React Query `onMutate` snapshot + rollback). Elsewhere, mutations await server response.

**Autosave (studio):** 800ms debounce with immediate `localStorage` mirror. `saveGenRef` generation counter drops stale responses. `flush()` awaited by publish.

---

## Conventions Actually Observed

✓ Consistent kebab-case file naming (except React components)
✓ Workspace package imports (no relative paths across projects)
✓ Zod-only validation
✓ Named `export function` + redundant `default`
✓ Props as local `type`
✓ Semantic Tailwind tokens
✓ JSDoc blocks citing specs/phases
✓ No form library (controlled `useState` + Zod)
✓ No TS path aliases
✓ Strict TypeScript config
✓ Advisory locks for scheduled jobs
✓ Single authorization gate (`assertCanAccess`)

---

## Known Inconsistencies

✗ `apps/web` + `apps/studio` both declare `ApiError`/`AuthUser` locally (drift)
✗ Two HTTP transports (`apps/*/lib/api.ts` vs `@wishly/api-client`)
✗ Two response shapes coexisting (no cut-over plan)
✗ Palette hex in 2 independent places (templates, ui tokens) — api bridge deleted 2026-07-30
✗ Enum-like columns as plain `String` in Prisma (validation only at app level)
✗ Comments cite plan/phase identifiers (P01–P13) but these aren't tracked in issue system

See [**Project Roadmap**](project-roadmap.md) → "De-duplicate HTTP transports" and "Finish response-envelope migration."

