/**
 * Single source of truth for TanStack Query keys.
 * P01-P06 legacy screens also use these when wrapped in useQuery
 * (transport may still be apps lib/api — non-envelope).
 */
export const queryKeys = {
  invitations: {
    mine: () => ['invitations', 'mine'] as const,
    one: (id: string) => ['invitations', id] as const,
  },
  guests: {
    list: (invitationId: string) => ['guests', invitationId] as const,
    guestbook: (invitationId: string) =>
      ['guests', invitationId, 'guestbook'] as const,
    gifts: (invitationId: string) => ['guests', invitationId, 'gifts'] as const,
  },
  plans: () => ['plans'] as const,
  orders: {
    one: (id: string) => ['orders', id] as const,
  },
  public: {
    invitation: (slug: string) => ['public', 'invitation', slug] as const,
    guestToken: (token: string) => ['public', 'guest', token] as const,
  },
  privacy: {
    settings: (invitationId: string) =>
      ['privacy', invitationId, 'settings'] as const,
    guestSelf: (token: string) => ['privacy', 'guest', token] as const,
  },
  seating: (invitationId: string) => ['seating', invitationId] as const,
  checkin: {
    roster: (invitationId: string) =>
      ['checkin', 'roster', invitationId] as const,
    staff: (invitationId: string) => ['checkin', 'staff', invitationId] as const,
  },
  album: {
    public: (slug: string) => ['album', 'public', slug] as const,
    owner: (invitationId: string) => ['album', 'owner', invitationId] as const,
  },
  thanks: (invitationId: string) => ['thanks', invitationId] as const,
  recap: {
    owner: (invitationId: string) => ['recap', invitationId] as const,
    public: (token: string) => ['recap', 'public', token] as const,
  },
  partner: {
    me: () => ['partner', 'me'] as const,
    dashboard: (partnerId?: string) =>
      ['partner', partnerId ?? 'current', 'dashboard'] as const,
    clients: (partnerId?: string, filters?: { status?: string; q?: string }) =>
      ['partner', partnerId ?? 'current', 'clients', filters ?? {}] as const,
    brand: (partnerId?: string) =>
      ['partner', partnerId ?? 'current', 'brand'] as const,
    members: (partnerId?: string) =>
      ['partner', partnerId ?? 'current', 'members'] as const,
    templates: (partnerId?: string) =>
      ['partner', partnerId ?? 'current', 'templates'] as const,
    billing: (partnerId?: string) =>
      ['partner', partnerId ?? 'current', 'billing'] as const,
    publicBrand: (subdomain: string) =>
      ['partner', 'public', subdomain] as const,
  },
} as const;
