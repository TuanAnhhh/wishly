import type { CSSProperties } from 'react';
import type { ThemeConfig } from '@wishly/contracts';

import { InvitationRule } from './blocks/shared.js';
import { resolveTheme } from './resolve-theme.js';

/**
 * Own mini layout, data-driven (Phase 07 §Architecture "option B") — NOT a
 * scaled-down real `Cover` (option A rejected, see report): `Cover`'s 3
 * variants never render `surfaceTexture` at all (only `BlockSection`-wrapped
 * blocks further down the page do — `Cover` has no `BlockSection`), and 2 of
 * the 3 variants (`photo-full`, `arch-frame`) hardcode a plain `DiamondRule`
 * instead of reading `motifSetId` (only `split` uses `InvitationRule`). A
 * literal scaled `<Cover>` would therefore fail this phase's own success
 * criterion ("texture + motif thể hiện được") for most families — reusing
 * `Cover` verbatim isn't actually "zero drift" here, it's "same blind spot
 * twice". This file instead reads the same `resolveTheme().cssVars` /
 * `InvitationRule` every other surface reads, applied to its own compact
 * card, so texture/motif always show regardless of which `Cover` variant a
 * family happens to use.
 */
export type TemplateThumbProps = {
  nameLeft: string;
  nameRight: string;
  dateLine: string;
  theme: ThemeConfig;
  className?: string;
  /**
   * `portrait` — full names for gallery cards (2:3).
   * `compact` — initials + vertical label for horizontal picker rows.
   */
  variant?: 'portrait' | 'compact';
  /**
   * `families.ts` `coverVariant` — distinguishes "photo behind text"
   * (`photo-full`/`arch-frame`, the default) from "photo above text"
   * (`split`), the one structural split `Cover.tsx` itself calls out as
   * "distinguishable at a glance, not just by token". Absent = `photo-full`.
   */
  coverVariant?: string;
};

function initialOf(name: string) {
  const t = name.trim();
  return t ? t.charAt(0).toLocaleUpperCase('vi-VN') : '·';
}

/**
 * Same CSS-var contract as `blocks/shared.tsx`'s `BlockSection` texture
 * layer — reuses whatever `resolveTheme` already put in scope, no need to
 * re-derive a tile data URI here. Inert (`opacity: 0`) when the style has no
 * `surfaceTexture`, same `var(--x, fallback)` idiom.
 */
function TextureLayer({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'var(--inv-texture-image, none)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'var(--inv-texture-size, auto)',
        opacity: 'var(--inv-texture-opacity, 0)',
        ...style,
      }}
    />
  );
}

/**
 * No real photo asset in a thumb (Unresolved #2 — undecided, kept as a
 * placeholder rather than blocked on it). Same visual idiom as
 * `blocks/shared.tsx`'s `MediaSlot` empty state (diagonal stripe), so a
 * "photo goes here" patch reads consistently across the whole app.
 */
const PHOTO_PLACEHOLDER: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--inv-surface) 0 8px, var(--inv-bg) 8px 16px)',
};

