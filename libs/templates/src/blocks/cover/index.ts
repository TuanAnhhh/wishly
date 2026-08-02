import type { CoverContent } from '@wishly/contracts';

import type { BlockDef } from '../../types.js';
import { Cover } from './Cover.js';
import { coverFields } from './fields.js';
import { CoverContentSchema } from './schema.js';
import { COVER_VARIANT_IDS } from './variants.js';

export const coverBlock: BlockDef<CoverContent> = {
  key: 'cover',
  schema: CoverContentSchema,
  fields: coverFields,
  Component: Cover,
  required: true,
  label: 'Bìa thiệp',
  help: 'Ảnh, tên hai bạn và ngày trên phần đầu thiệp.',
  empty: 'Chưa có tên hoặc ngày trên bìa.',
  variants: COVER_VARIANT_IDS,
};

export { Cover };
