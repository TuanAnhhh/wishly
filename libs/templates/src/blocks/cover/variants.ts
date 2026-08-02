/**
 * Allowed `variant` ids for the `cover` block — single source of truth for
 * both the render-time switch (`Cover.tsx`) and the parse-time guard
 * (`data-template.ts`). Kept React-free so `parseDataTemplate` (server-side
 * partner-template validation) never has to import block component code —
 * corporate blocks (agenda/practical/entry-pass) are intentionally code-split
 * in `InvitationRenderer` to keep classic-only bundles lean, and this file
 * must not undo that by pulling a component tree in just for an id list.
 */
export const COVER_VARIANT_IDS = ['photo-full', 'arch-frame', 'split'] as const;

export type CoverVariantId = (typeof COVER_VARIANT_IDS)[number];

export const DEFAULT_COVER_VARIANT: CoverVariantId = 'photo-full';
