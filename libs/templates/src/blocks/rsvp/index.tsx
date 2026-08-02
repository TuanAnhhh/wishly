import { useState, type CSSProperties, type FormEvent } from 'react';
import type { FieldDef, RsvpContent } from '@wishly/contracts';
import { RsvpContentSchema } from '@wishly/contracts';

import { corpStr } from '../../i18n/corporate-strings.js';
import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockSection, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Câu hỏi RSVP',
    placeholder: 'Anh chị đến dự được không ạ?',
  },
  {
    name: 'help',
    type: 'textarea',
    label: 'Dòng giải thích',
  },
  { name: 'acceptLabel', type: 'text', label: 'Nhãn đồng ý' },
  { name: 'declineLabel', type: 'text', label: 'Nhãn từ chối' },
  {
    name: 'wishPlaceholder',
    type: 'text',
    label: 'Placeholder lời chúc',
  },
  { name: 'submitLabel', type: 'text', label: 'Nhãn nút gửi' },
];

/**
 * P06: this block doesn't use `BlockHeading`/`Eyebrow` (hand-rolled `h2`) and
 * deliberately does not read `theme.style.layoutMode` — it's a form UI, not
 * prose, closer to `Cover`'s own carve-out ("đó là chỗ variant per-block
 * thực sự đáng") than to the 8 prose/list blocks `layoutMode` targets. Stays
 * centered regardless of family; revisit only if a real family needs it.
 */
