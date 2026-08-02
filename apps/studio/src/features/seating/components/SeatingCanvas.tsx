import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SeatingGuest, SeatingTable } from '../hooks/useSeating';
import { TableNode } from './TableNode';

type Props = {
  tables: SeatingTable[];
  guests: SeatingGuest[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onAssign: (guestId: string, tableId: string) => void;
};

export function SeatingCanvas({
  tables,
  guests,
  selectedId,
  onSelect,
  onMoveTable,
  onAssign,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    const id = String(active.id);

    if (id.startsWith('table:')) {
      const tableId = id.slice('table:'.length);
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      onMoveTable(tableId, table.x + delta.x, table.y + delta.y);
      return;
    }

    if (id.startsWith('guest:') && over) {
      const guestId = id.slice('guest:'.length);
      const overId = String(over.id);
      if (overId.startsWith('drop:')) {
        onAssign(guestId, overId.slice('drop:'.length));
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div
        className="relative h-[560px] w-full overflow-auto border border-border bg-muted"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        onClick={() => onSelect(null)}
      >
        <div className="relative min-h-[520px] min-w-[720px]">
          {tables.map((t) => (
            <TableNode
              key={t.id}
              table={t}
              guests={guests}
              selected={selectedId === t.id}
              onSelect={() => onSelect(t.id)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
