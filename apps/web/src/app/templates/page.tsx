import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { EventType } from '@wishly/contracts';
import {
  coverVariantOf,
  InvitationRenderer,
  listTemplates,
  TemplateThumb,
  type TemplateDefinition,
} from '@wishly/templates';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ScrollArea,
} from '@wishly/ui';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import { api, studioEditUrl } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media-url';

type OccasionFilter = EventType | 'ALL' | 'OPENING';
type StyleFilter =
  | 'ALL'
  | 'traditional'
  | 'lotus'
  | 'minimal'
  | 'modern'
  | 'vintage';
type TierFilter = 'ALL' | 'FREE' | 'PAID';
type ColorFilter = 'ALL' | string;

const OCCASIONS: Array<{ id: OccasionFilter; label: string; disabled?: boolean }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'WEDDING', label: 'Cưới' },
  { id: 'BIRTHDAY', label: 'Sinh nhật' },
  { id: 'BABY_MONTH', label: 'Đầy tháng' },
  { id: 'OPENING', label: 'Khai trương', disabled: true },
  { id: 'CORPORATE', label: 'Công ty' },
];

const STYLES: Array<{ id: StyleFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'traditional', label: 'Truyền thống' },
  { id: 'lotus', label: 'Hoa sen' },
  { id: 'minimal', label: 'Tối giản' },
  { id: 'modern', label: 'Hiện đại' },
  { id: 'vintage', label: 'Vintage' },
];

const COLOR_SWATCHES: Array<{ id: string; hex: string; label: string }> = [
  { id: 'cream', hex: '#E8DFD0', label: 'Ngà' },
  { id: 'blush', hex: '#E8C4BC', label: 'Hồng đất' },
  { id: 'son', hex: '#B04A3A', label: 'Son' },
  { id: 'tea', hex: '#7A8B6F', label: 'Trà' },
  { id: 'sand', hex: '#C9A961', label: 'Cát' },
  { id: 'ink', hex: '#2E2620', label: 'Mực' },
];

const FAQS = [
  {
    q: 'Mẫu miễn phí dùng được bao lâu?',
    a: 'Thiệp miễn phí hoạt động đủ để bạn chỉnh và gửi thử. Khi muốn bỏ watermark và gửi cho nhiều khách, nâng cấp một lần — không thuê bao tháng.',
  },
  {
    q: 'Có sửa được màu và chữ sau khi chọn mẫu không?',
    a: 'Có. Chọn mẫu chỉ là điểm bắt đầu — tên, ngày, địa điểm, ảnh và hầu hết nội dung chỉnh lại trong editor bất cứ lúc nào.',
  },
  {
    q: 'Khách lớn tuổi xem thiệp trên điện thoại có ổn không?',
    a: 'Thiệp mở bằng link Zalo, không cần tải app. Chữ lớn, nút xác nhận rõ — nhiều gia đình đã gửi cho ông bà không quen smartphone.',
  },
  {
    q: 'Link thiệp online giữ được bao lâu?',
    a: 'Thiệp xuất bản hoạt động 12 tháng kể từ ngày xuất bản. Bạn có thể gia hạn trong studio nếu cần giữ lâu hơn.',
  },
] as const;

/** `meta.slug` = `${familyId}-${eventSuffix}` (see registry.ts `composeTemplate`,
 *  P03) — family ids are known, non-overlapping prefixes, checked longest-first
 *  isn't needed since none is a prefix of another. */
const FAMILY_IDS = ['gach-bong', 'dong-son', 'giay-do', 'son-mai', 'lua', 'sen-truc'] as const;
function familyIdOf(tpl: TemplateDefinition): string {
  return FAMILY_IDS.find((id) => tpl.meta.slug.startsWith(`${id}-`)) ?? '';
}