function Rsvp({
  data,
  interactions,
  readOnly,
}: BlockRenderProps<RsvpContent>) {
  const corporate = interactions?.eventType === 'CORPORATE';
  const lang = interactions?.lang ?? 'vi';
  const maxPlus = corporate ? 2 : 20;
  const [attending, setAttending] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [name, setName] = useState(interactions?.guestName ?? '');
  const [plusOnes, setPlusOnes] = useState(0);
  const [mealChoice, setMealChoice] = useState<'standard' | 'vegetarian'>(
    'standard'
  );
  const [allergyNote, setAllergyNote] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interactive = Boolean(interactions?.onRsvp);

  if (readOnly) {
    return (
      <BlockSection>
        <h2
          style={{
            margin: '0 auto',
            textAlign: 'center',
            fontFamily: 'var(--inv-font-display)',
            fontSize: 'var(--inv-display-lg)',
            fontWeight: 500,
          }}
        >
          Thiệp đã kết thúc
        </h2>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <SoftText>Không nhận xác nhận tham dự nữa.</SoftText>
        </div>
      </BlockSection>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!interactive || attending === null || !interactions?.onRsvp) return;
    if (!name.trim()) {
      setError('Vui lòng nhập tên.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await interactions.onRsvp({
        attending,
        note,
        name: name.trim(),
        plusOnes: attending ? plusOnes : 0,
        mealChoice: corporate && attending ? mealChoice : null,
        allergyNote:
          corporate && attending ? allergyNote.trim() || null : null,
        lang: corporate ? lang : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <BlockSection>
        <h2
          style={{
            margin: '0 auto',
            textAlign: 'center',
            fontFamily: 'var(--inv-font-display)',
            fontSize: 'var(--inv-display-lg)',
            fontWeight: 500,
          }}
        >
          Đã nhận phản hồi
        </h2>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <SoftText>
            {attending
              ? 'Cảm ơn bạn — hẹn gặp tại ngày vui!'
              : 'Cảm ơn bạn đã báo — mong được gặp dịp khác.'}
          </SoftText>
        </div>
      </BlockSection>
    );
  }

  return (
    <BlockSection>
      <h2
        style={{
          margin: '0 auto 6px',
          maxWidth: 280,
          textAlign: 'center',
          fontFamily: 'var(--inv-font-display)',
          fontSize: 'var(--inv-display-lg)',
          lineHeight: 1.3,
          fontWeight: 500,
        }}
      >
        {data.heading}
      </h2>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <SoftText>{data.help}</SoftText>
      </div>
      <form
        method="post"
        action="#"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        onSubmit={onSubmit}
      >
        {interactive && !interactions?.guestName ? (
          <label style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <span>Tên của bạn</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                minHeight: 48,
                padding: '12px 14px',
                border: '1px solid var(--inv-border-strong)',
                borderRadius: 'var(--inv-corner-card)',
                font: 'inherit',
                background: 'var(--inv-bg)',
              }}
            />
          </label>
        ) : null}
        <label
          style={{
            display: 'flex',
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--inv-border-strong)',
            padding: '12px 16px',
            cursor: 'pointer',
            background: attending === true ? 'var(--inv-surface)' : undefined,
          }}
        >
          <input
            type="radio"
            name="going"
            value="yes"
            checked={attending === true}
            onChange={() => setAttending(true)}
            style={{ marginRight: 10 }}
          />
          {data.acceptLabel}
        </label>
        <label
          style={{
            display: 'flex',
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--inv-border-strong)',
            padding: '12px 16px',
            cursor: 'pointer',
            background: attending === false ? 'var(--inv-surface)' : undefined,
          }}
        >
          <input
            type="radio"
            name="going"
            value="no"
            checked={attending === false}
            onChange={() => setAttending(false)}
            style={{ marginRight: 10 }}
          />
          {data.declineLabel}
        </label>
        {attending === true ? (
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <span>{corpStr(lang, 'plusOnesLabel')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                aria-label="-"
                onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                style={stepBtn}
              >
                −
              </button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>
                {plusOnes}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setPlusOnes((n) => Math.min(maxPlus, n + 1))}
                style={stepBtn}
              >
                +
              </button>
              <span style={{ color: 'var(--inv-ink-soft)' }}>/ {maxPlus}</span>
            </div>
          </div>
        ) : null}
        {corporate && attending === true ? (
          <>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 14, marginBottom: 8 }}>
                {corpStr(lang, 'mealLabel')}
              </legend>
              <label style={radioRow}>
                <input
                  type="radio"
                  checked={mealChoice === 'standard'}
                  onChange={() => setMealChoice('standard')}
                />
                {corpStr(lang, 'mealStandard')}
              </label>
              <label style={radioRow}>
                <input
                  type="radio"
                  checked={mealChoice === 'vegetarian'}
                  onChange={() => setMealChoice('vegetarian')}
                />
                {corpStr(lang, 'mealVegetarian')}
              </label>
            </fieldset>
            <label style={{ display: 'grid', gap: 8, fontSize: 14 }}>
              <span>{corpStr(lang, 'allergyLabel')}</span>
              <input
                value={allergyNote}
                onChange={(e) => setAllergyNote(e.target.value)}
                placeholder={corpStr(lang, 'allergyPlaceholder')}
                maxLength={500}
                style={{
                  minHeight: 48,
                  padding: '12px 14px',
                  border: '1px solid var(--inv-border-strong)',
                  borderRadius: 'var(--inv-corner-card)',
                  font: 'inherit',
                  background: 'var(--inv-bg)',
                }}
              />
            </label>
          </>
        ) : null}
        <label style={{ display: 'grid', gap: 8, fontSize: 14 }}>
          <span>Gửi lời chúc</span>
          <textarea
            name="wish"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={data.wishPlaceholder}
            style={{
              minHeight: 96,
              padding: 12,
              border: '1px solid var(--inv-border-strong)',
              borderRadius: 'var(--inv-corner-card)',
              font: 'inherit',
              background: 'var(--inv-bg)',
              color: 'var(--inv-ink)',
              resize: 'vertical',
            }}
          />
        </label>
        {error ? (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--inv-accent)' }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || (interactive && attending === null)}
          style={{
            minHeight: 56,
            border: 0,
            borderRadius: 'var(--inv-corner-card)',
            background: 'var(--inv-accent)',
            color: 'var(--inv-bg)',
            font: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Đang gửi…' : data.submitLabel}
        </button>
      </form>
    </BlockSection>
  );
}

const stepBtn: CSSProperties = {
  width: 40,
  height: 40,
  border: '1px solid var(--inv-border-strong)',
  borderRadius: 'var(--inv-corner-card)',
  background: 'var(--inv-bg)',
  font: 'inherit',
  fontSize: 20,
  cursor: 'pointer',
};

const radioRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 40,
  fontSize: 14,
  marginBottom: 4,
};

export const rsvpBlock: BlockDef<RsvpContent> = {
  key: 'rsvp',
  schema: RsvpContentSchema,
  fields,
  Component: Rsvp,
  label: 'Xác nhận tham dự',
  help: 'Khách báo đến / không đến và gửi lời chúc.',
  empty: 'Phần RSVP đang tắt.',
};

export { Rsvp };
