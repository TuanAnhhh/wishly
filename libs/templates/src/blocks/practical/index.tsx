import type { FieldDef, PracticalContent } from '@wishly/contracts';
import { PracticalContentSchema } from '@wishly/contracts';

import { t } from '../../i18n/bilingual.js';
import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, Eyebrow, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'bilingual-text',
    label: 'Tiêu đề',
    placeholder: 'Thông tin cần biết',
  },
  {
    name: 'items',
    type: 'array',
    label: 'Mục thông tin',
    help: 'Trang phục · bãi đỗ · liên hệ…',
    itemFields: [
      { name: 'label', type: 'bilingual-text', label: 'Nhãn', required: true },
      { name: 'value', type: 'bilingual-text', label: 'Nội dung', required: true },
      { name: 'note', type: 'bilingual-textarea', label: 'Ghi chú' },
    ],
  },
];

function Practical({ data, interactions, theme }: BlockRenderProps<PracticalContent>) {
  const lang = interactions?.lang ?? 'vi';
  const layoutMode = theme.style.layoutMode;
  return (
    <BlockSection>
      <BlockHeading layoutMode={layoutMode}>{t(data.heading, lang)}</BlockHeading>
      <dl
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {data.items.map((item, i) => (
          <div key={`${t(item.label, lang)}-${i}`} style={{ display: 'grid', gap: 4 }}>
            <Eyebrow as="dt" layoutMode={layoutMode}>
              {t(item.label, lang)}
            </Eyebrow>
            <dd
              style={{
                margin: 0,
                fontFamily: 'var(--inv-font-display)',
                fontSize: 'var(--inv-display-md)',
                lineHeight: 1.35,
              }}
            >
              {t(item.value, lang)}
            </dd>
            {item.note ? <SoftText>{t(item.note, lang)}</SoftText> : null}
          </div>
        ))}
      </dl>
    </BlockSection>
  );
}

export const practicalBlock: BlockDef<PracticalContent> = {
  key: 'practical',
  schema: PracticalContentSchema,
  fields,
  Component: Practical,
  label: 'Thông tin cần biết',
  help: 'Trang phục, bãi đỗ, người liên hệ…',
  empty: 'Chưa có thông tin thực tế.',
};

export { Practical };
