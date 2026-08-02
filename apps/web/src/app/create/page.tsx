import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CakeIcon,
  FaceSmileIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { EventType } from '@wishly/contracts';
import {
  coverVariantOf,
  getTemplate,
  listTemplates,
  TemplateThumb,
} from '@wishly/templates';
import {
  BaseDatePicker,
  BaseTextField,
  Button,
  Label,
  Progress,
  SectionLabel,
} from '@wishly/ui';
import { track } from '../../lib/analytics';
import {
  api,
  studioEditUrl,
  type InvitationRecord,
} from '../../lib/api';
import { SignupSheet } from './signup-sheet';

type Step = 1 | 2 | 3 | 'loading' | 4;

type EventOption = {
  id: EventType | 'OPENING';
  label: string;
  help: string;
  comingSoon?: boolean;
  icon: ReactNode;
};

const EVENT_OPTIONS: EventOption[] = [
  {
    id: 'WEDDING',
    label: 'Thiệp cưới',
    help: 'Lễ thành hôn, vu quy, báo hỷ',
    icon: <HeartIcon className="size-5" aria-hidden />,
  },
  {
    id: 'BIRTHDAY',
    label: 'Sinh nhật',
    help: 'Tiệc mừng tuổi mới',
    icon: <CakeIcon className="size-5" aria-hidden />,
  },
  {
    id: 'BABY_MONTH',
    label: 'Đầy tháng',
    help: 'Đầy tháng, thôi nôi cho bé',
    icon: <FaceSmileIcon className="size-5" aria-hidden />,
  },
  {
    id: 'OPENING',
    label: 'Khai trương',
    help: 'Cửa hàng, quán, văn phòng mới',
    comingSoon: true,
    icon: <BuildingStorefrontIcon className="size-5" aria-hidden />,
  },
  {
    id: 'CORPORATE',
    label: 'Sự kiện công ty',
    help: 'Tất niên, hội nghị, ra mắt',
    icon: <BuildingOffice2Icon className="size-5" aria-hidden />,
  },
];

const TIPS = [
  'Thêm ảnh cưới ở phần Album — có thể xuất bản trước rồi bổ sung sau.',
  'Bật phần Hộp mừng cưới để hiện QR nhận tiền mừng.',
  'Sau khi xuất bản, thêm danh sách khách để gửi link riêng từng người.',
];

function mergeCover(
  content: Record<string, unknown>,
  basics: {
    nameLeft: string;
    nameRight: string;
    dateLine: string;
    placeLine: string;
  }
) {
  const cover = {
    ...((content.cover as Record<string, unknown>) ?? {}),
    ...(basics.nameLeft ? { nameLeft: basics.nameLeft } : {}),
    ...(basics.nameRight ? { nameRight: basics.nameRight } : {}),
    ...(basics.dateLine ? { dateLine: basics.dateLine } : {}),
    ...(basics.placeLine ? { placeLine: basics.placeLine } : {}),
  };
  return { ...content, version: 1 as const, cover };
}

function stepLabel(step: Step): string {
  if (step === 1) return 'Bước 1 / 4';
  if (step === 2) return 'Bước 2 / 4';
  if (step === 3 || step === 'loading') return 'Bước 3 / 4';
  return 'Bước 4 / 4';
}

function stepIndex(step: Step): number {
  if (step === 1) return 1;
  if (step === 2) return 2;
  if (step === 3 || step === 'loading') return 3;
  return 4;
}

/** Format ISO yyyy-mm-dd → cover dateLine "15 · 11 · 2026" */
function formatDateLine(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  return `${Number(m[3])} · ${Number(m[2])} · ${m[1]}`;
}

function fieldLabels(eventType: EventType) {
  if (eventType === 'WEDDING') {
    return {
      left: 'Tên cô dâu',
      right: 'Tên chú rể',
      date: 'Ngày cưới',
      leftPh: 'Minh Anh',
      rightPh: 'Quốc Huy',
      placePh: 'Nhà hàng Trống Đồng, Quận 1',
    };
  }
  if (eventType === 'BIRTHDAY') {
    return {
      left: 'Tên người tổ chức',
      right: 'Tuổi / ghi chú',
      date: 'Ngày tiệc',
      leftPh: 'Minh Anh',
      rightPh: '25 tuổi',
      placePh: 'Nhà riêng, Quận 1',
    };
  }
  if (eventType === 'BABY_MONTH') {
    return {
      left: 'Tên bé',
      right: 'Bố / mẹ',
      date: 'Ngày đầy tháng',
      leftPh: 'Bảo An',
      rightPh: 'Gia đình nhà An',
      placePh: 'Nhà hàng Trống Đồng, Quận 1',
    };
  }
  return {
    left: 'Tên sự kiện',
    right: 'Công ty / đơn vị',
    date: 'Ngày tổ chức',
    leftPh: 'Tất niên 2026',
    rightPh: 'Công ty ABC',
    placePh: 'Khách sạn Rex, Quận 1',
  };
}

