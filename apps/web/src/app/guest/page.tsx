import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { vietQrImageUrl } from '@wishly/contracts';
import { queryKeys } from '@wishly/api-client';
import { InvitationRenderer, type CorpLang } from '@wishly/templates';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media-url';
import { ExpiredState } from '../invitation-page.expired';
import { LangToggle } from '../../components/lang-toggle';

const LANG_KEY = 'wishly:inv-lang';

export function GuestInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useState<CorpLang>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return v === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  const guestQuery = useQuery({
    queryKey: queryKeys.public.guestToken(token ?? ''),
    queryFn: () => api.getGuestByToken(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const data = guestQuery.data;
  const wishesQuery = useQuery({
    queryKey: ['public', 'wishes', data?.invitation.id ?? ''],
    queryFn: () => api.listPublicWishes(data!.invitation.id),
    enabled: Boolean(data?.invitation.id),
  });
  const wishes = wishesQuery.data ?? [];

  useEffect(() => {
    if (!data) return;
    document.title = `${data.guest.name} ơi — Thiệp Việt`;
    if (data.guest.lang === 'en' || data.guest.lang === 'vi') {
      setLang(data.guest.lang);
    }
  }, [data]);

  const giftQrUrls = useMemo(() => {
    const accounts =
      (
        data?.invitation.content as {
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
        invitationId: data!.invitation.id,
        guestToken: token,
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
        invitationId: data!.invitation.id,
        name: payload.name,
        message: payload.message,
      }),
    onSuccess: () => void wishesQuery.refetch(),
  });

  function onLang(next: CorpLang) {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (guestQuery.isError) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">Không mở được thiệp</h1>
        <p className="text-sm text-secondary-foreground">
          {guestQuery.error instanceof Error
            ? guestQuery.error.message
            : 'Link có thể đã hết hạn.'}
        </p>
        <Link className="text-primary underline" to="/">
          Về trang chủ
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-secondary-foreground">
        Đang mở thiệp…
      </main>
    );
  }

  const corporate = data.invitation.eventType === 'CORPORATE';
  const ended = data.invitation.ended ?? false;

  return (
    <>
      {ended ? (
        <ExpiredState albumUrl={`/album/${data.invitation.slug}`} />
      ) : null}
      {corporate ? <LangToggle lang={lang} onChange={onLang} /> : null}
      <InvitationRenderer
        content={data.invitation.content}
        theme={data.invitation.theme}
        blocks={data.invitation.blocks as never}
        tier={data.invitation.tier ?? 'FREE'}
        resolveMedia={resolveMediaUrl}
        readOnly={ended}
        brandColor={data.invitation.brandColor}
        lang={lang}
        interactions={
          !ended
            ? {
                wishes,
                giftQrUrls,
                lang,
                eventType: data.invitation.eventType as never,
                guestName: data.guest.name,
                onRsvp: async (payload) => {
                  await rsvp.mutateAsync(payload);
                },
                onGuestbook: async ({ name, message }) => {
                  await guestbook.mutateAsync({ name, message });
                },
              }
            : {
                wishes,
                giftQrUrls,
                lang,
                eventType: data.invitation.eventType as never,
                guestName: data.guest.name,
              }
        }
      />
    </>
  );
}

export default GuestInvitationPage;
