import { useMutation } from '@tanstack/react-query';
import { ApiError, partnerApi } from '@wishly/api-client';
import { Button, ErrorState, LoadingSkeleton } from '@wishly/ui';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export function PartnerAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const accept = useMutation({
    mutationFn: () => partnerApi.acceptInvite(token),
    onSuccess: () => navigate('/partner', { replace: true }),
  });

  useEffect(() => {
    if (token) accept.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [token]);

  if (!token) {
    return (
      <ErrorState
        tone="warn"
        title="Thiếu mã lời mời"
        body="Mở lại liên kết từ email mời."
        primary={{ label: 'Về studio', href: '/partner' }}
      />
    );
  }
  if (accept.isPending) return <LoadingSkeleton variant="guest-list" rows={3} />;
  if (accept.error) {
    return (
      <div className="space-y-4">
        <ErrorState
          tone="warn"
          title="Không nhận được lời mời"
          body={
            accept.error instanceof ApiError
              ? accept.error.message
              : 'Thử đăng nhập đúng email được mời.'
          }
          primary={{ label: 'Thử lại', onClick: () => accept.mutate() }}
        />
        <Button asChild variant="outline">
          <Link to="/dashboard">Về dashboard</Link>
        </Button>
      </div>
    );
  }
  return <LoadingSkeleton variant="guest-list" rows={2} />;
}
