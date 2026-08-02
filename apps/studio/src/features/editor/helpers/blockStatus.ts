import type { BlockKey } from '@wishly/contracts';
import { getBlockDef } from '@wishly/templates';

export type BlockFillStatus =
  | 'done'
  | 'needs'
  | 'empty'
  | 'off';

const STATUS_LABEL: Record<BlockFillStatus, string> = {
  done: 'Đã xong',
  needs: 'Cần điền',
  empty: 'Chưa có nội dung',
  off: 'Đã tắt',
};

export function blockStatusLabel(status: BlockFillStatus) {
  return STATUS_LABEL[status];
}

export function getBlockFillStatus(
  key: BlockKey,
  enabled: boolean,
  content: Record<string, unknown>
): BlockFillStatus {
  if (!enabled) return 'off';
  const def = getBlockDef(key);
  const raw = content[key];
  if (raw == null || (typeof raw === 'object' && Object.keys(raw as object).length === 0)) {
    return 'empty';
  }
  const parsed = def.schema.safeParse(raw);
  if (!parsed.success) return 'needs';

  const requiredFields = def.fields.filter((f) => f.required);
  if (requiredFields.length === 0) return 'done';
  const data = parsed.data as Record<string, unknown>;
  const missing = requiredFields.some((f) => {
    const v = data[f.name];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  return missing ? 'needs' : 'done';
}

export function countFilledParts(
  blocks: Array<{ key: string; enabled: boolean }>,
  content: Record<string, unknown>
) {
  const enabled = blocks.filter((b) => b.enabled);
  const done = enabled.filter(
    (b) => getBlockFillStatus(b.key as BlockKey, true, content) === 'done'
  );
  return { done: done.length, total: enabled.length };
}
