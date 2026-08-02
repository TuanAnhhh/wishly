import type { FieldDef, InviteContent } from '@wishly/contracts';
import { InviteContentSchema } from '@wishly/contracts';

import type { BlockDef, BlockRenderProps } from '../../types.js';
import { BlockSection, InvitationRule } from '../shared.js';

const fields: FieldDef[] = [
  {
    name: 'heading',
    type: 'text',
    label: 'Dòng kính mời',
    placeholder: 'TRÂN TRỌNG KÍNH MỜI',
  },
  {
    name: 'body',
    type: 'textarea',
    label: 'Lời mời',
    help: 'Đoạn văn ngắn gửi tới khách. Xuống dòng được giữ nguyên.',
    placeholder: 'Ví dụ: Ngày vui của chúng tôi sẽ trọn vẹn hơn…',
    required: true,
  },
  {
    name: 'signature',
    type: 'text',
    label: 'Chữ ký dưới lời mời',
    placeholder: 'Ví dụ: Minh Anh & Quốc Huy',
  },
];

function Invite({ data, theme }: BlockRenderProps<InviteContent>) {
  // The whole block IS a short letter (heading/body/signature) — no
  // `BlockHeading`/`Eyebrow` here to thread a `layoutMode` prop through, so
  // this branches locally instead. `InvitationRule` already reads
  // `theme.style.layoutMode` itself (needs no prop change, see shared.tsx).
  const editorial = theme.style.layoutMode === 'editorial';
  return (
    <BlockSection>
      <div
        style={{
          textAlign: editorial ? 'left' : 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: editorial ? 'flex-start' : 'center',
          gap: 18,
          padding: '0 6px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--inv-font-display)',
            fontSize: 'var(--inv-display-md)',
            letterSpacing: '0.14em',
            color: 'var(--inv-accent)',
          }}
        >
          {data.heading}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            lineHeight: 1.85,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.body}
        </p>
        <InvitationRule style={theme.style} layoutMode={theme.style.layoutMode} />
        {data.signature ? (
          <span
            style={{
              fontFamily: 'var(--inv-font-display)',
              fontSize: 'var(--inv-display-md)',
              lineHeight: 1.25,
            }}
          >
            {data.signature}
          </span>
        ) : null}
      </div>
    </BlockSection>
  );
}

export const inviteBlock: BlockDef<InviteContent> = {
  key: 'invite',
  schema: InviteContentSchema,
  fields,
  Component: Invite,
  required: true,
  label: 'Lời mời',
  help: 'Đoạn kính mời và chữ ký dưới bìa.',
  empty: 'Chưa có lời mời.',
};

export { Invite };
