import type { BlockKey } from '@wishly/contracts';

import type { BlockDef } from '../types.js';
import { albumBlock } from './album/index.js';
import { coverBlock } from './cover/index.js';
import { giftBlock } from './gift/index.js';
import { guestbookBlock } from './guestbook/index.js';
import { inviteBlock } from './invite/index.js';
import { partyBlock } from './party/index.js';
import { rsvpBlock } from './rsvp/index.js';
import { storyBlock } from './story/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CLASSIC_BLOCK_REGISTRY: Partial<Record<BlockKey, BlockDef<any>>> = {
  cover: coverBlock,
  invite: inviteBlock,
  story: storyBlock,
  album: albumBlock,
  party: partyBlock,
  rsvp: rsvpBlock,
  gift: giftBlock,
  guestbook: guestbookBlock,
};
