import type {
  AssignGuest,
  CreateSeatingTable,
  UpdateSeatingTable,
} from '@wishly/contracts';
import { http } from '../client';

export type SeatingTable = {
  id: string;
  invitationId: string;
  label: string;
  kind: 'round' | 'long' | 'stage';
  capacity: number;
  x: number;
  y: number;
  createdAt: string;
};

export type SeatingGuest = {
  id: string;
  name: string;
  group: string | null;
  partySize: number;
  partySizeManual: boolean;
  tableId: string | null;
  mealChoice?: string | null;
  allergyNote?: string | null;
};

export type SeatingSnapshot = {
  tables: SeatingTable[];
  guests: SeatingGuest[];
  seatingLockedAt: string | null;
  seatingLog: Array<{ at: string; by: string; action: string }>;
  eventType?: string;
};

export const seatingApi = {
  get: (invitationId: string) =>
    http<SeatingSnapshot>(`/invitations/${invitationId}/seating`),

  createTable: (invitationId: string, body: CreateSeatingTable) =>
    http<SeatingTable>(`/invitations/${invitationId}/seating/tables`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateTable: (
    invitationId: string,
    tableId: string,
    body: UpdateSeatingTable
  ) =>
    http<SeatingTable>(
      `/invitations/${invitationId}/seating/tables/${tableId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    ),

  deleteTable: (invitationId: string, tableId: string) =>
    http<{ ok: true }>(
      `/invitations/${invitationId}/seating/tables/${tableId}`,
      { method: 'DELETE' }
    ),

  assign: (invitationId: string, body: AssignGuest) =>
    http<SeatingGuest>(`/invitations/${invitationId}/seating/assign`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  lock: (invitationId: string) =>
    http<{ seatingLockedAt: string }>(
      `/invitations/${invitationId}/seating/lock`,
      { method: 'POST' }
    ),
};
