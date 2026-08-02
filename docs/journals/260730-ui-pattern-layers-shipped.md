# UI Pattern Layers (L2) Implementation Shipped

**Date**: 2026-07-30 14:17
**Severity**: Medium
**Component**: `libs/ui` architecture, DX patterns
**Status**: Completed

## What Happened

Shipped the L2 props-first pattern layer end-to-end per plan `/plans/260730-0738-ui-pattern-layers/plan.md`. Restructured `libs/ui/src/components/` into a 4-layer system (UI primitives → pattern facades → brand → state containers). Created 6 new L2 facade components (`TextField`, `TextAreaField`, `SelectField`, `SwitchField`, `CheckboxField`, `ConfirmDialog`) designed for import-and-pass-props DX — replacing manual Label+Input+error composition.

## The Brutal Truth

This took longer than initially scoped because the design decision wasn't settled upfront. We planned B3 (compound-first hybrid API) but the user pivoted during planning to B2 (props-first facade) — the core requirement being "DX like importing a normal UI library and passing props." That pivot was *right*, but it meant rethinking component signatures, validation patterns, and error composition. The initial approach would have been harder to migrate app code against. The override was the right call, just not obvious until we talked through it.

Migrating 3 real app call sites (`privacy-page.tsx`, `staff/page.tsx`, `upgrade/page.tsx`) proved the new DX works and caught issues early — code review flagged 2 high-priority items (README accuracy, missing disabled-state opacity, UX reset bug) all fixed same day. No regressions.

## Technical Details

- **Layer 1 (UI)**: 26 shadcn primitives, unchanged
- **Layer 2 (Patterns)**: 6 new facades + 4 migrated composites (`field.tsx`, `date-picker.tsx`, `date-picker-time.tsx`, `dropzone.tsx`)
- **Layer 3 (Brand)**: 4 brand components moved (`SectionLabel`, `DiamondRule`, `Wordmark`, `RingStat`)
- **Layer 4 (States)**: Unchanged container patterns
- All typecheck/lint/build passing; 9 pre-existing type errors in studio (`clients-page.tsx`, `post-event/page.tsx`, `upgrade/page.tsx` payment typing) flagged as separate tech debt, not caused by this work

## Design Decision

**Override: B3 → B2.** User wanted props-first DX (like Material-UI/Element UI) over compound components. This is the right UX for library consumers — less cognitive load, faster onboarding, fewer decisions per import. We executed B2 (facade wrapping primitives + composition) rather than B3 (hybrid + Compound pattern). Props win.

## Lessons Learned

1. **Design ambiguity kills velocity** — settling the API style upfront (B2 vs B3) matters more than implementation speed. The pivot happened during planning, not mid-code, which saved us.
2. **Real app migrations catch issues** — Moving 3 actual call sites revealed UX details (confirmName reset, disabled opacity) that wouldn't show in component tests.
3. **Layer discipline prevents decay** — Clear layer boundaries (UI → Pattern → Brand → State) make it obvious where new components belong.

## Next Steps

- Wave-2 (deferred, documented): `RadioGroupField`, `FileUpload` facade wrapping Dropzone
- Monitor app adoption of new patterns; expect gradual migration of remaining `Label+Input` compositions
- Keep layer boundaries in linting/governance rules to prevent regressions
