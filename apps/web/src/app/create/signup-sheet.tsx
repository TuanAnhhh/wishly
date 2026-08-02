import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@wishly/ui';
import { api, googleAuthUrl } from '../../lib/api';
import { track } from '../../lib/analytics';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  onClaimed: () => void;
};

export function SignupSheet({
  open,
  onOpenChange,
  invitationId,
  onClaimed,
}: Props) {
  const claim = useMutation({
    mutationFn: async () => {
      await api.claim([invitationId]);
    },
    onSuccess: () => {
      track('claim', { invitationId });
      onClaimed();
    },
  });

  const devLogin = useMutation({
    mutationFn: async () => {
      await api.devLogin();
      await api.claim([invitationId]);
    },
    onSuccess: () => {
      track('claim', { invitationId });
      onClaimed();
    },
  });

  const busy = claim.isPending || devLogin.isPending;
  const err = claim.error ?? devLogin.error;
  const error = err
    ? err instanceof Error
      ? err.message
      : 'Không lưu được thiệp.'
    : null;

  function onGoogle() {
    track('signup_open', { provider: 'google' });
    sessionStorage.setItem('wishly_pending_claim', invitationId);
    const returnTo = `${window.location.origin}/create?auth=1`;
    window.location.href = googleAuthUrl(returnTo);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Lưu thiệp này</SheetTitle>
          <SheetDescription>
            Đăng nhập để gắn thiệp vào tài khoản. Chưa cần trả tiền.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <p className="text-sm text-secondary-foreground">
            Tiếp tục nghĩa là bạn đồng ý với Điều khoản và Chính sách bảo mật
            (sẽ công bố khi pháp nhân sẵn sàng).
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="button"
            className="w-full"
            disabled={busy}
            onClick={onGoogle}
          >
            Tiếp tục với Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => devLogin.mutate()}
          >
            Đăng nhập thử (dev)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
