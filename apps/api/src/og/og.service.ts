import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';

export type OgCoverInput = {
  nameLeft: string;
  nameRight: string;
  dateLine: string;
  placeLine?: string;
  accent?: string;
  background?: string;
  ink?: string;
  /** placeLine color — was hardcoded '#5A4B3F' (co-ngu's exact inkMuted; wrong on other palettes, ~1.9:1 contrast on son-mai) */
  inkMuted?: string;
  /** "THIỆP VIỆT" watermark label color — was hardcoded '#8A7A6A' (close-but-wrong approximation of inkSoft) */
  inkSoft?: string;
  /** Photo plane background — was hardcoded '#E8DFD2' (a bespoke cream, not palette-aware) */
  surface?: string;
  /** CSS font-family stack, same shape as FontPreset.display / --inv-font-display */
  fontDisplay?: string;
  /** CSS font-family stack, same shape as FontPreset.body / --inv-font-body */
  fontBody?: string;
  /** `StyleTokens.displayXl` — names fontSize. Defaults to `classic` (52). */
  displayXl?: number;
  /** `StyleTokens.displayMd` — dateText fontSize. Defaults to `classic` (26). */
  displayMd?: number;
  /**
   * Full `data:image/...` URI, already resolved by the caller from
   * `ResolvedTheme.style.surfaceTexture` (`getTexture(tileId).dataUri`) —
   * this service never looks up the registry itself, matching the existing
   * "OG gets flat scalars, not the theme object" boundary (P02).
   */
  textureDataUri?: string;
  /** 0..1, only meaningful alongside `textureDataUri`. */
  textureOpacity?: number;
  /**
   * Full `data:image/svg+xml` URI, already accent-baked by the caller via
   * `motifDataUri(motif.dividerGlyph, accent)` — absent (all templates today)
   * keeps the pre-existing flat divider rectangle.
   */
  motifDividerDataUri?: string;
  /** `StyleTokens.frameShape`. Only `'rect'`/`'arch'` have real rendering
   *  logic here — matches what `archFrame.tsx` implements on the FE side;
   *  `'octagon'`/`'scallop'` are accepted but currently render as `'rect'`. */
  frameShape?: 'rect' | 'arch' | 'octagon' | 'scallop';
};

/** fontId → default resolved theme (be-cormorant), duplicated here only as the
 *  literal fallback when a caller passes no font — matches FONTS['be-cormorant']
 *  in libs/templates/src/themes/fonts.ts byte-for-byte. */
const DEFAULT_FONT_DISPLAY = "'Cormorant Garamond', 'Times New Roman', serif";
const DEFAULT_FONT_BODY = "'Be Vietnam Pro', system-ui, sans-serif";

/** "'Cormorant Garamond', 'Times New Roman', serif" → "Cormorant Garamond" */
function primaryFamily(cssFontStack: string): string {
  const match = cssFontStack.match(/^\s*['"]?([^'",]+)['"]?/);
  return (match?.[1] ?? cssFontStack).trim();
}

/**
 * Registration order for satori's `fonts` array — NOT cosmetic. Empirically
 * verified against the pre-refactor byte output: body family must come
 * first, or satori's glyph-matching silently renders some glyphs (e.g.
 * digits, "&") as empty paths with no error. Do not reorder these params.
 */
function orderedFontFamilies(bodyFamily: string, displayFamily: string): string[] {
  return Array.from(new Set([bodyFamily, displayFamily]));
}

/** `family` → the 2-name satori fallback stack (see `FONT_FILES` doc below). */
function withVnFallback(family: string): string {
  return `${family}, ${family} VN`;
}

