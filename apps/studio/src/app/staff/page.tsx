import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { checkinApi, queryKeys } from '@wishly/api-client';
import { Button, EmptyState, Input, BaseTextField } from '@wishly/ui';

export function StaffPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [label, setLabel] = useState('Quầy 1');
  const [created, setCreated] = useState<{
    url: string;
    token: string;
    label: string;
  } | null>(null);

  const list = useQuery({
    queryKey: id ? queryKeys.checkin.staff(id) : ['checkin', 'staff', 'none'],
    queryFn: () => checkinApi.listStaff(id!),
    enabled: Boolean(id),
  });

  const create = useMutation({
    mutationFn: () => checkinApi.createStaff(id!, { label }),
    onSuccess: (row) => {
      setCreated({ url: row.url, token: row.token, label: row.label });
      void qc.invalidateQueries({ queryKey: queryKeys.checkin.staff(id!) });
    },
  });

  const revoke = useMutation({
    mutationFn: (staffId: string) => checkinApi.revokeStaff(id!, staffId),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.checkin.staff(id!) }),
  });

  if (!id) return null;

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-serif text-3xl">Nhân viên check-in</h1>
        <p className="text-sm text-secondary-foreground">
          Cấp link cho quầy đón khách — không cần tài khoản Thiệp Việt. Link
          hiện token đúng một lần.
        </p>
      </header>

      <section className="space-y-3 border border-border p-4">
        <BaseTextField
          label="Nhãn quầy"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Quầy 1 — chị Lan"
        />
        <Button
          type="button"
          disabled={!label.trim() || create.isPending}
          onClick={() => create.mutate()}
        >
          Tạo link nhân viên
        </Button>
      </section>

      {created ? (
        <section className="space-y-3 border border-warning bg-warning/10 p-4">
          <p className="font-medium">
            Link cho «{created.label}» — chép ngay, không hiện lại.
          </p>
          <Input
            readOnly
            value={created.url}
            onFocus={(e) => e.target.select()}
          />
          <div className="flex flex-wrap items-start gap-4">
            <QRCodeSVG value={created.url} size={140} />
            <div className="space-y-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void navigator.clipboard.writeText(created.url)}
              >
                Chép link
              </Button>
              <p className="max-w-xs text-xs text-secondary-foreground">
                Nhân viên mở link trên điện thoại → quét QR thẻ vào cổng. Token:{' '}
                <code className="text-[10px]">
                  {created.token.slice(0, 6)}…
                </code>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Đã cấp</h2>
        {!list.data?.length ? (
          <EmptyState
            title="Chưa có link nhân viên"
            body="Tạo một link cho mỗi quầy. Thu hồi ngay nếu máy bị mất."
            primary={{
              label: 'Tạo link đầu tiên',
              onClick: () => create.mutate(),
            }}
          />
        ) : (
          <ul className="divide-y border border-border">
            {list.data.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-secondary-foreground">
                    Hết hạn {new Date(s.expiresAt).toLocaleString('vi-VN')}
                    {s.lastSeenAt
                      ? ` · hoạt động ${new Date(s.lastSeenAt).toLocaleString('vi-VN')}`
                      : ' · chưa mở'}
                    {s.revokedAt ? ' · đã thu hồi' : ''}
                  </p>
                </div>
                {!s.revokedAt ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => revoke.mutate(s.id)}
                  >
                    Thu hồi
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default StaffPage;
