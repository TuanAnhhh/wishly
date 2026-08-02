import type { FieldDef, StoryContent } from '@wishly/contracts';
import { StoryContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, Eyebrow, MediaSlot, SoftText } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Tiêu đề',
    placeholder: 'Chuyện tình mình',
  },
  {
    name: 'items',
    type: 'array',
    label: 'Các mốc chuyện',
    help: 'Mỗi mốc: năm, tiêu đề, đoạn ngắn, ảnh tuỳ chọn.',
    itemFields: [
      { name: 'year', type: 'text', label: 'Năm', required: true },
      { name: 'title', type: 'text', label: 'Tiêu đề', required: true },
      { name: 'text', type: 'textarea', label: 'Nội dung', required: true },
      { name: 'mediaKey', type: 'media', label: 'Ảnh' },
    ],
  },
];

function Story({ data, resolveMedia, theme }: BlockRenderProps<StoryContent>) {
  const layoutMode = theme.style.layoutMode;
  return (
    <BlockSection surface>
      <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--inv-rhythm-stack-gap)',
        }}
      >
        {data.items.map((item) => (
          <div
            key={`${item.year}-${item.title}`}
            style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
          >
            <div style={{ width: 96, height: 120, flex: 'none' }}>
              <MediaSlot
                src={
                  item.mediaKey ? resolveMedia?.(item.mediaKey) : undefined
                }
                label="ảnh 4:5"
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingTop: 4,
              }}
            >
              <Eyebrow accent layoutMode={layoutMode}>
                {item.year}
              </Eyebrow>
              <span
                style={{
                  fontFamily: 'var(--inv-font-display)',
                  fontSize: 'var(--inv-display-md)',
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </span>
              <SoftText>{item.text}</SoftText>
            </div>
          </div>
        ))}
      </div>
    </BlockSection>
  );
}

export const storyBlock: BlockDef<StoryContent> = {
  key: 'story',
  schema: StoryContentSchema,
  fields,
  Component: Story,
  label: 'Chuyện tình',
  help: 'Các mốc thời gian kể chuyện hai bạn.',
  empty: 'Chưa có mốc chuyện nào.',
};

export { Story };
