import { CORPORATE_BLOCK_ORDER, DEFAULT_BLOCK_ORDER } from '@wishly/contracts';

import { DESIGN_FAMILIES, type DesignFamily } from './families.js';
import { EVENT_PRESETS, type EventPreset } from './event-presets.js';
import type { TemplateDefinition } from './types.js';

type EventType = TemplateDefinition['meta']['eventType'];

/** Sort by event type first, family second — matches how a user actually
 *  arrives (from an event-type landing page), see plan.md §Unresolved 4. */
const EVENT_TYPE_ORDER: EventType[] = ['WEDDING', 'BIRTHDAY', 'BABY_MONTH', 'CORPORATE'];

/**
 * The one place that knows how to combine a `DesignFamily` (theme + which
 * events it's offered for) with an `EventPreset` (block set + demo content)
 * into a full `TemplateDefinition` — replaces the 14 near-identical
 * per-template files this registry used to import directly (P03).
 */
function composeTemplate(family: DesignFamily, preset: EventPreset): TemplateDefinition {
  const blockOrder = preset.eventType === 'CORPORATE' ? CORPORATE_BLOCK_ORDER : DEFAULT_BLOCK_ORDER;
  const blocks = blockOrder.map((b) => ({
    ...b,
    enabled: preset.enabledBlocks.includes(b.key),
    ...(b.key === 'cover' && family.coverVariant ? { variant: family.coverVariant } : {}),
  }));

  return {
    meta: {
      id: `tpl_${family.id.replaceAll('-', '_')}_${preset.eventType.toLowerCase()}`,
      slug: `${family.id}-${preset.slugSuffix}`,
      name: `${family.name} · ${preset.name}`,
      eventType: preset.eventType,
      tier: family.tier,
      description: family.description,
      thumbKey: `templates/${family.id}-${preset.slugSuffix}/thumb.jpg`,
      sortOrder: EVENT_TYPE_ORDER.indexOf(preset.eventType) * 100 + family.sortOrder,
    },
    theme: family.theme,
    blocks,
    content: preset.content,
  };
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = DESIGN_FAMILIES.flatMap((family) =>
  family.eventTypes.map((eventType) => composeTemplate(family, EVENT_PRESETS[eventType]))
).sort((a, b) => a.meta.sortOrder - b.meta.sortOrder);

export function getTemplate(idOrSlug: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find(
    (t) => t.meta.id === idOrSlug || t.meta.slug === idOrSlug
  );
}

export function listTemplates(opts?: {
  eventType?: TemplateDefinition['meta']['eventType'];
}): TemplateDefinition[] {
  if (!opts?.eventType) return TEMPLATE_REGISTRY;
  return TEMPLATE_REGISTRY.filter((t) => t.meta.eventType === opts.eventType);
}
