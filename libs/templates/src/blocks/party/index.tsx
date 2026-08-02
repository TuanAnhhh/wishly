import type { FieldDef, PartyContent } from '@wishly/contracts';
import { PartyContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import {
  BlockHeading,
  BlockSection,
  Eyebrow,
  MediaSlot,
  SoftText,
} from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Tiêu đề',
    placeholder: 'Tiệc cưới',
  },
  {
    name: 'datetimeLabel',
    type: 'text',
    label: 'Thời gian (dòng chính)',
    placeholder: 'Ví dụ: 18:00 · Chủ nhật 15/11/2026',
    required: true,
  },
  {
    name: 'datetimeHelp',
    type: 'text',
    label: 'Ghi chú thời gian',
    placeholder: 'Ví dụ: Đón khách từ 17:30',
  },
  {
    name: 'venueName',
    type: 'text',
    label: 'Tên địa điểm',
    required: true,
    placeholder: 'Ví dụ: Nhà hàng Trống Đồng',
  },
  {
    name: 'venueAddress',
    type: 'textarea',
    label: 'Địa chỉ',
    required: true,
  },
  {
    name: 'venueDetail',
    type: 'text',
    label: 'Chi tiết phòng / sảnh',
  },
  {
    name: 'schedule',
    type: 'array',
    label: 'Lịch trình',
    itemFields: [
      { name: 'label', type: 'text', label: 'Mốc', required: true },
      { name: 'time', type: 'text', label: 'Giờ', required: true },
    ],
  },
  { name: 'mapMediaKey', type: 'media', label: 'Ảnh bản đồ' },
  { name: 'mapsUrl', type: 'url', label: 'Liên kết chỉ đường' },
  { name: 'calendarUrl', type: 'url', label: 'Liên kết lịch' },
];

function Party({ data, resolveMedia, theme }: BlockRenderProps<PartyContent>) {
  const layoutMode = theme.style.layoutMode;
  // This bordered card keeps its own internal alignment in sync with
  // `layoutMode` (rather than staying hardcoded center) so the `Eyebrow`
  // label below never visually detaches from its value/help text — see
  // phase-06 report §Unresolved for blocks that instead keep centered
  // regardless of mode.
  const cardTextAlign = layoutMode === 'editorial' ? 'left' : 'center';
  return (
    <BlockSection surface>
      <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
      <div
        style={{
          background: 'var(--inv-bg)',
          border: '1px solid var(--inv-border-strong)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ textAlign: cardTextAlign, display: 'grid', gap: 4 }}>
          <Eyebrow layoutMode={layoutMode}>Thời gian</Eyebrow>
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'var(--inv-display-md)',
              lineHeight: 1.25,
            }}
          >
            {data.datetimeLabel}
          </span>
          {data.datetimeHelp ? <SoftText>{data.datetimeHelp}</SoftText> : null}
        </div>
        <div style={{ height: 1, background: 'var(--inv-hairline)' }} />
        <div style={{ textAlign: cardTextAlign, display: 'grid', gap: 4 }}>
          <Eyebrow layoutMode={layoutMode}>Địa điểm</Eyebrow>
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'var(--inv-display-md)',
              lineHeight: 1.25,
            }}
          >
            {data.venueName}
          </span>
          <SoftText>
            {data.venueAddress}
            {data.venueDetail ? `\n${data.venueDetail}` : ''}
          </SoftText>
        </div>
        {data.schedule.length > 0 ? (
          <dl style={{ margin: 0, display: 'grid', gap: 10 }}>
            {data.schedule.map((row) => (
              <div
                key={`${row.label}-${row.time}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontSize: 15,
                  borderBottom: '1px solid var(--inv-hairline)',
                  paddingBottom: 8,
                }}
              >
                <dt style={{ margin: 0, color: 'var(--inv-ink-muted)' }}>
                  {row.label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                  }}
                >
                  {row.time}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div style={{ height: 150 }}>
          <MediaSlot
            src={
              data.mapMediaKey ? resolveMedia?.(data.mapMediaKey) : undefined
            }
            label="ảnh bản đồ tĩnh"
          />
        </div>
        {data.mapsUrl ? (
          <a
            href={data.mapsUrl}
            style={{
              display: 'flex',
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--inv-accent)',
              color: 'var(--inv-bg)',
              textDecoration: 'none',
              fontWeight: 600,
              borderRadius: 'var(--inv-corner-card)',
            }}
          >
            Chỉ đường tới nhà hàng
          </a>
        ) : null}
        {data.calendarUrl ? (
          <a
            href={data.calendarUrl}
            style={{
              display: 'flex',
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--inv-ink)',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
            }}
          >
            Lưu vào lịch điện thoại
          </a>
        ) : null}
      </div>
    </BlockSection>
  );
}

export const partyBlock: BlockDef<PartyContent> = {
  key: 'party',
  schema: PartyContentSchema,
  fields,
  Component: Party,
  required: true,
  label: 'Tiệc / sự kiện',
  help: 'Thời gian, địa điểm và lịch trình trong ngày.',
  empty: 'Chưa có thời gian hoặc địa điểm.',
};

export { Party };
