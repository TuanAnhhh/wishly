import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BlockKey } from '@wishly/contracts';
import type { InvitationRecord } from '../../../lib/api';

export type EditorBlock = { key: string; enabled: boolean; order: number };

export type EditorTheme = {
  paletteId: string;
  fontId: string;
  overrides?: Record<string, string>;
};

/** Exactly what `PATCH /invitations/:id/draft` accepts. */
export type EditorDraftPayload = {
  content: Record<string, unknown>;
  theme: EditorTheme;
  blocks: EditorBlock[];
  slug: string;
  brandColor?: string | null;
};

type EditorState = {
  invitationId: string | null;
  eventType: InvitationRecord['eventType'] | null;
  /**
   * Bumped by every action that changes the saved draft, never by hydration or
   * by UI-only actions. Autosave watches this instead of diffing the draft.
   */
  revision: number;
  content: Record<string, unknown>;
  theme: EditorTheme;
  blocks: EditorBlock[];
  slug: string;
  brandColor: string | null;
  activeKey: BlockKey;
  wide: boolean;
  previewOpen: boolean;
  previewLang: 'vi' | 'en';
};

type EditorActions = {
  hydrate: (record: InvitationRecord) => void;
  reset: () => void;
  setSlug: (slug: string) => void;
  setBrandColor: (hex: string | null) => void;
  patchActiveBlock: (next: Record<string, unknown>) => void;
  toggleBlock: (key: BlockKey, enabled: boolean) => void;
  reorderBlocks: (orderedKeys: BlockKey[]) => void;
  setActiveKey: (key: BlockKey) => void;
  toggleWide: () => void;
  setPreviewOpen: (open: boolean) => void;
  setPreviewLang: (lang: 'vi' | 'en') => void;
};

export type EditorStore = EditorState & EditorActions;

const CORPORATE_BRAND_FALLBACK = '#1F4E5F';

const INITIAL_STATE: EditorState = {
  invitationId: null,
  eventType: null,
  revision: 0,
  content: { version: 1 },
  theme: { paletteId: 'co-ngu', fontId: 'be-cormorant' },
  blocks: [],
  slug: '',
  brandColor: CORPORATE_BRAND_FALLBACK,
  activeKey: 'cover',
  wide: false,
  previewOpen: false,
  previewLang: 'vi',
};

function firstEnabledKey(blocks: EditorBlock[]): BlockKey | null {
  const first = [...blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order)[0];
  return first ? (first.key as BlockKey) : null;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,

      hydrate: (record) => {
        // A refetch (e.g. after publish) must not overwrite unsaved edits.
        if (get().invitationId === record.id) return;
        set(
          {
            invitationId: record.id,
            eventType: record.eventType,
            revision: 0,
            content: record.content,
            theme: record.theme,
            blocks: record.blocks,
            slug: record.slug,
            brandColor:
              record.brandColor ??
              (record.eventType === 'CORPORATE'
                ? CORPORATE_BRAND_FALLBACK
                : null),
            activeKey: firstEnabledKey(record.blocks) ?? INITIAL_STATE.activeKey,
          },
          false,
          'hydrate'
        );
      },

      reset: () => set(INITIAL_STATE, false, 'reset'),

      setSlug: (slug) =>
        set((s) => ({ slug, revision: s.revision + 1 }), false, 'setSlug'),

      setBrandColor: (hex) =>
        set(
          (s) => ({ brandColor: hex, revision: s.revision + 1 }),
          false,
          'setBrandColor'
        ),

      patchActiveBlock: (next) =>
        set(
          (s) => ({
            content: { ...s.content, version: 1, [s.activeKey]: next },
            revision: s.revision + 1,
          }),
          false,
          'patchActiveBlock'
        ),

      toggleBlock: (key, enabled) =>
        set(
          (s) => ({
            blocks: s.blocks.map((b) => (b.key === key ? { ...b, enabled } : b)),
            revision: s.revision + 1,
          }),
          false,
          'toggleBlock'
        ),

      reorderBlocks: (orderedKeys) =>
        set(
          (s) => {
            const byKey = new Map(s.blocks.map((b) => [b.key, b]));
            return {
              blocks: orderedKeys.map((key, order) => {
                const row = byKey.get(key);
                return row ? { ...row, order } : { key, enabled: true, order };
              }),
              revision: s.revision + 1,
            };
          },
          false,
          'reorderBlocks'
        ),

      setActiveKey: (activeKey) => set({ activeKey }, false, 'setActiveKey'),

      toggleWide: () => set((s) => ({ wide: !s.wide }), false, 'toggleWide'),

      setPreviewOpen: (previewOpen) =>
        set({ previewOpen }, false, 'setPreviewOpen'),

      setPreviewLang: (previewLang) =>
        set({ previewLang }, false, 'setPreviewLang'),
    }),
    { name: 'wishly:editor', enabled: import.meta.env.DEV }
  )
);

/** `brandColor` is only part of the draft for corporate invitations. */
export function selectDraftPayload(state: EditorState): EditorDraftPayload {
  return {
    content: state.content,
    theme: state.theme,
    blocks: state.blocks,
    slug: state.slug,
    ...(state.eventType === 'CORPORATE'
      ? { brandColor: state.brandColor }
      : {}),
  };
}
