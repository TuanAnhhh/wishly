import { useState } from 'react';
import {
  BaseTextAreaField,
  BaseTextField,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  SectionLabel,
} from '@wishly/ui';

type OtherInvite = { id: string; slug: string; status: string };

export type AddGuestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: boolean;
  onConsentToggle: (checked: boolean) => void;
  groups: string[];
  otherInvites: OtherInvite[];
  onAddOne: (input: {
    name: string;
    phone: string;
    group: string;
    note: string;
  }) => Promise<void>;
  onImportText: (text: string) => Promise<void>;
  onCopyFrom: (sourceId: string) => Promise<void>;
  error: string | null;
  limitMsg: string | null;
};

/** "+ Thêm khách" — thêm 1 người, dán danh sách, hoặc chép từ thiệp cũ. */
export function AddGuestDialog({
  open,
  onOpenChange,
  consent,
  onConsentToggle,
  groups,
  otherInvites,
  onAddOne,
  onImportText,
  onCopyFrom,
  error,
  limitMsg,
}: AddGuestDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('Nhà trai');
  const [note, setNote] = useState('');
  const [importText, setImportText] = useState('');
  const [sourceId, setSourceId] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Thêm khách</DialogTitle>
            </DialogHeader>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {limitMsg ? (
              <p className="text-sm text-destructive">{limitMsg}</p>
            ) : null}

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => onConsentToggle(e.target.checked)}
                className="mt-1"
              />
              Tôi đồng ý lưu SĐT khách theo NĐ 13/2023 và sẽ xoá khi không còn
              cần.
            </label>

            <div className="space-y-3 border-t border-border pt-4">
              <SectionLabel>Thêm 1 người</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseTextField
                  id="g-name"
                  label="Tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <BaseTextField
                  id="g-phone"
                  label="SĐT"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div>
                  <BaseTextField
                    id="g-group"
                    label="Nhóm"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    list="guest-groups"
                  />
                  <datalist id="guest-groups">
                    {groups.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
                <BaseTextField
                  id="g-note"
                  label="Quan hệ (vd. Dì ruột cô dâu)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={!consent || !name.trim()}
                onClick={() =>
                  void onAddOne({ name, phone, group, note }).then(() => {
                    setName('');
                    setPhone('');
                    setNote('');
                  })
                }
              >
                Thêm khách này
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <SectionLabel>Dán danh sách</SectionLabel>
              <p className="text-sm text-secondary-foreground">
                Mỗi dòng: Tên, SĐT, Nhóm.
              </p>
              <BaseTextAreaField
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                placeholder={'Nguyễn Văn A, 0901..., Nhà trai'}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!consent || !importText.trim()}
                onClick={() =>
                  void onImportText(importText).then(() => setImportText(''))
                }
              >
                Nhập danh sách
              </Button>
            </div>

            {otherInvites.length > 0 ? (
              <div className="space-y-3 border-t border-border pt-4">
                <SectionLabel>Chép từ thiệp cũ</SectionLabel>
                <p className="text-sm text-secondary-foreground">
                  Mỗi người nhận đường link riêng mới cho thiệp này.
                </p>
                <select
                  className="w-full border border-border bg-background px-3 py-2 text-sm"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  <option value="">Chọn thiệp nguồn…</option>
                  {otherInvites.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.slug} ({inv.status})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!sourceId}
                  onClick={() => void onCopyFrom(sourceId)}
                >
                  Chép khách
                </Button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AddGuestDialog;
