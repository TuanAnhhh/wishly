import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { TemplateThumb } from '@wishly/templates';
import { privacyApi, queryKeys } from '@wishly/api-client';
import {
  BaseDropdownMenu,
  Button,
  EmptyState,
  LoadingSkeleton,
} from '@wishly/ui';
import { api, type InvitationRecord } from '../../lib/api';
import { countFilledParts } from '../../features/editor/helpers/blockStatus';
import { greetNameFrom } from '../../lib/greet-name';

function webUrl(slug: string) {
  const base = (
    import.meta.env.VITE_PUBLIC_WEB_URL ?? 'http://localhost:4200'
  ).replace(/\/$/, '');
  return `${base}/${slug}`;
}

function webTemplatesUrl() {
  return `${(
    (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined) ??
    'http://localhost:4200'
  ).replace(/\/$/, '')}/templates`;
}

function shareUrl(slug: string, publishedAt: string | null) {
  const configured = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;
  const apiBase = (
    configured && configured.startsWith('http')
      ? configured
      : 'http://localhost:3001/api'
  ).replace(/\/$/, '');
  const v = publishedAt ? new Date(publishedAt).getTime() : Date.now();
  return `${apiBase}/invitations/public/${slug}/share?v=${v}`;
}

/** Minimal card glyph for empty dashboard — matches design mock. */
function EmptyCardIllustration() {
  return (
    <svg
      width="56"
      height="72"
      viewBox="0 0 56 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="4"
        y="2"
        width="48"
        height="68"
        rx="4"
        fill="var(--background)"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="28"
        x2="40"
        y2="28"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M28 34.5 L31 37.5 L28 40.5 L25 37.5 Z" fill="var(--primary)" />
      <line
        x1="16"
        y1="46"
        x2="40"
        y2="46"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function coverOf(inv: InvitationRecord) {
  return inv.content.cover as
    { nameLeft?: string; nameRight?: string; dateLine?: string } | undefined;
}

function invitationTitle(inv: InvitationRecord) {
  const cover = coverOf(inv);
  if (inv.eventType === 'WEDDING' && cover?.nameLeft && cover?.nameRight) {
    return `Cưới ${cover.nameLeft} & ${cover.nameRight}`;
  }
  if (inv.eventType === 'BABY_MONTH' && cover?.nameLeft) {
    return `Đầy tháng ${cover.nameLeft}`;
  }
  if (inv.eventType === 'BIRTHDAY' && cover?.nameLeft) {
    return `Sinh nhật ${cover.nameLeft}`;
  }
  if (cover?.nameLeft && cover?.nameRight) {
    return `${cover.nameLeft} & ${cover.nameRight}`;
  }
  return inv.slug;
}

function formatEventDate(inv: InvitationRecord) {
  if (inv.eventDate) {
    const d = new Date(inv.eventDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }
  return coverOf(inv)?.dateLine || 'Chưa chọn ngày';
}

function daysUntil(dateIso: string | null) {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function statusBadge(status: InvitationRecord['status']) {
  if (status === 'PUBLISHED') {
    return {
      label: 'Đã xuất bản',
      className: 'bg-success-soft text-success-ink',
    };
  }
  if (status === 'DRAFT') {
    return {
      label: 'Bản nháp',
      className: 'bg-warning-soft text-warning-ink',
    };
  }
  return {
    label: 'Đã kết thúc',
    className: 'bg-muted text-muted-foreground',
  };
}

function progressBarClass(status: InvitationRecord['status']) {
  if (status === 'DRAFT') return 'bg-warning';
  if (status === 'PUBLISHED') return 'bg-success';
  return 'bg-disabled-foreground';
}

const OCCASION_SUGGESTIONS = [
  {
    title: 'Thiệp đầy tháng',
    body: 'Mời họ hàng mừng bé tròn tháng',
    price: 'Từ 99.000đ',
    href: '/create',
  },
  {
    title: 'Thiệp sinh nhật',
    body: 'Tiệc mừng tuổi mới, gửi qua Zalo',
    price: 'Từ 99.000đ',
    href: '/create',
  },
  {
    title: 'Thiệp khai trương',
    body: 'Cửa hàng, quán, văn phòng mới',
    price: 'Từ 149.000đ',
    href: '/create',
  },
] as const;

function InvitationRow({
  inv,
  onCopyLink,
  onDuplicate,
  onRenew,
  duplicating,
}: {
  inv: InvitationRecord;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onRenew: () => void;
  duplicating: boolean;
}) {
  const cover = coverOf(inv);
  const contentProgress = countFilledParts(inv.blocks, inv.content);
  const badge = statusBadge(inv.status);

  let progressLabel = '';
  let progressValue = 0;
  let progressMax = 1;

  if (inv.status === 'DRAFT') {
    progressLabel = 'Hoàn thành nội dung';
    progressValue = contentProgress.done;
    progressMax = Math.max(contentProgress.total, 1);
  } else if (inv.status === 'PUBLISHED') {
    progressLabel = 'Khách đã xác nhận';
    progressValue = inv.attendingCount ?? 0;
    progressMax = Math.max(inv.guestCount ?? inv.guestLimit ?? 0, 1);
  } else {
    progressLabel = 'Khách đã tới dự';
    progressValue = inv.attendingCount ?? 0;
    progressMax = Math.max(inv.guestCount ?? 0, 1);
  }

  const pct = Math.min(100, Math.round((progressValue / progressMax) * 100));
  const progressText =
    inv.status === 'DRAFT'
      ? `${contentProgress.done}/${contentProgress.total} phần`
      : `${progressValue}/${inv.guestCount ?? progressMax} khách`;

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-28">
          <TemplateThumb
            nameLeft={cover?.nameLeft || 'Tên'}
            nameRight={cover?.nameRight || 'Tên'}
            dateLine={cover?.dateLine || '—'}
            theme={inv.theme}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium">{invitationTitle(inv)}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-sm capitalize text-secondary-foreground">
                {formatEventDate(inv)}
              </p>
            </div>
            <BaseDropdownMenu
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Menu thiệp"
                >
                  <EllipsisHorizontalIcon className="size-5" />
                </Button>
              }
              items={[
                {
                  label: 'Chỉnh sửa',
                  render: (c) => <Link to={`/edit/${inv.id}`}>{c}</Link>,
                },
                inv.status === 'PUBLISHED' && {
                  label: 'Xem thiệp',
                  render: (c) => (
                    <a href={webUrl(inv.slug)} target="_blank" rel="noreferrer">
                      {c}
                    </a>
                  ),
                },
                { label: 'Sao chép link', onSelect: onCopyLink },
                inv.tier === 'FREE' && {
                  label: 'Nâng cấp',
                  render: (c) => <Link to={`/upgrade/${inv.id}`}>{c}</Link>,
                },
                { type: 'separator' },
                {
                  label: 'Nhân bản',
                  disabled: duplicating,
                  onSelect: onDuplicate,
                },
                inv.status === 'ENDED' && {
                  label: 'Gia hạn',
                  onSelect: onRenew,
                },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-secondary-foreground">{progressLabel}</span>
              <span className="tabular-nums text-foreground">
                {progressText}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] ${progressBarClass(inv.status)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {inv.status === 'DRAFT' ? (
              <>
                <Button asChild size="sm">
                  <Link to={`/edit/${inv.id}`}>Soạn tiếp</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/edit/${inv.id}`}>Xem trước</Link>
                </Button>
              </>
            ) : null}
            {inv.status === 'PUBLISHED' ? (
              <>
                <Button asChild size="sm">
                  <Link to={`/edit/${inv.id}/guests`}>Quản lý khách mời</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/edit/${inv.id}/post-event`}>Xem thống kê</Link>
                </Button>
              </>
            ) : null}
            {inv.status === 'ENDED' ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/edit/${inv.id}/post-event`}>Xem thống kê</Link>
              </Button>
            ) : null}
          </div>

          {inv.status === 'ENDED' ? (
            <div className="space-y-2 border-t border-hairline pt-3">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Sau sự kiện, bạn có thể
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/edit/${inv.id}/post-event`}>
                    Tạo thiệp cảm ơn
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/edit/${inv.id}/post-event`}>
                    Chia sẻ album ảnh
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.me(),
    retry: false,
  });

  const list = useQuery({
    queryKey: queryKeys.invitations.mine(),
    queryFn: () => api.listInvitations(),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api.duplicate(id),
    onSuccess: (copy) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invitations.mine() });
      navigate(`/edit/${copy.id}`);
    },
    onError: (e) => {
      setToast(e instanceof Error ? e.message : 'Không nhân bản được.');
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => privacyApi.renew(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.invitations.mine() });
      setToast('Đã gia hạn thêm 12 tháng.');
    },
    onError: (e) => {
      setToast(e instanceof Error ? e.message : 'Không gia hạn được.');
    },
  });

  async function onCopyLink(inv: InvitationRecord) {
    const url =
      inv.status === 'PUBLISHED'
        ? shareUrl(inv.slug, inv.publishedAt)
        : webUrl(inv.slug);
    try {
      await navigator.clipboard.writeText(url);
      setToast(
        inv.status === 'PUBLISHED'
          ? 'Đã chép link chia sẻ (OG).'
          : 'Đã chép link (thiệp chưa xuất bản).',
      );
    } catch {
      setToast('Không chép được link.');
    }
  }

  const items = list.data ?? [];
  const error = list.error
    ? list.error instanceof Error
      ? list.error.message
      : 'Không tải được.'
    : null;

  const summary = useMemo(() => {
    const running = items.filter((i) => i.status === 'PUBLISHED').length;
    const drafts = items.filter((i) => i.status === 'DRAFT').length;
    const nextWedding = items
      .filter(
        (i) =>
          i.eventType === 'WEDDING' &&
          i.eventDate &&
          (i.status === 'PUBLISHED' || i.status === 'DRAFT'),
      )
      .map((i) => ({ inv: i, days: daysUntil(i.eventDate) }))
      .filter((x) => x.days != null && x.days >= 0)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))[0];

    return {
      running,
      drafts,
      nextWedding,
      greetName: greetNameFrom(me.data?.user?.name),
    };
  }, [items, me.data?.user?.name]);

  return (
    <>
      <section className="space-y-2">
        <h1 className="font-serif text-3xl leading-[1.2] tracking-tight sm:text-4xl">
          Chào {summary.greetName}
        </h1>
        <p className="text-secondary-foreground">
          {items.length === 0 ? (
            'Chưa có thiệp nào — tạo thiệp đầu tiên chỉ mất khoảng 15 phút.'
          ) : (
            <>
              Bạn có {summary.running} thiệp đang chạy
              {summary.drafts > 0 ? ` và ${summary.drafts} bản nháp` : ''}.
              {summary.nextWedding?.days != null ? (
                <> Còn {summary.nextWedding.days} ngày nữa tới đám cưới.</>
              ) : null}
            </>
          )}
        </p>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {toast ? (
        <p className="text-sm text-secondary-foreground">{toast}</p>
      ) : null}

      {items.length > 0 ? (
        <section className="flex flex-col gap-4 rounded-xl bg-primary px-5 py-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-serif text-2xl leading-tight">Tạo thiệp mới</p>
            <p className="text-sm text-primary-foreground/80">
              Chọn mẫu và điền tên — xong trong 15 phút, miễn phí đến khi bạn
              muốn gửi.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
          >
            <Link to="/create">Bắt đầu</Link>
          </Button>
        </section>
      ) : null}

      {list.isLoading ? (
        <LoadingSkeleton variant="guest-list" rows={3} />
      ) : items.length === 0 && !error ? (
        <EmptyState
          className="rounded-xl border border-dashed border-border-strong bg-card px-6 py-14"
          illustration={<EmptyCardIllustration />}
          title="Bạn chưa có thiệp nào"
          body="Bắt đầu bằng một mẫu có sẵn – điền tên và ngày là đã thấy thiệp thật của bạn. Không cần thẻ ngân hàng."
          primary={{
            label: 'Tạo thiệp đầu tiên',
            onClick: () => navigate('/create'),
          }}
          secondary={{
            label: 'Xem thư viện mẫu',
            href: webTemplatesUrl(),
          }}
        />
      ) : (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl leading-tight">Thiệp của bạn</h2>
          <div className="space-y-4">
            {items.map((inv) => (
              <InvitationRow
                key={inv.id}
                inv={inv}
                duplicating={duplicate.isPending}
                onCopyLink={() => void onCopyLink(inv)}
                onDuplicate={() => {
                  setToast(null);
                  duplicate.mutate(inv.id);
                }}
                onRenew={() => {
                  setToast(null);
                  renewMutation.mutate(inv.id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl leading-tight">
            Sắp có dịp gì khác?
          </h2>
          <a
            href={webTemplatesUrl()}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Xem tất cả mẫu →
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {OCCASION_SUGGESTIONS.map((o) => (
            <Link
              key={o.title}
              to={o.href}
              className="space-y-2 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-card"
            >
              <p className="font-medium">{o.title}</p>
              <p className="text-sm text-secondary-foreground">{o.body}</p>
              <p className="text-xs text-muted-foreground">{o.price}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default DashboardPage;
