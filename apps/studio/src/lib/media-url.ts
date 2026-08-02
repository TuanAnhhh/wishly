const PUBLIC =
  import.meta.env.VITE_S3_PUBLIC_URL?.replace(/\/$/, '') ??
  'http://localhost:9000/wishly';

export function resolveMediaUrl(key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://')) return key;
  return `${PUBLIC}/${key}`;
}
