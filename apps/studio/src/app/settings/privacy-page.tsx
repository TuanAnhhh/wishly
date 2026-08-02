import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  privacyApi,
  queryKeys,
  exportInvitationData,
  ApiError,
} from '@wishly/api-client';
import {
  Button,
  BaseConfirmDialog,
  SectionLabel,
  BaseSwitchField,
  BaseTextField,
} from '@wishly/ui';

const RETENTION_OPTIONS = [3, 6, 12] as const;

export function PrivacyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: id ? queryKeys.privacy.settings(id) : ['privacy', 'none'],
    queryFn: () => privacyApi.getSettings(id as string),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof privacyApi.updateSettings>[1]) =>
      privacyApi.updateSettings(id as string, body),
    onSuccess: (settings) => {
      if (id)
        queryClient.setQueryData(queryKeys.privacy.settings(id), settings);
      setToast('Đã lưu.');
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : 'Không lưu được.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => privacyApi.deleteEvent(id as string, confirmName),
    onSuccess: () => navigate('/dashboard'),
    onError: (e) => {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Không xoá được.',
      );
    },
  });

  async function onExport() {
    if (!id) return;
    try {
      const blob = await exportInvitationData(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wishly-${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xuất được dữ liệu.');
    }
  }

  const settings = settingsQuery.data;

  return (
    <>
      <header className="space-y-2">
        <h1 className="font-serif text-2xl leading-[1.25]">Cài đặt riêng tư</h1>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {toast ? (
        <p className="text-sm text-secondary-foreground">{toast}</p>
      ) : null}

      {!settings ? (
        <p className="text-secondary-foreground">Đang tải…</p>
      ) : (
        <>
          <section className="space-y-5 border border-border bg-card p-6">
            <SectionLabel>Hiển thị</SectionLabel>

            <BaseSwitchField
              label="Hiển thị công khai sổ lưu bút"
              hint="Tắt thì chỉ bạn đọc được lời chúc."
              checked={settings.publicGuestbook}
              onCheckedChange={(v) =>
                updateMutation.mutate({ publicGuestbook: v })
              }
            />

            <BaseSwitchField
              label="Ẩn thông tin tiền mừng"
              hint="Ẩn mã QR và số tài khoản khỏi thiệp. Giao dịch đã nhận vẫn còn trong sổ."
              checked={settings.hideGift}
              onCheckedChange={(v) => updateMutation.mutate({ hideGift: v })}
            />

            <div className="space-y-2">
              <p className="font-medium">Bảo vệ thiệp bằng mật khẩu</p>
              <p className="text-sm text-secondary-foreground">
                {settings.passwordProtected
                  ? 'Đang bật — nhập mật khẩu mới để đổi, để trống rồi lưu để tắt.'
                  : 'Chỉ dùng được cho gói trả phí.'}
              </p>
              <div className="flex gap-2">
                <BaseTextField
                  wrapperClassName="flex-1"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    settings.passwordProtected ? '••••••' : 'Đặt mật khẩu'
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateMutation.mutate({ password: password || null })
                  }
                >
                  Lưu
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4 border border-border bg-card p-6">
            <SectionLabel>Tự động xoá dữ liệu khách sau sự kiện</SectionLabel>
            <p className="text-sm text-secondary-foreground">
              Hết thời hạn này, tên/SĐT/phản hồi của khách bị xoá. Sổ lưu bút và
              ảnh vẫn giữ.
            </p>
            <div className="flex gap-2">
              {RETENTION_OPTIONS.map((months) => (
                <Button
                  key={months}
                  type="button"
                  variant={
                    settings.retentionMonths === months ? 'default' : 'outline'
                  }
                  onClick={() =>
                    updateMutation.mutate({ retentionMonths: months })
                  }
                >
                  {months} tháng
                </Button>
              ))}
            </div>
            {settings.purgeAt ? (
              <p className="text-xs text-secondary-foreground">
                Dự kiến xoá:{' '}
                {new Date(settings.purgeAt).toLocaleDateString('vi-VN')}
              </p>
            ) : null}
          </section>

          <section className="space-y-4 border border-border bg-card p-6">
            <SectionLabel>Dữ liệu của bạn</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onExport}>
                Tải toàn bộ dữ liệu của tôi
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Xoá vĩnh viễn sự kiện này
              </Button>
              <BaseConfirmDialog
                open={deleteOpen}
                onOpenChange={(next) => {
                  setDeleteOpen(next);
                  if (!next) setConfirmName('');
                }}
                title="Xoá vĩnh viễn sự kiện này?"
                description="Không thể hoàn lại. Khách mời, phản hồi và sổ tiền mừng sẽ mất. Hoá đơn thanh toán vẫn được giữ theo quy định kế toán."
                confirmLabel="Xoá vĩnh viễn"
                cancelLabel="Giữ lại sự kiện"
                variant="destructive"
                confirmDisabled={!confirmName.trim()}
                confirmPending={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate()}
              >
                <BaseTextField
                  label="Gõ lại tên thiệp để xác nhận"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                />
              </BaseConfirmDialog>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default PrivacyPage;
