import { z } from 'zod';

export const ThankYouPersonaSchema = z.enum([
  'gift',
  'came',
  'absent',
  'quiet',
]);

export const OverridePersonaSchema = z.object({
  persona: ThankYouPersonaSchema,
});
export type OverridePersona = z.infer<typeof OverridePersonaSchema>;

export const MarkThanksSentSchema = z.object({
  guestIds: z.array(z.string().min(1)).min(1).max(500),
});
export type MarkThanksSent = z.infer<typeof MarkThanksSentSchema>;

export const UpdateRecapPrivacySchema = z.object({
  showGiftOnRecap: z.boolean(),
});
export type UpdateRecapPrivacy = z.infer<typeof UpdateRecapPrivacySchema>;
