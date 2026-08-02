import { Suspense, lazy, useMemo } from 'react';
import {
  AgendaContentSchema,
  EntryPassContentSchema,
  InvitationContentSchema,
  PracticalContentSchema,
  type BlockKey,
} from '@wishly/contracts';

import { CLASSIC_BLOCK_REGISTRY } from './blocks/classic.js';
import { isCorporateBlock } from './blocks/corporate-keys.js';
import { resolveTheme } from './resolve-theme.js';
import type { InvitationRendererProps } from './types.js';

const LazyAgenda = lazy(() =>
  import('./blocks/agenda/index.js').then((m) => ({ default: m.Agenda }))
);
const LazyPractical = lazy(() =>
  import('./blocks/practical/index.js').then((m) => ({ default: m.Practical }))
);
const LazyEntryPass = lazy(() =>
  import('./blocks/entry-pass/index.js').then((m) => ({ default: m.EntryPass }))
);

/**
 * Invitation renderer for editor preview and the public page.
 * Corporate blocks are code-split so classic event types stay lean.
 *
 * NOT used by OG image generation — satori (apps/api/src/og/og.service.ts)
 * renders OG covers with its own plain-object tree, since satori doesn't run
 * React. It shares this component's palette/font *source of truth* via
 * `@wishly/templates/themes` (see resolveTheme.ts), but is a separate render
 * path with its own layout. Keep this comment honest: a prior version of this
 * docblock claimed OG went through here too — it never did.
 */
export function InvitationRenderer({
  content,
  theme,
  blocks,
  resolveMedia,
  interactions,
  className,
  footer,
  tier = 'FREE',
  readOnly = false,
  brandColor,
  lang,
}: InvitationRendererProps) {
  const resolved = resolveTheme(theme, brandColor);
  const parsed = InvitationContentSchema.safeParse(content);
  const data = parsed.success ? parsed.data : { version: 1 as const };
  const ordered = [...blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);

  const mergedInteractions = useMemo(
    () => ({
      ...interactions,
      lang: interactions?.lang ?? lang ?? 'vi',
    }),
    [interactions, lang]
  );

  const cover = data.cover as
    | { guestLabel?: string; nameLeft?: string; nameRight?: string }
    | undefined;
  const greeting =
    mergedInteractions?.guestName && cover
      ? `${cover.guestLabel || 'Kính gửi'} ${mergedInteractions.guestName}`
      : null;

  const needsCorpChunk = ordered.some((b) => isCorporateBlock(b.key));

  const nodes = ordered.map((block) => {
    const key = block.key as BlockKey;
    const raw = (data as Record<string, unknown>)[key];

    if (isCorporateBlock(key)) {
      if (key === 'agenda') {
        const result = AgendaContentSchema.safeParse(raw ?? {});
        if (!result.success) return null;
        return (
          <LazyAgenda
            key={key}
            data={result.data}
            theme={resolved}
            resolveMedia={resolveMedia}
            interactions={mergedInteractions}
            readOnly={readOnly}
            variant={block.variant}
          />
        );
      }
      if (key === 'practical') {
        const result = PracticalContentSchema.safeParse(raw ?? {});
        if (!result.success) return null;
        return (
          <LazyPractical
            key={key}
            data={result.data}
            theme={resolved}
            resolveMedia={resolveMedia}
            interactions={mergedInteractions}
            readOnly={readOnly}
            variant={block.variant}
          />
        );
      }
      if (key === 'entry-pass') {
        const result = EntryPassContentSchema.safeParse(raw ?? {});
        if (!result.success) return null;
        return (
          <LazyEntryPass
            key={key}
            data={result.data}
            theme={resolved}
            resolveMedia={resolveMedia}
            interactions={mergedInteractions}
            readOnly={readOnly}
            variant={block.variant}
          />
        );
      }
      return null;
    }

    const def = CLASSIC_BLOCK_REGISTRY[key];
    if (!def) return null;
    const result = def.schema.safeParse(raw ?? {});
    if (!result.success) return null;
    const Comp = def.Component;
    return (
      <Comp
        key={key}
        data={result.data}
        theme={resolved}
        resolveMedia={resolveMedia}
        interactions={mergedInteractions}
        readOnly={readOnly}
        variant={block.variant}
      />
    );
  });

  return (
    <article
      className={className}
      data-invitation-renderer
      style={{
        ...resolved.cssVars,
        background: 'var(--inv-bg)',
        color: 'var(--inv-ink)',
        fontFamily: 'var(--inv-font-body)',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {greeting ? (
        <p
          style={{
            margin: 0,
            padding: '16px 20px 0',
            textAlign: 'center',
            fontSize: 15,
            color: 'var(--inv-accent)',
          }}
        >
          {greeting}
        </p>
      ) : null}
      {needsCorpChunk ? <Suspense fallback={null}>{nodes}</Suspense> : nodes}
      {footer}
      {!footer && tier === 'FREE' ? (
        <p
          style={{
            margin: 0,
            padding: '24px 20px 32px',
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: '0.04em',
            color: 'var(--inv-muted, #8a8178)',
            borderTop:
              '1px solid color-mix(in srgb, var(--inv-ink) 8%, transparent)',
          }}
        >
          Tạo bằng Thiệp Việt · bản miễn phí
        </p>
      ) : null}
    </article>
  );
}
