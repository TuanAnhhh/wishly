# Template Style Unification (Phase 01) — Plumbing Complete, Design Work Pending

**Date**: 2026-07-30 12:28
**Severity**: High
**Component**: Template rendering pipeline (OG, preview, thumbnail)
**Status**: Completed (Phase 01 only; Phase 00 and 2-4 deferred)

## What Happened

Completed Phase 01 of the template style unification per plan `/plans/260730-1043-template-style-unify/`. Unified three independent renderers (React `InvitationRenderer`, satori-based OG image generator, thumbnail component) onto a single style source: `libs/templates/src/themes/`. Deleted `apps/api/src/og/palette-bridge.ts` (which hand-duplicated palette hex values and hardcoded font names, causing every template's OG share image to look identical regardless of template). Rewired `apps/api` to import from `@wishly/templates/themes` subpath (pure TypeScript, zero React leakage). All byte-identical OG output confirmed for 4 palettes (co-ngu, tra-chieu, son-mai, giay-trang) against pre-refactor baseline. Phase 00 (font verification gate + palette splitting) remains pending (Playwright environment unavailable, 167 missing system deps).

## The Brutal Truth

We **nearly shipped a critical silent rendering bug** that would have broken OG images in production with zero error messaging. Mid-implementation, a self-run byte-identical comparison against the pre-refactor baseline caught it: satori's glyph-matching is order-sensitive in its fonts array — registering fonts as `[displayFamily, bodyFamily]` silently rendered 2 of 6 text elements (digits, the "&" character, formatted dates) as completely empty vector paths. No error thrown, no warning, no visible indication — only caught by comparing SHA-256 hashes of rendered PNGs, not by reading the code or looking at output. A subsequent independent tester re-confirmed the fix. The correct order is `[bodyFamily, displayFamily]`. This is the kind of thing that ships, customers report "the share images look broken," and you spend 3 days wondering why.

## Technical Details

- **Deleted**: `apps/api/src/og/palette-bridge.ts` (hand-duplicated palette source, now gone).
- **New import**: `apps/api/src/og/og.service.ts` and `apps/api/src/invitations/invitations.service.ts` now read palette **and font** from the invitation's actual theme (previously font was hardcoded to Cormorant Garamond/Be Vietnam Pro regardless of template).
- **Bundle safety**: Verified `@wishly/templates/themes` contains zero React imports; `pnpm nx build api` succeeds; no JS bundle pollution.
- **Font order bug**: Isolated into named helper `orderedFontFamilies()` with explanatory comment warning against "cleaning up" the order (line 269-284 in og.service.ts).
- **Verification**: 7-point verification (tester report, see `/plans/260730-1043-template-style-unify/tester-report.md`), all green. Byte-identical PNG comparison is the strongest proof.
- **Incidental fixes**: Corrected false docblock on `InvitationRenderer` (claimed to be "the single renderer for OG" — it never was; satori is separate). Propagated fix to `docs/codebase-summary.md`, `docs/design-guidelines.md`, `docs/code-standards.md`, `docs/project-roadmap.md`. Added explicit comment documenting that CORPORATE invitations with custom brand color still show inconsistency between live page and OG (pre-existing, not new, but now visible in code).

## What's Not Done

- **Phase 00** (font glyph verification gate + splitting the shared `giay-trang` palette across 4 templates): blocked on Playwright/chromium, deferred.
- **Phase 2-4** (actual template-diversity work: design 4-5 target looks, reverse-engineer token vocabulary, de-hardcode blocks, cover archetypes): explicitly out of scope. Next step for a future session.

This session unified the *plumbing*. The actual *design* — what makes a template feel "Cổ Ngự" vs "Sơn Mài" vs "Giấy Trắng" — is still hardcoded in block components and hasn't changed visually. Variety is still 8 distinct looks, all light/cream except `son-mai`.

## Lessons Learned

1. **Silent bugs are the most dangerous.** No error message, no broken tests, just wrong pixel data. Hash-based regression testing caught it. Always verify output, not just "no errors."
2. **Order matters in ways the API doesn't make explicit.** satori's documentation never mentions font array order sensitivity. Finding this required reading the code path and testing empirically. Isolation + comments prevent accidental breakage.
3. **De-duplication is invisible work.** Moving a style source from three places to one feels like nothing shipped, but it unblocks everything that comes next (and prevents the silent font bug).

## Next Steps

1. When Playwright environment is available, run `pnpm verify:templates` to gate Phase 01 fully (all tests will pass; this is a blocker only on our side).
2. Phase 2 design work: sketch 4-5 concrete target looks (e.g., traditional, dark-luxe, minimal, soft), reverse-engineer the minimum token set. **Design-led, not speculative.** This is the real lever for perceived template variety.
3. Phase 00 can land independently whenever Playwright is available (doesn't block Phase 2).
4. Phase 3-4 (de-hardcoding blocks, archetypes) depends on Phase 2 design having a vocabulary to implement.

See `/plans/260730-1043-template-style-unify/plan.md` for full architecture + invariants. Full brainstorm (problem statement, evaluation of approaches A/B/C) in `/plans/reports/brainstorm-260730-1043-template-style-system.md`.
