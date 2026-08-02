import type { AlbumContent, FieldDef } from '@wishly/contracts';
import { AlbumContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockHeading, BlockSection, MediaSlot } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Tiêu đề',
    placeholder: 'Album ảnh',
  },
  {
    name: 'help',
    type: 'text',
    label: 'Dòng phụ',
    placeholder: 'Bấm vào ảnh để xem lớn',
  },
  {
    name: 'mediaKeys',
    type: 'array',
    label: 'Ảnh trong album',
    help: 'Chỉ dùng ảnh đã tải lên kho của thiệp.',
    itemFields: [{ name: 'key', type: 'media', label: 'Ảnh', required: true }],
  },
];

function Album({ data, resolveMedia, theme }: BlockRenderProps<AlbumContent>) {
  const layoutMode = theme.style.layoutMode;
  const keys =
    data.mediaKeys.length > 0 ? data.mediaKeys : [null, null, null, null];

  return (
    <BlockSection>
      <BlockHeading layoutMode={layoutMode}>{data.heading}</BlockHeading>
      <p
        style={{
          margin: '0 0 22px',
          // Sits directly under `BlockHeading` — follows the same mode so it
          // never visually detaches from a left-aligned heading above it.
          textAlign: layoutMode === 'editorial' ? 'left' : 'center',
          fontSize: 14,
          color: 'var(--inv-ink-soft)',
        }}
      >
        {data.help}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {keys.map((key, i) => (
          <div key={key ?? `slot-${i}`} style={{ aspectRatio: '3 / 4' }}>
            <MediaSlot
              src={key ? resolveMedia?.(key) : undefined}
              label={`ảnh ${i + 1} · 3:4`}
            />
          </div>
        ))}
      </div>
    </BlockSection>
  );
}

export const albumBlock: BlockDef<AlbumContent> = {
  key: 'album',
  schema: AlbumContentSchema,
  fields,
  Component: Album,
  label: 'Album ảnh',
  help: 'Lưới ảnh cưới trên thiệp.',
  empty: 'Chưa có ảnh trong album.',
};

export { Album };
