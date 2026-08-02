import type { BlockKey } from '@wishly/contracts';

import type { BlockDef } from '../types.js';
import { agendaBlock } from './agenda/index.js';
import { CLASSIC_BLOCK_REGISTRY } from './classic.js';
import { entryPassBlock } from './entry-pass/index.js';
import { practicalBlock } from './practical/index.js';

export { CLASSIC_BLOCK_REGISTRY } from './classic.js';
export { CORPORATE_BLOCK_KEYS, isCorporateBlock } from './corporate-keys.js';

/** Full registry for editor / studio — includes corporate blocks. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_REGISTRY: Record<BlockKey, BlockDef<any>> = {
  cover: CLASSIC_BLOCK_REGISTRY.cover!,
  invite: CLASSIC_BLOCK_REGISTRY.invite!,
  story: CLASSIC_BLOCK_REGISTRY.story!,
  album: CLASSIC_BLOCK_REGISTRY.album!,
  party: CLASSIC_BLOCK_REGISTRY.party!,
  rsvp: CLASSIC_BLOCK_REGISTRY.rsvp!,
  gift: CLASSIC_BLOCK_REGISTRY.gift!,
  guestbook: CLASSIC_BLOCK_REGISTRY.guestbook!,
  agenda: agendaBlock,
  practical: practicalBlock,
  'entry-pass': entryPassBlock,
};

export function getBlockDef(key: BlockKey) {
  return BLOCK_REGISTRY[key];
}

export {
  albumBlock,
  coverBlock,
  giftBlock,
  guestbookBlock,
  inviteBlock,
  partyBlock,
  rsvpBlock,
  storyBlock,
} from './classic-exports.js';

export { agendaBlock } from './agenda/index.js';
export { entryPassBlock } from './entry-pass/index.js';
export { practicalBlock } from './practical/index.js';
