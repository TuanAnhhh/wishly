import { Eyebrow } from '../shared.js';

/** Shared across every cover variant — countdown is not part of the archetype switch. */
export function Countdown({ eventAt }: { eventAt: string }) {
  const target = Date.parse(eventAt);
  const now = Date.now();
  const diff = Number.isFinite(target) ? Math.max(0, target - now) : 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells: Array<[string | number, string]> = [
    [Math.floor(diff / 86400000), 'ngày'],
    [pad(Math.floor(diff / 3600000) % 24), 'giờ'],
    [pad(Math.floor(diff / 60000) % 60), 'phút'],
  ];

  return (
    <div
      style={{
        // Shares the section-rhythm token with `BlockSection` — the
        // countdown wrapper is structurally the same (full-width,
        // bottom-hairline) role, just without the shared component.
        padding: 'var(--inv-rhythm-section-padding)',
        background: 'var(--inv-bg)',
        borderBottom: '1px solid var(--inv-hairline)',
      }}
    >
      <Eyebrow>
        <span style={{ display: 'block', textAlign: 'center', letterSpacing: '0.2em' }}>
          Còn lại
        </span>
      </Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 20,
        }}
      >
        {cells.map(([value, label]) => (
          <div
            key={label}
            style={{
              border: '1px solid var(--inv-border)',
              padding: '16px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--inv-font-display)',
                fontSize: 42,
                lineHeight: 1.16,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </span>
            <span style={{ fontSize: 13, color: 'var(--inv-ink-soft)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
