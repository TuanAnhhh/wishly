import { Card, CardContent, LoadingSkeleton, RingStat } from '@wishly/ui';

export type GuestStatsCardsProps = {
  count: number | null;
  yes: number;
  no: number;
  pending: number;
};

/** 4 ô tổng quan RSVP đầu trang Quản lý khách mời — vòng tròn % + số lớn. */
export function GuestStatsCards({ count, yes, no, pending }: GuestStatsCardsProps) {
  if (count == null) return <LoadingSkeleton variant="guest-list" rows={4} />;

  const pct = (n: number) => (count > 0 ? Math.round((n / count) * 100) : 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="py-4">
          <RingStat percent={100} value={count} label="Đã mời" tone="neutral" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <RingStat percent={pct(yes)} value={yes} label="Sẽ đến" tone="success" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <RingStat percent={pct(no)} value={no} label="Không đến" tone="muted" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <RingStat percent={pct(pending)} value={pending} label="Chưa phản hồi" tone="warning" />
        </CardContent>
      </Card>
    </div>
  );
}

export default GuestStatsCards;
