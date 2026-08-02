import type { BilingualText } from '@wishly/contracts';

import type { CorpLang } from './corporate-strings.js';

/** Resolve bilingual content. Missing `en` falls back to `vi` silently. */
export function t(
  field: BilingualText | string | undefined | null,
  lang: CorpLang
): string {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  if (lang === 'en' && field.en?.trim()) return field.en;
  return field.vi ?? '';
}
