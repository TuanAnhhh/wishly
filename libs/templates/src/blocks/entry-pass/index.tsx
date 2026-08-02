import { useRef, useState } from 'react';
import type { EntryPassContent, FieldDef } from '@wishly/contracts';
import { EntryPassContentSchema } from '@wishly/contracts';
import { QRCodeSVG } from 'qrcode.react';

import { t } from '../../i18n/bilingual.js';
import { corpStr } from '../../i18n/corporate-strings.js';
import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'bilingual-text',
    label: 'Tiêu đề thẻ',
  },
  {
    name: 'help',
    type: 'bilingual-textarea',
    label: 'Hướng dẫn',
  },
];

function EntryPass({
  data,
  interactions,
}: BlockRenderProps<EntryPassContent>) {
  const lang = interactions?.lang ?? 'vi';
  const pass = interactions?.entryPass;
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  // Hide completely when no personal token / passCode (shared slug link).
  if (!pass?.passCode) return null;
  const entry = pass;

  // NOTE: draws to a <canvas>, so it can't read CSS custom properties — this
  // is a second, parallel style system that hardcodes hex colors/fonts and
  // will silently drift from `--inv-*` tokens (incl. styleId/palette changes
  // here won't affect the downloaded PNG). Out of scope for Phase 03
  // (plans/260730-1502-template-style-vocabulary/phase-03-de-hardcode-blocks.md
  // Unresolved #3) — flagging only, not fixing.
  async function saveAsImage() {
    const el = cardRef.current;
    if (!el) return;
    setSaving(true);
    try {
      const svg = el.querySelector('svg');
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = getComputedStyle(el).backgroundColor || '#FDFBF7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2E2620';
      ctx.font = '500 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(t(data.heading, lang), 360, 80);
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText(entry.guestName, 360, 140);
      if (svg) {
        const xml = new XMLSerializer().serializeToString(svg);
        const url = URL.createObjectURL(
          new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
        );
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('qr'));
          img.src = url;
        });
        ctx.drawImage(img, 180, 200, 360, 360);
        URL.revokeObjectURL(url);
      }
      ctx.font = '600 32px ui-monospace, monospace';
      ctx.fillText(entry.passCode, 360, 620);
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(
        entry.tableLabel
          ? `${corpStr(lang, 'tableLabel')} ${entry.tableLabel}`
          : corpStr(lang, 'noTableYet'),
        360,
        680
      );
      ctx.fillStyle = '#8B7B6C';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(t(data.help, lang), 360, 760);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `the-vao-cong-${entry.passCode}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BlockSection surface>
      {/*
        P06: deliberately NOT threading `theme.style.layoutMode` here — this
        card reads as a physical entry ticket (QR + code + table number),
        listed by name in phase-06's own risk table as a block that should
        "giữ căn giữa cục bộ" regardless of the family's global layoutMode
        (same carve-out as the gift-block QR card). `BlockHeading`'s default
        param keeps it centered without any prop.
      */}
      <div
        ref={cardRef}
        data-entry-pass
        style={{
          border: '1px solid var(--inv-border-strong)',
          padding: 28,
          textAlign: 'center',
          background: 'var(--inv-bg)',
          display: 'grid',
          gap: 12,
          justifyItems: 'center',
        }}
      >
        <BlockHeading>{t(data.heading, lang)}</BlockHeading>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--inv-font-display)',
            fontSize: 'var(--inv-display-md)',
          }}
        >
          {entry.guestName}
        </p>
        <QRCodeSVG value={entry.passCode} size={180} level="M" includeMargin />
        <p
          style={{
            margin: 0,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 22,
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          {entry.passCode}
        </p>
        <p style={{ margin: 0, fontSize: 16 }}>
          {entry.tableLabel
            ? `${corpStr(lang, 'tableLabel')} ${entry.tableLabel}`
            : corpStr(lang, 'noTableYet')}
        </p>
        <SoftText>{t(data.help, lang)}</SoftText>
      </div>
      <button
        type="button"
        onClick={() => void saveAsImage()}
        disabled={saving}
        style={{
          marginTop: 16,
          width: '100%',
          minHeight: 48,
          border: '1px solid var(--inv-border-strong)',
          borderRadius: 'var(--inv-corner-card)',
          background: 'transparent',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        {saving ? '…' : corpStr(lang, 'savePassCard')}
      </button>
    </BlockSection>
  );
}

export const entryPassBlock: BlockDef<EntryPassContent> = {
  key: 'entry-pass',
  schema: EntryPassContentSchema,
  fields,
  Component: EntryPass,
  label: 'Thẻ vào cổng',
  help: 'QR + mã + số bàn — chỉ hiện khi khách mở link riêng.',
  empty: 'Ẩn khi không có mã khách.',
};

export { EntryPass };
