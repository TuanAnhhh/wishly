---
title: "Journal — UI pattern layers plan"
date: 2026-07-30
tags: [ui, planning]
---

# Journal — UI pattern layers plan

## Context

Brainstorm mở rộng `libs/ui` (goal 1.c). User nhảy `/ck:plan` trước khi trả A/B/C → lock khuyến nghị A2/B3/C2.

## What happened

- Scout: phase-01b done; pain = layer mờ (`dropzone` in `ui/`), no Storybook.
- Chốt P1 folder split, reject mini-MUI.
- Plan `plans/260730-0738-ui-pattern-layers/` — 5 phases, ~2.5d, P2, không block launch.
- ADR `docs/decisions/260730-ui-pattern-layers.md`.

## Decisions

- L1 `ui/` · L2 `patterns/` · `brand/` · `states/`
- **Revision:** L2 props-first (B2) — DX import+props; compound = escape hatch
- Cook order: 01 → 04 → 02 → 03 → 05; effort ~3.5d

## Next

`/ck:cook --auto` plan path; chốt optional RadioGroupField / FileUpload wave-1 nếu cần.
