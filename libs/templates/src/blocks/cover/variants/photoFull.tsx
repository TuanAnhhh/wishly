import type { CoverContent } from '@wishly/contracts';
import { DiamondRule } from '@wishly/ui';

import type { BlockRenderProps } from '../../../types.js';
import { MediaSlot } from '../../shared.js';
import { Countdown } from '../countdown.js';

/** Default cover archetype: full-bleed photo, gradient scrim, centered text over photo. */
export function PhotoFull({ data, resolveMedia }: BlockRenderProps<CoverContent>) {
  const src = data.coverMediaKey
    ? resolveMedia?.(data.coverMediaKey)
    : undefined;

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
            // `--inv-scrim-rgb` (not ink/bg — see paletteToCssVars comment):
            // always the theme's dark tone, so the photo scrim stays dark
            // (readable against always-cream `--inv-on-photo` text) on every
            // palette, including `son-mai` where `ink` itself is light.
            background:
              'linear-gradient(180deg, rgba(var(--inv-scrim-rgb),.42) 0%, rgba(var(--inv-scrim-rgb),.12) 34%, rgba(var(--inv-scrim-rgb),.72) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            padding: '26px 24px 0',
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
                background: 'rgba(var(--inv-scrim-rgb),.45)',
                border: '1px solid rgba(var(--inv-on-photo-rgb),.34)',
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
            padding: '0 28px 44px',
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
