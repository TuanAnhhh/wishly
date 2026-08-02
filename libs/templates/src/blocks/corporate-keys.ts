import type { BlockKey } from '@wishly/contracts';

export const CORPORATE_BLOCK_KEYS: BlockKey[] = [
  'agenda',
  'practical',
  'entry-pass',
];

export function isCorporateBlock(key: BlockKey): boolean {
  return (CORPORATE_BLOCK_KEYS as string[]).includes(key);
}
