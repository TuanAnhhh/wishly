/** Last name part for greetings and the header avatar. Falls back to "bạn". */
export function greetNameFrom(name: string | null | undefined) {
  const raw = name?.trim();
  if (!raw) return 'bạn';
  return raw.split(/\s+/).pop() || raw;
}
