import { Wordmark } from '@wishly/ui';

function webUrl(path = '') {
  const base = (
    (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined) ??
    'http://localhost:4200'
  ).replace(/\/$/, '');
  return `${base}${path}`;
}

const LINKS = [
  { label: 'Kho mẫu thiệp', href: webUrl('/templates') },
  { label: 'Bảng giá', href: webUrl('/#gia') },
  { label: 'Chính sách', href: webUrl('/privacy-policy') },
] as const;

/** Allow-list so the footer width always matches the page's header/main. */
const MAX_WIDTH_CLASS: Record<string, string> = {
  'max-w-xl': 'max-w-xl',
  'max-w-2xl': 'max-w-2xl',
  'max-w-4xl': 'max-w-4xl',
  'max-w-6xl': 'max-w-6xl',
};

export type StudioFooterProps = {
  /** Tailwind max-width class, matches the page's header/main width. */
  maxWidth?: keyof typeof MAX_WIDTH_CLASS;
};

/** Compact studio footer — same brand voice as the marketing site footer (`apps/web`), condensed for logged-in pages. */
export function StudioFooter({ maxWidth = 'max-w-6xl' }: StudioFooterProps) {
  const widthClass = MAX_WIDTH_CLASS[maxWidth] ?? MAX_WIDTH_CLASS['max-w-6xl'];

  return (
    <footer className="mt-auto bg-foreground text-primary-foreground">
      <div
        className={`mx-auto flex flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between ${widthClass}`}
      >
        <div className="space-y-1">
          <Wordmark size={18} className="text-primary-foreground" />
          <p className="max-w-xs text-xs text-primary-foreground/60">
            Thiệp mời online — font tiếng Việt chuẩn, gửi Zalo, nhận tiền mừng
            QR.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-primary-foreground/70">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p
          className={`mx-auto px-4 py-4 text-xs text-primary-foreground/50 ${widthClass}`}
        >
          © {new Date().getFullYear()} Thiệp Việt. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
}

export default StudioFooter;
