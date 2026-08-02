import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@wishly/api-client';
import {
  BaseTextField,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Input,
  Label,
  LoadingSkeleton,
  OfflineBanner,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Wordmark,
} from '@wishly/ui';
import { api, type InvitationRecord } from '../../lib/api';
import { EditorBlockForm } from '../../features/editor/components/EditorBlockForm';
import { EditorBlockList } from '../../features/editor/components/EditorBlockList';
import { EditorPreview } from '../../features/editor/components/EditorPreview';
import { EditorProgress } from '../../features/editor/components/EditorProgress';
import { useAutosave } from '../../features/editor/hooks/useAutosave';
import { useEditorStore } from '../../features/editor/stores/editorStore';
import { derivePalette, isValidBrandHex } from '@wishly/templates';

export function EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [publishStep, setPublishStep] = useState(0);

  const loaded = useQuery({
    queryKey: queryKeys.invitations.one(id ?? ''),
    queryFn: () => api.getInvitation(id!),
    enabled: Boolean(id),
  });
  const inv = loaded.data;

  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);
  const hydrated = useEditorStore((s) => s.invitationId === id);
  const slug = useEditorStore((s) => s.slug);
  const setSlug = useEditorStore((s) => s.setSlug);
  const brandColor = useEditorStore((s) => s.brandColor);
  const setBrandColor = useEditorStore((s) => s.setBrandColor);
  const previewLang = useEditorStore((s) => s.previewLang);
  const setPreviewLang = useEditorStore((s) => s.setPreviewLang);
  const wide = useEditorStore((s) => s.wide);
  const toggleWide = useEditorStore((s) => s.toggleWide);
  const previewOpen = useEditorStore((s) => s.previewOpen);
  const setPreviewOpen = useEditorStore((s) => s.setPreviewOpen);

  useEffect(() => {
    if (loaded.data) hydrate(loaded.data);
  }, [loaded.data, hydrate]);

  useEffect(() => () => reset(), [reset]);

  const loadError = loaded.isError
    ? loaded.error instanceof Error
      ? loaded.error.message
      : 'Không mở được thiệp.'
    : null;

  const {
    savedAt,
    error: saveError,
    saving,
    flush,
    offlineLocal,
    retrySync,
  } = useAutosave(id);

  const publish = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Thiếu id thiệp.');
      setPublishStep(0);
      await flush();
      setPublishStep(1);
      const result = await api.publish(id, { slug });
      setPublishStep(2);
      await new Promise((r) => setTimeout(r, 400));
      setPublishStep(3);
      await new Promise((r) => setTimeout(r, 400));
      setPublishStep(4);
      return result;
    },
    onSuccess: (result) => {
      setPublishedUrl(result.url);
      setPageUrl(result.pageUrl ?? result.url);
      qc.setQueryData<InvitationRecord>(
        queryKeys.invitations.one(id ?? ''),
        (prev) =>
          prev
            ? {
              ...prev,
              status: 'PUBLISHED',
              slug: result.slug,
              ogImageKey: result.ogImageKey ?? prev.ogImageKey,
              publishedAt: result.publishedAt ?? prev.publishedAt,
            }
            : prev
      );
      void qc.invalidateQueries({ queryKey: queryKeys.invitations.mine() });
      void qc.invalidateQueries({
        queryKey: queryKeys.invitations.one(id ?? ''),
      });
      setPublishStep(0);
    },
    onError: (e) => {
      setPublishError(e instanceof Error ? e.message : 'Xuất bản thất bại.');
      setPublishStep(0);
    },
  });

  async function onPublish() {
    setPublishError(null);
    setCopyMsg(null);
    // FREE → chọn gói trước khi gửi; gói trả phí (hoặc cập nhật đã nâng cấp) publish thẳng.
    if (inv?.tier === 'FREE' && inv.status !== 'PUBLISHED') {
      try {
        await flush();
        navigate(`/upgrade/${id}?from=publish`);
      } catch (e) {
        setPublishError(
          e instanceof Error ? e.message : 'Không lưu được bản nháp.'
        );
      }
      return;
    }
    publish.mutate();
  }

  function onPreview() {
    const url = pageUrl ?? publishedUrl;
    if (url && inv?.status === 'PUBLISHED') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    setPreviewOpen(true);
  }

  async function copyShareUrl() {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopyMsg('Đã chép link chia sẻ (Zalo/Facebook dùng link này).');
    } catch {
      setCopyMsg('Không chép được — hãy chọn và copy thủ công.');
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <ErrorState
          tone="error"
          title="Không mở được thiệp"
          body="Thiệp có thể đã bị xoá hoặc bạn không còn quyền truy cập. Dữ liệu khác trên tài khoản vẫn an toàn."
          primary={{
            label: 'Về danh sách',
            href: '/dashboard',
          }}
        />
      </main>
    );
  }

  if (!inv || !hydrated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <LoadingSkeleton variant="invitation" />
      </main>
    );
  }

  if (publish.isPending) {
    return (
      <main className="min-h-screen">
        <LoadingSkeleton variant="publish" publishStep={publishStep} />
      </main>
    );
  }

  const saveHint = saving
    ? 'Đang lưu…'
    : saveError
      ? saveError
      : savedAt
        ? `Đã lưu · ${savedAt.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
        : null;

  const brandWarn =
    inv.eventType === 'CORPORATE' &&
    brandColor &&
    isValidBrandHex(brandColor) &&
    derivePalette(brandColor).adjusted;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <OfflineBanner forced={offlineLocal} onRetry={retrySync} />

      <header className="z-20 shrink-0 border-b border-border bg-background">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/dashboard" className="inline-flex shrink-0">
              <Wordmark />
            </Link>
            {saveHint ? (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {saveHint}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPreview}>
              Xem thử
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onPublish}
              disabled={publish.isPending}
            >
              {inv.status === 'PUBLISHED' ? 'Cập nhật' : 'Xuất bản'}
            </Button>
          </div>
        </div>
        <EditorProgress />
      </header>

      {publishError ? (
        <p className="shrink-0 px-4 py-2 text-sm text-destructive">{publishError}</p>
      ) : null}

      {publishedUrl ? (
        <div className="mx-4 mt-3 shrink-0 space-y-2 rounded-lg border border-border bg-card p-4">
          <p className="font-serif text-lg leading-[1.25]">Thiệp đã lên mạng</p>
          <p className="text-sm text-secondary-foreground">
            Chép link bên dưới rồi gửi Zalo. Sửa nội dung? Bấm lại «Cập nhật».
          </p>
          <Input
            readOnly
            value={publishedUrl}
            onFocus={(e) => e.target.select()}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={copyShareUrl}>
              Chép link chia sẻ
            </Button>
            {pageUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={pageUrl} target="_blank" rel="noreferrer">
                  Mở thiệp
                </a>
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/edit/${id}/guests`}>Gửi thiệp cho khách ngay</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPublishedUrl(null)}
            >
              Đóng
            </Button>
          </div>
          {copyMsg ? (
            <p className="text-sm text-secondary-foreground">{copyMsg}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-border bg-background p-3 lg:block">
          <EditorBlockList />
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <div className="absolute top-3 right-3 z-10 hidden lg:block">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={toggleWide}
            >
              {wide ? 'Khung mobile' : 'Khung rộng'}
            </Button>
          </div>
          <EditorPreview fill />
        </section>

        <aside className="hidden min-h-0 lg:block">
          <ScrollArea className="h-full border-l border-border bg-background p-5">
            <div className="mb-6">
              <BaseTextField
                id="slug"
                name="slug"
                label="Đường dẫn thiệp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            {inv.eventType === 'CORPORATE' ? (
              <div className="mb-6 space-y-2">

                <div className="flex items-end gap-3">
                  <BaseTextField
                    id="brandColor"
                    label="Màu thương hiệu"
                    type="color"
                    value={brandColor ?? ''}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#1F4E5F"
                  />
                  <BaseTextField
                    id="brandColor"
                    value={brandColor ?? ''}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#1F4E5F"
                  />
                </div>
                {brandWarn ? (
                  <p className="text-sm text-secondary-foreground">
                    Màu này hơi nhạt — hệ thống đã chỉnh để chữ vẫn đọc được.
                  </p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewLang === 'vi' ? 'default' : 'outline'}
                    onClick={() => setPreviewLang('vi')}
                  >
                    VI
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewLang === 'en' ? 'default' : 'outline'}
                    onClick={() => setPreviewLang('en')}
                  >
                    EN
                  </Button>
                </div>
              </div>
            ) : null}
            <EditorBlockForm />
          </ScrollArea>
        </aside>
      </div>

      <div className="fixed right-4 bottom-4 z-30 flex gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Phần thiệp</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-auto">
            <SheetHeader>
              <SheetTitle>Các phần của thiệp</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <EditorBlockList />
            </div>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Chỉnh nội dung</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex max-h-[85vh] flex-col overflow-hidden">
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-4">
                <SheetHeader>
                  <SheetTitle>Nội dung</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 p-4">
                  <BaseTextField
                    id="slug-m"
                    label="Đường dẫn thiệp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <EditorBlockForm />
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          showCloseButton
          className="fixed inset-0 top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:max-w-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        >
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 text-left sm:text-left">
            <DialogTitle className="font-serif text-xl">Xem thử</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden bg-muted">
            <EditorPreview fill wide={false} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EditPage;
