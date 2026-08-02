const PASSCODE_RE = /^[A-Z]{2}-\d{4}-\d{4}$/;

/** Prefix from invitation slug — 2 letters A–Z. */
export function passCodePrefix(slug: string): string {
  const letters = slug
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);
  return (letters + 'VP').slice(0, 2);
}

export function formatPassCode(
  prefix: string,
  year: number,
  seq: number
): string {
  const p = prefix.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2).padEnd(2, 'V');
  return `${p}-${year}-${String(seq).padStart(4, '0')}`;
}

export function isValidPassCode(code: string): boolean {
  return PASSCODE_RE.test(code.trim().toUpperCase());
}

export function normalizePassCode(code: string): string {
  return code.trim().toUpperCase();
}
