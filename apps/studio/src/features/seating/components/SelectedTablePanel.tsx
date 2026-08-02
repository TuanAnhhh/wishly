import { BaseRadioField, Button, Label } from '@wishly/ui';
import type { SeatingGuest, SeatingTable } from '../hooks/useSeating';
import { tableLoad } from './TableNode';

type Props = {
  table: SeatingTable;
  guests: SeatingGuest[];
  onChangeKind: (kind: 'round' | 'long') => void;
  onUnassign: (guestId: string) => void;
  onDelete: () => void;
};

export function SelectedTablePanel({
  table,
  guests,
  onChangeKind,
  onUnassign,
  onDelete,
}: Props) {
  const atTable = guests.filter((g) => g.tableId === table.id);
  const { load } = tableLoad(table, guests);

  return (
    <div className="space-y-4 border border-border bg-card p-4">
      <div>
        <p className="font-serif text-xl">{table.label}</p>
        <p className="text-sm text-secondary-foreground">
          {table.kind === 'stage'
            ? 'Sân khấu'
            : `${load}/${table.capacity} ghế`}
        </p>
      </div>

      {table.kind !== 'stage' ? (
        <BaseRadioField
          label="Loại bàn"
          className="flex flex-row gap-4"
          value={table.kind}
          onValueChange={(kind) => onChangeKind(kind as 'round' | 'long')}
          options={[
            { value: 'round', label: 'Tròn 10' },
            { value: 'long', label: 'Dài 14' },
          ]}
        />
      ) : null}

      <div className="space-y-2">
        <Label>Khách tại bàn</Label>
        {atTable.length === 0 ? (
          <p className="text-sm text-secondary-foreground">
            Kéo nhóm khách vào bàn.
          </p>
        ) : (
          <ul className="space-y-2">
            {atTable.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {g.name}{' '}
                  <span className="text-secondary-foreground">
                    · {g.partySize}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onUnassign(g.id)}
                >
                  Bỏ ra
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={onDelete}>
        Xoá bàn
      </Button>
    </div>
  );
}
