import { z } from 'zod';

import { EventTypeSchema } from './invitation.js';
import {
  BlockConfigSchema,
  DraftInvitationContentSchema,
  ThemeConfigSchema,
} from './invitation-content.js';

export const PartnerRoleSchema = z.enum(['admin', 'edit', 'view']);
export type PartnerRole = z.infer<typeof PartnerRoleSchema>;

export const PartnerPlanTier = {
  studio: { slotLimit: 20, amountMonthly: 990_000, label: 'Studio' },
  agency: { slotLimit: 50, amountMonthly: 2_490_000, label: 'Agency' },
} as const;

export const RegisterPartnerSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ dùng chữ thường, số, gạch ngang.'),
  planTier: z.enum(['studio', 'agency']).default('studio'),
});
export type RegisterPartner = z.infer<typeof RegisterPartnerSchema>;

export const CreatePartnerClientSchema = z.object({
  nameLeft: z.string().min(1).max(80),
  nameRight: z.string().min(1).max(80),
  eventType: EventTypeSchema.default('WEDDING'),
  eventDate: z.string().optional().nullable(),
  assignedMemberId: z.string().min(1).optional().nullable(),
  /** Built-in template id — FE seeds theme/blocks/content from registry */
  templateId: z.string().min(1),
  partnerTemplateId: z.string().min(1).optional().nullable(),
  /** Required when not using partnerTemplateId (code template path) */
  theme: ThemeConfigSchema.optional(),
  blocks: z.array(BlockConfigSchema).optional(),
  content: DraftInvitationContentSchema.optional(),
  clientCode: z.string().max(40).optional().nullable(),
});
export type CreatePartnerClient = z.infer<typeof CreatePartnerClientSchema>;

export const UpdatePartnerBrandSchema = z.object({
  logoKey: z.string().min(1).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  subdomain: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullable()
    .optional(),
  signature: z.string().max(80).nullable().optional(),
});
export type UpdatePartnerBrand = z.infer<typeof UpdatePartnerBrandSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: PartnerRoleSchema,
});
export type InviteMember = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: PartnerRoleSchema,
});
export type UpdateMemberRole = z.infer<typeof UpdateMemberRoleSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});
export type AcceptInvite = z.infer<typeof AcceptInviteSchema>;

export const SavePartnerTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  invitationId: z.string().min(1),
});
export type SavePartnerTemplate = z.infer<typeof SavePartnerTemplateSchema>;

export const ChangePartnerPlanSchema = z.object({
  planTier: z.enum(['studio', 'agency']),
});
export type ChangePartnerPlan = z.infer<typeof ChangePartnerPlanSchema>;

export const DataTemplateSchema = z.object({
  theme: ThemeConfigSchema,
  blocks: z.array(BlockConfigSchema).min(1),
  content: DraftInvitationContentSchema,
});
export type DataTemplate = z.infer<typeof DataTemplateSchema>;

export const MarkInvoicePaidSchema = z.object({
  invoiceId: z.string().min(1),
});
export type MarkInvoicePaid = z.infer<typeof MarkInvoicePaidSchema>;
