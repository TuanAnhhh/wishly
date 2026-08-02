---
name: wishly-ui
description: >-
  Wishly / Thiệp Việt UI kit in libs/ui. Use when adding or changing shadcn/ui
  components, Tailwind tokens, Heroicons, SectionLabel/DiamondRule, form fields,
  or phase-01b base components. Mandates installing base components via shadcn
  CLI before any custom Design System edits, and using L2 pattern facades
  (BaseTextField, BaseSelectField…) instead of assembling L1 primitives by hand.
---

# Wishly UI (`libs/ui`)

## Layers

```
libs/ui/src/components/
  ui/         # L1 Origin — shadcn primitives / compound shadcn-style. Building blocks.
  patterns/   # L2 Complete — PUBLIC DX MẶC ĐỊNH. Props-first: import + truyền props.
  brand/      # Wordmark, SectionLabel, DiamondRule, RingStat — brand/ornament, không phải L2.
  states/     # EmptyState, ErrorState, OfflineBanner, LoadingSkeleton — UX state kit.
```

**Quy tắc vàng — L2 trước:**

```tsx
// ĐÚNG — props-first, giống thư viện UI thông thường
import { BaseTextField } from '@wishly/ui'
<BaseTextField label="Email" value={v} onChange={...} error={err} />

// TRÁNH — ghép L1 tay (chỉ dùng khi cần layout đặc biệt mà L2 chưa cover)
import { Label, Input } from '@wishly/ui'
<Label htmlFor="x">Email</Label>
<Input id="x" value={v} onChange={...} />
```

Mọi component ở `patterns/` (trừ `Field` compound — đã ở `ui/`) đặt tên prefix **`Base`** (`BaseTextField`, `BaseSelectField`, `BaseRadioField`, `BaseSwitchField`, `BaseCheckboxField`, `BaseButton`, `BaseModal`, `BaseConfirmDialog`, `BaseDropdownMenu`, `BaseDatePicker`, `BaseDatePickerTime`, `BaseDropzone`…) để tránh đụng tên với component domain (L3) ở `apps/*/features`. File cũng đặt tên `base-*.tsx` (vd `base-text-field.tsx`) khớp export.

- Cần input trần (search box, addon) không label → vẫn dùng `BaseTextField` (bỏ `label`), có `startAddon`/`endAddon` qua `InputGroup` (vd icon tìm kiếm, hậu tố domain). Không tạo component `BaseInput` riêng — trùng lặp với `BaseTextField`.
- ≤ 4-5 lựa chọn cần thấy hết cùng lúc → `BaseRadioField`; nhiều lựa chọn / danh sách động → `BaseSelectField`.
- Nút có async action (mutation) → `BaseButton` (`loading` tự hiện spinner + disable) thay vì `Button` + `disabled={isPending}` tay.
- Modal ngoài xác nhận đơn giản (`BaseConfirmDialog`) → `BaseModal` (title/description/footer/scrollable), **không** tự viết `fixed inset-0 z-50` hay ghép `Dialog`+`DialogContent`+`DialogHeader` tay.

Xem contract đầy đủ: `libs/ui/src/components/patterns/README.md`.

**L3 (domain) không thuộc `libs/ui`:** `MediaField`, `AlbumField`, `GuestTable`… ở `apps/*/features`. Promote lên `patterns/` chỉ khi ≥2 chỗ dùng **và** tách được domain (upload/API/route) ra khỏi component.

**Phạm vi — không dùng `Base*` trong `libs/templates` (block thiệp):** `libs/templates/src/blocks/*` render nội dung **cho khách xem trên thiệp**, dùng hệ theme riêng qua CSS variables `--inv-*` (`--inv-bg`, `--inv-accent`, `--inv-border-strong`, `--inv-font-display`…) đổi theo từng thiệp/theme cặp đôi chọn — độc lập hoàn toàn với token Tailwind của admin (`border-input`, `bg-card`… trong `globals.css` của `libs/ui`). `Base*` component gắn cứng token admin nên **không** convert form/field trong `libs/templates` sang `Base*` — sẽ mất theme `--inv-*` riêng của thiệp. `libs/templates` chỉ được dùng `DiamondRule` từ `@wishly/ui` (hoạ tiết hình học thuần, không token màu).

## Hard rule — CLI before custom (L1)

**Cấm** viết tay / paste lại base shadcn component từ đầu.

Luồng bắt buộc:

