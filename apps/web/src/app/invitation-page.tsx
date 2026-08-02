import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { vietQrImageUrl } from '@wishly/contracts';
import { queryKeys } from '@wishly/api-client';
import { InvitationRenderer, type CorpLang } from '@wishly/templates';
import { ErrorState, LoadingSkeleton } from '@wishly/ui';
import { api, type PublicInvitation } from '../lib/api';
import { resolveMediaUrl } from '../lib/media-url';
import { ExpiredState } from './invitation-page.expired';
import { LangToggle } from '../components/lang-toggle';

type PublicRow = PublicInvitation & {
  id?: string;
  brandColor?: string | null;
  partnerBrand?: {
    color: string | null;
    signature: string | null;
    logoKey: string | null;
    partnerName: string;
  } | null;
};

const LANG_KEY = 'wishly:inv-lang';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<CorpLang>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return v === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  const invQuery = useQuery({
    queryKey: queryKeys.public.invitation(slug ?? ''),
    queryFn: () => api.fetchPublicInvitation(slug!),
    enabled: Boolean(slug),
    retry: false,
  });

  const data = invQuery.data as PublicRow | undefined;
  const wishesQuery = useQuery({
    queryKey: ['public', 'wishes', data?.id ?? ''],
    queryFn: () => api.listPublicWishes(data!.id!),
    enabled: Boolean(data?.id),
  });
  const wishes = wishesQuery.data ?? [];

  useEffect(() => {
    if (!data) return;
    const cover = data.content.cover as
      | { nameLeft?: string; nameRight?: string; dateLine?: string }
      | undefined;
    document.title =
      cover?.nameLeft && cover?.nameRight
        ? `${cover.nameLeft} & ${cover.nameRight} — Thiệp Việt`
        : `Thiệp mời — ${data.slug}`;
  }, [data]);

  const giftQrUrls = useMemo(() => {
    const accounts =
      (
        data?.content as {
          gift?: {
            accounts?: Array<{ bank: string; accountNo: string; owner: string }>;
          };
        }
      )?.gift?.accounts ?? [];
    const map: Record<string, string> = {};
    for (const a of accounts) {
      const url = vietQrImageUrl({
        bank: a.bank,
        accountNo: a.accountNo,
        accountName: a.owner,
      });
      if (url) map[a.accountNo] = url;
    }
    return map;
  }, [data]);

  const rsvp = useMutation({
    mutationFn: (payload: {
      name: string;
      attending: boolean;
      plusOnes?: number;
      note?: string;
      mealChoice?: 'standard' | 'vegetarian' | null;
      allergyNote?: string;
      lang?: CorpLang;
    }) =>
      api.submitRsvp({
        invitationId: data!.id!,
        name: payload.name,
        attending: payload.attending,
        plusOnes: payload.plusOnes ?? 0,
        note: payload.note,
        mealChoice: payload.mealChoice,
        allergyNote: payload.allergyNote,
        lang: payload.lang,
      }),
  });

  const guestbook = useMutation({
    mutationFn: (payload: { name: string; message: string }) =>
      api.submitGuestbook({
        invitationId: data!.id!,
        name: payload.name,
        message: payload.message,
      }),
    onSuccess: () => {
      if (data?.id) {
        void wishesQuery.refetch();
      }
    },
  });

  function onLang(next: CorpLang) {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (invQuery.isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          tone="warn"
          title="Link thiệp không còn dùng được"
          body="Có thể link đã hết hạn hoặc bị gõ sai. Liên hệ người gửi thiệp để nhận link mới."
          primary={{ label: 'Về trang chủ', href: '/' }}
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <LoadingSkeleton variant="invitation" />
      </main>
    );
  }

  const invitationId = data.id;
  const ended = data.ended ?? false;
  const corporate = data.eventType === 'CORPORATE';

  return (
    <>
      {ended ? (
        <ExpiredState
          eventDate={data.eventDate}
          albumUrl={`/album/${data.slug}`}
        />
      ) : null}
      {corporate ? <LangToggle lang={lang} onChange={onLang} /> : null}
      <InvitationRenderer
        content={data.content}
        theme={data.theme}
        blocks={data.blocks as never}
        tier={data.tier ?? 'FREE'}
        resolveMedia={resolveMediaUrl}
        readOnly={ended}
        brandColor={data.partnerBrand?.color ?? data.brandColor}
        footer={
          data.partnerBrand?.signature ? (
            <p
              style={{
                margin: 0,
                padding: '24px 20px 32px',
                textAlign: 'center',
                fontSize: 12,
                letterSpacing: '0.04em',
                color: 'var(--inv-muted, #8a8178)',
                borderTop:
                  '1px solid color-mix(in srgb, var(--inv-ink) 8%, transparent)',
              }}
            >
              {data.partnerBrand.signature}
            </p>
          ) : undefined
        }
        lang={lang}
        interactions={
          invitationId && !ended
            ? {
                wishes,
                giftQrUrls,
                lang,
                eventType: data.eventType as never,
                onRsvp: async (payload) => {
                  await rsvp.mutateAsync(payload);
                },
                onGuestbook: async ({ name, message }) => {
                  await guestbook.mutateAsync({ name, message });
                },
              }
            : { wishes, giftQrUrls, lang, eventType: data.eventType as never }
        }
      />
    </>
  );
}

export default InvitationPage;
