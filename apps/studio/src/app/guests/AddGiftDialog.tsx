import { useState } from 'react';
import {
  BaseTextField,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
  SectionLabel,
} from '@wishly/ui';

export type AddGiftDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sides: string[];
  onAddOne: (entry: { giverName: string; amount: number; side: string; note?: string }) => void;
  onImportFile: (file: File, defaultSide: string) => void;
};

/** "+ Thêm khoản mừng" — ghi tay 1 khoản, hoặc nhập từ sao kê ngân hàng đã xuất sẵn. */
export function AddGiftDialog({ open, onOpenChange, sides, onAddOne, onImportFile }: AddGiftDialogProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState(sides[0] ?? 'Nhà trai');
  const [note, setNote] = useState('');
  const [importSide, setImportSide] = useState(sides[0] ?? 'Chưa phân');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Thêm khoản mừng</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <SectionLabel>Ghi tay 1 khoản</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <BaseTextField
                  id="gift-name"
                  label="Người gửi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <BaseTextField
                  id="gift-amount"
                  label="Số tiền"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div>
                  <BaseTextField
                    id="gift-side"
                    label="Tài khoản nhận"
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    list="gift-sides"
                  />
                  <datalist id="gift-sides">
                    {sides.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <BaseTextField
                  id="gift-note"
                  label="Quan hệ (vd. Bạn cô dâu)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button
                type="button"
                disabled={!name.trim() || !Number(amount.replace(/\D/g, ''))}
                onClick={() => {
                  const n = Number(amount.replace(/\D/g, ''));
                  if (!name.trim() || !n) return;
                  onAddOne({ giverName: name.trim(), amount: n, side, note: note.trim() || undefined });
                  setName('');
                  setAmount('');
                  setNote('');
                }}
              >
                Thêm vào sổ
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <SectionLabel>Nhập từ sao kê</SectionLabel>
              <p className="text-sm text-secondary-foreground">
                Sao kê ngân hàng: cột Số tiền (hoặc Ghi có) + Nội dung/Diễn giải.
              </p>
              <Input value={importSide} onChange={(e) => setImportSide(e.target.value)} list="gift-sides" />
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportFile(file, importSide || 'Chưa phân');
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" asChild>
                  <span>Nhập CSV/Excel sao kê</span>
                </Button>
              </label>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AddGiftDialog;
