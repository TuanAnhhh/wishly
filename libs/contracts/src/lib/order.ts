import { z } from 'zod';
import { TierSchema } from './invitation.js';

export const OrderStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const CreateOrderSchema = z.object({
  invitationId: z.string().min(1),
  /** Paid plan ids from seed: basic | premium */
  planId: z.enum(['basic', 'premium']),
  discountCode: z.string().max(40).optional(),
  /** MoMo gated on P00; bank_manual is day-1 path */
  provider: z.enum(['momo', 'bank_manual']).default('bank_manual'),
  invoiceInfo: z
    .object({
      companyName: z.string().min(1).max(200),
      taxCode: z.string().min(1).max(40),
    })
    .optional(),
});
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export const ClaimPaidSchema = z.object({
  /** Client ack — status stays pending until admin confirms */
  claimed: z.literal(true),
});
export type ClaimPaid = z.infer<typeof ClaimPaidSchema>;

void TierSchema;
