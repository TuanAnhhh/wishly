---
title: "UI kit layers — L1 Origin / L2 Complete props-first"
status: accepted
date: 2026-07-30
updated: 2026-07-30
---

# ADR — UI pattern layers (props-first L2)

## Context

`libs/ui` lẫn primitives và composites. User muốn DX như thư viện UI thông thường: **import + truyền props**, không compose Label+Input mỗi lần. L2 là lớp quan trọng nhất.

## Decision

1. **L1 Origin** = `components/ui/` — shadcn CLI / compound shadcn-style. Building blocks.
2. **L2 Complete** = `components/patterns/` — **public DX mặc định**, **props-first** (`TextField`, `SelectField`, `ConfirmDialog`…).
3. **Brand** = `components/brand/`.
4. **States** = `components/states/`.
5. **L3 Product** = `apps/*` — domain; promote có điều kiện.
6. **API:** props-first facade. Compound shadcn = escape hatch / internal engine.
7. Barrel phẳng `@wishly/ui`.
8. **Không** full MUI catalog — wave theo usage, cap rõ.

## Consequences

- App forms ngắn hơn, nhất quán a11y (label/error wire trong L2).
- Duy trì 2 kiểu API một thời gian (raw L1 + L2) — docs/skill đẩy L2.
- Effort cao hơn migrate-only (facade + adopt call sites).

## Alternatives rejected

- Compound-default (B3) — lệch DX user muốn.
- Doc-only / app blocks / full Element clone.

## References

- Plan: `plans/260730-0738-ui-pattern-layers/`
- Brainstorm: `plans/reports/brainstorm-260730-0738-ui-pattern-layers.md`
