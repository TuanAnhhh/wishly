import { useInvitation } from '../../app/edit/invitation-context';
import {
  INVITATION_STATUS_LABEL,
  invitationTitle,
  publicInvitationUrl,
} from '../../lib/invitation-name';

/**
 * Header context for every page under `/edit/:id` — which invitation you are
 * working on, plus its status and public address once published.
 */
export function InvitationHeading() {
  const { invitation } = useInvitation();

  return (
    <div className="min-w-0 space-y-0.5 border-l border-border pl-3">
      <h2 className="truncate font-serif text-xl leading-none">
        {invitationTitle(invitation)}
      </h2>
      {invitation ? (
        <p className="truncate text-xs text-secondary-foreground">
          {INVITATION_STATUS_LABEL[invitation.status]}
          {invitation.status !== 'DRAFT'
            ? ` · ${publicInvitationUrl(invitation.slug).replace(/^https?:\/\//, '')}`
            : ''}
        </p>
      ) : null}
    </div>
  );
}

export default InvitationHeading;
