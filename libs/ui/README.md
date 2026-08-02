# ui

This is the **Wishly / Thiệp Việt design system** — component library based on shadcn/ui + Tailwind 4.

## Quick Start

**For adding/modifying components:** read the skill at `.claude/skills/wishly-ui/SKILL.md` (or `.cursor/skills/wishly-ui/SKILL.md`).

**For consuming components:** use **L2 props-first facades** (recommended):

```tsx
import { BaseTextField, BaseSelectField, BaseConfirmDialog } from '@wishly/ui'

<BaseTextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} />
```

**Architecture:** 4 layers — `ui/` (L1 primitives) → `patterns/` (L2 facades) → `brand/` (brand) → `states/` (UX states). Details: `src/components/patterns/README.md`.

---

## Running unit tests

Run `nx test ui` to execute the unit tests via [Jest](https://jestjs.io).

