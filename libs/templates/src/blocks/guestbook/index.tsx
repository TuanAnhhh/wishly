import { useState, type FormEvent } from 'react';
import type { FieldDef, GuestbookContent } from '@wishly/contracts';
import { GuestbookContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Tiêu đề',
    placeholder: 'Sổ lưu bút',
  },
  {
    name: 'empty',
    type: 'text',
    label: 'Trạng thái trống',
    help: 'Hiện khi chưa có lời chúc nào.',
  },
];

function Guestbook({
  data,
  interactions,
  readOnly,
  theme,
}: BlockRenderProps<GuestbookContent>) {
  const layoutMode = theme.style.layoutMode;
  const wishes = interactions?.wishes ?? [];
  const [name, setName] = useState(interactions?.guestName ?? '');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = !readOnly && Boolean(interactions?.onGuestbook);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!interactions?.onGuestbook) return;
    if (!name.trim() || !message.trim()) {
      setError('Nhập tên và lời chúc.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await interactions.onGuestbook({
        name: name.trim(),
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <BlockSection style={{ borderBottom: 'none', paddingBottom: 56 }}>
      <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
      {wishes.length === 0 ? (
        <div
          style={{
            textAlign: layoutMode === 'editorial' ? 'left' : 'center',
            marginBottom: canSubmit ? 24 : 0,
          }}
        >
          <SoftText>{data.empty}</SoftText>
        </div>
      ) : (
        <>
          <p
            style={{
              margin: '0 0 24px',
              textAlign: layoutMode === 'editorial' ? 'left' : 'center',
              fontSize: 14,
              color: 'var(--inv-ink-soft)',
            }}
          >
            {wishes.length} lời chúc đã gửi tới hai bạn
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {wishes.map((wish) => (
              <article
                key={`${wish.name}-${wish.text.slice(0, 24)}`}
                style={{
                  border: '1px solid var(--inv-border)',
                  padding: 18,
                  background: 'var(--inv-surface)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: 16,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {wish.text}
                </p>
                <footer
                  style={{
                    fontSize: 13,
                    color: 'var(--inv-ink-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <span>{wish.name}</span>
                  {wish.time ? <span>{wish.time}</span> : null}
                </footer>
              </article>
            ))}
          </div>
        </>
      )}
      {canSubmit ? (
        <form
          onSubmit={onSubmit}
          style={{ display: 'grid', gap: 12, marginTop: 28 }}
        >
          {sent ? (
            <SoftText>
              Đã gửi — lời chúc sẽ hiện sau khi chủ thiệp duyệt.
            </SoftText>
          ) : (
            <>
              {!interactions?.guestName ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên của bạn"
                  style={{
                    minHeight: 48,
                    padding: '12px 14px',
                    border: '1px solid var(--inv-border-strong)',
                    borderRadius: 'var(--inv-corner-card)',
                    font: 'inherit',
                  }}
                />
              ) : null}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Viết lời chúc…"
                style={{
                  minHeight: 96,
                  padding: 12,
                  border: '1px solid var(--inv-border-strong)',
                  borderRadius: 'var(--inv-corner-card)',
                  font: 'inherit',
                  resize: 'vertical',
                }}
              />
              {error ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--inv-accent)' }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                style={{
                  minHeight: 48,
                  border: 0,
                  borderRadius: 'var(--inv-corner-card)',
                  background: 'var(--inv-accent)',
                  color: 'var(--inv-bg)',
                  font: 'inherit',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {busy ? 'Đang gửi…' : 'Gửi lời chúc'}
              </button>
            </>
          )}
        </form>
      ) : null}
    </BlockSection>
  );
}

export const guestbookBlock: BlockDef<GuestbookContent> = {
  key: 'guestbook',
  schema: GuestbookContentSchema,
  fields,
  Component: Guestbook,
  label: 'Sổ lưu bút',
  help: 'Hiển thị lời chúc khách đã gửi.',
  empty: 'Chưa bật sổ lưu bút.',
};

export { Guestbook };
