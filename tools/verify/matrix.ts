import {
  FONTS,
  listTemplates,
  STYLES,
  VERIFY_VIEWPORTS,
  type TemplateDefinition,
} from '../../libs/templates/src/index.js';
import {
  COVER_VARIANT_IDS,
  DEFAULT_COVER_VARIANT,
} from '../../libs/templates/src/blocks/cover/variants.js';

export type VerifyCase = {
  /** Unique key — also the screenshot filename stem (`${id}-${viewport}.png` is written by the caller). */
  id: string;
  kind: 'template' | 'style' | 'variant' | 'font';
  slug: string;
  styleId?: string;
  variant?: string;
  fontId?: string;
  eventType: TemplateDefinition['meta']['eventType'];
  viewport: number;
};

/** `presetId` — a styleId or fontId, whichever preset kind was skipped. */
export type SkippedPreset = { presetId: string; reason: string };

/**
 * Linear matrix, NOT cartesian — 3 independent loops summed, never multiplied:
 *   A: every real template (its own config) × viewport             — 14 × 3
 *   B: every `verified` styleId × 1 representative template/eventType × viewport
 *   C: every cover variant (excl. default, already covered by A) × 1 representative template × viewport
 * See phase-05-extend-verify-gate.md §Architecture.
 */
export function buildMatrix(templates: TemplateDefinition[] = listTemplates()): {
  cases: VerifyCase[];
  skipped: SkippedPreset[];
} {
  const cases: VerifyCase[] = [];
  const skipped: SkippedPreset[] = [];

  // Loop A
  for (const tpl of templates) {
    for (const viewport of VERIFY_VIEWPORTS) {
      cases.push({
        id: `${tpl.meta.slug}-${viewport}`,
        kind: 'template',
        slug: tpl.meta.slug,
        eventType: tpl.meta.eventType,
        viewport,
      });
    }
  }

  // Loop B — 1 representative template per real eventType present in the registry.
  const representativeByEventType = new Map<string, TemplateDefinition>();
  for (const tpl of templates) {
    if (!representativeByEventType.has(tpl.meta.eventType)) {
      representativeByEventType.set(tpl.meta.eventType, tpl);
    }
  }
  for (const style of Object.values(STYLES)) {
    if (!style.verified) {
      skipped.push({
        presetId: style.id,
        reason: 'verified: false in themes/styles.ts — skip, not fail (see listPickerStyles())',
      });
      continue;
    }
    for (const tpl of representativeByEventType.values()) {
      for (const viewport of VERIFY_VIEWPORTS) {
        cases.push({
          id: `style-${style.id}-${tpl.meta.slug}-${viewport}`,
          kind: 'style',
          slug: tpl.meta.slug,
          styleId: style.id,
          eventType: tpl.meta.eventType,
          viewport,
        });
      }
    }
  }

  // Loop C — 1 representative template (flagship WEDDING default), every
  // non-default cover variant (the default is already exercised by Loop A).
  const variantRepresentative =
    templates.find((t) => t.meta.slug === 'co-ngu') ?? templates[0];
  if (variantRepresentative) {
    for (const variant of COVER_VARIANT_IDS) {
      if (variant === DEFAULT_COVER_VARIANT) continue;
      for (const viewport of VERIFY_VIEWPORTS) {
        cases.push({
          id: `variant-${variant}-${variantRepresentative.meta.slug}-${viewport}`,
          kind: 'variant',
          slug: variantRepresentative.meta.slug,
          variant,
          eventType: variantRepresentative.meta.eventType,
          viewport,
        });
      }
    }
  }

  // Loop D — same shape as Loop B: 1 representative template per real
  // eventType, every `verified` fontId (see phase-01-font-gate-expansion.md).
  for (const font of Object.values(FONTS)) {
    if (!font.verified) {
      skipped.push({
        presetId: font.id,
        reason: 'verified: false in themes/fonts.ts — skip, not fail (see listPickerFonts())',
      });
      continue;
    }
    for (const tpl of representativeByEventType.values()) {
      for (const viewport of VERIFY_VIEWPORTS) {
        cases.push({
          id: `font-${font.id}-${tpl.meta.slug}-${viewport}`,
          kind: 'font',
          slug: tpl.meta.slug,
          fontId: font.id,
          eventType: tpl.meta.eventType,
          viewport,
        });
      }
    }
  }

  return { cases, skipped };
}