export function TemplateThumb({
  nameLeft,
  nameRight,
  dateLine,
  theme,
  className,
  variant = 'portrait',
  coverVariant,
}: TemplateThumbProps) {
  const resolved = resolveTheme(theme);
  const isSplit = coverVariant === 'split';
  // Only `frameShape: 'arch'` has real rendering logic anywhere today
  // (`archFrame.tsx`'s `showFrame` gate) — mirror that exact rule instead of
  // inventing a new visual for `'octagon'`/`'scallop'`, which stay
  // declared-but-inert everywhere else per `styles.ts`'s own comment. Adding
  // a thumb-only treatment for those would just be a 4th drift source with
  // extra steps: the thumb would promise a shape the real page never draws.
  const showArchFrame = resolved.style.frameShape === 'arch';
  const motifDividerImage = (resolved.cssVars as Record<string, string | undefined>)[
    '--inv-motif-divider'
  ];

  if (variant === 'compact') {
    const left = initialOf(nameLeft);
    const right = initialOf(nameRight);
    return (
      <div
        className={className}
        data-template-thumb
        data-variant="compact"
        style={{
          ...resolved.cssVars,
          position: 'relative',
          zIndex: 0,
          containerType: 'inline-size',
          aspectRatio: '2 / 3',
          width: '100%',
          overflow: 'hidden',
          background: 'var(--inv-bg)',
          color: 'var(--inv-ink)',
          border: '1px solid var(--inv-border)',
          borderRadius: 4,
          padding: '10% 8%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <TextureLayer style={{ zIndex: -1 }} />
        <span
          aria-hidden
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            fontSize: 'clamp(5px, 8cqi, 7px)',
            letterSpacing: '0.14em',
            color: 'var(--inv-ink-soft)',
            textTransform: 'uppercase',
            lineHeight: 1.15,
          }}
        >
          <span>Save</span>
          <span>the</span>
          <span>date</span>
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'clamp(15px, 32cqi, 22px)',
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            {left}
          </span>
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'clamp(9px, 14cqi, 11px)',
              lineHeight: 1,
              color: 'var(--inv-ink-muted)',
            }}
          >
            &amp;
          </span>
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'clamp(15px, 32cqi, 22px)',
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            {right}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {motifDividerImage ? (
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                backgroundImage: 'var(--inv-motif-divider)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
              }}
            />
          ) : (
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                background: 'var(--inv-accent)',
                transform: 'rotate(45deg)',
              }}
            />
          )}
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.04em',
              color: 'var(--inv-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateLine}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      data-template-thumb
      data-variant="portrait"
      data-cover-variant={coverVariant ?? 'photo-full'}
      style={{
        ...resolved.cssVars,
        position: 'relative',
        zIndex: 0,
        containerType: 'inline-size',
        aspectRatio: '2 / 3',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--inv-bg)',
        color: 'var(--inv-ink)',
        border: '1px solid var(--inv-border)',
        borderRadius: 4,
        boxSizing: 'border-box',
      }}
    >
      <TextureLayer style={{ zIndex: -2 }} />
      {isSplit ? (
        // `split`'s real distinguishing trait is a dedicated photo block
        // stacked above the text (`Split` in `variants/split.tsx`) — the
        // stripe patch here stands in for that block only where it
        // genuinely occupies its own region. A full-card version of the
        // same patch (tried first, see report) reads as "unfinished
        // placeholder" rather than "photo behind text" once it's the
        // *entire* card background — worse than showing no photo cue at
        // all for the other 2 archetypes, which don't get one.
        <div
          aria-hidden="true"
          style={{
            flex: '0 0 40%',
            borderBottom: '1px solid var(--inv-hairline)',
            ...PHOTO_PLACEHOLDER,
          }}
        />
      ) : (
        showArchFrame && (
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 8, zIndex: 0, border: '1px solid var(--inv-border-strong)' }}
          />
        )
      )}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          textAlign: 'center',
          padding: isSplit ? '8% 12% 12%' : '16% 12% 12%',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(8px, 3.5cqi, 11px)',
            letterSpacing: '0.22em',
            color: 'var(--inv-ink-soft)',
            textTransform: 'uppercase',
          }}
        >
          Save the date
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--inv-font-display)',
            fontSize: 'clamp(16px, 11cqi, 28px)',
            lineHeight: 1.15,
            fontWeight: 500,
          }}
        >
          {nameLeft}
          <br />
          <span style={{ fontSize: '0.55em', color: 'var(--inv-ink-muted)' }}>
            &amp;
          </span>
          <br />
          {nameRight}
        </p>
        <div style={{ width: '65%', transform: 'scale(0.55)' }}>
          <InvitationRule style={resolved.style} />
        </div>
        <span
          style={{
            fontSize: 'clamp(10px, 4cqi, 13px)',
            letterSpacing: '0.06em',
            color: 'var(--inv-ink-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dateLine}
        </span>
      </div>
    </div>
  );
}
