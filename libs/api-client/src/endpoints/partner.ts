import type {
  ChangePartnerPlan,
  CreatePartnerClient,
  InviteMember,
  RegisterPartner,
  SavePartnerTemplate,
  UpdateMemberRole,
  UpdatePartnerBrand,
} from '@wishly/contracts';
import { http } from '../client';

export const partnerApi = {
  register: (body: RegisterPartner) =>
    http('/partner/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  acceptInvite: (token: string) =>
    http('/partner/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  me: () => http<{ partner: PartnerMe | null }>('/partner/me'),

  dashboard: () => http<PartnerDashboard>('/partner/dashboard'),

  clients: (params?: { status?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    const q = qs.toString();
    return http<PartnerClient[]>(`/partner/clients${q ? `?${q}` : ''}`);
  },

  createClient: (body: CreatePartnerClient) =>
    http('/partner/clients', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getBrand: () => http<PartnerBrand>('/partner/brand'),

  updateBrand: (body: UpdatePartnerBrand) =>
    http('/partner/brand', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  publicBrand: (subdomain: string) =>
    http<PublicPartnerBrand>(`/public/brand/${subdomain}`),

  members: () => http<PartnerMember[]>('/partner/members'),

  inviteMember: (body: InviteMember) =>
    http('/partner/members', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateMemberRole: (memberId: string, body: UpdateMemberRole) =>
    http(`/partner/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  removeMember: (memberId: string) =>
    http(`/partner/members/${memberId}`, { method: 'DELETE' }),

  templates: () => http<PartnerTemplatesList>('/partner/templates'),

  saveTemplate: (body: SavePartnerTemplate) =>
    http('/partner/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteTemplate: (templateId: string) =>
    http(`/partner/templates/${templateId}`, { method: 'DELETE' }),

  billing: () => http<PartnerBilling>('/partner/billing'),

  changePlan: (body: ChangePartnerPlan) =>
    http('/partner/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  markInvoicePaid: (invoiceId: string) =>
    http('/partner/billing/mark-paid', {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    }),
};

export type PartnerMe = {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  slotLimit: number;
  status: string;
  role: string;
  memberId: string;
  slotUsed: number;
  createLocked: boolean;
  brand: PartnerBrand | null;
};

export type PartnerDashboard = {
  slotUsed: number;
  slotLimit: number;
  totalClients: number;
  createdThisMonth: number;
  createdDelta: number;
  createLocked: boolean;
  chartByMonth: Array<{ month: string; count: number }>;
  chartResponseRate: Array<{ invitationId: string; rate: number }>;
};

export type PartnerClient = {
  id: string;
  slug: string;
  status: string;
  eventType: string;
  eventDate: string | null;
  clientCode: string | null;
  assignedMemberId: string | null;
  nameLeft: string;
  nameRight: string;
  guestCount: number;
  rsvpCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PartnerBrand = {
  partnerId: string;
  logoKey: string | null;
  color: string | null;
  subdomain: string | null;
  domainStatus: string;
  signature: string | null;
};

export type PublicPartnerBrand = {
  partnerName: string;
  logoKey: string | null;
  color: string | null;
  signature: string | null;
  subdomain: string | null;
  domainStatus: string;
  customDomainDeferred: boolean;
};

export type PartnerMember = {
  id: string;
  email: string;
  role: string;
  userId: string | null;
  invitedAt: string;
  joinedAt: string | null;
  lastSeenAt: string | null;
};

export type PartnerTemplatesList = {
  partner: Array<{
    id: string;
    name: string;
    eventType: string;
    thumbKey: string | null;
    useCount: number;
    createdAt: string;
    source: 'partner';
  }>;
};

export type PartnerBilling = {
  planTier: string;
  slotLimit: number;
  slotUsed: number;
  status: string;
  provider: string;
  periodStart: string | null;
  periodEnd: string | null;
  amountMonthly: number;
  invoices: Array<{
    id: string;
    code: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    status: string;
    paidAt: string | null;
  }>;
  bankManual: { method: 'bank_manual'; note: string };
};
