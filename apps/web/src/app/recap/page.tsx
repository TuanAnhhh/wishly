import { useQuery } from '@tanstack/react-query';
import { queryKeys, recapApi } from '@wishly/api-client';
import { Button, ErrorState, LoadingSkeleton } from '@wishly/ui';
import { Link, useParams } from 'react-router-dom';

export function RecapPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const recap = useQuery({
    queryKey: queryKeys.recap.public(shareToken ?? ''),
    queryFn: () => recapApi.getPublic(shareToken!),
    enabled: Boolean(shareToken),
  });

  if (recap.isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <LoadingSkeleton variant="invitation" />
      </main>
    );
  }

  if (recap.isError || !recap.data) {
    return (
      <main className="min-h-screen">
        <ErrorState
          tone="warn"
          title="Không mở được trang tổng kết"
          body="Link có thể đã hết hạn hoặc chưa được chia sẻ."
          primary={{ label: 'Về trang chủ', href: '/' }}
        />
      </main>
    );
  }

  const d = recap.data;
  const studio = import.meta.env.VITE_STUDIO_URL ?? 'http://localhost:4201';

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
      <header className="space-y-2 text-center">
        <p className="text-sm tracking-micro text-secondary-foreground">
          TỔNG KẾT
        </p>
        <h1 className="font-serif text-4xl leading-[1.2]">{d.title}</h1>
        {d.eventDate ? (
          <p className="text-secondary-foreground">
            {new Date(d.eventDate).toLocaleDateString('vi-VN')}
          </p>
        ) : null}
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Đã đến" value={d.stats.attended} />
        <Stat label="Lời chúc" value={d.stats.wishes} />
        <Stat label="Ảnh album" value={d.stats.photos} />
        <Stat
          label="Tiền mừng"
          value={
            d.stats.giftTotal == null
              ? '—'
              : `${d.stats.giftTotal.toLocaleString('vi-VN')}đ`
          }
        />
      </section>

      {d.wishSamples.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Lời chúc</h2>
          <ul className="space-y-3">
            {d.wishSamples.map((w) => (
              <li key={w.name + w.text.slice(0, 12)} className="text-sm">
                <p className="font-medium">{w.name}</p>
                <p className="text-secondary-foreground">{w.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {d.photos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Ảnh kỷ niệm</h2>
          <ul className="grid grid-cols-3 gap-2">
            {d.photos.map((p) => (
              <li key={p.id}>
                <img
                  src={p.url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" asChild>
            <Link to={`/album/${d.albumSlug}`}>Xem album đầy đủ</Link>
          </Button>
        </section>
      ) : null}

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="font-serif text-2xl">Dịp tiếp theo?</h2>
        <p className="text-sm text-secondary-foreground">
          Tạo thiệp mới và dùng lại danh sách khách đã có.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <a href={`${studio}/create`}>Kỷ niệm / Đầy tháng / Sinh nhật</a>
          </Button>
          <Button type="button" variant="ghost" disabled>
            Khai trương — sắp có
          </Button>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border p-4 text-center">
      <p className="font-serif text-3xl">{value}</p>
      <p className="text-sm text-secondary-foreground">{label}</p>
    </div>
  );
}

export default RecapPage;