export function CreateInvitationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [eventType, setEventType] = useState<EventType>('WEDDING');
  const [nameLeft, setNameLeft] = useState('');
  const [nameRight, setNameRight] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dateLine, setDateLine] = useState('');
  const [placeLine, setPlaceLine] = useState('');
  const [templateSlug, setTemplateSlug] = useState<string | null>(
    searchParams.get('template')
  );
  const [draft, setDraft] = useState<InvitationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signupOpen, setSignupOpen] = useState(false);

  const templates = useMemo(
    () => listTemplates({ eventType }).slice(0, 6),
    [eventType]
  );

  const labels = fieldLabels(eventType);
  const displayLeft = nameLeft.trim() || 'Tên';
  const displayRight = nameRight.trim() || 'Tên';
  const displayDate = dateLine.trim() || 'Ngày sự kiện';
  const currentStep = stepIndex(step);

  useEffect(() => {
    track('onboarding_1');
  }, []);

  useEffect(() => {
    const pre = searchParams.get('template');
    if (!pre) return;
    const tpl = getTemplate(pre);
    if (tpl) {
      setEventType(tpl.meta.eventType);
      setTemplateSlug(tpl.meta.slug);
    }
  }, [searchParams]);

  const claimReturn = useMutation({
    mutationFn: (pending: string) => api.claim([pending]),
    onSuccess: (_res, pending) => {
      track('claim', { invitationId: pending, via: 'google_return' });
      sessionStorage.removeItem('wishly_pending_claim');
      window.location.href = studioEditUrl(pending);
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Không claim được thiệp.');
      setSearchParams({}, { replace: true });
    },
  });

  useEffect(() => {
    if (searchParams.get('auth') !== '1') return;
    const pending = sessionStorage.getItem('wishly_pending_claim');
    if (!pending) return;
    claimReturn.mutate(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const createDraft = useMutation({
    mutationFn: async (slug: string) => {
      const tpl =
        getTemplate(slug) ?? templates.find((t) => t.meta.slug === slug);
      if (!tpl) throw new Error('Mẫu không hợp lệ.');
      const content = mergeCover(tpl.content as Record<string, unknown>, {
        nameLeft: nameLeft.trim(),
        nameRight: nameRight.trim(),
        dateLine: dateLine.trim(),
        placeLine: placeLine.trim(),
      });
      const started = Date.now();
      const created = await api.createDraft({
        templateId: tpl.meta.id,
        eventType,
        content,
        theme: tpl.theme,
        blocks: tpl.blocks,
      });
      const wait = Math.max(0, 2200 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      return { created, slug };
    },
    onMutate: () => {
      setStep('loading');
      setError(null);
    },
    onSuccess: ({ created, slug }) => {
      setDraft(created);
      setTemplateSlug(slug);
      setStep(4);
      track('onboarding_4', { invitationId: created.id });
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Không tạo được thiệp.');
      setStep(3);
    },
  });

  function createDraftFromTemplate(slug: string) {
    track('onboarding_3', { template: slug });
    createDraft.mutate(slug);
  }

  function goEdit() {
    if (!draft) return;
    window.location.href = studioEditUrl(draft.id);
  }

  function goBack() {
    if (step === 1) {
      window.location.href = '/';
      return;
    }
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 'loading') setStep(3);
  }

  function skipStep() {
    if (step === 1) {
      track('onboarding_2');
      setStep(2);
      return;
    }
    if (step === 2) setStep(3);
    else if (step === 3 && templates[0]) {
      createDraftFromTemplate(templates[0].meta.slug);
    }
  }

  function selectEvent(opt: EventOption) {
    if (opt.comingSoon || opt.id === 'OPENING') return;
    setEventType(opt.id);
    track('onboarding_2', { eventType: opt.id });
    setStep(2);
  }

  const showChrome = step !== 4;

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto min-h-screen max-w-6xl bg-background sm:my-0">
        {showChrome ? (
          <header className="px-4 pt-4 pb-0">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 justify-self-start text-muted-foreground transition-colors hover:text-foreground"
              >
                <span aria-hidden>←</span> Quay lại
              </button>
              <p className="text-center text-secondary-foreground">
                {stepLabel(step)}
              </p>
              {step !== 'loading' ? (
                <button
                  type="button"
                  onClick={skipStep}
                  className="justify-self-end text-secondary-foreground transition-colors hover:text-foreground"
                >
                  Bỏ qua
                </button>
              ) : (
                <span />
              )}
            </div>
            <div className="mt-3 flex gap-1" aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full ${
                    n <= currentStep
                      ? 'bg-primary'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </header>
        ) : null}

        <main className="space-y-8 px-4 py-8">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {step === 1 ? (
            <section className="space-y-8">
              <div className="space-y-3">
                <h1 className="font-serif text-[1.75rem] leading-[1.2] tracking-tight sm:text-3xl">
                  Bạn muốn tạo thiệp gì?
                </h1>
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  Chọn loại thiệp để chúng tôi gợi ý đúng mẫu. Chưa cần đăng ký
                  gì cả.
                </p>
              </div>
              <div className="space-y-3">
                {EVENT_OPTIONS.map((opt) => {
                  const disabled = Boolean(opt.comingSoon);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectEvent(opt)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-[border-color,box-shadow,background-color] hover:border-primary/40 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-secondary-foreground">
                        {opt.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {opt.label}
                          </span>
                          {disabled ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                              Sắp có
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {opt.help}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      >
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-7">
              <div className="space-y-4">
                <h1 className="font-serif text-[1.75rem] leading-[1.2] tracking-tight sm:text-3xl">
                  Điền thông tin cơ bản
                </h1>
                <p className="rounded-lg bg-success-soft px-3.5 py-3 text-sm leading-relaxed text-success-ink">
                  Chỉ mất 30 giây — sửa lại lúc nào cũng được.
                </p>
              </div>

              <div className="space-y-5">
                <BaseTextField
                  id="nameLeft"
                  label={labels.left}
                  value={nameLeft}
                  onChange={(e) => setNameLeft(e.target.value)}
                  placeholder={labels.leftPh}
                  autoComplete="given-name"
                />
                <BaseTextField
                  id="nameRight"
                  label={labels.right}
                  value={nameRight}
                  onChange={(e) => setNameRight(e.target.value)}
                  placeholder={labels.rightPh}
                  autoComplete="family-name"
                />
                <div className="space-y-2">
                  <Label htmlFor="eventDate">{labels.date}</Label>
                  <BaseDatePicker
                    id="eventDate"
                    value={eventDate}
                    onChange={(iso) => {
                      setEventDate(iso);
                      setDateLine(formatDateLine(iso));
                    }}
                    placeholder="Chọn ngày"
                  />
                  <p className="text-xs text-muted-foreground">
                    Chưa chốt ngày? Cứ chọn tạm, đổi sau được.
                  </p>
                </div>
                <BaseTextField
                  id="placeLine"
                  label="Nơi tổ chức"
                  value={placeLine}
                  onChange={(e) => setPlaceLine(e.target.value)}
                  placeholder={labels.placePh}
                />
              </div>

              <div className="flex flex-col items-stretch gap-3 pt-1">
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(3)}
                >
                  Xem thiệp của tôi
                </Button>
                <button
                  type="button"
                  className="text-center text-sm text-secondary-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  onClick={() => setStep(3)}
                >
                  Điền sau, xem mẫu trước
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-serif text-[1.75rem] leading-[1.2] sm:text-3xl">
                  Chọn phong cách
                </h1>
                <p className="text-sm text-secondary-foreground">
                  Thumbnail hiện tên bạn vừa nhập. Chọn một mẫu để tạo thiệp thật.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <button
                    key={tpl.meta.id}
                    type="button"
                    className={`space-y-2 rounded-xl border p-2 text-left transition-shadow hover:shadow-card ${
                      templateSlug === tpl.meta.slug
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                    onClick={() => void createDraftFromTemplate(tpl.meta.slug)}
                  >
                    <TemplateThumb
                      nameLeft={displayLeft}
                      nameRight={displayRight}
                      dateLine={displayDate}
                      theme={tpl.theme}
                      coverVariant={coverVariantOf(tpl.blocks)}
                    />
                    <p className="px-1 text-sm font-medium">{tpl.meta.name}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 'loading' ? (
            <section className="space-y-4 py-16 text-center">
              <h1 className="font-serif text-3xl leading-[1.25]">
                Đang dựng thiệp của bạn…
              </h1>
              <p className="text-secondary-foreground">
                Tạo bản nháp thật trên máy chủ — không chỉ lưu tạm trên máy.
              </p>
              <Progress value={80} className="mx-auto max-w-xs" />
            </section>
          ) : null}

          {step === 4 && draft ? (
            <section className="space-y-8">
              <div className="space-y-2 text-center">
                <SectionLabel>Xong bước đầu</SectionLabel>
                <h1 className="font-serif text-3xl leading-[1.25]">
                  Thiệp đã sẵn sàng chỉnh
                </h1>
                <p className="text-secondary-foreground">
                  Bạn chưa mất đồng nào và chưa cần tài khoản. Lưu thiệp để không
                  mất khi đổi máy.
                </p>
              </div>
              <div className="mx-auto max-w-[240px]">
                <TemplateThumb
                  nameLeft={
                    (draft.content.cover as { nameLeft?: string } | undefined)
                      ?.nameLeft || displayLeft
                  }
                  nameRight={
                    (draft.content.cover as { nameRight?: string } | undefined)
                      ?.nameRight || displayRight
                  }
                  dateLine={
                    (draft.content.cover as { dateLine?: string } | undefined)
                      ?.dateLine || displayDate
                  }
                  theme={draft.theme}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    track('signup_open');
                    setSignupOpen(true);
                  }}
                >
                  Lưu thiệp này
                </Button>
                <Button type="button" variant="outline" onClick={goEdit}>
                  Chỉnh sửa tiếp
                </Button>
              </div>
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Gợi ý tiếp theo</p>
                <ul className="space-y-2 text-sm text-secondary-foreground">
                  {TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
              <SignupSheet
                open={signupOpen}
                onOpenChange={setSignupOpen}
                invitationId={draft.id}
                onClaimed={goEdit}
              />
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default CreateInvitationPage;