/**
 * @fontsource ships each family as non-overlapping unicode-range subsets
 * (standard Google Fonts practice — browsers stitch multiple `@font-face`
 * rules sharing one `font-family` back together via `unicode-range`). The
 * "vietnamese" subset contains ONLY Vietnamese-specific precomposed
 * characters + combining marks — zero plain Latin letters, digits, or "&".
 * satori has no unicode-range fallback: a single registered `{name, data}`
 * entry is either used whole or not at all, and it does NOT merge coverage
 * across multiple entries sharing the same `name` (verified empirically —
 * see plans/260801-0658-template-design-families/reports/spike-00-satori-findings.md
 * §3). The fix is a genuine CSS-style fallback STACK: register the
 * "latin" file under the plain family name and the "vietnamese" file under
 * `"${family} VN"`, then reference both via a comma-separated `fontFamily`
 * (`withVnFallback`) — satori resolves per-glyph across distinctly-named
 * entries correctly, exactly like a browser's `font-family` list.
 *
 * Before this fix, `loadFontFile` loaded ONLY the vietnamese-subset file
 * (the latin fallback below only triggered on ENOENT, which never happens —
 * the vietnamese file always exists) → every plain-Latin glyph in OG output
 * silently rendered as resvg's "NO GLYPH" tofu box. Confirmed live via
 * `OgService.renderCoverPng()` with real input before this fix landed.
 *
 * Covers all presets in libs/templates/src/themes/fonts.ts so OG stays
 * correct if a template ever ships a non-default fontId. */
const FONT_FILES: Record<string, { pkg: string; weight: 400 | 500 }> = {
  'Be Vietnam Pro': { pkg: 'be-vietnam-pro', weight: 400 },
  'Cormorant Garamond': { pkg: 'cormorant-garamond', weight: 500 },
  'Playfair Display': { pkg: 'playfair-display', weight: 500 },
  Lora: { pkg: 'lora', weight: 400 },
  Newsreader: { pkg: 'newsreader', weight: 500 },
  'Bricolage Grotesque': { pkg: 'bricolage-grotesque', weight: 500 },
  'EB Garamond': { pkg: 'eb-garamond', weight: 400 },
};

// Nest webpack emits CJS — use __filename (do not shadow `require` or use import.meta).
const nodeRequire = createRequire(__filename);

function loadResvg(): new (
  svg: string | Buffer,
  options?: { fitTo?: { mode: string; value: number } }
) => { render: () => { asPng: () => Uint8Array } } {
  // Dynamic id so webpack cannot statically pull native .node bindings into the bundle.
  const pkg = ['@resvg', 'resvg-js'].join('/');
  return nodeRequire(pkg).Resvg;
}

/** Format for OG: "15.11.2026" — not relative dates (image is reshared months later). */
export function formatOgDate(dateLine: string): string {
  const iso = Date.parse(dateLine);
  if (!Number.isNaN(iso)) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  }
  // Already dotted or "15 · 11 · 2026" / "15/11/2026"
  const m = dateLine.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
  if (m) {
    return `${m[1]!.padStart(2, '0')}.${m[2]!.padStart(2, '0')}.${m[3]}`;
  }
  return dateLine;
}

@Injectable()
export class OgService {
  private readonly logger = new Logger(OgService.name);
  private readonly fontCache = new Map<string, Buffer>();

