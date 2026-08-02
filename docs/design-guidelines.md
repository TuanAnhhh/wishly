# Design Guidelines

The Wishly design system is CSS-first with a three-layer architecture. No JavaScript configuration, no dark mode, single "cream" light theme.

## CSS Architecture

Three-layer stack (defined in `libs/ui/src/globals.css`):

### Layer 1: Tokens (`src/styles/tokens.css`)

Raw CSS custom properties on `:root` + reduced-motion override.

**Surfaces:**
- `--background` #F6F1E7 (cream)
- `--card` #FDFBF7 (off-white)
- `--popover` #FDFBF7
- `--secondary` #F2ECE0 (light beige)

**Ink:**
- `--foreground` #2E2620 (dark brown, primary text)
- `--secondary-foreground` #5A4B3F (medium brown)
- `--muted-foreground` #8B7B6C (light brown)
- `--disabled-foreground` #B8AA99 (disabled state)

**Brand:**
- `--primary` #B04A3A (burnt red, primary action)
- `--primary-hover` #8F3A2C (darker red, hover state)
- `--accent-soft` #F5E3DE (pale red, soft background)

**Lines:**
- `--border` #E2D8C8 (light border)
- `--border-strong` #D8CDBB (medium border)
- `--hairline` #EDE4D5 (very light)

**Semantic:**
- `--success` #7A8B6F (muted green)
- `--success-ink` + `-soft` variants
- `--warning` #C9A961 (gold)
- `--warning-ink` + `-soft` variants
- `--destructive` #A33A2E (rust red)
- `--destructive-ink` + `-soft` variants

**Spacing & Motion:**
- `--radius-sharp` 2px, `--radius` 3px, `--radius-card` 4px, `--radius-pill` 999px
- `--duration` 140ms (→ 0ms under `prefers-reduced-motion`)
- `--spacing-hit-min` 44px, `--spacing-hit` 48px, `--spacing-hit-lg` 56px (touch targets)
- `--tracking-micro` .14em, `--tracking-eyebrow` .18em, `--tracking-wordmark` .05em (letter spacing)

**Fonts (4):**
- `--font-sans` Be Vietnam Pro (body, UI)
- `--font-serif` Cormorant Garamond (display)
- `--font-serif-display` Playfair Display (headings)
- `--font-serif-read` Lora (long-form content)

Loaded side-effect-only via `src/fonts.ts` (@fontsource, self-hosted, no CDN).

### Layer 2: Theme (`src/styles/theme.css`)

`@theme inline {}` block mapping tokens → Tailwind utilities. **The public API.**

```css
@theme {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --spacing-hit: var(--spacing-hit);
  /* ... */
}
```

### Layer 3: Base (`src/styles/base.css`)

`@layer base` element defaults:
- `body` — font-sans, line-height 1.75, tabular-nums (for tables/numbers)
- `h1–h3` — font-serif, adjusted font-size/weight
- `code` — monospace, slightly smaller

---

## Component Library

`libs/ui/src/components/` chia 4 layer. Quyết định + rationale: [ADR 260730](decisions/260730-ui-pattern-layers.md) · [plan](../plans/260730-0738-ui-pattern-layers/plan.md).

```
components/
  ui/         # L1 Origin — shadcn primitives / compound shadcn-style
  patterns/   # L2 Complete — DX MẶC ĐỊNH, props-first (import + truyền props)
  brand/      # Brand/ornament — không phải L2
  states/     # UX state kit
```

### L1 — `ui/` (60 shadcn primitives)

Kebab-case, import Radix qua `radix-ui` package. Tất cả emit `data-slot`. 22 dùng Heroicons thay lucide (không còn `lucide-react` trong dependency).