function styleTags(tpl: TemplateDefinition): StyleFilter[] {
  const family = familyIdOf(tpl);
  const tags: StyleFilter[] = [];
  if (family === 'son-mai' || family === 'dong-son') tags.push('traditional');
  if (family === 'sen-truc') tags.push('lotus');
  if (family === 'giay-do') tags.push('minimal');
  if (family === 'gach-bong') tags.push('modern');
  if (family === 'lua') tags.push('vintage');
  return tags.length ? tags : ['traditional'];
}

function colorTags(tpl: TemplateDefinition): string[] {
  const family = familyIdOf(tpl);
  if (family === 'son-mai') return ['ink', 'son'];
  if (family === 'sen-truc') return ['tea', 'blush'];
  if (family === 'gach-bong') return ['tea', 'sand'];
  if (family === 'dong-son') return ['sand', 'cream'];
  if (family === 'giay-do') return ['cream', 'ink'];
  if (family === 'lua') return ['cream', 'son'];
  return ['cream', 'son'];
}

function tierLabel(tier: TemplateDefinition['meta']['tier']) {
  if (tier === 'FREE') return 'Miễn phí';
  if (tier === 'PREMIUM') return 'Cao cấp';
  return 'Cơ bản';
}

function FilterChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-secondary-foreground ring-1 ring-border hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function TemplateCard({
  tpl,
  busy,
  onPreview,
  onUse,
}: {
  tpl: TemplateDefinition;
  busy?: boolean;
  onPreview: () => void;
  onUse: () => void;
}) {
  const premium = tpl.meta.tier !== 'FREE';
  return (
    <article className="group space-y-2.5">
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_0_var(--border)] transition-shadow group-hover:shadow-card">
        <span
          className={`absolute top-2 left-2 z-20 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${
            premium
              ? 'bg-warning-soft text-warning-ink'
              : 'bg-foreground/85 text-primary-foreground'
          }`}
        >
          {tierLabel(tpl.meta.tier)}
        </span>
        <TemplateThumb
          nameLeft="Minh Anh"
          nameRight="Quốc Huy"
          dateLine="15 · 11 · 2026"
          theme={tpl.theme}
          coverVariant={coverVariantOf(tpl.blocks)}
        />
        {/* Hover / focus actions — always visible on coarse pointers */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-foreground/55 via-foreground/15 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPreview();
              }}
              className="h-10 w-full rounded-md bg-card text-sm font-medium text-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Xem trước
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUse();
              }}
              className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? 'Đang tạo…' : 'Dùng mẫu này'}
            </button>
          </div>
        </div>
      </div>
      <Link
        to={`/templates/${tpl.meta.slug}`}
        className="block space-y-0.5 px-0.5"
      >
        <p className="font-serif text-lg leading-tight">{tpl.meta.name}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-secondary-foreground">
          {tpl.meta.description}
        </p>
      </Link>
    </article>
  );
}

