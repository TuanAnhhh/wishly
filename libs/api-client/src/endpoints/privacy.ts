import { http } from '../client';

export type PrivacySettings = {
  passwordProtected: boolean;
  publicGuestbook: boolean;
  hideGift: boolean;
  retentionMonths: 3 | 6 | 12;
  purgeAt: string | null;
  consentGiven: boolean;
};

export type GuestSelf = {
  name: string;
  phone: string | null;
  attending: boolean | null;
  wish: string | null;
};

export const privacyApi = {
  getSettings: (invitationId: string) =>
    http<PrivacySettings>(`/invitations/${invitationId}/privacy`),

  updateSettings: (
    invitationId: string,
    body: Partial<Omit<PrivacySettings, 'purgeAt'>> & { password?: string }
  ) =>
    http<PrivacySettings>(`/invitations/${invitationId}/privacy`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  renew: (invitationId: string) =>
    http<{ expiresAt: string; status: string }>(
      `/invitations/${invitationId}/renew`,
      { method: 'POST' }
    ),

  giveConsent: (invitationId: string) =>
    http<{ consentAt: string }>(`/invitations/${invitationId}/consent`, {
      method: 'POST',
    }),

  deleteEvent: (invitationId: string, confirmName: string) =>
    http<{ deleted: true }>(`/invitations/${invitationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmName }),
    }),

  guestSelf: {
    get: (token: string) => http<GuestSelf>(`/guests/public/${token}/me`),

    update: (token: string, body: { attending?: boolean; wish?: string }) =>
      http<{ ok: true }>(`/guests/public/${token}/me`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    remove: (token: string) =>
      http<{ ok: true }>(`/guests/public/${token}/me`, { method: 'DELETE' }),
  },
};

/** Not envelope-wrapped — returns a raw xlsx blob for direct download. */
export async function exportInvitationData(
  invitationId: string
): Promise<Blob> {
  const base = import.meta.env.VITE_API_URL ?? '/api';
  const res = await fetch(`${base}/invitations/${invitationId}/export`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  return res.blob();
}
