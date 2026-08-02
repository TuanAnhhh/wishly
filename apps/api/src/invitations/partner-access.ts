/**
 * Pure partner RBAC for invitations — tested exhaustively (P12).
 * Controllers must not re-implement this; assertCanAccess calls it.
 */
export type PartnerAccessDecision =
  | { ok: true }
  | { ok: false; reason: 'view_write' | 'edit_unassigned' | 'unknown_role' };

export function evaluatePartnerAccess(input: {
  role: string;
  write?: boolean;
  assignedMemberId: string | null;
  memberId: string;
}): PartnerAccessDecision {
  const { role, write, assignedMemberId, memberId } = input;
  if (role === 'admin') return { ok: true };
  if (role === 'view') {
    if (write) return { ok: false, reason: 'view_write' };
    return { ok: true };
  }
  if (role === 'edit') {
    if (assignedMemberId !== memberId) {
      return { ok: false, reason: 'edit_unassigned' };
    }
    return { ok: true };
  }
  return { ok: false, reason: 'unknown_role' };
}
