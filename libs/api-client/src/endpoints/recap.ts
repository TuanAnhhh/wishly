import type { UpdateRecapPrivacy } from '@wishly/contracts';
import { http } from '../client';

export type RecapPayload = {
  title: string;
  slug: string;
  eventDate: string | null;
  shareToken: string | null;
  showGiftOnRecap: boolean;
  stats: {
    attended: number;
    wishes: number;
    photos: number;
    giftCount: number;
    giftTotal: number | null;
    views: number;
  };
  wishSamples: Array<{ name: string; text: string }>;
  photos: Array<{ id: string; url: string; uploaderName: string }>;
  albumSlug: string;
  upsell: {
    anniversary: boolean;
    babyMonth: boolean;
    birthday: boolean;
    openingSoon: boolean;
  };
};

export const recapApi = {
  getOwner: (invitationId: string) =>
    http<RecapPayload>(`/invitations/${invitationId}/recap`),

  getPublic: (shareToken: string) =>
    http<RecapPayload>(`/public/recap/${shareToken}`),

  updatePrivacy: (invitationId: string, body: UpdateRecapPrivacy) =>
    http<{ showGiftOnRecap: boolean; recapToken: string | null }>(
      `/invitations/${invitationId}/recap/privacy`,
      { method: 'PATCH', body: JSON.stringify(body) }
    ),
};
