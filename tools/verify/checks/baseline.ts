/**
 * Folder-of-PNG byte-diff helper — the "so baseline" mechanism proposed in
 * phase-03-de-hardcode-blocks.md step 3, never actually built there (that
 * phase's Playwright steps were skipped per user request that session; see
 * that phase's Todo List). Built here in phase-05 instead, first use.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

async function hashFile(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

async function listPngFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.png'))
      .map((e) => e.name)
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export type BaselineDiff = {
  changed: string[];
  onlyInCurrent: string[];
  onlyInBaseline: string[];
};

/** Compare two folders of PNGs by content hash. Empty result = byte-identical. */
export async function compareBaselineDirs(
  currentDir: string,
  baselineDir: string
): Promise<BaselineDiff> {
  const [currentFiles, baselineFiles] = await Promise.all([
    listPngFiles(currentDir),
    listPngFiles(baselineDir),
  ]);
  const currentSet = new Set(currentFiles);
  const baselineSet = new Set(baselineFiles);

  const changed: string[] = [];
  for (const name of currentFiles) {
    if (!baselineSet.has(name)) continue;
    const [a, b] = await Promise.all([
      hashFile(path.join(currentDir, name)),
      hashFile(path.join(baselineDir, name)),
    ]);
    if (a !== b) changed.push(name);
  }

  return {
    changed,
    onlyInCurrent: currentFiles.filter((n) => !baselineSet.has(n)),
    onlyInBaseline: baselineFiles.filter((n) => !currentSet.has(n)),
  };
}

/** Copy every `*.png` from `srcDir` into `destDir` — used to freeze a new baseline. */
export async function snapshotBaseline(srcDir: string, destDir: string): Promise<number> {
  await mkdir(destDir, { recursive: true });
  const files = await listPngFiles(srcDir);
  for (const name of files) {
    await copyFile(path.join(srcDir, name), path.join(destDir, name));
  }
  return files.length;
}

/**
 * Filenames allowed to differ without failing `--compare` — sign-off list for
 * intentional visual changes (e.g. a `collapse` decision from phase-03/04).
 * Empty for now: no sign-off list exists yet because no baseline has been
 * captured this session (see phase-05 §Sandbox limitations). Populate by
 * adding `${slug}-${viewport}.png` entries when a future intentional change
 * needs one.
 */
export const BASELINE_ALLOWLIST: ReadonlySet<string> = new Set([]);

export function filterAllowlisted(diff: BaselineDiff): BaselineDiff {
  return {
    changed: diff.changed.filter((n) => !BASELINE_ALLOWLIST.has(n)),
    onlyInCurrent: diff.onlyInCurrent.filter((n) => !BASELINE_ALLOWLIST.has(n)),
    onlyInBaseline: diff.onlyInBaseline.filter((n) => !BASELINE_ALLOWLIST.has(n)),
  };
}
