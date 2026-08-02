import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { coverVariantOf, getTemplate, TemplateThumb } from '@wishly/templates';
import { Button, SectionLabel } from '@wishly/ui';
import { api, studioEditUrl } from '../../lib/api';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';

const EVENT_LABEL: Record<string, string> = {
  WEDDING: 'Đám cưới',
  BIRTHDAY: 'Sinh nhật',
  BABY_MONTH: 'Đầy tháng',
  CORPORATE: 'Doanh nghiệp',
};

export function TemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const tpl = slug ? getTemplate(slug) : undefined;
  const [createError, setCreateError] = useState<string | null>(null);

  const createFromTemplate = useMutation({
    mutationFn: () =>
      api.createDraft({
        templateId: tpl!.meta.id,
        eventType: tpl!.meta.eventType,
        content: tpl!.content,
        theme: tpl!.theme,
        blocks: tpl!.blocks,
      }),
    onMutate: () => setCreateError(null),
    onSuccess: (draft) => {
      window.location.href = studioEditUrl(draft.id);
    },
    onError: (e) => {
      setCreateError(
        e instanceof Error ? e.message : 'Không tạo được thiệp. Thử lại sau.'
      );
    },
  });

  if (!tpl) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
          <h1 className="font-serif text-2xl">Không tìm thấy mẫu</h1>
          <Button asChild>
            <Link to="/templates">Về thư viện mẫu</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-start">
        <TemplateThumb
          nameLeft="Minh Anh"
          nameRight="Quốc Huy"
          dateLine="15 · 11 · 2026"
          theme={tpl.theme}
          coverVariant={coverVariantOf(tpl.blocks)}
          className="mx-auto max-w-sm"
        />
        <div className="space-y-6">
          <div className="space-y-2">
            <SectionLabel>
              {EVENT_LABEL[tpl.meta.eventType] ?? tpl.meta.eventType}
            </SectionLabel>
            <h1 className="font-serif text-4xl leading-[1.25]">
              {tpl.meta.name}
            </h1>
            <p className="text-secondary-foreground">{tpl.meta.description}</p>
          </div>
          <Button
            size="lg"
            disabled={createFromTemplate.isPending}
            onClick={() => createFromTemplate.mutate()}
          >
            {createFromTemplate.isPending ? 'Đang tạo…' : 'Dùng mẫu này'}
          </Button>
          {createError ? (
            <p className="text-sm text-destructive">{createError}</p>
          ) : null}
          <Link
            to="/templates"
            className="block text-sm text-secondary-foreground underline-offset-4 hover:underline"
          >
            ← Tất cả mẫu
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default TemplateDetailPage;
