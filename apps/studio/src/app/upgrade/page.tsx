import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@wishly/api-client';
import { Button, ErrorState, BaseTextField } from '@wishly/ui';
import { api, type PlanRecord } from '../../lib/api';
import { readStep, type Step } from './step';

type OrderBundle = Awaited<ReturnType<typeof api.createOrder>>;

function formatVnd(n: number) {
  return `${n.toLocaleString('vi-VN')}đ`;
}

const PLAN_COPY: Record<
  string,
  { bullets: string[]; tagline: string; badge?: string }
> = {
  basic: {
    tagline: 'Trả một lần — không phí định kỳ',
    bullets: [
      '12 mẫu cơ bản',
      'Tối đa 150 khách',
      'Xác nhận RSVP',
      'Chỉ đường tới địa điểm',
    ],
  },
  premium: {
    tagline: 'Trả một lần — không phí định kỳ',
    badge: 'PHỔ BIẾN NHẤT',
    bullets: [
      'Tất cả mẫu thiệp',
      'Không giới hạn khách',
      'Thiệp Zalo cá nhân hoá',
      'QR tiền mừng + sổ lưu bút',
      'Album ảnh cưới',
      'Nhắc RSVP',
    ],
  },
};

export function UpgradePage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const orderId = search.get('order');
  const fromPublish = search.get('from') === 'publish';
  const step = readStep(search);
  const [planId, setPlanId] = useState<'basic' | 'premium'>('premium');
  const [discount, setDiscount] = useState('');
  const [bundle, setBundle] = useState<OrderBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const writeStep = useCallback(
    (next: Step, replace: boolean) => {
      // Guard against re-navigating to the step we are already on, which would
      // loop with the effects below.
      if (search.get('step') === next) return;
      const params = new URLSearchParams(search);
      params.set('step', next);
      setSearch(params, { replace });
    },
    [search, setSearch]
  );
  /** User-driven transition — back goes to the previous step. */
  const setStep = useCallback(
    (next: Step) => writeStep(next, false),
    [writeStep]
  );
  /** Server-driven correction — must not add a history entry. */
  const syncStep = useCallback(
    (next: Step) => writeStep(next, true),
    [writeStep]
  );

  const plansQuery = useQuery({
    queryKey: queryKeys.plans(),
    queryFn: () => api.listPlans(),
    select: (rows) => rows.filter((p) => p.id !== 'free') as PlanRecord[],
  });

  const existingOrder = useQuery({
    queryKey: queryKeys.orders.one(orderId ?? ''),
    queryFn: () => api.getOrder(orderId!),
    enabled: Boolean(orderId),
  });

  const activeOrderId = bundle?.order.id ?? orderId ?? null;
  const processingPoll = useQuery({
    queryKey: queryKeys.orders.one(activeOrderId ?? ''),
    queryFn: () => api.getOrder(activeOrderId!),
    enabled: step === 'processing' && Boolean(activeOrderId),
    refetchInterval: 10_000,
  });

  /** A step that needs an order behind it must not be reachable by URL alone. */
  useEffect(() => {
    if (step === 'pay' && !bundle && !orderId) syncStep('plans');
    else if (
      (step === 'processing' || step === 'success') &&
      !activeOrderId
    )
      syncStep('plans');
  }, [step, bundle, orderId, activeOrderId, syncStep]);

  useEffect(() => {
    if (step !== 'processing') return;
    const o = processingPoll.data;
    if (!o) return;
    if (o.status === 'paid') syncStep('success');
    if (o.status === 'failed') syncStep('fail');
  }, [step, processingPoll.data, syncStep]);

  useEffect(() => {
    if (!orderId) return;
    if (existingOrder.isError) {
      syncStep('fail');
      return;
    }
    if (!existingOrder.data) return;
    const o = existingOrder.data;
    if (o.status === 'paid') {
      syncStep('success');
      return;
    }
    if (o.status === 'failed') {
      syncStep('fail');
      return;
    }
    setBundle({
      order: o,
      payment: o.payment ?? {
        method: 'bank_manual',
        shortCode: o.shortCode,
        amount: o.amount,
        bank: {
          bin: '',
          accountNo: '',
          holder: '',
          bankName: '',
        },
        vietqrUrl: '',
        transferContent: o.shortCode,
      },
    } as OrderBundle);
    syncStep('pay');
  }, [orderId, existingOrder.data, existingOrder.isError, syncStep]);

  const checkout = useMutation({
    mutationFn: () =>
      api.createOrder({
        invitationId: invitationId!,
        planId,
        provider: 'bank_manual',
        discountCode: discount.trim() || undefined,
      }),
    onSuccess: (res) => {
      setBundle(res);
      setStep('pay');
      setError(null);
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Không tạo được đơn.');
      setStep('fail');
    },
  });

  const claim = useMutation({
    mutationFn: () => api.claimOrderPaid(bundle!.order.id),
    onSuccess: () => {
      setStep('processing');
      setError(null);
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Không ghi nhận được.');
    },
  });

  const publishFree = useMutation({
    mutationFn: () => api.publish(invitationId!),
    onSuccess: () => {
      navigate(`/edit/${invitationId}`, { replace: true });
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Không xuất bản được.');
    },
  });

  const plans = plansQuery.data ?? [];
  const busy = checkout.isPending || claim.isPending || publishFree.isPending;
  const pageError =
    error ??
    (plansQuery.error instanceof Error ? plansQuery.error.message : null);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId) ?? null,
    [plans, planId],
  );

  if (!invitationId) return null;

  return (
    <>
      {pageError ? (
        <p className="mb-4 text-sm text-destructive">{pageError}</p>
      ) : null}

      {step === 'plans' ? (
        <section className="relative space-y-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
          <button
            type="button"
            onClick={() => navigate(`/edit/${invitationId}`)}
            className="absolute top-4 right-4 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Đóng"
          >
            ✕
          </button>

          <header className="max-w-xl space-y-2 pr-8">
            <p className="text-xs font-medium tracking-micro text-primary uppercase">
              Nâng cấp thiệp
            </p>
            <h1 className="font-serif text-2xl leading-tight sm:text-3xl">
              Thiệp của bạn đã hoàn hảo. Gỡ watermark để gửi đi.
            </h1>
            <p className="text-sm leading-relaxed text-secondary-foreground">
              {fromPublish
                ? 'Chọn gói để gỡ watermark Thiệp Việt và mở gửi khách. Bạn vẫn có thể tiếp tục bản miễn phí nếu chưa sẵn sàng.'
                : 'Nâng cấp gỡ watermark, mở gửi Zalo và tăng giới hạn khách. Trả một lần — thiệp hoạt động 12 tháng.'}
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((p) => {
              const id = p.id as 'basic' | 'premium';
              const copy = PLAN_COPY[p.id] ?? {
                tagline: 'Trả một lần — không phí định kỳ',
                bullets: p.guestLimit
                  ? [`Tối đa ${p.guestLimit} khách`]
                  : ['Không giới hạn khách'],
              };
              const selected = planId === id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(id)}
                  className={`relative flex h-full flex-col gap-3 rounded-xl border p-5 text-left transition-shadow ${
                    selected
                      ? 'border-2 border-primary shadow-card'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  {copy.badge ? (
                    <span className="absolute -top-2.5 left-4 rounded bg-primary px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary-foreground">
                      {copy.badge}
                    </span>
                  ) : null}
                  <div className="space-y-1 pt-1">
                    <p className="text-xs font-medium tracking-micro text-muted-foreground uppercase">
                      {p.name}
                    </p>
                    <p className="font-serif text-2xl leading-none">
                      {formatVnd(p.price)}
                      <span className="ml-1 text-sm font-sans text-secondary-foreground">
                        / thiệp
                      </span>
                    </p>
                    <p className="text-xs text-secondary-foreground">
                      {copy.tagline}
                    </p>
                  </div>
                  <ul className="flex-1 space-y-1.5 text-sm text-secondary-foreground">
                    {copy.bullets.map((b) => (
                      <li key={b}>· {b}</li>
                    ))}
                  </ul>
                  <span
                    className={`inline-flex h-9 items-center justify-center rounded-md text-sm font-medium ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card'
                    }`}
                  >
                    {selected ? 'Đang chọn' : 'Chọn gói này'}
                  </span>
                </button>
              );
            })}
          </div>

          <BaseTextField
            label="Mã giảm giá (nếu có)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="CUOI20"
            className="max-w-xs"
          />

          <p className="text-xs text-secondary-foreground">
            Thiệp giấy 500 khách thường tốn 2–8 triệu. Hoàn tiền trong 7 ngày
            nếu chưa gửi khách.
          </p>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={busy}
              onClick={() => publishFree.mutate()}
              className="text-left text-sm text-secondary-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              Để sau, tiếp tục dùng bản miễn phí
            </button>
            <Button
              type="button"
              size="lg"
              disabled={busy || !selectedPlan}
              onClick={() => checkout.mutate()}
            >
              {selectedPlan
                ? `Tiếp tục với gói ${selectedPlan.name}`
                : 'Tiếp tục'}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 'pay' && bundle?.payment?.method === 'bank_manual' ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <p className="text-xs font-medium tracking-micro text-primary uppercase">
            Thanh toán
          </p>
          <h2 className="font-serif text-2xl">Chuyển khoản</h2>
          <p className="text-sm">
            Số tiền{' '}
            <strong className="font-serif text-xl">
              {formatVnd(bundle.payment.amount)}
            </strong>
          </p>
          <p className="text-sm">
            Nội dung CK (bắt buộc):{' '}
            <strong>{bundle.payment.transferContent}</strong>
          </p>
          <p className="text-sm text-secondary-foreground">
            {bundle.payment.bank.bankName} · {bundle.payment.bank.accountNo} ·{' '}
            {bundle.payment.bank.holder}
          </p>
          {bundle.payment.vietqrUrl ? (
            <img
              src={bundle.payment.vietqrUrl}
              alt="VietQR thanh toán"
              className="mx-auto w-56"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => claim.mutate()}
            >
              Tôi đã chuyển
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('plans')}
            >
              Đổi gói
            </Button>
          </div>
        </section>
      ) : null}

      {step === 'processing' ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <h2 className="font-serif text-2xl">Đang đối soát</h2>
          <p className="text-sm text-secondary-foreground">
            Chúng tôi sẽ xác nhận trong giờ làm việc. Bạn có thể đóng tab — đơn
            đã được lưu, không cần thanh toán lại.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">Về dashboard</Link>
          </Button>
        </section>
      ) : null}

      {step === 'success' ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <h2 className="font-serif text-2xl">Thanh toán thành công</h2>
          <p className="text-sm text-secondary-foreground">
            Watermark đã gỡ, giới hạn khách đã nâng. Mở lại trang thiệp để kiểm
            tra.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/edit/${invitationId}/guests`}>
                Gửi thiệp cho khách ngay
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/edit/${invitationId}`}>Về editor</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {step === 'fail' ? (
        <ErrorState
          tone="warn"
          title="Ngân hàng chưa xác nhận giao dịch này"
          body="Bạn chưa mất đồng nào. Thiệp và nội dung vẫn nguyên — thử lại hoặc đổi cách thanh toán."
          primary={{
            label: 'Thử lại',
            onClick: () => setStep(bundle ? 'pay' : 'plans'),
          }}
          secondary={{
            label: 'Đổi cách thanh toán',
            onClick: () => setStep('plans'),
          }}
          hint="Chuyển khoản QR tay được xác nhận trong khoảng 5 phút giờ làm việc."
        />
      ) : null}
    </>
  );
}

export default UpgradePage;