1. **Cài bằng lệnh shadcn** từ `libs/ui` (cwd = `libs/ui`).
2. **Rồi mới custom** file đã generate trong `libs/ui/src/components/ui/*` theo Design System + phase-01b.
3. **Không** wrap thêm lớp abstraction quanh shadcn ngay trong `ui/` — lớp bọc props-first (facade) sống ở `patterns/`, không sửa file L1 gốc để giả lập facade.

Nếu file đã bị viết tay trước (vd `button.tsx`): xóa hoặc overwrite bằng `shadcn add <name> --overwrite`, sau đó mới apply token/size/a11y.

Component không có sẵn trên shadcn registry → viết **compound kiểu shadcn** trong `ui/` (`data-slot`, Radix nếu cần, `cn`/`cva`), rồi mới bọc L2 facade nếu cần DX props phẳng.

## Design sources

- Tokens / brand: repo sibling `../Thiệp Việt Design System/` (readme + `tokens/*.css` + `SKILL.md`).
- Plan chi tiết: `../plans/260727-1529-thiep-viet-platform/phase-01b-ui-base-components.md`.
- Layer decision: `../plans/260730-0738-ui-pattern-layers/plan.md` · ADR `docs/decisions/260730-ui-pattern-layers.md`.
- Icons: **Heroicons** (`@heroicons/react`). Nếu CLI inject `lucide-react` → thay Heroicons. Brand ornament (`DiamondRule`, khối hình học) = CSS thuần, không icon.

## Setup commands

```bash
cd libs/ui

# components.json đã có iconLibrary: heroicons
# Cài từng component hoặc batch:
pnpm dlx shadcn@latest add button input textarea label form select switch checkbox radio-group
pnpm dlx shadcn@latest add card separator tabs sheet dialog alert-dialog
pnpm dlx shadcn@latest add progress sonner skeleton badge tooltip
pnpm dlx shadcn@latest add table dropdown-menu avatar popover calendar

# Overwrite nếu cần thay bản viết tay:
pnpm dlx shadcn@latest add button --overwrite
```

Chạy CLI **trong `libs/ui`**, không từ root monorepo.

## After install — customize (tóm tắt)

Áp dụng đúng phase-01b, không đoán:

| Component | Custom chính |
|---|---|
| `button` | h-11 / h-10 / h-14 / size-11 · radius 3px · focus-visible · loading giữ size |
| `input` / `textarea` | h-12 · text-base · focus ring token |
| `card` | radius-card 4px · bỏ shadow mặc định |
| `dialog` / `sheet` | shadow/overlay token · overscroll contain · sheet safe-area · close = Heroicons + aria-label |
| `form` | `FormDescription` → `text-secondary-foreground` (không ink-soft <18px) |

- Copy token từ Design System vào `globals.css`; **không** `.dark` cho app UI.
- Helper text <18px dùng muted (ink-muted), không ink-soft.
- Copy UI tiếng Việt; không uppercase tiêu đề VN; không emoji.

## Viết L2 pattern facade (form field)

Mỗi `Base*Field` trong `patterns/`:

1. Nhận `label`, `hint`, `error`, `required`, `disabled`, `id` (auto `useId()`), `className`.
2. Forward control props qua `Omit<React.ComponentProps<typeof Control>, ...>`.
3. Wire `aria-invalid` khi có `error`, `aria-describedby` trỏ error/hint id.
4. Dùng L1 (`Input`, `Select`…) hoặc compound `Field*` bên trong — app không thấy internals.
5. `forwardRef` tới control khi hợp lý (React Hook Form).
6. Export qua `libs/ui/src/index.ts`, tên **prefix `Base`** (vd `BaseTextField`).

Xem ví dụ: `libs/ui/src/components/patterns/base-text-field.tsx` (export `BaseTextField`).

## Export & apps

- Export public qua `libs/ui/src/index.ts`.
- `web` / `studio` import `@wishly/ui` + `@wishly/ui/globals.css` (+ `@wishly/ui/fonts`).
- Tailwind content globs phải include `libs/ui/src/**`.

## DoD check

```bash
# Không còn lucide trong UI kit / apps
rg -i 'lucide' libs/ui apps/ || true

# L2 không lẫn trong ui/ (trừ upstream shadcn thuần)
rg -n 'date-picker|dropzone' libs/ui/src/components/ui || true

# Build
pnpm nx run-many -t build -p web,studio
```
