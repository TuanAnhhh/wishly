import { Link, useParams } from 'react-router-dom';
import { Button, LoadingSkeleton } from '@wishly/ui';
import { useSeating } from '../../features/seating/hooks/useSeating';
import { tableLoad } from '../../features/seating/components/TableNode';

/** Print-first layout — window.print() for MVP PDF (no Puppeteer). */
export function SeatingPrintPage() {
  const { id } = useParams<{ id: string }>();
  const seating = useSeating(id);

  if (!id) return null;
  if (seating.isLoading) {
    return (
      <main className="p-8">
        <LoadingSkeleton variant="guest-list" />
      </main>
    );
  }

  const dining = seating.tables.filter((t) => t.kind !== 'stage');

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 print:max-w-none print:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={`/edit/${id}/seating`}
          className="text-sm underline-offset-4 hover:underline"
        >
          ← Về sơ đồ
        </Link>
        <Button type="button" onClick={() => window.print()}>
          Xuất PDF gửi nhà hàng
        </Button>
      </header>

      <div className="space-y-1">
        <h1 className="font-serif text-3xl">Danh sách bàn tiệc</h1>
        <p className="text-sm text-secondary-foreground">
          {seating.seatedPeople}/{seating.totalPeople} khách · {dining.length}{' '}
          bàn
        </p>
      </div>

      <section className="space-y-4">
        {dining.map((t) => {
          const at = seating.guests.filter((g) => g.tableId === t.id);
          const { load } = tableLoad(t, seating.guests);
          return (
            <div
              key={t.id}
              className="break-inside-avoid border border-border p-4"
            >
              <h2 className="font-serif text-xl">
                {t.label} — {load}/{t.capacity} ghế
              </h2>
              {at.length === 0 ? (
                <p className="mt-2 text-sm text-secondary-foreground">Trống</p>
              ) : (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {at.map((g) => (
                    <li key={g.id}>
                      {g.name}
                      {g.partySize > 1 ? ` (${g.partySize} người)` : ''}
                      {g.group ? ` — ${g.group}` : ''}
                      {g.mealChoice
                        ? ` · ${g.mealChoice === 'vegetarian' ? 'Chay' : 'Thường'}`
                        : ''}
                      {g.allergyNote ? ` · ⚠ ${g.allergyNote}` : ''}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </section>

      {seating.eventType === 'CORPORATE' ? (
        <section className="space-y-3 print:break-before-page">
          <h2 className="font-serif text-xl">Suất ăn & dị ứng</h2>
          {(() => {
            let standard = 0;
            let vegetarian = 0;
            const allergies = seating.guests.filter((g) => g.allergyNote?.trim());
            for (const g of seating.guests) {
              if (g.mealChoice === 'vegetarian') vegetarian += g.partySize;
              else if (g.mealChoice === 'standard') standard += g.partySize;
            }
            return (
              <>
                <p className="text-sm">
                  Thường: {standard} · Chay: {vegetarian} · Có dị ứng:{' '}
                  {allergies.length}
                </p>
                {allergies.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {allergies.map((g) => {
                      const table = seating.tables.find((t) => t.id === g.tableId);
                      return (
                        <li key={g.id}>
                          {g.name}
                          {table ? ` — ${table.label}` : ''}
                          {': '}
                          {g.allergyNote}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </>
            );
          })()}
        </section>
      ) : null}

      <section className="print:break-before-page">
        <h2 className="mb-3 font-serif text-xl">Sơ đồ (thu nhỏ)</h2>
        <div
          className="relative h-[360px] border border-border bg-muted"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {seating.tables.map((t) => (
            <div
              key={t.id}
              className="absolute flex items-center justify-center border border-foreground/40 bg-card text-[10px]"
              style={{
                left: t.x / 2,
                top: t.y / 2,
                width: t.kind === 'long' ? 70 : t.kind === 'stage' ? 80 : 48,
                height: t.kind === 'long' ? 36 : t.kind === 'stage' ? 28 : 48,
                borderRadius: t.kind === 'round' ? 999 : 4,
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </main>
  );
}

export default SeatingPrintPage;
