import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError, partnerApi, queryKeys } from '@wishly/api-client';
import {
  BaseButton,
  BaseRadioField,
  BaseTextField,
  Button,
  LoadingSkeleton,
} from '@wishly/ui';

export function PartnerTeamPage() {
  const qc = useQueryClient();
  const members = useQuery({
    queryKey: queryKeys.partner.members(),
    queryFn: () => partnerApi.members(),
  });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'edit' | 'view'>('edit');

  const invite = useMutation({
    mutationFn: () => partnerApi.inviteMember({ email, role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.partner.members() });
      setEmail('');
    },
  });
  const updateRole = useMutation({
    mutationFn: (p: { id: string; role: 'admin' | 'edit' | 'view' }) =>
      partnerApi.updateMemberRole(p.id, { role: p.role }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.partner.members() }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => partnerApi.removeMember(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.partner.members() }),
  });

  if (members.isLoading) return <LoadingSkeleton variant="guest-list" rows={4} />;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Nhân sự</h1>
        <p className="text-sm text-secondary-foreground">
          3 vai: admin · edit (chỉ thiệp được giao) · view. Lời mời hết hạn 7 ngày.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-3">
        <BaseTextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <BaseRadioField
          label="Vai"
          className="flex flex-row gap-4"
          value={role}
          onValueChange={(v) => setRole(v as typeof role)}
          options={[
            { value: 'admin', label: 'Quản trị' },
            { value: 'edit', label: 'Chỉnh sửa' },
            { value: 'view', label: 'Chỉ xem' },
          ]}
        />
        <BaseButton
          type="button"
          loading={invite.isPending}
          disabled={!email}
          onClick={() => invite.mutate()}
        >
          Mời
        </BaseButton>
        {invite.error ? (
          <p className="w-full text-sm text-destructive">
            {invite.error instanceof ApiError
              ? invite.error.message
              : 'Không mời được'}
          </p>
        ) : null}
      </section>

      <ul className="space-y-3">
        {members.data?.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-3"
          >
            <div>
              <p className="font-medium">{m.email}</p>
              <p className="text-xs text-secondary-foreground">
                {m.joinedAt ? 'Đã tham gia' : 'Đang chờ nhận lời mời'}
                {m.lastSeenAt
                  ? ` · thấy lần cuối ${new Date(m.lastSeenAt).toLocaleDateString('vi-VN')}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={m.role}
                onChange={(e) =>
                  updateRole.mutate({
                    id: m.id,
                    role: e.target.value as 'admin' | 'edit' | 'view',
                  })
                }
              >
                <option value="admin">admin</option>
                <option value="edit">edit</option>
                <option value="view">view</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => remove.mutate(m.id)}
              >
                Gỡ
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
