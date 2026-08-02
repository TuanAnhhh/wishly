import type { MarkThanksSent, OverridePersona } from '@wishly/contracts';
import { http } from '../client';

export type ThanksRecipient = {
  guestId: string;
  name: string;
  group: string | null;
  persona: 'gift' | 'came' | 'absent' | 'quiet';
  personaLabel: string;
  preview: string;
  sentAt: string | null;
};

export const thanksApi = {
  recipients: (invitationId: string) =>
    http<{
      recipients: ThanksRecipient[];
      counts: Record<string, number>;
    }>(`/invitations/${invitationId}/thanks/recipients`),

  override: (
    invitationId: string,
    guestId: string,
    body: OverridePersona
  ) =>
    http(`/invitations/${invitationId}/thanks/recipients/${guestId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  markSent: (invitationId: string, body: MarkThanksSent) =>
    http<{ marked: number }>(
      `/invitations/${invitationId}/thanks/mark-sent`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
};
