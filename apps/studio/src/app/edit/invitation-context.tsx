import { createContext, useContext } from 'react';
import type { InvitationRecord } from '../../lib/api';

export type InvitationContextValue = {
  invitationId: string;
  invitation: InvitationRecord | null;
};

const InvitationContext = createContext<InvitationContextValue | null>(null);

export const InvitationProvider = InvitationContext.Provider;

/**
 * Invitation loaded once by the `/edit/:id` layout route. Available to every
 * page and header slot under it, so no page refetches it.
 */
export function useInvitation(): InvitationContextValue {
  const value = useContext(InvitationContext);
  if (!value) {
    throw new Error('useInvitation must be used inside the /edit/:id routes');
  }
  return value;
}

/** For components rendered both inside and outside the edit routes. */
export function useOptionalInvitation() {
  return useContext(InvitationContext);
}