**Extended sizes on button:**
- `xs` (extra-small)
- `icon-xs`, `icon-sm`, `icon-lg` (icon buttons)
- All with **≥44px hit targets** (design rule #3)

**Badge extensions:**
- `ghost` variant (transparent background)
- `link` variant (text-only)

### L2 — `patterns/` (DX mặc định)

**Cách dùng chính của `@wishly/ui`:** import → truyền props, giống thư viện UI thông thường. Không ghép `Label`+`Input`+error tay ở app trừ layout đặc biệt.

| Component | Wraps | Ghi chú |
|---|---|---|
| **BaseTextField** | Label + Input + hint/error | props: `label, hint, error, required`; `className`→input, `wrapperClassName`→root; `startAddon`/`endAddon` (vd hậu tố domain) tự chuyển sang `InputGroup`; `label` optional nên dùng được như input trần |
| **BaseTextAreaField** | Label + Textarea + hint/error | như trên |
| **BaseSelectField** | Label + Select + hint/error | `options={{value,label}[]}`; `className`→trigger |
| **BaseSwitchField** | label row + Switch | layout `justify-between` (settings pattern); không có `error`/`required` |
| **BaseCheckboxField** | Checkbox + label | không có `required` |
| **BaseRadioField** | Label + RadioGroup + hint/error | `options={{value,label,hint?}[]}`; `className`→RadioGroup (mặc định dọc, `"flex flex-row gap-4"` để ngang); dùng khi ≤4-5 lựa chọn |
| **BaseButton** | Button + Spinner | `loading` tự hiện spinner + disable; `loadingText` thay `children` khi loading; bỏ qua khi `asChild` |
| **BaseModal** | Dialog + Header/Footer/ScrollArea | `title, description?, footer?, size, scrollable`; thay modal ghép tay (`fixed inset-0`) hoặc `Dialog`+`DialogContent` lặp lại |
| **BaseConfirmDialog** | AlertDialog + title/description/actions | không tự đóng — gọi `onOpenChange(false)` trong `onConfirm` |
| **BaseDropdownMenu** | DropdownMenu + Trigger/Content/Item | `trigger` + `items[]` (`label, onSelect, variant, render, icon`); falsy trong mảng tự bị lọc (`cond && {...}`) |
| `BaseDatePicker` / `BaseDatePickerTime` | Button + Calendar + Popover | `date-fns` `vi` locale, ISO in/out |
| `BaseDropzone` | compound shadcn (upload) | escape hatch — dùng khi L2 facade chưa cover |
| `Field*` | compound shadcn (`ui/field.tsx`, L1, không prefix `Base`) | escape hatch layout đặc biệt |

Contract đầy đủ: `libs/ui/src/components/patterns/README.md`.

### Brand (`brand/`)

| Component | Purpose |
|---|---|
| **SectionLabel** | Eyebrow caption: 12px semibold, `tracking-micro` uppercase, polymorphic `as` prop |
| **DiamondRule** | Hairline — rotated 7° diamond, `role="separator"` |
| **Wordmark** | Hard-coded "Thiệp Việt", `translate="no"` |
| **RingStat** | SVG radial gauge (progress ring) |

### States (`states/`)

| Component | Purpose |
|---|---|
| **EmptyState** | One-action enforced by type |
| **ErrorState** | Error messaging, tone: `warn \| error` |
| **OfflineBanner** | `navigator.onLine` + `online`/`offline` events |
| **LoadingSkeleton** | Variants: `invitation \| guest-list \| upload \| publish` |

**LoadingSkeleton invitation variant** mirrors actual guest layout to keep **CLS ≤ 0.05** (Cumulative Layout Shift).

### L3 (không thuộc `libs/ui`)

`MediaField`, `AlbumField`, `ArrayField`, `GuestTable`, seating nodes — domain (upload/API/route), sống ở `apps/*/features`. Promote lên `patterns/` chỉ khi ≥2 chỗ dùng **và** tách được domain.

### Styling Helpers

`src/lib/utils.ts` — single helper:
```ts
cn(...) = twMerge(clsx(...))
```

`cva` (class variance authority) dùng trong `button`, `badge`, `tabs`, `field`. Facade L2 dùng `cn()` + composition thay vì `cva` riêng.

---

## Invitation Surface Tokens

Separate namespace: `--inv-*` (not app chrome `--*`). Palettised, theme-aware.

**Per-palette tokens:**
- `--inv-bg` — background
- `--inv-surface` — card background
- `--inv-ink` — primary text
- `--inv-ink-muted` — secondary text
- `--inv-ink-soft` — tertiary text
- `--inv-accent` — brand/highlight colour
- `--inv-accent-soft` — accent background
- `--inv-border` — hairline
- `--inv-border-strong` — stronger border
- `--inv-hairline` — very thin line
- `--inv-on-photo` — text over photos
- `--inv-dark-bg` — dark background (for light photo overlays)
- `--inv-dark-ink` — dark text

**Plus:**
- `--inv-font-display` — heading font
- `--inv-font-body` — body font

---

## Palettes (8 + Runtime Derive)

**Palettes** defined in `libs/templates/src/themes/palettes.ts` (authoritative source).

| ID | Name | Background | Ink | Accent |
|---|---|---|---|---|
| `co-ngu` | Cổ Ngự | #FDFBF7 | #2E2620 | #B04A3A |
| `ao-dai` | Áo Dài | #FDFBF7 | #2E2620 | #B04A3A |
| `sen-ha` | Sen Hạ | #FDFBF7 | #2E2620 | #A33A2E |
| `giay-trang` | Giấy Trắng | #FDFBF7 | #2E2620 | #2E2620 |
| `sai-gon` | Sài Gòn | #F2ECE0 | #2E2620 | #B04A3A |
| `tra-chieu` | Trà Chiều | #E7EBE1 | #2E2620 | #87692B |
| `son-mai` | Sơn Mài | #2E2620 | #FDFBF7 | #C9A961 |
| `vang-cat` | Vàng Cát | #F5EBD6 | #2E2620 | #B04A3A |

**9th (runtime):** `derivePalette(brandColor)` — partner brand custom palette. Derives from `giay-trang` base, ensures `accentContrast ≥ 4.5:1` via `ensureAccentContrast` darkening (×0.88 per iteration, max 24). Invalid hex → `#1F4E5F`.

### Palette Hex Copies ⚠️

**Two independent copies** (sync manually or risk divergence):
1. `libs/templates/src/themes/palettes.ts` — **authoritative**
2. `libs/ui/src/styles/tokens.css` — app chrome tokens (overlap by hand)

There used to be a third: `apps/api/src/og/palette-bridge.ts` hand-copied all 8 palettes for OG image rendering. Deleted 2026-07-30 — OG now imports directly from `libs/templates/src/themes/` via the `@wishly/templates/themes` subpath export (pure TS, no React), so palette + font are single-sourced for the live page, OG, and thumbnail. See `plans/260730-1043-template-style-unify/`.

**No verification** between the two remaining copies. Roadmap: establish sync mechanism.

---

## Fonts & Verification

### 4 Font Presets

Defined `libs/templates/src/themes/fonts.ts`:

| ID | Name | CSS Family | Verified | Usage |
|---|---|---|---|---|
| `be-cormorant` | Cormorant Garamond | Georgia serif | ✓ true | user-selectable (only in font picker) |
| `be-playfair` | Playfair Display | serif | — | backup |
| `be-lora` | Lora | serif | — | backup |
| `cormorant-only` | Cormorant Garamond | Georgia serif | — | internal only |

**Verification gate:** `verified: true` templates pass `tools/verify-template.ts` (Playwright glyph coverage test). Only verified fonts appear in the font picker.

### Glyph Coverage

Hard requirement: the **17 hardest Vietnamese diacritic glyphs** must render (`VERIFY_STRINGS.hardGlyphs` in [verify-content.ts](libs/templates/src/verify-content.ts)):
```
ễộữỡặẩẫựườỹẾỘỮẰỸỢ
```

Plus `document.fonts.check('48px --inv-font-display')` and `24px --inv-font-body` must pass.

---

## Touch Targets

**Minimum 44px hit target** (design rule #3, enforced via Tailwind utilities).

- `min-h-9` — 36px (sub-target, avoided)
- `min-h-11` — 44px (standard button)
- `min-h-13` — 52px (large button)
- `w-11` + `h-11` — 44×44 icon buttons

---

## Color Contrast

**Public recap** + **Album** + **public invitation** are WCAG 2.1 AA validated at deploy time.

- Minimum 4.5:1 contrast between text and background
- Tested via `tools/verify-template.ts` — `contrastRatio(bgHex, fgHex) ≥ 4.5`
- Brand color derivation enforces via `ensureAccentContrast` darkening

---

## Responsive Design

**Mobile-first approach:**

- **No dark mode** (zero `dark:` variants)
- **Bottom sheets** on mobile replace desktop side panels
- **h-dvh** not `h-screen` (avoids address bar jump on mobile Safari)
- **Semantic spacing:** `min-h-9`, `min-h-11` for touch, `gap-4`/`gap-6` for breathing room
- **Print variants** for check-in roster (`print:` Tailwind utilities)

**Breakpoints:** defaults (sm 640px, md 768px, lg 1024px, xl 1280px).

---

## Component Inventory

### shadcn Primitives (60, L1 — `ui/`)

Accordion, Alert, AlertDialog, AspectRatio, Attachment, Avatar, Badge, Breadcrumb, Bubble, Button, ButtonGroup, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, ContextMenu, Dialog, DirectionProvider, Drawer, DropdownMenu, Empty, Form, HoverCard, Input, InputGroup, InputOTP, Item, Kbd, Label, Marker, Menubar, Message, MessageScroller, NativeSelect, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Toaster (sonner), Spinner, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip.

> Note: `BaseDatePicker`, `BaseDatePickerTime`, `BaseDropzone` sống ở L2 `patterns/` (prefix `Base` để tránh đụng tên component domain L3); `Field*` là compound shadcn thuần, sống ở L1 `ui/field.tsx`, không đổi tên. `Bubble`/`Message`/`MessageScroller`/`Attachment` là AI-chat primitives (chưa dùng trong app, giữ ở L1 vì compound kiểu shadcn thuần, chưa cần facade).

### Wishly Custom (8)

SectionLabel, DiamondRule, Wordmark, RingStat, EmptyState, ErrorState, OfflineBanner, LoadingSkeleton.

---

## Barrel & Exports

`libs/ui/src/index.ts` — explicit named re-exports, NodeNext `.js` extensions.

**Subpath exports:**
- `@wishly/ui/globals.css` — CSS entry (Tailwind + base)
- `@wishly/ui/fonts` — Font loader (side-effect-only)

**Note:** `@wishly/ui` **does NOT declare the `@wishly/source` condition** that templates/api-client do. Inconsistency.

---

## Quality Assurance

### Template Verification

`tools/verify-template.ts` — Playwright-based gate:

1. Vietnamese stress strings present (names like "Nguyễn Thị Hường", event name "Lễ Thành Hôn")
2. Glyph coverage (all 17 hard Vietnamese diacritics renderable)
3. Font load ready (`document.fonts.ready`)
4. No horizontal overflow (`scrollWidth ≤ innerWidth + 2px`)
5. Contrast ≥ 4.5:1

Covers **WEDDING templates only** (corporate + birthday/baby-month not enforced).

Runs via `pnpm verify:templates` with Chromium headless. Outputs:
- `artifacts/templates/<slug>-<width>.png` per viewport (390/768/1440)
- `report.json` with findings
- Exit 1 on failure

---

## No Configuration

- **No `tailwind.config.*`** — zero-config Tailwind 4
- **No `postcss.config.*`** — handled by Vite
- **No `@tailwind` directives** (Tailwind 4 auto-injects via `@tailwindcss/vite` plugin)
- **No dark mode** anywhere

---

## Design Decisions

| Decision | Rationale |
|---|---|
| CSS-first Tailwind | Performance, consistency, no JS bloat |
| Three-layer CSS | Separation: tokens (design system) → theme (mapping) → base (defaults) |
| Invitation token namespace | Invitation surface must work in OG images (satori doesn't understand Tailwind) |
| Palette hex copies | Was 3 (incl. a hand-copied OG-only map); consolidated to 2026-07-30, OG now single-sourced |
| No dark mode | Wedding invitations are not nocturnal; cream light theme only |
| 44px touch targets | Vietnamese UX norms (older relatives, outdoor use) |
| Verified fonts | Diacritics must render correctly (broken glyph = formal event failure) |
| Playwright verification | Visual + text gate catches issues at template publish, not user-discover |

