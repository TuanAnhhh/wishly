import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@wishly/ui';
import { privacyApi, queryKeys } from '@wishly/api-client';
import { api } from '../../lib/api';
import {
  exportGuestsXlsx,
  guestsToImportText,
  parseGiftsFromFile,
  parseGuestsFromFile,
} from '../../lib/guest-files';
import { useInvitation } from '../edit/invitation-context';
import { AddGuestDialog } from './AddGuestDialog';
import { SendZaloDialog } from './SendZaloDialog';
import { GuestTable } from './GuestTable';
import { GuestActionBar } from './GuestActionBar';
import { GuestStatsCards } from './GuestStatsCards';
import { GuestbookPanel } from './GuestbookPanel';
import { GiftsPanel } from './GiftsPanel';
import { MealsPanel } from './MealsPanel';

type Tab = 'guests' | 'guestbook' | 'gifts' | 'meals';
type Guest = Awaited<ReturnType<typeof api.listGuests>>['guests'][number];

function apiBase() {
  const configured = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;
  return (
    configured && configured.startsWith('http')
      ? configured
      : 'http://localhost:3001/api'
  ).replace(/\/$/, '');
}

function guestShareUrl(token: string) {
  return `${apiBase()}/guests/public/${token}/share`;
}

export function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('guests');
  const [addOpen, setAddOpen] = useState(false);
  const [zaloOpen, setZaloOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const { invitation: inv } = useInvitation();
  const guestsQuery = useQuery({
    queryKey: queryKeys.guests.list(id ?? ''),
    queryFn: () => api.listGuests(id!),
    enabled: Boolean(id),
  });
  const othersQuery = useQuery({
    queryKey: queryKeys.invitations.mine(),
    queryFn: () => api.listInvitations(),
    select: (list) => list.filter((inv) => inv.id !== id),
    enabled: Boolean(id),
  });
  const privacyQuery = useQuery({
    queryKey: queryKeys.privacy.settings(id ?? ''),
    queryFn: () => privacyApi.getSettings(id!),
    enabled: Boolean(id),
  });
  const guestbookQuery = useQuery({
    queryKey: queryKeys.guests.guestbook(id ?? ''),
    queryFn: () => api.listGuestbook(id!),
    enabled: Boolean(id) && tab === 'guestbook',
  });
  const giftsQuery = useQuery({
    queryKey: queryKeys.guests.gifts(id ?? ''),
    queryFn: () => api.listGiftEntries(id!),
    enabled: Boolean(id) && tab === 'gifts',
  });

  const data = guestsQuery.data ?? null;
  const otherInvites = othersQuery.data ?? [];
  const consent = Boolean(privacyQuery.data?.consentGiven);
  const guestbook = guestbookQuery.data ?? [];
  const gifts = giftsQuery.data ?? null;

  const reload = () => {
    if (!id) return;
    void qc.invalidateQueries({ queryKey: queryKeys.guests.list(id) });
  };

  const giveConsent = useMutation({
    mutationFn: () => privacyApi.giveConsent(id!),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.privacy.settings(id!) }),
  });

  const stats = useMemo(() => {
    const guests = data?.guests ?? [];
    return {
      yes: guests.filter((g) => g.rsvp?.attending === true).length,
      no: guests.filter((g) => g.rsvp?.attending === false).length,
      pending: guests.filter((g) => g.rsvp == null).length,
    };
  }, [data]);

  const mealStats = useMemo(() => {
    const attending = (data?.guests ?? []).filter((g) => g.rsvp?.attending === true);
    let standard = 0;
    let vegetarian = 0;
    const allergies: Array<{ name: string; allergyNote: string; mealChoice: string }> = [];
    for (const g of attending) {
      if (g.mealChoice === 'vegetarian') vegetarian += 1;
      else standard += 1;
      if (g.allergyNote?.trim()) {
        allergies.push({
          name: g.name,
          allergyNote: g.allergyNote.trim(),
          mealChoice: g.mealChoice === 'vegetarian' ? 'Chay' : 'Thường',
        });
      }
    }
    return { standard, vegetarian, allergies };
  }, [data]);

  const giftAccounts = useMemo(() => {
    const gift = (inv?.content as { gift?: { accounts?: unknown } } | undefined)?.gift;
    const accounts = Array.isArray(gift?.accounts) ? gift.accounts : [];
    return accounts as Array<{ side: string; owner: string; bank: string }>;
  }, [inv]);

  async function ensureConsent() {
    if (!id || consent) return true;
    setError('Cần xác nhận đồng ý xử lý dữ liệu khách (Nghị định 13/2023) trước.');
    return false;
  }

  async function onAddOne(input: { name: string; phone: string; group: string; note: string }) {
    if (!id || !input.name.trim() || !(await ensureConsent())) return;
    setLimitMsg(null);
    setError(null);
    try {
      await api.createGuest(id, {
        name: input.name.trim(),
        phone: input.phone.trim() || null,
        group: input.group || null,
        note: input.note.trim() || null,
      });
      setCopyMsg(`Đã thêm ${input.name.trim()}.`);
      await reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thêm được.';
      if (msg.includes('giới hạn') || msg.includes('GUEST_LIMIT')) setLimitMsg(msg);
      else setError(msg);
    }
  }

  async function onImportText(text: string) {
    if (!id || !(await ensureConsent())) return;
    try {
      const res = await api.importGuests(id, { text, consentAccepted: true });
      setCopyMsg(`Đã nhập ${res.imported} khách.`);
      await reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import thất bại.';
      if (msg.includes('giới hạn')) setLimitMsg(msg);
      else setError(msg);
    }
  }

  async function onImportExcel(file: File) {
    if (!id || !(await ensureConsent())) return;
    try {
      const rows = await parseGuestsFromFile(file);
      if (!rows.length) {
        setError('File không có dòng khách hợp lệ.');
        return;
      }
      const res = await api.importGuests(id, {
        text: guestsToImportText(rows),
        consentAccepted: true,
      });
      setCopyMsg(`Đã nhập ${res.imported} khách từ Excel.`);
      await reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import Excel thất bại.';
      if (msg.includes('giới hạn')) setLimitMsg(msg);
      else setError(msg);
    }
  }

  async function onExportExcel() {
    const rows = (data?.guests ?? []).map((g) => ({
      name: g.name,
      phone: g.phone ?? '',
      group: g.group ?? '',
      note: g.note ?? '',
      rsvp: g.rsvp == null ? 'Chưa phản hồi' : g.rsvp.attending ? 'Sẽ đến' : 'Không đến',
      plusOnes: g.rsvp?.attending ? g.rsvp.plusOnes ?? 0 : undefined,
    }));
    await exportGuestsXlsx(rows, `guests-${data?.slug ?? id}.xlsx`);
    setCopyMsg(`Đã xuất ${rows.length} khách.`);
  }

  async function onCopyFrom(sourceId: string) {
    if (!id || !sourceId || !(await ensureConsent())) return;
    try {
      const res = await api.importGuestsFrom(id, sourceId);
      setCopyMsg(`Đã chép ${res.imported} khách từ thiệp cũ.`);
      await reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chép khách thất bại.';
      if (msg.includes('giới hạn')) setLimitMsg(msg);
      else setError(msg);
    }
  }

  async function onImportGiftFile(file: File, defaultSide: string) {
    if (!id) return;
    try {
      const rows = await parseGiftsFromFile(file, defaultSide);
      if (!rows.length) {
        setError('Không đọc được dòng tiền. Cần cột Số tiền / Ghi có và Tên hoặc Nội dung.');
        return;
      }
      const res = await api.importGiftEntries(id, { entries: rows, defaultSide });
      setCopyMsg(`Đã nhập ${res.imported} dòng vào sổ tiền mừng.`);
      void qc.invalidateQueries({ queryKey: queryKeys.guests.gifts(id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import sao kê thất bại.');
    }
  }

  function onCopyLink(g: Guest) {
    void navigator.clipboard.writeText(guestShareUrl(g.token));
    setCopyMsg(`Đã chép link riêng của ${g.name}.`);
  }

  async function onZaloForGuest(g: Guest) {
    if (!id) return;
    if (g.rsvp == null) {
      try {
        const res = await api.remindGuest(id, g.id);
        window.open(`https://zalo.me/?text=${encodeURIComponent(res.text)}`, '_blank', 'noopener,noreferrer');
        setCopyMsg(
          res.lastReminder
            ? 'Đã mở Zalo — đây là lần nhắc cuối cho khách này.'
            : 'Đã mở Zalo để nhắc khách.'
        );
        reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nhắc khách thất bại.');
      }
      return;
    }
    const text = `${g.name} ơi, đây là thiệp mời của tụi mình — mời bạn xem lại nhé: ${guestShareUrl(g.token)}`;
    window.open(`https://zalo.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function onDeleteGuest(g: Guest) {
    if (!id) return;
    void api.deleteGuest(id, g.id).then(reload);
  }

  async function loadMessages(pendingOnly: boolean) {
    if (!id) return { messages: [], hint: '' };
    return api.guestMessages(id, { pendingOnly });
  }

  async function copyAllMessages(messages: Array<{ text: string }>) {
    const blob = messages.map((m) => m.text).join('\n\n---\n\n');
    await navigator.clipboard.writeText(blob);
    setCopyMsg(`Đã chép ${messages.length} tin nhắn.`);
    if (id && messages.length > 0) void api.markBulkSent(id).catch(() => undefined);
  }

  if (!id) return null;

  return (
    <>
      <GuestActionBar invitationId={id} onSendZalo={() => setZaloOpen(true)} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {limitMsg ? (
        <div className="space-y-2 border border-primary bg-card p-4">
          <p className="text-sm">{limitMsg}</p>
          <p className="text-sm text-secondary-foreground">
            Nâng cấp gói để thêm khách — đây là chỗ chuyển đổi chính của sản phẩm.
          </p>
          <Button asChild size="sm">
            <Link to={`/upgrade/${id}`}>Nâng cấp gói</Link>
          </Button>
        </div>
      ) : null}
      {copyMsg ? <p className="text-sm text-secondary-foreground">{copyMsg}</p> : null}

      <GuestStatsCards count={data?.count ?? null} yes={stats.yes} no={stats.no} pending={stats.pending} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList variant="line">
          <TabsTrigger value="guests" className="after:bg-primary">
            Khách mời
          </TabsTrigger>
          <TabsTrigger value="guestbook" className="after:bg-primary">
            Lời chúc đã nhận
          </TabsTrigger>
          <TabsTrigger value="gifts" className="after:bg-primary">
            Tiền mừng đã nhận
          </TabsTrigger>
          {data?.eventType === 'CORPORATE' ? (
            <TabsTrigger value="meals" className="after:bg-primary">
              Suất ăn
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="guests" className="pt-4">
          <GuestTable
            guests={data?.guests ?? []}
            count={data?.count ?? 0}
            onRemind={(g) => void onZaloForGuest(g)}
            onCopyLink={onCopyLink}
            onDelete={onDeleteGuest}
            onAddFirst={() => setAddOpen(true)}
            onAdd={() => setAddOpen(true)}
            onImportExcel={(file) => void onImportExcel(file)}
            onExportExcel={() => void onExportExcel()}
            canImport={consent}
          />
        </TabsContent>

        <TabsContent value="guestbook" className="pt-4">
          <GuestbookPanel
            entries={guestbook}
            onModerate={(entryId, status) =>
              void api
                .moderateGuestbook(id, entryId, status)
                .then(() => qc.invalidateQueries({ queryKey: queryKeys.guests.guestbook(id) }))
            }
            onEmptyAction={() => setZaloOpen(true)}
          />
        </TabsContent>

        <TabsContent value="gifts" className="pt-4">
          <GiftsPanel
            gifts={gifts}
            accounts={giftAccounts}
            onAdd={(entry) =>
              void api
                .createGiftEntry(id, entry)
                .then(() => qc.invalidateQueries({ queryKey: queryKeys.guests.gifts(id) }))
            }
            onDelete={(entryId) =>
              void api
                .deleteGiftEntry(id, entryId)
                .then(() => qc.invalidateQueries({ queryKey: queryKeys.guests.gifts(id) }))
            }
            onImportFile={(file, defaultSide) => void onImportGiftFile(file, defaultSide)}
          />
        </TabsContent>

        {data?.eventType === 'CORPORATE' ? (
          <TabsContent value="meals" className="pt-4">
            <MealsPanel {...mealStats} onEmptyAction={() => setTab('guests')} />
          </TabsContent>
        ) : null}
      </Tabs>

      <AddGuestDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        consent={consent}
        onConsentToggle={(checked) => checked && giveConsent.mutate()}
        groups={data?.groups ?? []}
        otherInvites={otherInvites}
        onAddOne={onAddOne}
        onImportText={onImportText}
        onCopyFrom={onCopyFrom}
        error={error}
        limitMsg={limitMsg}
      />
      <SendZaloDialog
        open={zaloOpen}
        onOpenChange={setZaloOpen}
        onLoad={loadMessages}
        onCopyAll={copyAllMessages}
      />
    </>
  );
}

export default GuestsPage;
