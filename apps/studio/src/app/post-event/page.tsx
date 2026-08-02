import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  albumApi,
  queryKeys,
  recapApi,
  thanksApi,
  type ThanksRecipient,
} from '@wishly/api-client';
import {
  BaseTextField,
  Button,
  EmptyState,
  LoadingSkeleton,
  SectionLabel,
} from '@wishly/ui';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

type Tab = 'album' | 'thanks' | 'recap';

export function PostEventPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('album');
  const qc = useQueryClient();

  const album = useQuery({
    queryKey: queryKeys.album.owner(id ?? ''),
    queryFn: () => albumApi.getOwner(id!),
    enabled: Boolean(id),
  });
  const thanks = useQuery({
    queryKey: queryKeys.thanks(id ?? ''),
    queryFn: () => thanksApi.recipients(id!),
    enabled: Boolean(id) && tab === 'thanks',
  });
  const recap = useQuery({
    queryKey: queryKeys.recap.owner(id ?? ''),
    queryFn: () => recapApi.getOwner(id!),
    enabled: Boolean(id) && tab === 'recap',
  });

  const moderate = useMutation({
    mutationFn: (p: { photoId: string; status: 'ok' | 'hidden' | 'pending' }) =>
      albumApi.moderate(id!, p.photoId, { status: p.status }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.album.owner(id!) }),
  });
  const approveAll = useMutation({
    mutationFn: () => albumApi.approveAll(id!),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.album.owner(id!) }),
  });

  if (!id) return null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">Sau sự kiện</h1>
        <p className="text-sm text-secondary-foreground">
          Album · thiệp cảm ơn · trang tổng kết
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['album', 'Album'],
            ['thanks', 'Cảm ơn'],
            ['recap', 'Tổng kết'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {label}
            {key === 'album' && album.data?.pendingCount
              ? ` (${album.data.pendingCount})`
              : ''}
          </Button>
        ))}
      </div>

      {tab === 'album' ? (
        album.isLoading ? (
          <LoadingSkeleton variant="guest-list" />
        ) : album.data ? (
          <AlbumPanel
            data={album.data}
            onModerate={(photoId, status) =>
              moderate.mutate({ photoId, status })
            }
            onApproveAll={() => approveAll.mutate()}
          />
        ) : (
          <EmptyState
            title="Chưa có album"
            body="Xuất bản thiệp để mở album tự động."
          />
        )
      ) : null}

      {tab === 'thanks' ? (
        thanks.isLoading ? (
          <LoadingSkeleton variant="guest-list" />
        ) : thanks.data ? (
          <ThanksPanel invitationId={id} data={thanks.data} />
        ) : null
      ) : null}

      {tab === 'recap' ? (
        recap.isLoading ? (
          <LoadingSkeleton variant="guest-list" />
        ) : recap.data ? (
          <RecapPanel invitationId={id} data={recap.data} />
        ) : null
      ) : null}
    </>
  );
}

