import { useState } from 'react';
import { Button, Card, CardContent, EmptyState, ScrollArea, ScrollBar } from '@wishly/ui';
import type { api } from '../../lib/api';
import { AddGiftDialog } from './AddGiftDialog';

type Gifts = Awaited<ReturnType<typeof api.listGiftEntries>>;
type GiftAccount = { side: string; owner: string; bank: string };

export type GiftsPanelProps = {
  gifts: Gifts | null;
  accounts: GiftAccount[];
  onAdd: (entry: { giverName: string; amount: number; side: string; note?: string }) => void;
  onDelete: (entryId: string) => void;
  onImportFile: (file: File, defaultSide: string) => void;
};

function vnd(n: number) {
  return `${n.toLocaleString('vi-VN')}đ`;
}

function relativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Hôm nay ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Hôm qua ${time}`;
  const days = Math.max(1, Math.round((now.getTime() - d.getTime()) / 86_400_000));
  return `${days} ngày trước`;
}

/** "Tiền mừng đã nhận" tab — sổ nhập tay, không đọc tài khoản ngân hàng. */
export function GiftsPanel({ gifts, accounts, onAdd, onDelete, onImportFile }: GiftsPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const entries = gifts?.entries ?? [];
  const sides = accounts.length > 0 ? accounts.map((a) => a.side) : ['Nhà trai', 'Nhà gái'];

  if (entries.length === 0) {
    return (
      <>
        <EmptyState
          title="Sổ tiền mừng còn trống"
          body="Ghi lại từng khoản mừng để không cảm ơn sót ai — tiền vẫn vào thẳng tài khoản của hai bạn."
          primary={{ label: 'Thêm khoản đầu tiên', onClick: () => setAddOpen(true) }}
        />
        <AddGiftDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          sides={sides}
          onAddOne={onAdd}
          onImportFile={onImportFile}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-secondary-foreground">Tổng đã nhận</p>
            <p className="font-serif text-3xl">{vnd(gifts?.total ?? 0)}</p>
            <p className="text-xs text-secondary-foreground">từ {entries.length} lượt gửi</p>
          </CardContent>
        </Card>
        {accounts.map((a) => (
          <Card key={a.side}>
            <CardContent className="py-4">
              <p className="text-sm text-secondary-foreground">Tài khoản {a.side.toLowerCase()}</p>
              <p className="font-serif text-3xl">{vnd(gifts?.bySide?.[a.side] ?? 0)}</p>
              <p className="text-xs text-secondary-foreground">
                {a.bank} · {a.owner}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-foreground">{entries.length} khoản đã ghi</p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          + Thêm khoản
        </button>
      </div>

      <ScrollArea className="border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-secondary-foreground uppercase">
              <th className="px-3 py-2 font-medium">Người gửi</th>
              <th className="px-3 py-2 font-medium">Số tiền</th>
              <th className="px-3 py-2 font-medium">Tài khoản nhận</th>
              <th className="px-3 py-2 font-medium">Thời gian</th>
              <th className="w-8 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-3">
                  <p className="font-medium">{e.giverName}</p>
                  {e.note ? <p className="text-xs text-secondary-foreground">{e.note}</p> : null}
                </td>
                <td className="px-3 py-3 font-medium tabular-nums">{vnd(e.amount)}</td>
                <td className="px-3 py-3 text-secondary-foreground">{e.side}</td>
                <td className="px-3 py-3 text-secondary-foreground">{relativeTime(e.receivedAt)}</td>
                <td className="px-3 py-3">
                  <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(e.id)}>
                    Xoá
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td className="px-3 py-3" colSpan={3}>
                Tổng cộng
              </td>
              <td className="px-3 py-3 tabular-nums" colSpan={2}>
                {vnd(gifts?.total ?? 0)}
              </td>
            </tr>
          </tfoot>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <p className="text-xs text-secondary-foreground">
        Tiền mừng vào thẳng tài khoản của hai bạn — Thiệp Việt không giữ hộ. Bạn ghi lại vào sổ
        để không cảm ơn sót ai, không đọc thông tin tài khoản ngân hàng.
      </p>

      <AddGiftDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        sides={sides}
        onAddOne={onAdd}
        onImportFile={onImportFile}
      />
    </div>
  );
}

export default GiftsPanel;
