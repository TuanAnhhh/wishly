import type { CheckinRoster, RosterGuest } from '@wishly/api-client';

const ROSTER_KEY = 'wishly:checkin:roster';
const QUEUE_KEY = 'wishly:checkin:queue';
const TOKEN_KEY = 'wishly:checkin:staff-token';

export type QueueItem = { guestId: string; at: string };

export function saveStaffToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function loadStaffToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearCheckinLocal() {
  localStorage.removeItem(ROSTER_KEY);
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function cacheRoster(roster: CheckinRoster) {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

export function loadCachedRoster(): CheckinRoster | null {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckinRoster;
  } catch {
    return null;
  }
}

export function rosterAgeHours(roster: CheckinRoster): number {
  const t = Date.parse(roster.fetchedAt);
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60);
}

export function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}

export function enqueueCheckin(guestId: string, at = new Date().toISOString()) {
  const q = loadQueue().filter((i) => i.guestId !== guestId);
  q.push({ guestId, at });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function clearQueueItems(guestIds: string[]) {
  const set = new Set(guestIds);
  const next = loadQueue().filter((i) => !set.has(i.guestId));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}

/** Optimistic local mark — keeps earliest at. */
export function markLocalCheckedIn(
  roster: CheckinRoster,
  guestId: string,
  at: string
): CheckinRoster {
  const guests = roster.guests.map((g) => {
    if (g.id !== guestId) return g;
    if (g.checkedInAt && Date.parse(g.checkedInAt) <= Date.parse(at)) {
      return g;
    }
    return { ...g, checkedInAt: at };
  });
  const next = { ...roster, guests };
  cacheRoster(next);
  return next;
}

export function findByPassCode(
  guests: RosterGuest[],
  passCode: string
): RosterGuest | undefined {
  const code = passCode.trim().toUpperCase();
  return guests.find((g) => g.passCode?.toUpperCase() === code);
}

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function searchGuests(guests: RosterGuest[], q: string): RosterGuest[] {
  const needle = stripDiacritics(q.trim());
  if (!needle) return guests.slice(0, 40);
  return guests
    .filter((g) => {
      const hay = stripDiacritics(
        `${g.name} ${g.group ?? ''} ${g.phone ?? ''} ${g.passCode ?? ''}`
      );
      return hay.includes(needle);
    })
    .slice(0, 40);
}
