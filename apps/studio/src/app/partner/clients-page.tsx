import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError, partnerApi, queryKeys } from '@wishly/api-client';
import { getTemplate, listTemplates } from '@wishly/templates';
import {
  BaseButton,
  BaseDatePicker,
  BaseModal,
  BaseTextField,
  Button,
  EmptyState,
  Label,
  LoadingSkeleton,
  Progress,
  ScrollArea,
  ScrollBar,
} from '@wishly/ui';

const KpiCharts = lazy(() =>
  import('../../features/partner/components/KpiCharts').then((m) => ({
    default: m.KpiCharts,
  }))
);

export function PartnerClientsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const me = useQuery({
    queryKey: queryKeys.partner.me(),
    queryFn: () => partnerApi.me(),
  });
  const dash = useQuery({
    queryKey: queryKeys.partner.dashboard(),
    queryFn: () => partnerApi.dashboard(),
    enabled: Boolean(me.data?.partner),
  });
  const clients = useQuery({
    queryKey: queryKeys.partner.clients(undefined, { status, q }),
    queryFn: () =>
      partnerApi.clients({
        status: status || undefined,
        q: q || undefined,
      }),
    enabled: Boolean(me.data?.partner),
  });
  const templates = useQuery({
    queryKey: queryKeys.partner.templates(),
    queryFn: () => partnerApi.templates(),
    enabled: open,
  });
  const members = useQuery({
    queryKey: queryKeys.partner.members(),
    queryFn: () => partnerApi.members(),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (body: Parameters<typeof partnerApi.createClient>[0]) => {
      if (body.partnerTemplateId) {
        return partnerApi.createClient(body);
      }
      const tpl = getTemplate(body.templateId);
      if (!tpl) {
        return Promise.reject(new Error('Mẫu không hợp lệ.'));
      }
      return partnerApi.createClient({
        ...body,
        eventType: tpl.meta.eventType,
        theme: tpl.theme,
        blocks: tpl.blocks,
        content: tpl.content as never,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['partner'] });
      setOpen(false);
    },
  });

  if (me.isLoading) return <LoadingSkeleton variant="guest-list" rows={4} />;
  if (!me.data?.partner) {
    return (
      <RegisterPartnerCard
        onDone={() => void qc.invalidateQueries({ queryKey: ['partner'] })}
      />
    );
  }

  const p = me.data.partner;
  const slotPct =
    p.slotLimit > 0 ? Math.min(100, (p.slotUsed / p.slotLimit) * 100) : 0;
  const slotFull = p.slotUsed >= p.slotLimit;
  const locked = p.createLocked || dash.data?.createLocked;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Khách hàng</h1>
        <p className="text-sm text-secondary-foreground">
          Quản lý sự kiện studio · slot tính theo DRAFT + PUBLISHED
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Slot còn lại"
          value={`${Math.max(0, p.slotLimit - p.slotUsed)}/${p.slotLimit}`}
        />
        <KpiCard
          label="Tổng khách hàng"
          value={String(dash.data?.totalClients ?? '—')}
        />
        <KpiCard
          label="Tạo tháng này"
          value={String(dash.data?.createdThisMonth ?? '—')}
          hint={
            dash.data
              ? `${dash.data.createdDelta >= 0 ? '+' : ''}${dash.data.createdDelta} so với tháng trước`
              : undefined
          }
        />
        <KpiCard
          label="Trạng thái gói"
          value={p.status}
          hint={locked ? 'Khoá tạo mới (thiệp đang chạy vẫn mở)' : undefined}
        />
      </section>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Slot đã dùng</span>
          <span>
            {p.slotUsed}/{p.slotLimit}
          </span>
        </div>
        <Progress value={slotPct} />
      </div>

      {dash.data ? (
        <Suspense fallback={<LoadingSkeleton variant="guest-list" rows={3} />}>
          <KpiCharts
            byMonth={dash.data.chartByMonth}
            responseRate={dash.data.chartResponseRate}
          />
        </Suspense>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <BaseTextField
          id="q"
          label="Tìm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mã KH hoặc slug"
        />
        <div className="space-y-1">
          <Label htmlFor="st">Trạng thái</Label>
          <select
            id="st"
            className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="ENDED">Đã kết thúc</option>
          </select>
        </div>
        {slotFull || locked ? (
          <Button asChild variant="outline">
            <Link to="/partner/billing">Nâng gói để thêm khách</Link>
          </Button>
        ) : (
          <Button type="button" onClick={() => setOpen(true)}>
            + Thêm khách hàng
          </Button>
        )}
      </div>

      {clients.isLoading ? (
        <LoadingSkeleton variant="guest-list" rows={5} />
      ) : !clients.data?.length ? (
        <EmptyState
          title="Chưa có khách hàng nào"
          body="Thêm cặp đôi đầu tiên từ mẫu sẵn có hoặc kho mẫu studio."
          primary={
            slotFull || locked
              ? { label: 'Xem gói', href: '/partner/billing' }
              : {
                  label: 'Thêm khách hàng',
                  onClick: () => setOpen(true),
                }
          }
        />
      ) : (
        <ScrollArea>
          <table className="w-full text-left text-sm">
            <thead className="border-b text-secondary-foreground">
              <tr>
                <th className="py-2 pr-3">Mã</th>
                <th className="py-2 pr-3">Cặp đôi</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">RSVP</th>
                <th className="py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {clients.data.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-mono text-xs">
                    {c.clientCode ?? '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {c.nameLeft} & {c.nameRight}
                  </td>
                  <td className="py-2 pr-3">{c.status}</td>
                  <td className="py-2 pr-3">
                    {c.rsvpCount}/{c.guestCount}
                  </td>
                  <td className="py-2">
                    <Link
                      className="underline-offset-4 hover:underline"
                      to={`/edit/${c.id}`}
                    >
                      Mở thiệp
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {open ? (
        <CreateClientModal
          templates={templates.data}
          members={members.data ?? []}
          error={
            create.error instanceof ApiError
              ? create.error.message
              : create.error
                ? 'Không tạo được'
                : null
          }
          busy={create.isPending}
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
          onSubmit={(body) => create.mutate(body)}
        />
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1 border-b border-border/40 pb-3">
      <p className="text-xs uppercase tracking-wide text-secondary-foreground">
        {label}
      </p>
      <p className="font-serif text-2xl">{value}</p>
      {hint ? (
        <p className="text-xs text-secondary-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function RegisterPartnerCard({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const reg = useMutation({
    mutationFn: () =>
      partnerApi.register({ name, slug, planTier: 'studio' }),
    onSuccess: onDone,
  });
  return (
    <div className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="font-serif text-3xl">Đăng ký studio đối tác</h1>
      <p className="text-sm text-secondary-foreground">
        Gói Studio 20 slot · thanh toán chuyển khoản tay.
      </p>
      <BaseTextField
        id="name"
        label="Tên studio"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <BaseTextField
        id="slug"
        label="Slug"
        value={slug}
        onChange={(e) =>
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
        }
        placeholder="studio-hoa-sen"
      />
      {reg.error ? (
        <p className="text-sm text-destructive">
          {reg.error instanceof ApiError
            ? reg.error.message
            : 'Không đăng ký được'}
        </p>
      ) : null}
      <BaseButton
        type="button"
        loading={reg.isPending}
        disabled={!name || slug.length < 3}
        onClick={() => reg.mutate()}
      >
        Bắt đầu
      </BaseButton>
    </div>
  );
}

function CreateClientModal({
  templates,
  members,
  error,
  busy,
  onOpenChange,
  onSubmit,
}: {
  templates: Awaited<ReturnType<typeof partnerApi.templates>> | undefined;
  members: Array<{ id: string; email: string; role: string; joinedAt: string | null }>;
  error: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: {
    nameLeft: string;
    nameRight: string;
    templateId: string;
    partnerTemplateId?: string | null;
    assignedMemberId?: string | null;
    eventDate?: string | null;
  }) => void;
}) {
  const [nameLeft, setNameLeft] = useState('');
  const [nameRight, setNameRight] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [partnerTemplateId, setPartnerTemplateId] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [eventDate, setEventDate] = useState('');

  return (
    <BaseModal
      open
      onOpenChange={onOpenChange}
      title="Thêm khách hàng"
      scrollable
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <BaseButton
            type="button"
            loading={busy}
            disabled={
              !nameLeft || !nameRight || (!templateId && !partnerTemplateId)
            }
            onClick={() =>
              onSubmit({
                nameLeft,
                nameRight,
                templateId: partnerTemplateId
                  ? partnerTemplateId
                  : templateId,
                partnerTemplateId: partnerTemplateId || null,
                assignedMemberId: assignedMemberId || null,
                eventDate: eventDate || null,
              })
            }
          >
            Tạo
          </BaseButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <BaseTextField
            label="Cô dâu / bên trái"
            value={nameLeft}
            onChange={(e) => setNameLeft(e.target.value)}
          />
          <BaseTextField
            label="Chú rể / bên phải"
            value={nameRight}
            onChange={(e) => setNameRight(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Ngày sự kiện</Label>
          <BaseDatePicker
            value={eventDate}
            onChange={setEventDate}
            placeholder="Chọn ngày sự kiện"
          />
        </div>
        <div className="space-y-1">
          <Label>Mẫu sẵn có</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={partnerTemplateId ? '' : templateId}
            disabled={Boolean(partnerTemplateId)}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setPartnerTemplateId('');
            }}
          >
            <option value="">Chọn mẫu…</option>
            {listTemplates().map((t) => (
              <option key={t.meta.id} value={t.meta.id}>
                {t.meta.name}
              </option>
            ))}
          </select>
        </div>
        {templates?.partner.length ? (
          <div className="space-y-1">
            <Label>Hoặc mẫu studio</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={partnerTemplateId}
              onChange={(e) => {
                setPartnerTemplateId(e.target.value);
                if (e.target.value) setTemplateId(e.target.value);
              }}
            >
              <option value="">—</option>
              {templates.partner.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (dùng {t.useCount} lần)
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-1">
          <Label>Người phụ trách</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={assignedMemberId}
            onChange={(e) => setAssignedMemberId(e.target.value)}
          >
            <option value="">Mặc định (bạn)</option>
            {members
              .filter((m) => m.joinedAt)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email} ({m.role})
                </option>
              ))}
          </select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </BaseModal>
  );
}
