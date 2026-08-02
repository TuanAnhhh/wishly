import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@wishly/api-client';
import { ErrorState, LoadingSkeleton } from '@wishly/ui';
import { api } from '../../lib/api';
import { InvitationProvider } from './invitation-context';

/**
 * Data layout route for `/edit/:id`. Loads the invitation once for the whole
 * subtree and renders no chrome, so the full-bleed editor and the print sheet
 * stay untouched while the shell pages get the record for free.
 */
export function EditDataRoute() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: queryKeys.invitations.one(id ?? ''),
    queryFn: () => api.getInvitation(id!),
    enabled: Boolean(id),
  });

  if (!id) return <Navigate to="/dashboard" replace />;

  if (query.isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <LoadingSkeleton variant="guest-list" rows={4} />
      </main>
    );
  }

  if (query.error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          tone="warn"
          title="Không mở được thiệp này"
          body={
            query.error instanceof Error
              ? query.error.message
              : 'Thiệp không tồn tại hoặc bạn không có quyền xem.'
          }
          primary={{ label: 'Về danh sách thiệp', href: '/dashboard' }}
        />
      </main>
    );
  }

  return (
    <InvitationProvider
      value={{ invitationId: id, invitation: query.data ?? null }}
    >
      <Outlet />
    </InvitationProvider>
  );
}

export default EditDataRoute;
