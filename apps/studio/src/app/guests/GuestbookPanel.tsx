import { Button, EmptyState } from '@wishly/ui';
import type { api } from '../../lib/api';

type GuestbookEntry = Awaited<ReturnType<typeof api.listGuestbook>>[number];

export type GuestbookPanelProps = {
  entries: GuestbookEntry[];
  onModerate: (entryId: string, status: 'approved' | 'hidden') => void;
  onEmptyAction: () => void;
};

/** "Lời chúc đã nhận" tab — spam chắc chắn có, giữ moderation Duyệt/Ẩn. */
export function GuestbookPanel({ entries, onModerate, onEmptyAction }: GuestbookPanelProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Chưa có lời chúc nào"
        body="Lời chúc hiện tự động khi khách xác nhận RSVP và gửi lời nhắn trên thiệp."
        primary={{ label: 'Gửi thiệp qua Zalo', onClick: onEmptyAction }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="space-y-2 border border-border p-3">
          <p className="text-sm font-medium">
            {e.name} <span className="text-secondary-foreground">({e.status})</span>
          </p>
          <p className="text-sm whitespace-pre-wrap">{e.message}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => onModerate(e.id, 'approved')}>
              Duyệt
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onModerate(e.id, 'hidden')}>
              Ẩn
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default GuestbookPanel;
