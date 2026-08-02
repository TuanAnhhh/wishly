export type ThankYouPersona = 'gift' | 'came' | 'absent' | 'quiet';

export type PersonaInput = {
  hasGift: boolean;
  attending: boolean | null | undefined;
  /** Manual override from owner */
  override?: ThankYouPersona | null;
};

/**
 * Computed thank-you persona — no DB column required.
 * Priority: override → gift → came → absent → quiet.
 */
export function computePersona(g: PersonaInput): ThankYouPersona {
  if (g.override) return g.override;
  if (g.hasGift) return 'gift';
  if (g.attending === true) return 'came';
  if (g.attending === false) return 'absent';
  return 'quiet';
}

export const PERSONA_LABELS: Record<ThankYouPersona, string> = {
  gift: 'Có tiền mừng',
  came: 'Đã đến',
  absent: 'Báo vắng',
  quiet: 'Chưa phản hồi',
};
