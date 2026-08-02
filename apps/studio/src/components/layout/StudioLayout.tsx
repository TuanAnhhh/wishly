import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '@wishly/ui';
import { AccountAvatar } from '../header/AccountAvatar';
import { Breadcrumbs } from './Breadcrumbs';
import { StudioFooter, type StudioFooterProps } from './StudioFooter';

export type StudioLayoutProps = {
  /** Route the wordmark links to. */
  backTo?: string;
  /** Extra content rendered right before the account avatar (step nav, actions...). */
  headerRight?: ReactNode;
  /** Context shown next to the wordmark, e.g. the invitation being edited. */
  headerTitle?: ReactNode;
  /** Shared max-width for header + main + footer, unless overridden individually. */
  maxWidth?: StudioFooterProps['maxWidth'];
  headerMaxWidth?: string;
  /** Extra classes applied to <main> (spacing, etc). */
  contentClassName?: string;
  /** Hide the footer — for rare cases where it doesn't make sense. */
  hideFooter?: boolean;
  /** Pin the header while scrolling — for long flows like tạo thiệp. */
  sticky?: boolean;
  /** Let the page own its horizontal rhythm (full-width bands, e.g. /create). */
  fullBleed?: boolean;
  children: ReactNode;
};

/** Shared studio page shell: brand header, `<main>` content slot, marketing-aligned footer. */
export function StudioLayout({
  backTo = '/dashboard',
  headerRight,
  headerTitle,
  maxWidth = 'max-w-6xl',
  headerMaxWidth,
  contentClassName = 'space-y-8 py-8 sm:py-10',
  hideFooter = true,
  sticky = true,
  fullBleed = false,
  children,
}: StudioLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={`border-b border-border ${sticky ? 'sticky top-0 z-30 bg-background/95 backdrop-blur-sm' : ''
          }`}
      >
        <div
          className={`mx-auto space-y-2 px-4 py-3 ${headerMaxWidth ?? maxWidth}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link to={backTo} className="inline-flex shrink-0">
                <Wordmark />
              </Link>
              {headerTitle}
              <Breadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {headerRight}
              <AccountAvatar />
            </div>
          </div>
        </div>
      </header>

      <main
        className={
          fullBleed
            ? `w-full flex-1 ${contentClassName}`
            : `mx-auto w-full flex-1 px-4 ${maxWidth} ${contentClassName}`
        }
      >
        {children}
      </main>

      {hideFooter ? null : <StudioFooter maxWidth={maxWidth} />}
    </div>
  );
}

export default StudioLayout;