export function TemplateLibraryPage() {
  const all = useMemo(() => listTemplates(), []);
  const [occasion, setOccasion] = useState<OccasionFilter>('WEDDING');
  const [style, setStyle] = useState<StyleFilter>('ALL');
  const [color, setColor] = useState<ColorFilter>('ALL');
  const [tier, setTier] = useState<TierFilter>('ALL');
  const [previewTpl, setPreviewTpl] = useState<TemplateDefinition | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const createFromTemplate = useMutation({
    mutationFn: (tpl: TemplateDefinition) =>
      api.createDraft({
        templateId: tpl.meta.id,
        eventType: tpl.meta.eventType,
        content: tpl.content,
        theme: tpl.theme,
        blocks: tpl.blocks,
      }),
    onMutate: () => setCreateError(null),
    onSuccess: (draft) => {
      window.location.href = studioEditUrl(draft.id);
    },
    onError: (e) => {
      setCreateError(
        e instanceof Error ? e.message : 'Không tạo được thiệp. Thử lại sau.'
      );
    },
  });

  const freeCount = all.filter((t) => t.meta.tier === 'FREE').length;
  const popular = useMemo(
    () =>
      listTemplates({ eventType: 'WEDDING' })
        .slice()
        .sort((a, b) => a.meta.sortOrder - b.meta.sortOrder)
        .slice(0, 4),
    []
  );

  const filtered = useMemo(() => {
    return all.filter((tpl) => {
      if (occasion === 'OPENING') return false;
      if (occasion !== 'ALL' && tpl.meta.eventType !== occasion) return false;
      if (style !== 'ALL' && !styleTags(tpl).includes(style)) return false;
      if (color !== 'ALL' && !colorTags(tpl).includes(color)) return false;
      if (tier === 'FREE' && tpl.meta.tier !== 'FREE') return false;
      if (tier === 'PAID' && tpl.meta.tier === 'FREE') return false;
      return true;
    });
  }, [all, occasion, style, color, tier]);

  const filtersActive =
    occasion !== 'ALL' || style !== 'ALL' || color !== 'ALL' || tier !== 'ALL';

  function clearFilters() {
    setOccasion('ALL');
    setStyle('ALL');
    setColor('ALL');
    setTier('ALL');
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:py-14">
            <nav className="text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Trang chủ
              </Link>
              <span className="mx-1.5">›</span>
              <span className="text-secondary-foreground">Mẫu thiệp cưới</span>
            </nav>
            <div className="max-w-2xl space-y-4">
              <h1 className="font-serif text-3xl leading-[1.15] tracking-tight sm:text-4xl md:text-[2.75rem]">
                Mẫu thiệp cưới online đẹp, miễn phí
              </h1>
              <p className="text-base leading-relaxed text-secondary-foreground sm:text-lg">
                {all.length} mẫu lấy cảm hứng từ chất liệu Việt — sen, lụa, sơn
                mài, giấy dó. Chọn mẫu, điền tên, xem thiệp thật trong khoảng 15
                phút. Chưa cần đăng ký.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-sm text-secondary-foreground">
              <span>
                {all.length} mẫu · cập nhật tháng 7/2026
              </span>
              <span>{freeCount} mẫu miễn phí</span>
              <span>Đã dùng bởi các cặp đôi đầu tiên</span>
            </div>
          </div>
        </section>

        {/* Popular */}
        <section className="border-b border-border bg-muted">
          <div className="mx-auto max-w-6xl space-y-5 px-4 py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
                Mẫu đang được yêu thích
              </h2>
              <p className="text-sm text-muted-foreground">
                Gợi ý theo bộ cưới
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {popular.map((tpl) => (
                <button
                  key={tpl.meta.id}
                  type="button"
                  onClick={() => setPreviewTpl(tpl)}
                  className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-3 text-left shadow-[0_1px_2px_color-mix(in_srgb,var(--foreground)_4%,transparent)] transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card"
                >
                  <div className="w-[4.5rem] shrink-0 overflow-hidden rounded-md sm:w-20">
                    <TemplateThumb
                      variant="compact"
                      nameLeft="Minh Anh"
                      nameRight="Quốc Huy"
                      dateLine="15.11"
                      theme={tpl.theme}
                      coverVariant={coverVariantOf(tpl.blocks)}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
                    <p className="truncate font-serif text-lg leading-tight tracking-tight">
                      {tpl.meta.name}
                    </p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-secondary-foreground">
                      {tpl.meta.description}
                    </p>
                    {tpl.meta.tier === 'FREE' ? (
                      <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium text-success-ink bg-success-soft">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-medium text-warning-ink">
                        {tierLabel(tpl.meta.tier)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filters + grid */}
        <section className="mx-auto max-w-6xl space-y-8 px-4 py-10">
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="w-20 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Dịp
              </span>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <FilterChip
                    key={o.id}
                    active={occasion === o.id}
                    disabled={o.disabled}
                    onClick={() => setOccasion(o.id)}
                  >
                    {o.label}
                    {o.disabled ? ' · sắp' : ''}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="w-20 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Phong cách
              </span>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <FilterChip
                    key={s.id}
                    active={style === s.id}
                    onClick={() => setStyle(s.id)}
                  >
                    {s.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
              <span className="w-20 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Màu
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    onClick={() => setColor(color === c.id ? 'ALL' : c.id)}
                    className={`size-7 rounded-full border-2 transition-transform ${
                      color === c.id
                        ? 'scale-110 border-primary'
                        : 'border-transparent ring-1 ring-border-strong'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <span className="mx-1 h-4 w-px bg-border" />
                {(
                  [
                    { id: 'ALL' as const, label: 'Tất cả' },
                    { id: 'FREE' as const, label: 'Miễn phí' },
                    { id: 'PAID' as const, label: 'Trả phí' },
                  ] as const
                ).map((t) => (
                  <FilterChip
                    key={t.id}
                    active={tier === t.id}
                    onClick={() => setTier(t.id)}
                  >
                    {t.label}
                  </FilterChip>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-3 text-sm">
                <span className="text-secondary-foreground">
                  {filtered.length} mẫu
                </span>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Xoá bộ lọc
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {createError ? (
            <p className="text-sm text-destructive">{createError}</p>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="Không có mẫu khớp bộ lọc này"
              body="Thử bỏ lọc màu hoặc phong cách — hầu hết mẫu chỉnh được màu sau khi chọn."
              primary={{
                label: 'Xoá bộ lọc',
                onClick: clearFilters,
              }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filtered.map((tpl) => (
                <TemplateCard
                  key={tpl.meta.id}
                  tpl={tpl}
                  busy={
                    createFromTemplate.isPending &&
                    createFromTemplate.variables?.meta.id === tpl.meta.id
                  }
                  onPreview={() => setPreviewTpl(tpl)}
                  onUse={() => createFromTemplate.mutate(tpl)}
                />
              ))}
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-14">
            <h2 className="max-w-xl font-serif text-2xl leading-tight sm:text-3xl">
              Câu hỏi thường gặp về mẫu thiệp cưới online
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {FAQS.map((item) => (
                <div
                  key={item.q}
                  className="space-y-2 rounded-lg border border-border bg-card p-5"
                >
                  <h3 className="text-sm font-medium leading-snug">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-secondary-foreground">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-10 text-center">
              <p className="mx-auto max-w-lg text-secondary-foreground">
                Chọn được mẫu ưng ý rồi? Điền tên hai bạn và xem thiệp thật trong
                vài phút — miễn phí đến khi bạn muốn gửi.
              </p>
              <Button asChild size="lg">
                <Link to="/create">Tạo thiệp miễn phí</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <Dialog
        open={Boolean(previewTpl)}
        onOpenChange={(open) => {
          if (!open) setPreviewTpl(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-md overflow-hidden p-0 sm:max-w-lg">
          {previewTpl ? (
            <>
              <DialogHeader className="border-b border-border px-4 py-3">
                <DialogTitle className="font-serif text-xl">
                  {previewTpl.meta.name}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[min(70vh,640px)] bg-muted px-4 py-5">
                <div className="mx-auto max-w-[320px] overflow-hidden rounded-[1.25rem] border-[3px] border-foreground bg-card shadow-[0_16px_40px_-12px_rgba(46,38,32,0.35)]">
                  <InvitationRenderer
                    content={previewTpl.content}
                    theme={previewTpl.theme}
                    blocks={previewTpl.blocks as never}
                    resolveMedia={resolveMediaUrl}
                    interactions={{
                      eventType: previewTpl.meta.eventType,
                      lang: 'vi',
                    }}
                  />
                </div>
              </ScrollArea>
              <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewTpl(null)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  disabled={createFromTemplate.isPending}
                  onClick={() => {
                    const tpl = previewTpl;
                    setPreviewTpl(null);
                    createFromTemplate.mutate(tpl);
                  }}
                >
                  {createFromTemplate.isPending
                    ? 'Đang tạo…'
                    : 'Dùng mẫu này'}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateLibraryPage;
