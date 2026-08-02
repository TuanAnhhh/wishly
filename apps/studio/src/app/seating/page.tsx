import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  LoadingSkeleton,
  Progress,
} from '@wishly/ui';
import { SeatingCanvas } from '../../features/seating/components/SeatingCanvas';
import { SelectedTablePanel } from '../../features/seating/components/SelectedTablePanel';
import { UnseatedPanel } from '../../features/seating/components/UnseatedPanel';
import { useSeating } from '../../features/seating/hooks/useSeating';

export function SeatingPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const seating = useSeating(id);

  if (!id) return null;

  if (seating.isLoading) {
    return <LoadingSkeleton variant="guest-list" rows={4} />;
  }

  if (seating.isError) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Không tải được sơ đồ bàn"
          body="Kiểm tra kết nối rồi thử lại. Thay đổi cục bộ chưa đồng bộ vẫn giữ trên máy khi bạn kéo lại."
          primary={{
            label: 'Thử lại',
            onClick: () => void seating.refetch(),
          }}
          secondary={{
            label: 'Về quản lý khách',
            href: `/edit/${id}/guests`,
          }}
        />
      </div>
    );
  }

  const selected = seating.tables.find((t) => t.id === selectedId) ?? null;
  const pct =
    seating.totalPeople > 0
      ? Math.min(100, Math.round((seating.seatedPeople / seating.totalPeople) * 100))
      : 0;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl leading-[1.25]">Sơ đồ bàn tiệc</h1>
          <p className="text-sm text-secondary-foreground">
            {seating.seatedPeople}/{seating.totalPeople} khách đã xếp ·{' '}
            {seating.tables.filter((t) => t.kind !== 'stage').length} bàn
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              seating.createTable.mutate({ kind: 'round', x: 80, y: 80 })
            }
          >
            Thêm bàn tròn
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              seating.createTable.mutate({ kind: 'long', x: 200, y: 80 })
            }
          >
            Thêm bàn dài
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              seating.createTable.mutate({ kind: 'stage', x: 280, y: 20 })
            }
          >
            Thêm sân khấu
          </Button>
          <Button type="button" size="sm" asChild>
            <Link to={`/edit/${id}/seating/print`}>Xuất PDF gửi nhà hàng</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={seating.lock.isPending}
            onClick={() => seating.lock.mutate()}
          >
            Chốt sơ đồ
          </Button>
        </div>
      </header>

      {seating.seatingLockedAt ? (
        <p className="border border-warning bg-warning/12 px-3 py-2 text-sm">
          Sơ đồ đã gửi nhà hàng — nhớ báo lại nếu đổi. Đã chốt lúc{' '}
          {new Date(seating.seatingLockedAt).toLocaleString('vi-VN')}.
        </p>
      ) : null}

      {seating.overloadTables.length > 0 ? (
        <p className="border border-destructive bg-destructive/8 px-3 py-2 text-sm text-destructive">
          Vượt ghế: {seating.overloadTables.map((t) => t.label).join(', ')}.
          Vẫn lưu được — nhà hàng có thể kê thêm ghế.
        </p>
      ) : null}

      <div className="space-y-2">
        <Progress value={pct} />
        <p className="text-xs text-secondary-foreground">
          Tiến độ xếp theo số người (partySize), không theo số dòng khách.
        </p>
      </div>

      {seating.tables.length === 0 ? (
        <EmptyState
          title="Chưa có bàn nào"
          body="Thêm bàn tròn hoặc bàn dài, rồi kéo nhóm khách vào từng bàn."
          primary={{
            label: 'Thêm bàn tròn đầu tiên',
            onClick: () =>
              seating.createTable.mutate({ kind: 'round', x: 120, y: 120 }),
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <SeatingCanvas
            tables={seating.tables}
            guests={seating.guests}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveTable={seating.moveTable}
            onAssign={(guestId, tableId) =>
              seating.assign.mutate({ guestId, tableId })
            }
          />
          <aside className="space-y-4">
            {selected ? (
              <SelectedTablePanel
                table={selected}
                guests={seating.guests}
                onChangeKind={(kind) =>
                  seating.updateTable.mutate({
                    tableId: selected.id,
                    body: { kind },
                  })
                }
                onUnassign={(guestId) =>
                  seating.assign.mutate({ guestId, tableId: null })
                }
                onDelete={() => {
                  seating.deleteTable.mutate(selected.id);
                  setSelectedId(null);
                }}
              />
            ) : null}
            <UnseatedPanel
              unseated={seating.unseated}
              hasGuests={seating.guests.length > 0}
              invitationId={id}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export default SeatingPage;