function AlbumPanel({
  data,
  onModerate,
  onApproveAll,
}: {
  data: NonNullable<Awaited<ReturnType<typeof albumApi.getOwner>>>;
  onModerate: (id: string, status: 'ok' | 'hidden' | 'pending') => void;
  onApproveAll: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-secondary-foreground">
          {data.pendingCount} chờ duyệt · đóng{' '}
          {new Date(data.closesAt).toLocaleDateString('vi-VN')}
        </p>
        <Button type="button" size="sm" onClick={onApproveAll}>
          Duyệt tất cả
        </Button>
      </div>
      {data.photos.length === 0 ? (
        <EmptyState
          title="Chưa có ảnh"
          body="Chia sẻ link album với khách để họ tải ảnh lên."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.photos.map((p) => (
            <li key={p.id} className="space-y-2 border border-border p-2">
              <img
                src={p.url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <p className="truncate text-xs">
                {p.uploaderName} · {p.status}
              </p>
              <div className="flex flex-wrap gap-1">
                {p.status !== 'ok' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onModerate(p.id, 'ok')}
                  >
                    Duyệt
                  </Button>
                ) : null}
                {p.status !== 'hidden' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onModerate(p.id, 'hidden')}
                  >
                    Ẩn
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onModerate(p.id, 'pending')}
                  >
                    Về chờ
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ThanksPanel({
  invitationId,
  data,
}: {
  invitationId: string;
  data: Awaited<ReturnType<typeof thanksApi.recipients>>;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const unsent = useMemo(
    () => data.recipients.filter((r) => !r.sentAt),
    [data.recipients],
  );

  const mark = useMutation({
    mutationFn: (guestIds: string[]) =>
      thanksApi.markSent(invitationId, { guestIds }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.thanks(invitationId) }),
  });

  async function copyMessages(rows: ThanksRecipient[]) {
    const blob = rows.map((r) => r.preview).join('\n\n---\n\n');
    await navigator.clipboard.writeText(blob);
    setCopyMsg(`Đã chép ${rows.length} tin nhắn.`);
    await mark.mutateAsync(rows.map((r) => r.guestId));
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-secondary-foreground">
        Có quà {data.counts.gift} · Đến {data.counts.came} · Vắng{' '}
        {data.counts.absent} · Chưa trả lời {data.counts.quiet}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void copyMessages(unsent)}
          disabled={unsent.length === 0}
        >
          Chép {unsent.length} tin chưa gửi
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={selected.length === 0}
          onClick={() =>
            void copyMessages(
              data.recipients.filter((r) => selected.includes(r.guestId)),
            )
          }
        >
          Chép {selected.length} đã chọn
        </Button>
      </div>
      {copyMsg ? (
        <p className="text-sm text-secondary-foreground">{copyMsg}</p>
      ) : null}
      <ul className="divide-y border border-border">
        {data.recipients.map((r) => (
          <li key={r.guestId} className="space-y-2 px-3 py-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected.includes(r.guestId)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, r.guestId]
                      : prev.filter((x) => x !== r.guestId),
                  )
                }
                className="mt-1"
              />
              <span>
                <span className="font-medium">{r.name}</span>
                {' · '}
                {r.personaLabel}
                {r.sentAt ? ' · đã chép' : ''}
              </span>
            </label>
            <p className="pl-6 text-secondary-foreground">{r.preview}</p>
            <div className="flex flex-wrap gap-1 pl-6">
              {(['gift', 'came', 'absent', 'quiet'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={r.persona === p ? 'default' : 'ghost'}
                  onClick={() =>
                    void thanksApi
                      .override(invitationId, r.guestId, { persona: p })
                      .then(() =>
                        qc.invalidateQueries({
                          queryKey: queryKeys.thanks(invitationId),
                        }),
                      )
                  }
                >
                  {p}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecapPanel({
  invitationId,
  data,
}: {
  invitationId: string;
  data: Awaited<ReturnType<typeof recapApi.getOwner>>;
}) {
  const qc = useQueryClient();
  const web = import.meta.env.VITE_WEB_URL ?? 'http://localhost:4200';
  const shareUrl = data.shareToken ? `${web}/recap/${data.shareToken}` : null;

  const privacy = useMutation({
    mutationFn: (showGiftOnRecap: boolean) =>
      recapApi.updatePrivacy(invitationId, { showGiftOnRecap }),
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: queryKeys.recap.owner(invitationId),
      }),
  });

  return (
    <section className="space-y-4">
      <SectionLabel>Số liệu</SectionLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MiniStat label="Lượt xem" value={data.stats.views} />
        <MiniStat label="Đến" value={data.stats.attended} />
        <MiniStat label="Lời chúc" value={data.stats.wishes} />
        <MiniStat label="Ảnh" value={data.stats.photos} />
        <MiniStat
          label="Tiền mừng"
          value={`${(data.stats.giftTotal ?? 0).toLocaleString('vi-VN')}đ`}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.showGiftOnRecap}
          onChange={(e) => privacy.mutate(e.target.checked)}
        />
        Hiện tổng tiền mừng trên bản chia sẻ công khai
      </label>
      {shareUrl ? (
        <div className="space-y-2">
          <BaseTextField
            id="share"
            label="Link chia sẻ tổng kết"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              Chép link
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                Mở trang
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a
                href={`${web}/album/${data.albumSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                Album khách
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-secondary-foreground">
          Xuất bản thiệp để có link tổng kết.
        </p>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border p-3 text-center">
      <p className="font-serif text-2xl">{value}</p>
      <p className="text-xs text-secondary-foreground">{label}</p>
    </div>
  );
}

export default PostEventPage;
