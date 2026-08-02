/**
 * Phase 08 wave-2 manual check — same pattern as render-wave1-og.ts (P05),
 * for the 3 new families. Not part of the committed deliverable.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getTemplate, resolveTheme } from '../../../../libs/templates/src/index.js';
import { getMotif, motifDataUri } from '../../../../libs/templates/src/themes/motifs.js';
import { getTexture } from '../../../../libs/templates/src/themes/textures.js';
import { OgService } from '../../src/og/og.service.js';

async function main() {
  const svc = new OgService();
  const out = join(process.cwd(), 'artifacts', 'templates', 'p08-check');
  await mkdir(out, { recursive: true });

  const slugs = ['lua-cuoi', 'sen-truc-cuoi', 'son-mai-cuoi'];
  for (const slug of slugs) {
    const tpl = getTemplate(slug);
    if (!tpl) throw new Error(`template not found: ${slug}`);
    const resolved = resolveTheme(tpl.theme);
    const { palette, font, style } = resolved;
    const texture =
      style.surfaceTexture && 'tileId' in style.surfaceTexture
        ? getTexture(style.surfaceTexture.tileId)
        : null;
    const motif = getMotif(style.motifSetId ?? 'no-motif');
    const cover = (tpl.content as { cover?: Record<string, unknown> }).cover ?? {};

    const png = await svc.renderCoverPng({
      nameLeft: (cover.nameLeft as string) ?? 'Nguyễn Thị Hương',
      nameRight: (cover.nameRight as string) ?? 'Đỗ Quốc Huy',
      dateLine: (cover.dateLine as string) ?? '2026-11-15',
      placeLine: cover.placeLine as string | undefined,
      accent: palette.accent,
      background: palette.bg,
      ink: palette.ink,
      inkMuted: palette.inkMuted,
      inkSoft: palette.inkSoft,
      surface: palette.surface,
      fontDisplay: font.display,
      fontBody: font.body,
      displayXl: style.displayXl,
      displayMd: style.displayMd,
      textureDataUri: texture?.dataUri || undefined,
      textureOpacity:
        style.surfaceTexture && 'tileId' in style.surfaceTexture
          ? style.surfaceTexture.opacity
          : undefined,
      motifDividerDataUri: motif.dividerGlyph
        ? motifDataUri(motif.dividerGlyph, palette.accent)
        : undefined,
      frameShape: style.frameShape,
    });
    const file = join(out, `${slug}-og.png`);
    await writeFile(file, png);
    console.log(`wrote ${file}, bytes=${png.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
