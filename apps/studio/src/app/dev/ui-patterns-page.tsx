import { useState } from 'react';
import {
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  BaseButton,
  BaseCheckboxField,
  BaseConfirmDialog,
  BaseDatePicker,
  BaseDatePickerTime,
  BaseDropdownMenu,
  BaseDropzone,
  BaseDropZoneArea,
  BaseDropzoneDescription,
  BaseDropzoneFileList,
  BaseDropzoneFileListItem,
  BaseDropzoneMessage,
  BaseDropzoneRemoveFile,
  BaseDropzoneTrigger,
  BaseModal,
  BaseRadioField,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Input,
  BaseInfiniteProgress,
  SectionLabel,
  BaseSelectField,
  BaseSwitchField,
  BaseTextAreaField,
  BaseTextField,
  useBaseDropzone,
} from '@wishly/ui';

/**
 * Playground — thử nhanh các L2 pattern facade (`@wishly/ui`).
 * Không phải trang sản phẩm, chỉ để dev xem DX + hình ảnh thực tế.
 * Route: /dev/ui-patterns
 */
export function UiPatternsPage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('');
  const [notify, setNotify] = useState(true);
  const [agree, setAgree] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [date, setDate] = useState('');
  const [datetime, setDatetime] = useState('');
  const [tableKind, setTableKind] = useState('round');
  const [search, setSearch] = useState('');
  const [subdomain, setSubdomain] = useState('hoa-sen');
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const dropzone = useBaseDropzone({
    onDropFile: async (file) => {
      await new Promise((r) => setTimeout(r, 800));
      return { status: 'success' as const, result: `mock/${file.name}` };
    },
    validation: { maxFiles: 1 },
  });

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">UI Patterns Playground</h1>
        <p className="text-sm text-secondary-foreground">
          Thử các L2 facade trong <code className="text-xs">@wishly/ui</code> —
          import + truyền props, không ghép Label+Input tay.
        </p>
      </header>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseTextField</SectionLabel>
        <BaseTextField
          label="Họ tên"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Hiển thị trên thiệp mời"
        />
        <BaseTextField
          label="Email (lỗi mẫu)"
          type="email"
          defaultValue="khong-hop-le"
          error="Email không hợp lệ"
        />
        <BaseTextField label="Đã khoá" defaultValue="Không sửa được" disabled />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseTextAreaField</SectionLabel>
        <BaseTextAreaField
          label="Giới thiệu ngắn"
          placeholder="Vài dòng về sự kiện…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          hint={`${bio.length}/200 ký tự`}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseSelectField</SectionLabel>
        <BaseSelectField
          label="Vai trò"
          placeholder="Chọn vai trò"
          value={role}
          onValueChange={setRole}
          options={[
            { value: 'host', label: 'Chủ tiệc' },
            { value: 'staff', label: 'Nhân viên check-in' },
            { value: 'guest', label: 'Khách mời' },
          ]}
          hint="Ảnh hưởng quyền truy cập"
        />
      </section>

      <section className="space-y-5 border border-border p-4">
        <SectionLabel>BaseSwitchField / BaseCheckboxField</SectionLabel>
        <BaseSwitchField
          label="Nhận thông báo qua email"
          hint="Tắt thì chỉ xem trong ứng dụng."
          checked={notify}
          onCheckedChange={setNotify}
        />
        <BaseSwitchField label="Đã khoá (disabled)" checked={false} disabled />
        <BaseCheckboxField
          label="Tôi đồng ý với điều khoản"
          checked={agree}
          onCheckedChange={(v) => setAgree(v === true)}
          error={!agree ? 'Bắt buộc để tiếp tục' : undefined}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseRadioField</SectionLabel>
        <BaseRadioField
          label="Loại bàn"
          className="flex flex-row gap-4"
          value={tableKind}
          onValueChange={setTableKind}
          options={[
            { value: 'round', label: 'Tròn 10' },
            { value: 'long', label: 'Dài 14', hint: 'Phù hợp phòng dài' },
          ]}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseTextField — addon (startAddon / endAddon)</SectionLabel>
        <BaseTextField
          placeholder="Tìm khách mời…"
          startAddon={<MagnifyingGlassIcon className="size-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          hint="Không cần label — dùng như input trần"
        />
        <BaseTextField
          label="Subdomain (endAddon)"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          endAddon={<span className="whitespace-nowrap">.thiepviet.vn</span>}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseButton (loading)</SectionLabel>
        <BaseButton
          type="button"
          loading={saving}
          onClick={() => {
            setSaving(true);
            setTimeout(() => setSaving(false), 1500);
          }}
        >
          Lưu thay đổi
        </BaseButton>
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseModal</SectionLabel>
        <Button type="button" onClick={() => setModalOpen(true)}>
          Mở modal
        </Button>
        <BaseModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Thêm khách hàng"
          description="Demo BaseModal — title/description/footer chuẩn hoá."
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Huỷ
              </Button>
              <Button type="button" onClick={() => setModalOpen(false)}>
                Xác nhận
              </Button>
            </>
          }
        >
          <BaseTextField label="Tên" placeholder="Nguyễn Văn A" />
        </BaseModal>
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseConfirmDialog</SectionLabel>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            Xoá mục này
          </Button>
          {deleted ? (
            <p className="text-sm text-secondary-foreground">Đã xoá ✓</p>
          ) : null}
        </div>
        <BaseConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Xoá mục này?"
          description="Không thể hoàn tác. Đây chỉ là demo, không có gì mất thật."
          variant="destructive"
          confirmLabel="Xoá"
          onConfirm={() => {
            setDeleted(true);
            setConfirmOpen(false);
          }}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseDatePicker / BaseDatePickerTime</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Ngày (BaseDatePicker)</p>
            <BaseDatePicker value={date} onChange={setDate} />
          </div>
          <div>
            <BaseDatePickerTime value={datetime} onChange={setDatetime} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseDropdownMenu</SectionLabel>
        <BaseDropdownMenu
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Thêm thao tác">
              <EllipsisHorizontalIcon className="size-4" />
            </Button>
          }
          items={[
            { label: 'Chỉnh sửa', onSelect: () => alert('Chỉnh sửa') },
            { label: 'Nhân bản', onSelect: () => alert('Nhân bản') },
            { type: 'separator' },
            {
              label: 'Xoá',
              variant: 'destructive',
              onSelect: () => alert('Xoá'),
            },
          ]}
        />
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>Field (compound — escape hatch)</SectionLabel>
        <p className="text-xs text-secondary-foreground">
          Dùng khi layout đặc biệt mà L2 facade chưa cover — không phải cách
          dùng mặc định.
        </p>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="compound-demo">Mã quầy</FieldLabel>
            <FieldDescription>Chỉ dùng nội bộ, không hiện khách.</FieldDescription>
          </FieldContent>
          <Input id="compound-demo" placeholder="Q-01" className="sm:max-w-40" />
        </Field>
      </section>

      <section className="space-y-4 border border-border p-4">
        <SectionLabel>BaseDropzone (upload giả lập)</SectionLabel>
        <BaseDropzone {...dropzone}>
          <BaseDropZoneArea className="min-h-32 flex-col gap-2">
            <div className="rounded-full bg-muted p-3">
              <ArrowUpTrayIcon className="size-5 text-muted-foreground" />
            </div>
            <BaseDropzoneDescription>Kéo file vào đây</BaseDropzoneDescription>
            <BaseDropzoneTrigger>Chọn file</BaseDropzoneTrigger>
          </BaseDropZoneArea>
          <BaseDropzoneMessage />
          <BaseDropzoneFileList>
            {dropzone.fileStatuses.map((file) => (
              <BaseDropzoneFileListItem key={file.id} file={file}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {file.fileName}
                    </p>
                    <BaseInfiniteProgress status={file.status} />
                  </div>
                  <BaseDropzoneRemoveFile variant="ghost" size="icon-sm">
                    <XMarkIcon className="size-4" />
                  </BaseDropzoneRemoveFile>
                </div>
              </BaseDropzoneFileListItem>
            ))}
          </BaseDropzoneFileList>
        </BaseDropzone>
      </section>
    </div>
  );
}

export default UiPatternsPage;
