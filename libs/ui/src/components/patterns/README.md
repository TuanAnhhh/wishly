# Patterns (L2 Complete)

**DX mặc định của `@wishly/ui`.** Import → truyền props. Không ghép `Label` + `Input` + error tay ở app.

Mọi component ở layer này (trừ `Field` compound — đã chuyển về `ui/`) đặt tên với tiền tố **`Base`** để phân biệt rõ với component domain (L3) ở `apps/*/features` sau này có thể trùng tên ngắn (vd `TextField` riêng của form nào đó).

```tsx
import { BaseTextField } from '@wishly/ui'

<BaseTextField
  label="Email"
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={error}
  hint="Dùng để gửi thiệp"
/>
```

## Contract

**`BaseTextField` / `BaseTextAreaField` / `BaseSelectField`** (đầy đủ chrome):

| Prop | Type | Ghi chú |
|------|------|---------|
| `label` | `ReactNode` | Hiện label |
| `hint` | `ReactNode` | Helper text (muted, <18px) — ẩn khi có `error` |
| `error` | `ReactNode` | Lỗi; set `aria-invalid` + `aria-describedby` |
| `required` | `boolean` | Đánh dấu `*` + native `required` (AT đọc qua `required`, không cần `aria-required` riêng) |
| `disabled` | `boolean` | Pass-through control |
| `id` | `string` | Tự sinh bằng `useId()` nếu thiếu |
| `className` | `string` | Đi thẳng vào **control** (input/textarea/trigger) |
| `wrapperClassName` | `string` | Root wrapper (label + control + hint/error) |
| …control props | native/shadcn | `value`, `onChange`, `placeholder`, `name`… forward nguyên |

**`BaseSwitchField`**: `label`, `hint`, `disabled` + mọi prop `Switch` (`checked`, `onCheckedChange`…). Không có `error`/`required`.

**`BaseCheckboxField`**: `label`, `hint`, `error`, `disabled` + mọi prop `Checkbox`. Không có `required`.

**`BaseConfirmDialog`**: xem JSDoc trong `confirm-dialog.tsx` — không tự đóng khi confirm, tự gọi `onOpenChange(false)`.

**`BaseDropdownMenu`**: `trigger` (ReactElement, asChild) + `items` (mảng, hỗ trợ `cond && {...}` falsy tự lọc). Mỗi item: `label`, `icon?`, `onSelect?`, `disabled?`, `variant?: "default"|"destructive"`, `render?: (children) => ReactElement` (bọc `Link`/`<a>` — asChild pattern). Entry đặc biệt: `{ type: "separator" }`, `{ type: "label", label }`.

**`BaseRadioField`**: cùng contract chrome (`label`/`hint`/`error`/`required`/`disabled`) + `options: { value, label, hint?, disabled? }[]`, `value`/`defaultValue`/`onValueChange`/`name`. `className` đi vào `RadioGroup` — mặc định xếp dọc (`grid gap-3`), truyền `"flex flex-row gap-4"` để xếp ngang. Dùng khi ≤ 4-5 lựa chọn hiện hết ra màn hình (thay `Select`/`<select>` khi số lượng ít và muốn thấy hết option cùng lúc, vd loại bàn, vai trò).

**`BaseModal`**: facade cho `Dialog` — `open`/`onOpenChange` bắt buộc, `title`, `description?`, `trigger?` (ReactElement, asChild — bỏ qua nếu tự điều khiển `open` từ ngoài), `children` (nội dung), `footer?` (thường 1-2 `Button`/`BaseButton`), `size?: "sm"|"md"|"lg"|"xl"` (mặc định `md`), `scrollable?` (bọc `children` bằng `ScrollArea` khi nội dung dài, giữ header/footer cố định), `showCloseButton?`. Thay mọi modal ghép tay (`fixed inset-0 z-50` tự viết) hoặc `Dialog`+`DialogContent`+`DialogHeader`+`DialogTitle` lặp lại ở app.

**`BaseButton`**: `Button` (L1) + `loading?: boolean` (hiện `Spinner`, tự `disabled`) + `loadingText?` (label thay thế khi loading, mặc định giữ `children`). Thay pattern `disabled={mutation.isPending}` không có feedback trực quan. Không hỗ trợ `loading` khi `asChild` (bỏ qua spinner, chỉ forward `disabled`).

`BaseTextField` hỗ trợ `startAddon?`/`endAddon?` (tự chuyển control sang `InputGroup` khi có) — dùng cho prefix/suffix (icon tìm kiếm, hậu tố domain `.thiepviet.vn`…). `label` là optional nên cũng dùng được như input trần (không cần component riêng).

## Compound = escape hatch

`Field`, `FieldLabel`, `FieldContent`… (shadcn Field kit) sống ở `ui/field.tsx` (L1 — không đổi tên Base) — dùng khi cần layout đặc biệt (horizontal, custom slot), **không phải cách dùng mặc định**.

## Trong `patterns/` này

- `base-field-chrome.tsx` — helper nội bộ (label/hint/error wiring), không export ra `index.ts`
- `base-text-field.tsx` → `BaseTextField` (hỗ trợ `startAddon`/`endAddon`), `base-textarea-field.tsx` → `BaseTextAreaField`, `base-select-field.tsx` → `BaseSelectField`, `base-switch-field.tsx` → `BaseSwitchField`, `base-checkbox-field.tsx` → `BaseCheckboxField`, `base-radio-field.tsx` → `BaseRadioField`
- `base-confirm-dialog.tsx` → `BaseConfirmDialog`, `base-modal.tsx` → `BaseModal`
- `base-button.tsx` → `BaseButton` (Button + loading)
- `base-dropdown-menu.tsx` → `BaseDropdownMenu`
- `base-date-picker.tsx` → `BaseDatePicker`, `base-date-picker-time.tsx` → `BaseDatePickerTime`, `base-dropzone.tsx` → `BaseDropzone` (+ `BaseDropZoneArea`, `BaseDropzoneTrigger`… và hook `useBaseDropzone`)

## Không thuộc L2 (giữ ở app)

`MediaField`, `AlbumField`, `ArrayField`, `GuestTable`, seating nodes — có domain (upload API, React Query, business rule). Promote lên đây chỉ khi ≥2 chỗ dùng **và** tách được domain ra khỏi component (inject qua props/callback).

## Không dùng trong `libs/templates` (block thiệp)

`libs/templates/src/blocks/*` render cho khách xem trên thiệp, dùng hệ theme `--inv-*` (CSS variables đổi theo từng thiệp) — độc lập với token Tailwind admin mà `Base*` đang gắn cứng. Convert form trong block thiệp sang `Base*` sẽ làm mất theme riêng của thiệp. `libs/templates` chỉ dùng `DiamondRule` (hoạ tiết thuần, không token màu) từ `@wishly/ui`.
