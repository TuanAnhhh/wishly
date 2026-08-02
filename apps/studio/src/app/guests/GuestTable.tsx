import { useMemo, useState } from 'react';
import {
  Badge,
  BaseDropdownMenu,
  Button,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wishly/ui';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import type { api } from '../../lib/api';

type Guest = Awaited<ReturnType<typeof api.listGuests>>['guests'][number];
type StatusFilter = 'all' | 'yes' | 'no' | 'pending';

export type GuestTableProps = {
  guests: Guest[];
  count: number;
  onRemind: (guest: Guest) => void;
  onCopyLink: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onAddFirst: () => void;
  onAdd: () => void;
  onImportExcel: (file: File) => void;
  onExportExcel: () => void;
  canImport: boolean;
};

function rsvpBadge(g: Guest) {
  if (g.rsvp == null) {
    return {
      label: 'Chưa phản hồi',
      className: 'bg-warning-soft text-warning-ink',
    };
  }
  if (g.rsvp.attending) {
    return {
      label: 'Sẽ đến',
      className: 'bg-success-soft text-success-ink',
    };
  }
  return { label: 'Không đến', className: 'bg-muted text-muted-foreground' };
}

function companionLabel(g: Guest) {
  if (g.rsvp?.attending !== true) return '–';
  const n = g.rsvp.plusOnes ?? 0;
  return n > 0 ? `+${n}` : '–';
}

/** Server caps reminders at 2/guest — only relevant while still pending. */
function remindExhausted(g: Guest) {
  return g.rsvp == null && (g.remindedCount ?? 0) >= 2;
}

/** "Khách mời" tab — search/filter + table (desktop) / card list (mobile), theo design Quản lý khách mời. */
export function GuestTable({
  guests,
  count,
  onRemind,
  onCopyLink,
  onDelete,
  onAddFirst,
  onAdd,
  onImportExcel,
  onExportExcel,
  canImport,
}: GuestTableProps) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const groups = useMemo(
    () => Array.from(new Set(guests.map((g) => g.group).filter(Boolean))) as string[],
    [guests]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q) && !(g.phone ?? '').includes(q)) {
        return false;
      }
      if (group !== 'all' && g.group !== group) return false;
      if (status === 'yes' && g.rsvp?.attending !== true) return false;
      if (status === 'no' && g.rsvp?.attending !== false) return false;
      if (status === 'pending' && g.rsvp != null) return false;
      return true;
    });
  }, [guests, search, group, status]);

  if (count === 0) {
    return (
      <EmptyState
        title="Danh sách khách còn trống"
        body="Thêm tên khách để gửi thiệp riêng và theo dõi phản hồi."
        primary={{ label: 'Thêm khách đầu tiên', onClick: onAddFirst }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Tìm theo tên hoặc số điện thoại"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tất cả nhóm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Mọi trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi trạng thái</SelectItem>
            <SelectItem value="yes">Sẽ đến</SelectItem>
            <SelectItem value="no">Không đến</SelectItem>
            <SelectItem value="pending">Chưa phản hồi</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center">
            <span className="sr-only">Nhập từ Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={!canImport}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportExcel(file);
                e.target.value = '';
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={!canImport} asChild>
              <span>Nhập từ Excel</span>
            </Button>
          </label>
          <Button type="button" size="sm" variant="outline" onClick={onExportExcel}>
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-foreground">
          Hiện {filtered.length}/{count} khách
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          + Thêm khách
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khách</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Phản hồi</TableHead>
              <TableHead>Đi cùng</TableHead>
              <TableHead>Đường link riêng</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((g) => {
              const badge = rsvpBadge(g);
              return (
                <TableRow key={g.id}>
                  <TableCell>
                    <p className="font-medium">{g.name}</p>
                    {g.note ? (
                      <p className="text-xs text-secondary-foreground">{g.note}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-secondary-foreground">{g.group ?? '—'}</TableCell>
                  <TableCell className="text-secondary-foreground">{g.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{companionLabel(g)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => onCopyLink(g)}>
                        Chép link
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={remindExhausted(g)}
                        onClick={() => onRemind(g)}
                      >
                        {remindExhausted(g) ? 'Đã nhắc đủ 2 lần' : 'Gửi Zalo'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <BaseDropdownMenu
                      trigger={
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Thêm thao tác">
                          <EllipsisHorizontalIcon className="size-4" />
                        </Button>
                      }
                      items={[
                        {
                          label: 'Xoá khách',
                          variant: 'destructive',
                          onSelect: () => onDelete(g),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y border border-border sm:hidden">
        {filtered.map((g) => {
          const badge = rsvpBadge(g);
          return (
            <li key={g.id} className="space-y-2 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-secondary-foreground">
                    {[g.group, g.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <Badge className={badge.className}>{badge.label}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onCopyLink(g)}
                >
                  Chép link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={remindExhausted(g)}
                  onClick={() => onRemind(g)}
                >
                  {remindExhausted(g) ? 'Đã nhắc đủ 2 lần' : 'Gửi Zalo'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default GuestTable;
