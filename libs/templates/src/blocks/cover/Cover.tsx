import type { ComponentType } from 'react';
import type { CoverContent } from '@wishly/contracts';

import type { BlockRenderProps } from '../../types.js';
import { ArchFrame } from './variants/archFrame.js';
import { PhotoFull } from './variants/photoFull.js';
import { Split } from './variants/split.js';
import { DEFAULT_COVER_VARIANT, type CoverVariantId } from './variants.js';

export { COVER_VARIANT_IDS, DEFAULT_COVER_VARIANT } from './variants.js';

/**
 * Closed object literal — `variant` comes from user/partner JSON, never used
 * as a dynamic property path. `Record<CoverVariantId, ...>` makes TS enforce
 * that every id in `variants.ts` has a matching component here.
 */
const COVER_VARIANTS: Record<
  CoverVariantId,
  ComponentType<BlockRenderProps<CoverContent>>
> = {
  'photo-full': PhotoFull,
  'arch-frame': ArchFrame,
  split: Split,
};

export function Cover(props: BlockRenderProps<CoverContent>) {
  const key = props.variant;
  const V =
    key && Object.hasOwn(COVER_VARIANTS, key)
      ? COVER_VARIANTS[key as CoverVariantId]
      : COVER_VARIANTS[DEFAULT_COVER_VARIANT];
  return <V {...props} />;
}
