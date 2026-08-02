import { useEffect } from 'react';
import {
  CheckCircleIcon,
  QrCodeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@wishly/api-client';
import { coverVariantOf, listTemplates, TemplateThumb } from '@wishly/templates';
import { Button, SectionLabel } from '@wishly/ui';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import { track } from '../../lib/analytics';
import { api, formatVnd, type PlanRecord } from '../../lib/api';

function planBullets(plan: PlanRecord): string[] {
  if (plan.id === 'free') {
    return [
      'Mẫu miễn phí trong kho',
      `Tối đa ${plan.guestLimit ?? 30} khách`,
      'Có watermark Thiệp Việt',
      'Slug ngẫu nhiên',
    ];
  }
  if (plan.id === 'basic') {
    return [
      'Kho mẫu cơ bản',
      `Tối đa ${plan.guestLimit ?? 150} khách`,
      'Xác nhận tham dự',
      'Chỉ đường tới địa điểm',
      'Slug tùy chọn',
    ];
  }
  return [
    'Toàn bộ kho mẫu',
    'Không giới hạn khách',
    'Thiệp riêng theo tên khách',
    'Mã QR nhận tiền mừng + sổ ghi',
    'Album ảnh trong thiệp',
    'Nhắc khách chưa trả lời',
  ];
}

const FEATURES = [
  {
    title: 'Mỗi khách một tên thiệp riêng',
    body: 'Nhập danh sách một lần — mỗi khách mở ra thấy đúng tên mình trên thiệp.',
    icon: <UserIcon className="size-5" aria-hidden />,
  },
  {
    title: 'Khách xác nhận ngay trên thiệp',
    body: 'Một nút xác nhận và số người đi cùng. Bạn chốt bàn theo thời gian thực.',
    icon: <CheckCircleIcon className="size-5" aria-hidden />,
  },
  {
    title: 'Mã QR nhận tiền mừng',
    body: 'Gắn tài khoản ngân hàng — khách quét QR, bạn có sổ ghi tự động.',
    icon: <QrCodeIcon className="size-5" aria-hidden />,
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      'Gửi hết danh sách trong một buổi tối. Sáng hôm sau đã biết ai đến, đặt bàn không còn đoán mò.',
    names: 'Duyên & Khánh',
    detail: 'Cưới tháng 10 · TP.HCM',
  },
  {
    quote:
      'Khách ở xa vẫn mừng cưới qua QR trong thiệp. Sổ ghi rõ ràng, không phải chép tay từng khoản.',
    names: 'Thu Hải & Minh Quân',
    detail: 'Cưới tháng 8 · Hà Nội',
  },
  {
    quote:
      'Sửa giờ tiệc lúc 11 giờ đêm — khách mở lại link là thấy bản mới. Không phải in lại.',
    names: 'Lan Anh & Đức Huy',
    detail: 'Cưới tháng 12 · Đà Nẵng',
  },
] as const;

export function LandingPage() {
  const gallery = listTemplates({ eventType: 'WEDDING' }).slice(0, 6);
  const plansQuery = useQuery({
    queryKey: queryKeys.plans(),
    queryFn: () => api.listPlans(),
  });
  const plans = (plansQuery.data ?? []) as PlanRecord[];

  useEffect(() => {
    track('landing_view');
  }, []);

  const paidPlans = plans.filter((p) => p.id !== 'free');
  const freePlan = plans.find((p) => p.id === 'free');

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 85% 15%, var(--accent-soft), transparent 60%), linear-gradient(180deg, var(--muted) 0%, var(--background) 70%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6 duration-700 fill-mode-both">
            <SectionLabel className="tracking-eyebrow">
              Thiệp mời điện tử cho người Việt
            </SectionLabel>
            <h1 className="font-serif text-4xl leading-[1.15] tracking-tight text-foreground sm:text-5xl">
              Thiệp cưới online của riêng bạn — xong trong 15 phút
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-secondary-foreground">
              Chọn mẫu, điền tên và địa điểm, gửi cho khách qua Zalo. Khách bấm
              là thấy thiệp, xác nhận tham dự và mừng cưới ngay trên đó.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to="/create">Tạo thiệp miễn phí</Link>
              </Button>
              <Link
                to="/templates"
                className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                Xem clip mẫu →
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Miễn phí đến khi bạn muốn gửi · Không cần thẻ ngân hàng
            </p>
          </div>

          <div className="mx-auto w-full max-w-[260px] animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
            <div className="relative rounded-[2rem] border-[3px] border-foreground bg-foreground p-2.5 shadow-[0_24px_48px_-12px_rgba(46,38,32,0.35)]">
              <div className="absolute left-1/2 top-1.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-foreground" />
              <div className="overflow-hidden rounded-[1.5rem] bg-card">
                <TemplateThumb
                  nameLeft="Mỹ Duyên"
                  nameRight="Đăng Khánh"
                  dateLine="12 · 10 · 2026"
                  theme={{ paletteId: 'co-ngu', fontId: 'be-cormorant' }}
                />
                <div className="space-y-2 border-t border-border px-4 py-3">
                  <p className="text-center text-xs text-secondary-foreground">
                    Chào chị Ngọc Trâm, mời chị đến chung vui
                  </p>
                  <div className="rounded-md bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground">
                    Xác nhận tham dự
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost comparison */}
      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-16">
          <div className="space-y-3">
            <h2 className="font-serif text-3xl leading-[1.2] sm:text-4xl">
              In 500 tấm thiệp giấy hết bao nhiêu?
            </h2>
            <p className="max-w-xl text-secondary-foreground">
              Đây là con số các cặp đôi thường kể lại với chúng tôi.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-card p-7">
              <SectionLabel>Thiệp giấy · 500 khách</SectionLabel>
              <p className="font-serif text-3xl text-secondary-foreground">
                2 – 8 triệu đồng
              </p>
              <ul className="space-y-2.5 text-sm text-secondary-foreground">
                <li>In xong mới phát hiện sai tên hoặc sai giờ</li>
                <li>Chạy xe đi phát từng nhà, mất vài tuần</li>
                <li>Sát ngày vẫn không biết ai đến, đặt bao nhiêu bàn</li>
              </ul>
            </div>
            <div className="space-y-4 rounded-lg border-2 border-primary bg-card p-7 shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
              <SectionLabel>Thiệp Việt</SectionLabel>
              <p className="font-serif text-3xl">Từ 199.000đ</p>
              <ul className="space-y-2.5 text-sm">
                <li>Sửa tên, sửa giờ bất cứ lúc nào — khách luôn thấy bản mới</li>
                <li>Gửi hết danh sách khách qua Zalo trong một buổi tối</li>
                <li>Biết chính xác ai đến, đi mấy người, chốt số bàn</li>
                <li>QR nhận tiền mừng ngay trong thiệp</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl space-y-12 px-4 py-16">
        <h2 className="font-serif text-3xl leading-[1.2] sm:text-4xl">
          Ba thứ mà thiệp giấy không làm được
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {FEATURES.map((item) => (
            <div key={item.title} className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-primary">
                {item.icon}
              </div>
              <h3 className="font-serif text-xl leading-[1.25]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-secondary-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Template gallery */}
      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl leading-[1.2] sm:text-4xl">
              Thư viện mẫu thiệp
            </h2>
            <Link
              to="/templates"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Xem tất cả mẫu →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {gallery.map((tpl) => (
              <Link
                key={tpl.meta.id}
                to={`/templates/${tpl.meta.slug}`}
                className="group space-y-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-card"
              >
                <div className="overflow-hidden rounded-md">
                  <TemplateThumb
                    nameLeft="Minh Anh"
                    nameRight="Quốc Huy"
                    dateLine="15 · 11 · 2026"
                    theme={tpl.theme}
                    coverVariant={coverVariantOf(tpl.blocks)}
                  />
                </div>
                <div className="space-y-1 px-0.5">
                  <p className="font-medium">{tpl.meta.name}</p>
                  <p className="line-clamp-2 text-xs text-secondary-foreground">
                    {tpl.meta.description}
                  </p>
                  <span className="inline-block pt-1 text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                    Xem mẫu
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="gia" className="mx-auto max-w-6xl space-y-8 px-4 py-16">
        <div className="space-y-3">
          <h2 className="font-serif text-3xl leading-[1.2] sm:text-4xl">
            Trả một lần cho mỗi thiệp
          </h2>
          <p className="max-w-xl text-secondary-foreground">
            Không thuê bao tháng, không phí ẩn. Thiệp hoạt động 12 tháng kể từ
            ngày xuất bản.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[freePlan, ...paidPlans].filter(Boolean).map((plan) => {
            if (!plan) return null;
            const featured = plan.id === 'premium';
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col gap-5 rounded-lg bg-card p-6 ${featured
                    ? 'border-2 border-primary shadow-[0_12px_32px_-12px_color-mix(in_srgb,var(--primary)_30%,transparent)]'
                    : 'border border-border'
                  }`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                    Bán chạy nhất
                  </span>
                ) : null}
                <div className="space-y-1 pt-1">
                  <SectionLabel>{plan.name}</SectionLabel>
                  <p className="font-serif text-3xl">
                    {plan.price === 0 ? 'Miễn phí' : formatVnd(plan.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">giá ra mắt</p>
                </div>
                <ul className="flex-1 space-y-2.5 text-sm text-secondary-foreground">
                  {planBullets(plan).map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-0.5 text-primary" aria-hidden>
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={featured ? 'default' : 'outline'}>
                  <Link to="/create">Chọn gói {plan.name}</Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-secondary-foreground">
          Thanh toán một lần qua chuyển khoản hoặc MoMo. Không hài lòng trong 7
          ngày đầu, chúng tôi hoàn tiền — thiệp sẽ trở lại bản miễn phí.
        </p>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-muted">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
          <h2 className="font-serif text-3xl leading-[1.2] sm:text-4xl">
            Các cặp đôi đã dùng nói gì
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.names}
                className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6"
              >
                <blockquote className="flex-1 text-sm leading-relaxed text-secondary-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-hairline pt-4">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-sm text-primary"
                    aria-hidden
                  >
                    {t.names.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.names}</p>
                    <p className="text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-foreground">
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-16 text-center">
          <h2 className="font-serif text-3xl leading-[1.2] text-primary-foreground sm:text-4xl">
            Thử một tấm thiệp trước, quyết định sau
          </h2>
          <p className="mx-auto max-w-md text-primary-foreground/70">
            Tạo thử miễn phí ngay hôm nay — chưa cần tài khoản, chưa cần thẻ.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
          >
            <Link to="/create">Tạo thiệp miễn phí</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default LandingPage;
