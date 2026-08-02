import type { CSSProperties, ElementType, ReactNode } from 'react';
import { DiamondRule } from '@wishly/ui';

import { DEFAULT_MOTIF_ID, getMotif } from '../themes/motifs.js';
import type { StyleTokens } from '../themes/styles.js';

export function BlockSection({
  children,
  surface,
  style,
}: {
  children: ReactNode;
  surface?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        // `zIndex: 0` alongside `position: relative` is load-bearing, not
        // decorative — `position:relative` ALONE does not create a new
        // stacking context, so the texture div's `zIndex: -1` below would
        // escape past this section entirely (verified: without this, the
        // texture rendered fully invisible, stacked behind the whole page
        // instead of just behind this section's own children).
        position: 'relative',
        zIndex: 0,
        padding: 'var(--inv-rhythm-section-padding)',
        background: surface ? 'var(--inv-surface)' : 'var(--inv-bg)',
        color: 'var(--inv-ink)',
        borderBottom: '1px solid var(--inv-hairline)',
        fontFamily: 'var(--inv-font-body)',
        ...style,
      }}
    >
      {/*
        Texture fill, behind content. `zIndex: -1` (not DOM order) controls
        stacking here — positioned descendants with z-index:auto paint AFTER
        non-positioned in-flow content per CSS stacking rules, so without an
        explicit negative z-index this would cover `children`, not sit behind
        them. Fully inert (no image, opacity 0) when `surfaceTexture` is null
        — the `var(--x, fallback)` pattern is why no template renders
        differently yet (`--inv-texture-image`/`-opacity` are simply absent).
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          backgroundImage: 'var(--inv-texture-image, none)',
          backgroundRepeat: 'repeat',
          backgroundSize: 'var(--inv-texture-size, auto)',
          opacity: 'var(--inv-texture-opacity, 0)',
        }}
      />
      {children}
    </section>
  );
}

/**
 * P06: `layoutMode` is read from `theme.style.layoutMode` at each call site
 * (passed in as this prop), NOT from the `--inv-layout-mode` CSS var — that
 * var is emitted (styles.ts `styleToCssVars`) for studio preview/debug
 * inspection only, never as a logic source (plan.md phase-06 §Architecture).
 * Default param value (not a destructure fallback baked into JSX) means any
 * call site that omits the prop renders byte-identical to pre-P06.
 */
export function BlockHeading({
  children,
  layoutMode = 'centered',
}: {
  children: ReactNode;
  layoutMode?: StyleTokens['layoutMode'];
}) {
  const editorial = layoutMode === 'editorial';
  return (
    <h2
      style={{
        margin: editorial ? '0 0 32px' : '0 0 24px',
        textAlign: editorial ? 'left' : 'center',
        fontFamily: 'var(--inv-font-display)',
        fontSize: 'var(--inv-display-lg)',
        lineHeight: 1.25,
        fontWeight: 500,
      }}
    >
      {children}
    </h2>
  );
}

export function Eyebrow({
  children,
  accent,
  as: Tag = 'p',
  style,
  layoutMode = 'centered',
}: {
  children: ReactNode;
  accent?: boolean;
  /** Render as a different element (e.g. `dt`) while keeping identical styling. Defaults to `p`. */
  as?: ElementType;
  style?: CSSProperties;
  layoutMode?: StyleTokens['layoutMode'];
}) {
  const editorial = layoutMode === 'editorial';
  return (
    <Tag
      style={{
        margin: 0,
        fontSize: 12,
        lineHeight: 1.5,
        letterSpacing: 'var(--inv-track-eyebrow)',
        fontWeight: 'var(--inv-weight-eyebrow)',
        textTransform: 'uppercase',
        color: accent ? 'var(--inv-accent)' : 'var(--inv-ink-soft)',
        // `null` spreads to nothing — centered mode stays byte-identical.
        ...(editorial
          ? { textAlign: 'left', paddingBottom: 6, borderBottom: '1px solid var(--inv-hairline)' }
          : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function SoftText({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 15,
        lineHeight: 1.7,
        color: 'var(--inv-ink-muted)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </p>
  );
}

export function MediaSlot({
  src,
  label,
  style,
}: {
  src?: string;
  label: string;
  style?: CSSProperties;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 80,
        background:
          'repeating-linear-gradient(135deg,#E6DCCB 0 8px,#EDE4D5 8px 16px)',
        border: '1px solid var(--inv-border-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: 'var(--inv-ink-soft)',
        ...style,
      }}
    >
      {label}
    </div>
  );
}

export function InvitationRule({
  style,
  layoutMode = 'centered',
}: {
  style: StyleTokens;
  /**
   * Explicit opt-in, NOT read from `style.layoutMode` directly — `split.tsx`
   * (`Cover` variant) also calls this component and P06 must leave `Cover`
   * unaffected ("Không sửa Cover.tsx + variants", plan.md phase-06
   * §Related code files). Reading `style.layoutMode` implicitly here would
   * silently change `split`'s divider too the moment any family flips to
   * `editorial` — every non-Cover call site passes this explicitly instead.
   */
  layoutMode?: StyleTokens['layoutMode'];
}) {
  // `getMotif` never throws on an unknown id (matches getStyle/getFont/getPalette
  // fallback pattern); `dividerGlyph` absent (every current preset — 'no-motif'
  // defines no art) falls through to the pre-existing DiamondRule, byte-identical.
  const motif = getMotif(style.motifSetId ?? DEFAULT_MOTIF_ID);
  const editorial = layoutMode === 'editorial';
  if (motif.dividerGlyph) {
    // Square box, NOT `dividerSize` as a line-height (that's a DiamondRule-only
    // concept) — a motif glyph's own viewBox is square-ish, squashing it into
    // a thin strip would shrink-to-fit and read as an indistinct dot.
    const size = style.dividerSize * 4;
    const glyphStyle: CSSProperties = {
      width: size,
      height: size,
      flex: 'none',
      backgroundImage: 'var(--inv-motif-divider)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'contain',
    };
    if (!editorial) {
      return <div aria-hidden="true" style={{ ...glyphStyle, margin: '0 auto' }} />;
    }
    // Editorial: pair the glyph with a flanking hairline (same "rule" feel
    // as the `DiamondRule` branch below) instead of leaving it floating
    // alone at the left margin — a bare icon with no line reads as an
    // accidental gap, not a section break.
    return (
      <div
        aria-hidden="true"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}
      >
        <div style={glyphStyle} />
        <div style={{ height: 1, flex: 1, background: 'var(--inv-hairline)' }} />
      </div>
    );
  }
  return (
    <DiamondRule
      color="var(--inv-accent)"
      lineColor="var(--inv-border)"
      size={style.dividerSize}
      gap={style.dividerGap}
      style={
        editorial
          ? { maxWidth: '100%', margin: 0 }
          : { maxWidth: style.dividerMaxWidth, margin: '0 auto' }
      }
    />
  );
}
