/** Dev: Vite proxy `/api` → :3001. Override with VITE_API_URL if needed. */
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
  eventDate: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ENDED';
  tier: string;
  guestLimit?: number;
  content: Record<string, unknown>;
  theme: { paletteId: string; fontId: string; overrides?: Record<string, string> };
  blocks: Array<{ key: string; enabled: boolean; order: number }>;
  brandColor?: string | null;
  ogImageKey: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  /** Populated by listMine for dashboard progress */
  guestCount?: number;
  rsvpCount?: number;
  attendingCount?: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email?: string | null;
};

export const api = {
  me: () => request<{ user: AuthUser }>('/auth/me'),
  listPlans: () =>
    request<
      Array<{
        id: string;
        name: string;
        price: number;
        priceByEvent: Record<string, number> | null;
        guestLimit: number | null;
        features: Record<string, unknown>;
        sortOrder: number;
      }>
    >('/plans'),
  createOrder: (body: {
    invitationId: string;
    planId: 'basic' | 'premium';
    provider?: 'momo' | 'bank_manual';
    discountCode?: string;
  }) =>
    request<{
      order: {
        id: string;
        invitationId: string;
        planId: string;
        tier: string;
        amount: number;
        status: string;
        shortCode: string;
        provider: string;
        paidAt: string | null;
        claimedAt: string | null;
      };
      payment: {
        method: 'bank_manual' | 'momo';
        shortCode?: string;
        amount?: number;
        bank?: {
          bin: string;
          accountNo: string;
          holder: string;
          bankName: string;
        };
        vietqrUrl?: string;
        transferContent?: string;
        payUrl?: string | null;
      };
    }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrder: (orderId: string) =>
    request<{
      id: string;
      invitationId: string;
      planId: string;
      amount: number;
      status: string;
      shortCode: string;
      paidAt: string | null;
      claimedAt: string | null;
      payment: {
        method: 'bank_manual';
        shortCode: string;
        amount: number;
        bank: {
          bin: string;
          accountNo: string;
          holder: string;
          bankName: string;
        };
        vietqrUrl: string;
        transferContent: string;
      } | null;
    }>(`/orders/${orderId}`),
  claimOrderPaid: (orderId: string) =>
    request(`/orders/${orderId}/claim-paid`, {
      method: 'POST',
      body: JSON.stringify({ claimed: true }),
    }),
  listInvitations: () => request<InvitationRecord[]>('/invitations'),
  getInvitation: (id: string) => request<InvitationRecord>(`/invitations/${id}`),
  createDraft: (body: unknown) =>
    request<InvitationRecord>('/invitations/draft', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateDraft: (id: string, body: unknown) =>
    request<InvitationRecord>(`/invitations/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  duplicate: (id: string) =>
    request<InvitationRecord>(`/invitations/${id}/duplicate`, {
      method: 'POST',
      body: '{}',
    }),
  publish: (id: string, body: { slug?: string } = {}) =>
    request<{
      id: string;
      slug: string;
      url: string;
      pageUrl?: string;
      ogImageKey?: string | null;
      publishedAt?: string | null;
    }>(`/invitations/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  presign: (body: {
    filename: string;
    contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    byteSize: number;
  }) =>
    request<{ uploadUrl: string; key: string; publicUrl?: string }>(
      '/media/presign',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listGuests: (invitationId: string) =>
    request<{
      guests: Array<{
        id: string;
        name: string;
        phone: string | null;
        group: string | null;
        note: string | null;
        token: string;
        passCode?: string | null;
        checkedInAt?: string | null;
        mealChoice?: string | null;
        allergyNote?: string | null;
        lang?: string | null;
        title?: string | null;
        tableId?: string | null;
        remindedCount?: number;
        rsvp: {
          attending: boolean;
          plusOnes: number;
          note: string | null;
          createdAt: string;
        } | null;
      }>;
      guestLimit: number;
      count: number;
      slug: string;
      eventType?: string;
      groups: string[];
    }>(`/invitations/${invitationId}/guests`),
  createGuest: (
    invitationId: string,
    body: {
      name: string;
      phone?: string | null;
      group?: string | null;
      note?: string | null;
      consentAt?: string | null;
    }
  ) =>
    request(`/invitations/${invitationId}/guests`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteGuest: (invitationId: string, guestId: string) =>
    request(`/invitations/${invitationId}/guests/${guestId}`, {
      method: 'DELETE',
    }),
  remindGuest: (invitationId: string, guestId: string) =>
    request<{
      remindedCount: number;
      lastReminder: boolean;
      text: string;
      link: string;
      messageKey: string;
    }>(`/invitations/${invitationId}/guests/${guestId}/remind`, {
      method: 'POST',
    }),
  importGuests: (
    invitationId: string,
    body: { text: string; consentAccepted: true }
  ) =>
    request<{ imported: number }>(`/invitations/${invitationId}/guests/import`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  importGuestsFrom: (invitationId: string, sourceId: string) =>
    request<{ imported: number }>(
      `/invitations/${invitationId}/guests/import-from/${sourceId}`,
      { method: 'POST' }
    ),
  markBulkSent: (invitationId: string) =>
    request<{ ok: boolean }>(
      `/invitations/${invitationId}/guests/mark-bulk-sent`,
      { method: 'POST' }
    ),
  guestMessages: (
    invitationId: string,
    opts?: { group?: string; pendingOnly?: boolean }
  ) => {
    const q = new URLSearchParams();
    if (opts?.group) q.set('group', opts.group);
    if (opts?.pendingOnly) q.set('pendingOnly', '1');
    const qs = q.toString();
    return request<{
      count: number;
      hint: string;
      messages: Array<{ name: string; token: string; text: string; link: string }>;
    }>(
      `/invitations/${invitationId}/guests/messages${qs ? `?${qs}` : ''}`
    );
  },
  listGuestbook: (invitationId: string) =>
    request<
      Array<{
        id: string;
        name: string;
        message: string;
        status: string;
        createdAt: string;
      }>
    >(`/invitations/${invitationId}/guestbook`),
  moderateGuestbook: (
    invitationId: string,
    entryId: string,
    status: 'approved' | 'hidden' | 'pending'
  ) =>
    request(`/invitations/${invitationId}/guestbook/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  listGiftEntries: (invitationId: string) =>
    request<{
      entries: Array<{
        id: string;
        giverName: string;
        amount: number;
        side: string;
        note: string | null;
        receivedAt: string;
      }>;
      total: number;
      bySide: Record<string, number>;
    }>(`/invitations/${invitationId}/gift-entries`),
  createGiftEntry: (
    invitationId: string,
    body: {
      giverName: string;
      amount: number;
      side: string;
      note?: string | null;
    }
  ) =>
    request(`/invitations/${invitationId}/gift-entries`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteGiftEntry: (invitationId: string, entryId: string) =>
    request(`/invitations/${invitationId}/gift-entries/${entryId}`, {
      method: 'DELETE',
    }),
  importGiftEntries: (
    invitationId: string,
    body: {
      entries: Array<{
        giverName: string;
        amount: number;
        side: string;
        note?: string | null;
      }>;
      defaultSide?: string;
    }
  ) =>
    request<{ imported: number }>(
      `/invitations/${invitationId}/gift-entries/import`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    ),
};

export async function uploadImage(file: File): Promise<{
  key: string;
  publicUrl?: string;
}> {
  const type = file.type as
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'image/gif';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
    throw new Error('Chỉ nhận ảnh JPEG, PNG, WebP hoặc GIF.');
  }
  if (file.size > 8 * 1024 * 1024) {
    const mb = Math.round(file.size / (1024 * 1024));
    throw new Error(`Ảnh nặng ${mb} MB, vượt giới hạn 8 MB`);
  }
  const { uploadUrl, key, publicUrl } = await api.presign({
    filename: file.name,
    contentType: type,
    byteSize: file.size,
  });
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': type },
  });
  if (!put.ok) {
    throw new Error('Tải ảnh lên kho thất bại. Thử lại sau.');
  }
  return { key, publicUrl };
}
