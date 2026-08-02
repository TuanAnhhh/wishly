export type FontPreset = {
  id: string;
  name: string;
  /** CSS font-family for display / names */
  display: string;
  /** CSS font-family for body */
  body: string;
  /**
   * Must pass tools/verify-template.ts before picker exposure.
   * Be Vietnam + Cormorant already used in app chrome with VN subset.
   */
  verified: boolean;
};

export const FONTS: Record<string, FontPreset> = {
  'be-cormorant': {
    id: 'be-cormorant',
    name: 'Be Vietnam + Cormorant',
    display: "'Cormorant Garamond', 'Times New Roman', serif",
    body: "'Be Vietnam Pro', system-ui, sans-serif",
    verified: true,
  },
  'be-playfair': {
    id: 'be-playfair',
    name: 'Be Vietnam + Playfair',
    display: "'Playfair Display', 'Times New Roman', serif",
    body: "'Be Vietnam Pro', system-ui, sans-serif",
    verified: true,
  },
  'be-lora': {
    id: 'be-lora',
    name: 'Be Vietnam + Lora',
    display: "'Lora', Georgia, serif",
    body: "'Be Vietnam Pro', system-ui, sans-serif",
    verified: true,
  },
  'cormorant-only': {
    id: 'cormorant-only',
    name: 'Cormorant (tiêu đề + nội dung)',
    display: "'Cormorant Garamond', 'Times New Roman', serif",
    body: "'Cormorant Garamond', 'Times New Roman', serif",
    verified: true,
  },
  'newsreader-be': {
    id: 'newsreader-be',
    name: 'Be Vietnam + Newsreader',
    display: "'Newsreader', 'Times New Roman', serif",
    body: "'Be Vietnam Pro', system-ui, sans-serif",
    verified: true,
  },
  'bricolage-be': {
    id: 'bricolage-be',
    name: 'Be Vietnam + Bricolage Grotesque',
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'Be Vietnam Pro', system-ui, sans-serif",
    verified: true,
  },
  'eb-garamond-only': {
    id: 'eb-garamond-only',
    name: 'EB Garamond (tiêu đề + nội dung)',
    display: "'EB Garamond', 'Times New Roman', serif",
    body: "'EB Garamond', 'Times New Roman', serif",
    verified: true,
  },
};

export const DEFAULT_FONT_ID = 'be-cormorant';

export function getFont(id: string): FontPreset {
  return FONTS[id] ?? FONTS[DEFAULT_FONT_ID];
}

export function listPickerFonts(): FontPreset[] {
  return Object.values(FONTS).filter((f) => f.verified);
}
