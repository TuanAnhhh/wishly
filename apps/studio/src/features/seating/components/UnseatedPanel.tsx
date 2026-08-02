import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { EmptyState, Input, Label } from '@wishly/ui';
import type { SeatingGuest } from '../hooks/useSeating';

function GuestChip({ guest }: { guest: SeatingGuest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `guest:${guest.id}`,
      data: { type: 'guest', guestId: guest.id },
    });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-border bg-card px-3 py-2 text-sm active:cursor-grabbing ${
        isDragging ? 'opacity-70 shadow-md z-30' : ''
      }`}
    >
      <p className="font-medium">{guest.name}</p>
      <p className="text-xs text-secondary-foreground">
        {[guest.group, `${guest.partySize} người`].filter(Boolean).join(' · ')}
      </p>
    </li>
  );
}

type Props = {
  unseated: SeatingGuest[];
  hasGuests: boolean;
  invitationId: string;
};

export function UnseatedPanel({
  unseated,
  hasGuests,
  invitationId,
}: Props) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return unseated;
    return unseated.filter(
      (g) =>
        g.name.toLowerCase().includes(needle) ||
        (g.group ?? '').toLowerCase().includes(needle)
    );
  }, [unseated, q]);

  if (!hasGuests) {
    return (
      <EmptyState
        className="py-8"
        title="Chưa có khách nào"
        body="Thêm khách ở trang Quản lý khách mời trước khi xếp bàn."
        primary={{
          label: 'Quản lý khách',
          href: `/edit/${invitationId}/guests`,
        }}
      />
    );
  }

  if (unseated.length === 0) {
    return (
      <EmptyState
        className="py-8"
        title="Đã xếp hết khách"
        body="Xuất PDF và gửi cho nhà hàng để họ kê bàn theo sơ đồ này."
        primary={{
          label: 'Xuất PDF gửi nhà hàng',
          href: `/edit/${invitationId}/seating/print`,
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <Label>Chưa xếp</Label>
          <p className="text-xs text-secondary-foreground">
            {unseated.length} nhóm
          </p>
        </div>
      </div>
      <Input
        placeholder="Tìm theo tên…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="max-h-[50vh] space-y-2 overflow-auto pr-1">
        {filtered.map((g) => (
          <GuestChip key={g.id} guest={g} />
        ))}
      </ul>
    </div>
  );
}
