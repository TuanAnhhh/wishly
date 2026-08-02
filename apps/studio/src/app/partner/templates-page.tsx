import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError, partnerApi, queryKeys } from '@wishly/api-client';
import {
  BaseButton,
  BaseTextField,
  Button,
  EmptyState,
  Label,
  LoadingSkeleton,
} from '@wishly/ui';

export function PartnerTemplatesPage() {
  const qc = useQueryClient();
  const templates = useQuery({
    queryKey: queryKeys.partner.templates(),
    queryFn: () => partnerApi.templates(),
  });
  const clients = useQuery({
    queryKey: queryKeys.partner.clients(),
    queryFn: () => partnerApi.clients(),
  });
  const [name, setName] = useState('');
  const [invitationId, setInvitationId] = useState('');

  const save = useMutation({
    mutationFn: () => partnerApi.saveTemplate({ name, invitationId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.partner.templates() });
      setName('');
      setInvitationId('');
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => partnerApi.deleteTemplate(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.partner.templates() }),
  });

  if (templates.isLoading) return <LoadingSkeleton variant="guest-list" rows={4} />;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Kho mẫu</h1>
        <p className="text-sm text-secondary-foreground">
          Lưu mẫu dạng dữ liệu (theme/blocks/content) — ảnh & tên cặp đôi bị loại bỏ.
        </p>
      </header>

      <section className="space-y-3 rounded-md border border-border/60 p-4">
        <h2 className="font-medium">Lưu mẫu từ thiệp có sẵn</h2>
        <BaseTextField
          label="Tên mẫu"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="space-y-1">
          <Label>Thiệp nguồn</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={invitationId}
            onChange={(e) => setInvitationId(e.target.value)}
          >
            <option value="">Chọn…</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientCode ?? c.slug} — {c.nameLeft} & {c.nameRight}
              </option>
            ))}
          </select>
        </div>
        {save.error ? (
          <p className="text-sm text-destructive">
            {save.error instanceof ApiError
              ? save.error.message
              : 'Không lưu được'}
          </p>
        ) : null}
        <BaseButton
          type="button"
          loading={save.isPending}
          disabled={!name || !invitationId}
          onClick={() => save.mutate()}
        >
          Lưu vào kho
        </BaseButton>
      </section>

      {!templates.data?.partner.length ? (
        <EmptyState
          title="Chưa có mẫu studio"
          body="Lưu một thiệp đã chỉnh thành mẫu để tái dùng cho khách mới."
          primary={{ label: 'Chọn thiệp nguồn ở trên' }}
        />
      ) : (
        <ul className="space-y-3">
          {templates.data.partner.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-3"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-secondary-foreground">
                  {t.eventType} · dùng {t.useCount} lần
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => remove.mutate(t.id)}
              >
                Xoá
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
