import { DataTemplateSchema, type DataTemplate } from '@wishly/contracts';

const MEDIA_FIELD_HINTS = /mediaKey|MediaKey|coverMediaKey|mapMediaKey|qrMediaKey/;

/** Node-safe parse — mirrors libs/templates data-template without React deps. */
export function parseDataTemplate(raw: unknown): DataTemplate {
  return DataTemplateSchema.parse(raw);
}

export function stripPersonalContent(
  content: Record<string, unknown>
): Record<string, unknown> {
  const next = structuredClone(content) as Record<string, unknown>;
  stripMediaDeep(next);
  const cover = next.cover as Record<string, unknown> | undefined;
  if (cover) {
    cover.nameLeft = 'Cô dâu';
    cover.nameRight = 'Chú rể';
    cover.guestLabel = 'Kính gửi';
    delete cover.coverMediaKey;
  }
  const invite = next.invite as Record<string, unknown> | undefined;
  if (invite && typeof invite.body === 'string') {
    invite.body = 'Nội dung lời mời mẫu — chỉnh lại cho từng cặp đôi.';
  }
  return next;
}

function stripMediaDeep(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) stripMediaDeep(item);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (MEDIA_FIELD_HINTS.test(k)) {
      obj[k] = null;
    } else {
      stripMediaDeep(v);
    }
  }
}
