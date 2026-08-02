import type { AgendaContent, FieldDef } from '@wishly/contracts';
import { AgendaContentSchema } from '@wishly/contracts';

import { t } from '../../i18n/bilingual.js';
import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, Eyebrow, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'bilingual-text',
    label: 'Tiêu đề',
    placeholder: 'Chương trình',
  },
  {
    name: 'items',
    type: 'array',
    label: 'Các mục chương trình',
    help: 'Thời gian · tiêu đề · mô tả ngắn (song ngữ).',
    itemFields: [
      { name: 'time', type: 'bilingual-text', label: 'Thời gian', required: true },
      { name: 'title', type: 'bilingual-text', label: 'Tiêu đề', required: true },
      { name: 'desc', type: 'bilingual-textarea', label: 'Mô tả' },
    ],
  },
];

function Agenda({ data, interactions, theme }: BlockRenderProps<AgendaContent>) {
  const lang = interactions?.lang ?? 'vi';
  const layoutMode = theme.style.layoutMode;
  return (
    <BlockSection surface>
      <BlockHeading layoutMode={layoutMode}>{t(data.heading, lang)}</BlockHeading>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {data.items.map((item, i) => (
          <li
            key={`${t(item.time, lang)}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <Eyebrow as="span" accent layoutMode={layoutMode} style={{ paddingTop: 4 }}>
              {t(item.time, lang)}
            </Eyebrow>
            <div style={{ display: 'grid', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--inv-font-display)',
                  fontSize: 'var(--inv-display-md)',
                  lineHeight: 1.3,
                }}
              >
                {t(item.title, lang)}
              </span>
              {item.desc ? <SoftText>{t(item.desc, lang)}</SoftText> : null}
            </div>
          </li>
        ))}
      </ol>
    </BlockSection>
  );
}

export const agendaBlock: BlockDef<AgendaContent> = {
  key: 'agenda',
  schema: AgendaContentSchema,
  fields,
  Component: Agenda,
  label: 'Chương trình',
  help: 'Lịch trình sự kiện doanh nghiệp (song ngữ).',
  empty: 'Chưa có mục chương trình.',
};

export { Agenda };
