import type { FieldDef, GiftContent } from '@wishly/contracts';
import { GiftContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import {
  BlockHeading,
  BlockSection,
  Eyebrow,
  MediaSlot,
  SoftText,
} from '../shared.js';

const fields: FieldDef[] = [
  { name: 'heading', type: 'text', label: 'Tiêu đề', placeholder: 'Hộp mừng cưới' },
  { name: 'help', type: 'textarea', label: 'Đoạn giải thích' },
  {
    name: 'accounts',
    type: 'array',
    label: 'Tài khoản',
    itemFields: [
      { name: 'side', type: 'text', label: 'Nhãn bên', required: true },
      { name: 'owner', type: 'text', label: 'Chủ tài khoản', required: true },
      { name: 'bank', type: 'text', label: 'Ngân hàng', required: true },
      { name: 'accountNo', type: 'text', label: 'Số tài khoản', required: true },
      { name: 'qrMediaKey', type: 'media', label: 'Mã QR' },
    ],
  },
];

function Gift({
  data,
  resolveMedia,
  interactions,
  readOnly,
  theme,
}: BlockRenderProps<GiftContent>) {
  const layoutMode = theme.style.layoutMode;
  const editorial = layoutMode === 'editorial';
  if (readOnly) {
    return (
      <BlockSection surface>
        <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
        <div style={{ textAlign: editorial ? 'left' : 'center' }}>
          <SoftText>Thiệp đã kết thúc, không nhận mừng cưới nữa.</SoftText>
        </div>
      </BlockSection>
    );
  }

  return (
    <BlockSection surface>
      <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
      <div style={{ textAlign: editorial ? 'left' : 'center', marginBottom: 24 }}>
        <SoftText>{data.help}</SoftText>
      </div>
      <p
        style={{
          margin: '0 0 20px',
          textAlign: editorial ? 'left' : 'center',
          fontSize: 14,
          color: 'var(--inv-ink-muted)',
          lineHeight: 1.6,
        }}
      >
        Tiền mừng vào thẳng tài khoản của hai bạn. Bạn ghi lại vào sổ để không
        cảm ơn sót ai.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.accounts.map((account) => {
          const vietQr = interactions?.giftQrUrls?.[account.accountNo];
          const src =
            vietQr ||
            (account.qrMediaKey
              ? resolveMedia?.(account.qrMediaKey)
              : undefined);
          return (
            <div
              key={`${account.side}-${account.accountNo}`}
              style={{
                background: 'var(--inv-bg)',
                border: '1px solid var(--inv-border-strong)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                // QR card keeps its own centered identity even in `editorial`
                // — a QR block reads as a self-contained "ticket", not prose
                // that should follow the section's text alignment (phase-06
                // risk mitigation: "giữ căn giữa cục bộ" for block đặc thù).
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <Eyebrow accent>{account.side}</Eyebrow>
              <div style={{ width: 140, height: 140 }}>
                <MediaSlot src={src} label="mã QR" />
              </div>
              <div style={{ display: 'grid', gap: 3 }}>
                <strong style={{ fontSize: 16 }}>{account.owner}</strong>
                <span style={{ fontSize: 14, color: 'var(--inv-ink-muted)' }}>
                  {account.bank}
                </span>
                <span
                  style={{
                    fontSize: 19,
                    letterSpacing: '0.06em',
                    fontVariantNumeric: 'tabular-nums',
                    paddingTop: 4,
                  }}
                >
                  {account.accountNo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </BlockSection>
  );
}

export const giftBlock: BlockDef<GiftContent> = {
  key: 'gift',
  schema: GiftContentSchema,
  fields,
  Component: Gift,
  label: 'Hộp mừng',
  help: 'Thông tin chuyển khoản / QR mừng cưới.',
  empty: 'Chưa có tài khoản nhận mừng.',
};

export { Gift };
