import type { PaletteTokens } from './palettes.js';
import { getPalette } from './palettes.js';

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isValidBrandHex(color: string): boolean {
  return HEX.test(color.trim());
}

function parseRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function channelLum(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseRgb(hex);
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Darken until contrast vs white reaches AA (4.5:1), or black if still failing. */
export function ensureAccentContrast(brandColor: string): {
  accent: string;
  onAccent: string;
  adjusted: boolean;
} {
  let accent = brandColor.trim();
  if (!isValidBrandHex(accent)) {
    accent = '#1F4E5F';
  }
  let [r, g, b] = parseRgb(accent);
  let adjusted = false;
  for (let i = 0; i < 24; i++) {
    const hex = toHex(r, g, b);
    const white = contrastRatio(hex, '#FFFFFF');
    const black = contrastRatio(hex, '#2E2620');
    if (white >= 4.5) {
      return { accent: hex, onAccent: '#FFFFFF', adjusted };
    }
    if (black >= 4.5 && white < 3) {
      return { accent: hex, onAccent: '#2E2620', adjusted };
    }
    r *= 0.88;
    g *= 0.88;
    b *= 0.88;
    adjusted = true;
  }
  return { accent: toHex(r, g, b), onAccent: '#FFFFFF', adjusted: true };
}

/**
 * Derive corporate palette from free-form brandColor.
 * Cream bg stays (Thiệp Việt identity); accent comes from brand.
 */
export function derivePalette(brandColor: string): PaletteTokens & {
  adjusted: boolean;
  onAccent: string;
} {
  const base = getPalette('giay-trang');
  const { accent, onAccent, adjusted } = ensureAccentContrast(brandColor);
  const soft = mixHex(accent, base.bg, 0.88);
  return {
    ...base,
    id: 'brand',
    name: 'Thương hiệu',
    accent,
    accentSoft: soft,
    darkBg: accent,
    darkInk: onAccent,
    adjusted,
    onAccent,
  };
}

function mixHex(a: string, b: string, weightB: number): string {
  const [ar, ag, ab] = parseRgb(a);
  const [br, bg, bb] = parseRgb(b);
  const w = Math.max(0, Math.min(1, weightB));
  return toHex(
    ar * (1 - w) + br * w,
    ag * (1 - w) + bg * w,
    ab * (1 - w) + bb * w
  );
}
