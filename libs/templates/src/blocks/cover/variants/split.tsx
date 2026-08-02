import type { CoverContent } from '@wishly/contracts';

import type { BlockRenderProps } from '../../../types.js';
import { InvitationRule, MediaSlot } from '../../shared.js';
import { Countdown } from '../countdown.js';

/**
 * Stacked archetype: photo as its own block (no absolute overlay/scrim,
 * no on-photo text), names/date sit below on the normal surface — the
 * structural opposite of `photo-full`/`arch-frame` (which layer text over
 * the photo). Distinguishable at a glance, not just by token.
 */
export function Split({ data, resolveMedia, theme }: BlockRenderProps<CoverContent>) {
  const src = data.coverMediaKey
    ? resolveMedia?.(data.coverMediaKey)
    : undefined;

  return (
    <>
      <section style={{ background: 'var(--inv-bg)', color: 'var(--inv-ink)' }}>
        <div style={{ height: 320 }}>
          <MediaSlot src={src} label="ảnh cưới" />
        </div>
        <div
          style={{
            padding: '28px 24px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
            borderBottom: '1px solid var(--inv-hairline)',
          }}
        >
          {data.guestLabel ? (
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--inv-ink-soft)',
              }}
            >
              Thân mời {data.guestLabel}
            </span>
          ) : null}
          {data.eyebrow ? (
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                color: 'var(--inv-accent)',
              }}
            >
              {data.eyebrow}
            </span>
          ) : null}
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'var(--inv-display-xl)',
              lineHeight: 1.16,
              fontWeight: 500,
            }}
          >
            {data.nameLeft}
            <br />
            <span style={{ fontSize: 'var(--inv-display-lg)', color: 'var(--inv-accent)' }}>
              &amp;
            </span>
            <br />
            {data.nameRight}
          </h1>
          <InvitationRule style={theme.style} />
          <span style={{ fontSize: 19, letterSpacing: '0.06em' }}>
            {data.dateLine}
          </span>
          {data.placeLine ? (
            <span
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--inv-ink-muted)',
              }}
            >
              {data.placeLine}
            </span>
          ) : null}
        </div>
      </section>
      {data.showCountdown && data.eventAt ? (
        <Countdown eventAt={data.eventAt} />
      ) : null}
    </>
  );
}
