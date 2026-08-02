import type {
  CheckinManual,
  CheckinScan,
  CheckinSyncBatch,
  CheckinWalkIn,
  CreateStaffAccess,
} from '@wishly/contracts';
import { http } from '../client';

export type RosterGuest = {
  id: string;
  name: string;
  group: string | null;
  phone: string | null;
  partySize: number;
  passCode: string | null;
  checkedInAt: string | null;
  walkIn: boolean;
  tableId: string | null;
  tableLabel: string | null;
};

export type CheckinRoster = {
  invitationId: string;
  fetchedAt: string;
  guests: RosterGuest[];
};

export type CheckinGuestView = {
  id: string;
  name: string;
  group: string | null;
  partySize: number;
  tableLabel: string | null;
  checkedInAt: string | null;
  walkIn: boolean;
};

export type CheckinResult =
  | { result: 'ok'; guest: CheckinGuestView }
  | { result: 'dup'; at: string; guest: CheckinGuestView }
  | { result: 'invalid' };

export type StaffRow = {
  id: string;
  label: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

export type CreatedStaff = {
  id: string;
  label: string;
  expiresAt: string;
  token: string;
  url: string;
};

function staffHeaders(token: string): HeadersInit {
  return { 'x-staff-token': token };
}

export const checkinApi = {
  roster: (token: string) =>
    http<CheckinRoster>('/checkin/roster', {
      headers: staffHeaders(token),
    }),

  scan: (token: string, body: CheckinScan) =>
    http<CheckinResult>('/checkin/scan', {
      method: 'POST',
      headers: staffHeaders(token),
      body: JSON.stringify(body),
    }),

  manual: (token: string, body: CheckinManual) =>
    http<CheckinResult>('/checkin/manual', {
      method: 'POST',
      headers: staffHeaders(token),
      body: JSON.stringify(body),
    }),

  walkIn: (token: string, body: CheckinWalkIn) =>
    http<CheckinResult>('/checkin/walk-in', {
      method: 'POST',
      headers: staffHeaders(token),
      body: JSON.stringify(body),
    }),

  sync: (token: string, body: CheckinSyncBatch) =>
    http<{ applied: number; total: number }>('/checkin/sync', {
      method: 'POST',
      headers: staffHeaders(token),
      body: JSON.stringify(body),
    }),

  listStaff: (invitationId: string) =>
    http<StaffRow[]>(`/invitations/${invitationId}/staff`),

  createStaff: (invitationId: string, body: CreateStaffAccess) =>
    http<CreatedStaff>(`/invitations/${invitationId}/staff`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  revokeStaff: (invitationId: string, staffId: string) =>
    http<{ ok: true }>(`/invitations/${invitationId}/staff/${staffId}`, {
      method: 'DELETE',
    }),
};
