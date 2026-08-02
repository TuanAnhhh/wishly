import type { CSSProperties } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '@wishly/ui';
import type { SeatingGuest, SeatingTable } from '../hooks/useSeating';

export type LoadTone = 'ok' | 'full' | 'over';

export function tableLoad(
  table: SeatingTable,
  guests: SeatingGuest[]
): { load: number; tone: LoadTone } {
  const load = guests
    .filter((g) => g.tableId === table.id)
    .reduce((s, g) => s + g.partySize, 0);
  if (table.kind === 'stage' || table.capacity <= 0) {
    return { load, tone: 'ok' };
  }
  if (load > table.capacity) return { load, tone: 'over' };
  if (load >= table.capacity) return { load, tone: 'full' };
  return { load, tone: 'ok' };
}

const toneClass: Record<LoadTone, string> = {
  ok: 'border-success bg-success/12 text-success',
  full: 'border-warning bg-warning/15 text-foreground',
  over: 'border-destructive bg-destructive/12 text-destructive',
};

type Props = {
  table: SeatingTable;
  guests: SeatingGuest[];
  selected: boolean;
  onSelect: () => void;
};

export function TableNode({ table, guests, selected, onSelect }: Props) {
  const { load, tone } = tableLoad(table, guests);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: `table:${table.id}`, data: { type: 'table', table } });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${table.id}`,
    data: { type: 'table-drop', tableId: table.id },
  });

  const setRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const size =
    table.kind === 'long'
      ? { w: 140, h: 72 }
      : table.kind === 'stage'
        ? { w: 160, h: 56 }
        : { w: 96, h: 96 };

  const style: CSSProperties = {
    left: table.x,
    top: table.y,
    width: size.w,
    height: size.h,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <button
      type="button"
      ref={setRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      style={style}
      className={cn(
        'absolute flex cursor-grab flex-col items-center justify-center border-2 text-center text-xs font-medium active:cursor-grabbing',
        table.kind === 'round' && 'rounded-full',
        table.kind === 'long' && 'rounded-lg',
        table.kind === 'stage' && 'rounded-md',
        toneClass[tone],
        selected && 'ring-2 ring-primary ring-offset-2',
        isOver && 'ring-2 ring-accent',
        isDragging && 'opacity-80 z-20'
      )}
    >
      <span className="leading-tight">{table.label}</span>
      {table.kind !== 'stage' ? (
        <span className="mt-0.5 text-[10px] opacity-80">
          {load}/{table.capacity}
        </span>
      ) : (
        <span className="mt-0.5 text-[10px] opacity-80">Sân khấu</span>
      )}
    </button>
  );
}
