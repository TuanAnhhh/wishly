import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, partnerApi, queryKeys } from '@wishly/api-client';
import { Button, LoadingSkeleton, Progress } from '@wishly/ui';

function vnd(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

export function PartnerBillingPage() {
  const qc = useQueryClient();
  const billing = useQuery({
    queryKey: queryKeys.partner.billing(),
    queryFn: () => partnerApi.billing(),
  });
  const change = useMutation({
    mutationFn: (planTier: 'studio' | 'agency') =>
      partnerApi.changePlan({ planTier }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['partner'] }),
  });
  const markPaid = useMutation({
    mutationFn: (invoiceId: string) => partnerApi.markInvoicePaid(invoiceId),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.partner.billing() }),
  });

  if (billing.isLoading) return <LoadingSkeleton variant="guest-list" rows={5} />;
  if (billing.error) {
    return (
      <p className="text-sm text-destructive">
        {billing.error instanceof ApiError
          ? billing.error.message
          : 'Không tải được hoá đơn (cần vai admin).'}
      </p>
    );
  }
  const b = billing.data!;
  const slotPct =
    b.slotLimit > 0 ? Math.min(100, (b.slotUsed / b.slotLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Gói & hoá đơn</h1>
        <p className="text-sm text-secondary-foreground">
          Thanh toán chuyển khoản tay · quá hạn chỉ khoá tạo mới, không tắt thiệp
          đang chạy.
        </p>
      </header>

      <section className="space-y-3 border-b border-border/50 pb-6">
        <p className="text-sm text-secondary-foreground">Gói hiện tại</p>
        <p className="font-serif text-2xl capitalize">
          {b.planTier} · {vnd(b.amountMonthly)}/tháng
        </p>
        <p className="text-sm">
          Trạng thái: <strong>{b.status}</strong>
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Slot</span>
            <span>
              {b.slotUsed}/{b.slotLimit}
            </span>
          </div>
          <Progress value={slotPct} />
        </div>
        <div className="flex flex-wrap gap-2">
          {b.planTier !== 'agency' ? (
            <Button
              type="button"
              disabled={change.isPending}
              onClick={() => change.mutate('agency')}
            >
              Nâng Agency (50 slot)
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={change.isPending}
              onClick={() => change.mutate('studio')}
            >
              Hạ Studio (20 slot)
            </Button>
          )}
        </div>
        <p className="text-xs text-secondary-foreground">{b.bankManual.note}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Hoá đơn</h2>
        <ul className="space-y-2">
          {b.invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 py-2 text-sm"
            >
              <div>
                <p className="font-mono text-xs">{inv.code}</p>
                <p className="text-secondary-foreground">
                  {vnd(inv.amount)} · {inv.status}
                </p>
              </div>
              {inv.status === 'pending' || inv.status === 'overdue' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={markPaid.isPending}
                  onClick={() => markPaid.mutate(inv.id)}
                >
                  Đánh dấu đã trả
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
