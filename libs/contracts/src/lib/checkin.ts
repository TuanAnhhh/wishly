import { z } from 'zod';

export const CheckinScanSchema = z.object({
  passCode: z.string().min(3).max(32),
});
export type CheckinScan = z.infer<typeof CheckinScanSchema>;

export const CheckinManualSchema = z.object({
  guestId: z.string().min(1),
});
export type CheckinManual = z.infer<typeof CheckinManualSchema>;

export const CheckinWalkInSchema = z.object({
  name: z.string().min(1).max(120),
  partySize: z.number().int().min(1).max(20).default(1),
  tableId: z.string().min(1).optional().nullable(),
});
export type CheckinWalkIn = z.infer<typeof CheckinWalkInSchema>;

export const CheckinSyncBatchSchema = z.object({
  items: z
    .array(
      z.object({
        guestId: z.string().min(1),
        at: z.string().datetime(),
      })
    )
    .min(1)
    .max(200),
});
export type CheckinSyncBatch = z.infer<typeof CheckinSyncBatchSchema>;

export const CreateStaffAccessSchema = z.object({
  label: z.string().min(1).max(80),
});
export type CreateStaffAccess = z.infer<typeof CreateStaffAccessSchema>;
