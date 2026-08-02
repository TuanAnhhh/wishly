const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let message = 'Không thực hiện được thao tác. Thử lại sau.';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(' ');
      else if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type PublicInvitation = {
  id?: string;
  slug: string;
  eventType: string;
  tier?: 'FREE' | 'BASIC' | 'PREMIUM';
  content: Record<string, unknown>;
  theme: { paletteId: string; fontId: string };
  blocks: Array<{ key: string; enabled: boolean; order: number }>;
  brandColor?: string | null;
  partnerBrand?: {
    color: string | null;
    signature: string | null;
    logoKey: string | null;
    partnerName: string;
  } | null;
  ogImageKey: string | null;
  publishedAt: string | null;
  expiresAt?: string | null;
  ended?: boolean;
  eventDate?: string | null;
};

export type PlanRecord = {
  id: string;
  name: string;
  price: number;
  priceByEvent: Record<string, number> | null;
  guestLimit: number | null;
  features: Record<string, unknown>;
  sortOrder: number;
};

export type InvitationRecord = {
  id: string;
  slug: string;
  templateId: string;
  eventType: 'WEDDING' | 'BIRTHDAY' | 'BABY_MONTH' | 'CORPORATE';
  status: string;
  content: Record<string, unknown>;
  theme: { paletteId: string; fontId: string };
  blocks: Array<{ key: string; enabled: boolean; order: number }>;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type GuestByToken = {
  guest: {
    name: string;
    token: string;
    group: string | null;
    attending: boolean | null;
    passCode?: string | null;
    tableLabel?: string | null;
    mealChoice?: string | null;
    lang?: string | null;
  };
  invitation: {
    id: string;
    slug: string;
    eventType: string;
    tier?: 'FREE' | 'BASIC' | 'PREMIUM';
    content: Record<string, unknown>;
    theme: { paletteId: string; fontId: string };
    blocks: Array<{ key: string; enabled: boolean; order: number }>;
    brandColor?: string | null;
    ogImageKey: string | null;
    publishedAt: string | null;
    expiresAt?: string | null;
    ended?: boolean;
  };
};

export const api = {
  fetchPublicInvitation: (slug: string) =>
    request<PublicInvitation>(`/invitations/public/${slug}`),
  listPlans: () => request<PlanRecord[]>('/plans'),
  createDraft: (body: unknown) =>
    request<InvitationRecord>('/invitations/draft', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  claim: (invitationIds?: string[]) =>
    request<{ claimed: number }>('/invitations/claim', {
      method: 'POST',
      body: JSON.stringify(
        invitationIds?.length ? { invitationIds } : {}
      ),
    }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  devLogin: () =>
    request<{ user: AuthUser }>('/auth/dev-login', { method: 'POST' }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  getGuestByToken: (token: string) =>
    request<GuestByToken>(`/guests/public/${token}`),
  submitRsvp: (body: {
    invitationId: string;
    guestToken?: string;
    name: string;
    attending: boolean;
    plusOnes?: number;
    note?: string | null;
    mealChoice?: 'standard' | 'vegetarian' | null;
    allergyNote?: string | null;
    lang?: 'vi' | 'en' | null;
  }) =>
    request<{ id: string; message: string }>('/public/rsvp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  submitGuestbook: (body: {
    invitationId: string;
    name: string;
    message: string;
  }) =>
    request<{ id: string; message: string }>('/public/guestbook', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listPublicWishes: (invitationId: string) =>
    request<Array<{ name: string; text: string; time?: string }>>(
      `/public/invitations/${invitationId}/wishes`
    ),
};

/** @deprecated use api.fetchPublicInvitation */
export async function fetchPublicInvitation(
  slug: string
): Promise<PublicInvitation> {
  return api.fetchPublicInvitation(slug);
}

export function googleAuthUrl(returnTo: string): string {
  const base = API_BASE.startsWith('http')
    ? API_BASE
    : `${window.location.origin}${API_BASE}`;
  return `${base}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
}

export function studioEditUrl(invitationId: string): string {
  const base = (
    import.meta.env.VITE_STUDIO_URL ?? 'http://localhost:4201'
  ).replace(/\/$/, '');
  return `${base}/edit/${invitationId}`;
}

export function formatVnd(amount: number): string {
  if (amount <= 0) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}
