import { Card, CardContent, EmptyState } from '@wishly/ui';

export type MealStats = {
  standard: number;
  vegetarian: number;
  allergies: Array<{ name: string; allergyNote: string; mealChoice: string }>;
};

export type MealsPanelProps = MealStats & { onEmptyAction: () => void };

/** "Suất ăn" tab (CORPORATE only) — tổng suất + danh sách dị ứng gửi nhà hàng. */
export function MealsPanel({ standard, vegetarian, allergies, onEmptyAction }: MealsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-secondary-foreground">Suất thường</p>
            <p className="font-serif text-3xl">{standard}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-secondary-foreground">Suất chay</p>
            <p className="font-serif text-3xl">{vegetarian}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-secondary-foreground">Có dị ứng</p>
            <p className="font-serif text-3xl">{allergies.length}</p>
          </CardContent>
        </Card>
      </div>
      {allergies.length > 0 ? (
        <ul className="divide-y border border-border">
          {allergies.map((a) => (
            <li key={a.name + a.allergyNote} className="px-3 py-3 text-sm">
              <span className="font-medium">{a.name}</span> · {a.mealChoice} · {a.allergyNote}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Chưa có ghi chú dị ứng"
          body="Khi khách RSVP và điền dị ứng, danh sách sẽ hiện ở đây."
          primary={{ label: 'Xem khách mời', onClick: onEmptyAction }}
        />
      )}
    </div>
  );
}

export default MealsPanel;
