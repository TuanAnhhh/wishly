import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  queryKeys,
  seatingApi,
  type SeatingGuest,
  type SeatingSnapshot,
  type SeatingTable,
} from '@wishly/api-client';
import type { CreateSeatingTable, UpdateSeatingTable } from '@wishly/contracts';

function snap20(n: number) {
  return Math.round(n / 20) * 20;
}

export function useSeating(invitationId: string | undefined) {
  const qc = useQueryClient();
  const key = invitationId
    ? queryKeys.seating(invitationId)
    : (['seating', 'none'] as const);

  const query = useQuery({
    queryKey: key,
    queryFn: () => seatingApi.get(invitationId!),
    enabled: Boolean(invitationId),
  });

  const invalidate = () => {
    if (invitationId) void qc.invalidateQueries({ queryKey: key });
  };

  const createTable = useMutation({
    mutationFn: (body: CreateSeatingTable) =>
      seatingApi.createTable(invitationId!, body),
    onSuccess: invalidate,
  });

  const updateTable = useMutation({
    mutationFn: ({
      tableId,
      body,
    }: {
      tableId: string;
      body: UpdateSeatingTable;
    }) => seatingApi.updateTable(invitationId!, tableId, body),
    onMutate: async ({ tableId, body }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SeatingSnapshot>(key);
      if (prev) {
        qc.setQueryData<SeatingSnapshot>(key, {
          ...prev,
          tables: prev.tables.map((t) =>
            t.id === tableId ? { ...t, ...body } : t
          ) as SeatingTable[],
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: invalidate,
  });

  const deleteTable = useMutation({
    mutationFn: (tableId: string) =>
      seatingApi.deleteTable(invitationId!, tableId),
    onSuccess: invalidate,
  });

  const assign = useMutation({
    mutationFn: (body: { guestId: string; tableId: string | null }) =>
      seatingApi.assign(invitationId!, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<SeatingSnapshot>(key);
      if (prev) {
        qc.setQueryData<SeatingSnapshot>(key, {
          ...prev,
          guests: prev.guests.map((g) =>
            g.id === body.guestId ? { ...g, tableId: body.tableId } : g
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: invalidate,
  });

  const lock = useMutation({
    mutationFn: () => seatingApi.lock(invitationId!),
    onSuccess: invalidate,
  });

  const moveTable = (tableId: string, x: number, y: number) => {
    updateTable.mutate({
      tableId,
      body: { x: snap20(Math.max(0, x)), y: snap20(Math.max(0, y)) },
    });
  };

  const data = query.data;
  const guests = data?.guests ?? [];
  const tables = data?.tables ?? [];

  const seatedPeople = guests
    .filter((g) => g.tableId)
    .reduce((s, g) => s + g.partySize, 0);
  const totalPeople = guests.reduce((s, g) => s + g.partySize, 0);
  const unseated = guests.filter((g) => !g.tableId);

  const overloadTables = tables.filter((t) => {
    if (t.kind === 'stage' || t.capacity <= 0) return false;
    const load = guests
      .filter((g) => g.tableId === t.id)
      .reduce((s, g) => s + g.partySize, 0);
    return load > t.capacity;
  });

  return {
    ...query,
    tables,
    guests,
    unseated,
    seatedPeople,
    totalPeople,
    overloadTables,
    seatingLockedAt: data?.seatingLockedAt ?? null,
    eventType: data?.eventType,
    createTable,
    updateTable,
    deleteTable,
    assign,
    lock,
    moveTable,
  };
}

export type { SeatingGuest, SeatingTable };
