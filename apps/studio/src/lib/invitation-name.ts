import type { InvitationRecord } from './api';

/** Couple/celebrant name from the cover block, when both halves are filled. */
export function coupleName(content: Record<string, unknown> | undefined) {
  const cover = content?.cover as
    | { nameLeft?: string; nameRight?: string }
    | undefined;
  return cover?.nameLeft && cover?.nameRight
    ? `${cover.nameLeft} & ${cover.nameRight}`
    : null;
}

/** Display title for headers and breadcrumbs. */
export function invitationTitle(invitation: InvitationRecord | null | undefined) {
  return coupleName(invitation?.content) ?? 'Thiệp mời';
}

/** Public invitation URL on the marketing site. */
export function publicInvitationUrl(slug: string) {
  const base = (
    (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined) ??
    'http://localhost:4200'
  ).replace(/\/$/, '');
  return `${base}/${slug}`;
}

export const INVITATION_STATUS_LABEL: Record<InvitationRecord['status'], string> =
  {
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã xuất bản',
    ENDED: 'Đã kết thúc',
  };
