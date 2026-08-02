import { useMemo, useState, type ButtonHTMLAttributes } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { BlockKey } from '@wishly/contracts';
import { getBlockDef } from '@wishly/templates';
import { Button, Switch } from '@wishly/ui';
import {
  getBlockFillStatus,
  type BlockFillStatus,
} from '../helpers/blockStatus';
import { Bars4Icon } from '@heroicons/react/24/outline';

type BlockRow = { key: string; enabled: boolean; order: number };

type Props = {
  blocks: BlockRow[];
  content: Record<string, unknown>;
  activeKey: BlockKey;
  onSelect: (key: BlockKey) => void;
  onToggle: (key: BlockKey, enabled: boolean) => void;
  onReorder: (orderedKeys: BlockKey[]) => void;
};

function statusDotClass(status: BlockFillStatus) {
  if (status === 'done') return 'bg-success';
  if (status === 'needs') return 'bg-warning';
  if (status === 'off') return 'bg-border-strong';
  return 'bg-muted-foreground/40';
}

function statusLabel(status: BlockFillStatus) {
  if (status === 'done') return 'Đã xong';
  if (status === 'needs') return 'Cần điền';
  if (status === 'off') return 'Đã tắt';
  return 'Chưa có nội dung';
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function DragHandle(props: ButtonHTMLAttributes<HTMLButtonElement>) {

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Kéo để sắp xếp"
      {...props}
    >
      <Bars4Icon />
    </Button>
  );
}

function SortableBlockRow({
  row,
  active,
  status,
  onSelect,
  onToggle,
}: {
  row: BlockRow;
  active: boolean;
  status: BlockFillStatus;
  onSelect: (key: BlockKey) => void;
  onToggle: (key: BlockKey, enabled: boolean) => void;
}) {
  const key = row.key as BlockKey;
  const def = getBlockDef(key);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: key });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: key });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : undefined}>
      <div
        className={`group flex items-center gap-1 rounded-lg px-1.5 py-2 transition-colors ${isOver && !isDragging
          ? 'bg-accent-soft ring-1 ring-primary/30'
          : active
            ? 'bg-accent-soft'
            : 'hover:bg-muted'
          }`}
      >
        <DragHandle {...listeners} {...attributes} />
        <button
          type="button"
          className="min-w-0 flex-1 py-0.5 text-left"
          onClick={() => onSelect(key)}
        >
          <span className="flex items-center gap-2">
            <span
              className={`size-1.5 shrink-0 rounded-full ${statusDotClass(status)}`}
              title={statusLabel(status)}
              aria-label={statusLabel(status)}
            />
            <span
              className={`block truncate text-sm ${active
                ? 'font-medium text-foreground'
                : row.enabled
                  ? 'text-foreground'
                  : 'text-muted-foreground'
                }`}
            >
              {def.label}
            </span>
          </span>
        </button>
        <Switch
          checked={row.enabled}
          disabled={def.required}
          onCheckedChange={(v) => onToggle(key, v)}
          aria-label={`Bật ${def.label}`}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </li>
  );
}

function OverlayRow({ row }: { row: BlockRow }) {
  const def = getBlockDef(row.key as BlockKey);
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-2 shadow-card">
      <DragHandle tabIndex={-1} />
      <span className="min-w-0 flex-1 text-sm font-medium">{def.label}</span>
    </div>
  );
}

export function BlockList({
  blocks,
  content,
  activeKey,
  onSelect,
  onToggle,
  onReorder,
}: Props) {
  const ordered = useMemo(
    () => [...blocks].sort((a, b) => a.order - b.order),
    [blocks]
  );
  const [draggingKey, setDraggingKey] = useState<BlockKey | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragStart(event: DragStartEvent) {
    setDraggingKey(String(event.active.id) as BlockKey);
  }

  function onDragEnd(event: DragEndEvent) {
    setDraggingKey(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = ordered.map((b) => b.key as BlockKey);
    const from = keys.indexOf(String(active.id) as BlockKey);
    const to = keys.indexOf(String(over.id) as BlockKey);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(keys, from, to));
  }

  const draggingRow = draggingKey
    ? ordered.find((b) => b.key === draggingKey)
    : null;

  return (
    <div className="space-y-1">
      <p className="mb-3 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Phần thiệp
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingKey(null)}
      >
        <ul className="space-y-0.5">
          {ordered.map((row) => (
            <SortableBlockRow
              key={row.key}
              row={row}
              active={row.key === activeKey}
              status={getBlockFillStatus(
                row.key as BlockKey,
                row.enabled,
                content
              )}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
        <DragOverlay dropAnimation={null}>
          {draggingRow ? <OverlayRow row={draggingRow} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
