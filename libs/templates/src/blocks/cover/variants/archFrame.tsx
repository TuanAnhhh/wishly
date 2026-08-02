import type { CoverContent } from '@wishly/contracts';
import { DiamondRule } from '@wishly/ui';

import type { BlockRenderProps } from '../../../types.js';
import { MediaSlot } from '../../shared.js';
import { Countdown } from '../countdown.js';

/**
 * "Hộp sơn mài" archetype: same full-bleed photo as `photo-full`, plus an
 * inset decorative frame line around the whole hero — this is the one place
 * `frameShape === 'arch'` gets *drawn* as a visible line (P02: migrated off
 * the old `frameSides === 4` proxy — `dark-luxe` now carries both, since
 * `frameSides`/`frameInset` still control the inset AMOUNT, a separate axis
 * from `frameShape`, kept per style-spec.md §1c). Styles with
 * `frameShape !== 'arch'` (everything but `dark-luxe`) render with no
 * visible line and identical padding to `photo-full` — the archetype only
 * *shows* on a style that opts in.
 */
export function ArchFrame({ data, resolveMedia, theme }: BlockRenderProps<CoverContent>) {
  const src = data.coverMediaKey
    ? resolveMedia?.(data.coverMediaKey)
    : undefined;
  const showFrame = theme.style.frameShape === 'arch';
  const inset = theme.style.frameInset;

  return (
    <>
      <section
        style={{
          position: 'relative',
          minHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: 'var(--inv-on-photo)',
          background: 'var(--inv-surface)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <MediaSlot src={src} label="ảnh cưới toàn khung" />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(var(--inv-scrim-rgb),.48) 0%, rgba(var(--inv-scrim-rgb),.18) 34%, rgba(var(--inv-scrim-rgb),.78) 100%)',
          }}
        />
        {showFrame ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset,
              border: '1px solid rgba(var(--inv-on-photo-rgb),.55)',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'relative',
            padding: `${26 + inset}px ${24 + inset}px 0`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {data.guestLabel ? (
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--inv-on-photo)',
                background: 'rgba(var(--inv-scrim-rgb),.5)',
                border: '1px solid rgba(var(--inv-on-photo-rgb),.4)',
                padding: '9px 16px',
                borderRadius: 999,
              }}
            >
              Thân mời {data.guestLabel}
            </span>
          ) : null}
        </div>
        <div
          style={{
            position: 'relative',
            padding: `0 ${28 + inset}px ${44 + inset}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            textAlign: 'center',
          }}
        >
          {data.eyebrow ? (
            <span style={{ fontSize: 11, letterSpacing: '0.3em' }}>
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
            <span style={{ fontSize: 'var(--inv-display-lg)' }}>&amp;</span>
            <br />
            {data.nameRight}
          </h1>
          <DiamondRule
            color="var(--inv-on-photo)"
            lineColor="rgba(var(--inv-on-photo-rgb),.45)"
            style={{ width: '100%', maxWidth: 240 }}
          />
          <span style={{ fontSize: 19, letterSpacing: '0.06em' }}>
            {data.dateLine}
          </span>
          {data.placeLine ? (
            <span style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9 }}>
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