  /**
   * Layout per system-messages.md §02:
   * left ~55% text (names ~half the frame), right ~45% photo plane,
   * 40px edge inset, cream flat background (no text-over-photo).
   */
  async renderCoverPng(input: OgCoverInput): Promise<Buffer> {
    const displayFamily = primaryFamily(input.fontDisplay ?? DEFAULT_FONT_DISPLAY);
    const bodyFamily = primaryFamily(input.fontBody ?? DEFAULT_FONT_BODY);
    const fonts = await this.loadFonts(displayFamily, bodyFamily);
    // Comma-stack, not the bare family — see FONT_FILES doc: the "vietnamese"
    // subset alone is missing plain Latin/digits, satori needs the fallback
    // resolved explicitly per glyph via a 2nd, differently-named entry.
    const displayFamilyCss = withVnFallback(displayFamily);
    const bodyFamilyCss = withVnFallback(bodyFamily);
    const bg = input.background ?? '#FDFBF7';
    const ink = input.ink ?? '#2E2620';
    const accent = input.accent ?? '#B04A3A';
    const inkMuted = input.inkMuted ?? '#5A4B3F';
    const inkSoft = input.inkSoft ?? '#8A7A6A';
    const surface = input.surface ?? '#E8DFD2';
    const displayXl = input.displayXl ?? 52;
    const displayMd = input.displayMd ?? 26;
    const dateText = formatOgDate(input.dateLine);
    const frameShape = input.frameShape ?? 'rect';
    // Only 'arch' has real rendering logic (matches archFrame.tsx on FE) —
    // 'octagon'/'scallop' fall through to the 'rect' (no radius) case rather
    // than guessing an implementation ahead of a real consumer (YAGNI).
    const photoBorderRadius = frameShape === 'arch' ? '9999px 9999px 0 0' : undefined;

    // satori's own .d.ts types its param as React's ReactNode; this tree is
    // satori's plain-object pseudo-VDOM, not real JSX — cast bypasses that
    // mismatch (same `as never` idiom used for the FE block-union casts).
    const tree = {
      type: 'div',
        props: {
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: bg,
            color: ink,
            fontFamily: bodyFamilyCss,
          },
          children: [
            // Texture fill, behind both panes. Absent `textureDataUri` (every
            // template today) → no image, opacity 0 — fully inert, matches
            // the FE `BlockSection` idiom (P02). NOT using `zIndex` here —
            // satori logs "z-index is currently not supported" and ignores
            // it entirely (confirmed empirically); unlike `blocks/shared.tsx`
            // (real browser), ordering here is controlled by array position.
            input.textureDataUri
              ? {
                  type: 'div',
                  props: {
                    style: {
                      // `top/left/right/bottom`, NOT the `inset` shorthand —
                      // satori silently renders nothing with `inset: 0` here
                      // (confirmed via apps/api/tools/spike/debug-og-texture.ts:
                      // identical tree, only `inset`→explicit sides changed,
                      // blank → correct). Not a P00 regression: P00's Q5
                      // scallop test happened to use explicit sides already.
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${input.textureDataUri})`,
                      backgroundRepeat: 'repeat',
                      opacity: input.textureOpacity ?? 1,
                    },
                  },
                }
              : null,
            {
              type: 'div',
              props: {
                style: {
                  width: '55%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '40px 32px 40px 40px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontFamily: displayFamilyCss,
                        fontSize: displayXl,
                        lineHeight: 1.12,
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: displayXl },
                            children: input.nameLeft,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              // OG is a fixed 1200x630 landscape layout, not
                              // the cover's portrait composition — this "&"
                              // keeps its own independent geometric ratio
                              // (not tied to `--inv-display-lg`).
                              fontSize: 28,
                              margin: '6px 0',
                              color: accent,
                            },
                            children: '&',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: displayXl },
                            children: input.nameRight,
                          },
                        },
                      ],
                    },
                  },
                  input.motifDividerDataUri
                    ? {
                        type: 'img',
                        props: {
                          src: input.motifDividerDataUri,
                          style: { width: 64, height: 24, marginTop: 28, marginBottom: 20 },
                        },
                      }
                    : {
                        type: 'div',
                        props: {
                          style: {
                            width: 64,
                            height: 2,
                            backgroundColor: accent,
                            marginTop: 28,
                            marginBottom: 20,
                          },
                        },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: displayMd,
                        letterSpacing: 1,
                        fontFamily: bodyFamilyCss,
                      },
                      children: dateText,
                    },
                  },
                  input.placeLine
                    ? {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20,
                            marginTop: 10,
                            color: inkMuted,
                          },
                          children: input.placeLine,
                        },
                      }
                    : null,
                ].filter(Boolean),
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  width: '45%',
                  height: '100%',
                  display: 'flex',
                  padding: '40px 40px 40px 16px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: '100%',
                        height: '100%',
                        backgroundColor: surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: inkSoft,
                        fontSize: 18,
                        letterSpacing: 4,
                        // Spread, NOT `borderRadius: photoBorderRadius` — satori@0.18.4's
                        // style expander does `for (const key in style)` and crashes with
                        // "Cannot read properties of undefined (reading 'trim')" the moment
                        // it iterates a key whose VALUE is `undefined` (confirmed via an
                        // isolated repro: an explicit `borderRadius: undefined` key throws,
                        // omitting the key entirely does not). `photoBorderRadius` is
                        // `undefined` for every style except `frameShape: 'arch'` — i.e. this
                        // crashed `renderCoverPng()` (and therefore `publish()`, which awaits
                        // it with no try/catch) for every template using `classic`/`minimal`/
                        // `soft`/the 3 new wave-1 styles. Discovered during
                        // plans/260801-0658-template-design-families phase-05 OG spot-check;
                        // fixed here since it blocks real publishing, not just this phase.
                        ...(photoBorderRadius ? { borderRadius: photoBorderRadius } : {}),
                      },
                      children: 'THIỆP VIỆT',
                    },
                  },
                ],
              },
            },
          ].filter(Boolean),
        },
    };

    const svg = await satori(tree as never, {
      width: 1200,
      height: 630,
      fonts,
    });

    const Resvg = loadResvg();
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    return Buffer.from(resvg.render().asPng());
  }

  /** One subset file for `family`, cached by `${family}:${subset}` — a single
   *  `family` key would collide once we load both "latin" and "vietnamese"
   *  for the same family (see FONT_FILES doc). */
  private async loadFontSubset(
    family: string,
    subset: 'latin' | 'vietnamese'
  ): Promise<Buffer> {
    const cacheKey = `${family}:${subset}`;
    const cached = this.fontCache.get(cacheKey);
    if (cached) return cached;

    const entry = FONT_FILES[family] ?? FONT_FILES['Be Vietnam Pro']!;
    const pkgRoot = dirname(
      nodeRequire.resolve(`@fontsource/${entry.pkg}/package.json`)
    );
    const buf = await readFile(
      join(pkgRoot, `files/${entry.pkg}-${subset}-${entry.weight}-normal.woff`)
    );
    this.fontCache.set(cacheKey, buf);
    return buf;
  }

  /** Both subset buffers for `family`, registered under two distinct satori
   *  font names (`family` = latin, `${family} VN` = vietnamese) — see
   *  `withVnFallback` / FONT_FILES doc for why a single shared name doesn't
   *  work. Missing one subset degrades to just the other rather than
   *  throwing — better a partial glyph set than no OG image at all. */
  private async loadFontFamily(family: string) {
    const weight = (FONT_FILES[family] ?? FONT_FILES['Be Vietnam Pro']!).weight;
    const [latin, vietnamese] = await Promise.allSettled([
      this.loadFontSubset(family, 'latin'),
      this.loadFontSubset(family, 'vietnamese'),
    ]);
    const entries: { name: string; data: Buffer; weight: 400 | 500; style: 'normal' }[] = [];
    if (latin.status === 'fulfilled') {
      entries.push({ name: family, data: latin.value, weight, style: 'normal' });
    } else {
      this.logger.warn(`Không load được font "${family}" (latin subset): ${latin.reason}`);
    }
    if (vietnamese.status === 'fulfilled') {
      entries.push({ name: `${family} VN`, data: vietnamese.value, weight, style: 'normal' });
    } else {
      this.logger.warn(`Không load được font "${family}" (vietnamese subset): ${vietnamese.reason}`);
    }
    return entries;
  }

  private async loadFonts(displayFamily: string, bodyFamily: string) {
    const families = orderedFontFamilies(bodyFamily, displayFamily);
    const groups = await Promise.all(
      families.map((family) => this.loadFontFamily(family))
    );
    return groups.flat();
  }
}
