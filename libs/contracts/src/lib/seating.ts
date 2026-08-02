import { z } from 'zod';

export const TableKindSchema = z.enum(['round', 'long', 'stage']);
export type TableKind = z.infer<typeof TableKindSchema>;

export const CreateSeatingTableSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  kind: TableKindSchema.default('round'),
  capacity: z.number().int().min(0).max(40).optional(),
  x: z.number().int().min(0).max(4000).default(80),
  y: z.number().int().min(0).max(4000).default(80),
});
export type CreateSeatingTable = z.infer<typeof CreateSeatingTableSchema>;

export const UpdateSeatingTableSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  kind: TableKindSchema.optional(),
  capacity: z.number().int().min(0).max(40).optional(),
  x: z.number().int().min(0).max(4000).optional(),
  y: z.number().int().min(0).max(4000).optional(),
});
export type UpdateSeatingTable = z.infer<typeof UpdateSeatingTableSchema>;

export const AssignGuestSchema = z.object({
  guestId: z.string().min(1),
  tableId: z.string().min(1).nullable(),
});
export type AssignGuest = z.infer<typeof AssignGuestSchema>;

export const UpdatePartySizeSchema = z.object({
  partySize: z.number().int().min(1).max(20),
});
export type UpdatePartySize = z.infer<typeof UpdatePartySizeSchema>;

export const DEFAULT_TABLE_CAPACITY: Record<TableKind, number> = {
  round: 10,
  long: 14,
  stage: 0,
};
