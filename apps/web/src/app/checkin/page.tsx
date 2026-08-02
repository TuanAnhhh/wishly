import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ApiError,
  checkinApi,
  type CheckinGuestView,
  type CheckinRoster,
} from '@wishly/api-client';
import {
  BaseTextField,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Progress,
} from '@wishly/ui';
import {
  cacheRoster,
  clearCheckinLocal,
  clearQueueItems,
  enqueueCheckin,
  findByPassCode,
  loadCachedRoster,
  loadQueue,
  loadStaffToken,
  markLocalCheckedIn,
  rosterAgeHours,
  saveStaffToken,
  searchGuests,
} from '../../lib/checkin-store';
import { createQrScanner } from '../../lib/qr-scanner';

type Mode = 'scan' | 'success' | 'invalid' | 'dup' | 'search' | 'walkin';

type State = {
  mode: Mode;
  guest: CheckinGuestView | null;
  dupAt: string | null;
};

type Action =
  | { type: 'scan' }
  | { type: 'success'; guest: CheckinGuestView }
  | { type: 'dup'; guest: CheckinGuestView; at: string }
  | { type: 'invalid' }
  | { type: 'search' }
  | { type: 'walkin' };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'scan':
      return { mode: 'scan', guest: null, dupAt: null };
    case 'success':
      return { mode: 'success', guest: action.guest, dupAt: null };
    case 'dup':
      return { mode: 'dup', guest: action.guest, dupAt: action.at };
    case 'invalid':
      return { mode: 'invalid', guest: null, dupAt: null };
    case 'search':
      return { mode: 'search', guest: null, dupAt: null };
    case 'walkin':
      return { mode: 'walkin', guest: null, dupAt: null };
  }
}

function toView(g: {
  id: string;
  name: string;
  group: string | null;
  partySize: number;
  tableLabel: string | null;
  checkedInAt: string | null;
  walkIn: boolean;
}): CheckinGuestView {
  return {
    id: g.id,
    name: g.name,
    group: g.group,
    partySize: g.partySize,
    tableLabel: g.tableLabel,
    checkedInAt: g.checkedInAt,
    walkIn: g.walkIn,
  };
}

export function CheckinPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState<string | null>(() => {
    const q = params.get('s');
    if (q) {
      saveStaffToken(q);
      return q;
    }
    return loadStaffToken();
  });
  const [roster, setRoster] = useState<CheckinRoster | null>(() =>
    loadCachedRoster()
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [queueLen, setQueueLen] = useState(() => loadQueue().length);
  const [q, setQ] = useState('');
  const [walkName, setWalkName] = useState('');
  const [walkSize, setWalkSize] = useState('1');
  const [state, dispatch] = useReducer(reducer, {
    mode: 'scan',
    guest: null,
    dupAt: null,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScanRef = useRef('');
  const scanningRef = useRef(false);

  const refreshQueueBadge = () => setQueueLen(loadQueue().length);

  const loadRoster = useCallback(async (staffToken: string) => {
    try {
      const data = await checkinApi.roster(staffToken);
      cacheRoster(data);
      setRoster(data);
      setLoadError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearCheckinLocal();
        setToken(null);
        setLoadError('Link nhân viên không còn hiệu lực.');
        return;
      }
      const cached = loadCachedRoster();
      if (cached) {
        setRoster(cached);
        setLoadError('Đang dùng danh sách đã lưu — mạng chập chờn.');
      } else {
        setLoadError(
          e instanceof Error ? e.message : 'Không tải được danh sách khách.'
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadRoster(token);
  }, [token, loadRoster]);

  const flushQueue = useCallback(async () => {
    if (!token) return;
    const items = loadQueue();
    if (!items.length) return;
    try {
      await checkinApi.sync(token, { items });
      clearQueueItems(items.map((i) => i.guestId));
      refreshQueueBadge();
      void loadRoster(token);
    } catch {
      /* keep queue */
    }
  }, [token, loadRoster]);

  useEffect(() => {
    const id = window.setInterval(() => void flushQueue(), 10_000);
    const onOnline = () => void flushQueue();
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
    };
  }, [flushQueue]);

  const applyLocalOk = useCallback(
    (guestId: string) => {
      if (!roster) return null;
      const at = new Date().toISOString();
      enqueueCheckin(guestId, at);
      refreshQueueBadge();
      const next = markLocalCheckedIn(roster, guestId, at);
      setRoster(next);
      const g = next.guests.find((x) => x.id === guestId);
      return g ? toView(g) : null;
    },
    [roster]
  );

  const handlePassCode = useCallback(
    async (raw: string) => {
      if (!token || !roster || scanningRef.current) return;
      const code = raw.trim().toUpperCase();
      if (!code || code === lastScanRef.current) return;
      lastScanRef.current = code;
      scanningRef.current = true;

      const local = findByPassCode(roster.guests, code);
      if (!local) {
        dispatch({ type: 'invalid' });
        scanningRef.current = false;
        return;
      }
      if (local.checkedInAt) {
        dispatch({
          type: 'dup',
          guest: toView(local),
          at: local.checkedInAt,
        });
        scanningRef.current = false;
        return;
      }

      const view = applyLocalOk(local.id);
      if (view) dispatch({ type: 'success', guest: view });

      try {
        const res = await checkinApi.scan(token, { passCode: code });
        if (res.result === 'dup') {
          dispatch({ type: 'dup', guest: res.guest, at: res.at });
        } else if (res.result === 'ok') {
          dispatch({ type: 'success', guest: res.guest });
        } else {
          dispatch({ type: 'invalid' });
        }
      } catch {
        /* offline — local optimistic already applied */
      } finally {
        scanningRef.current = false;
      }
    },
    [token, roster, applyLocalOk]
  );

  useEffect(() => {
    if (state.mode !== 'success' && state.mode !== 'dup') return;
    const t = window.setTimeout(() => {
      lastScanRef.current = '';
      dispatch({ type: 'scan' });
    }, 2000);
    return () => window.clearTimeout(t);
  }, [state.mode]);

  useEffect(() => {
    if (state.mode !== 'scan' || !token || !videoRef.current) return;
    const scanner = createQrScanner();
    let active = true;
    void (async () => {
      try {
        await scanner.start(videoRef.current!, (text) => {
          if (active) void handlePassCode(text);
        });
        setCameraDenied(false);
      } catch {
        setCameraDenied(true);
      }
    })();
    return () => {
      active = false;
      scanner.stop();
    };
  }, [state.mode, token, handlePassCode]);

  if (!token) {
    return (
      <main className="min-h-screen bg-[#1a1612] px-4 py-12 text-primary-foreground">
        <ErrorState
          className="text-primary-foreground"
          tone="warn"
          title="Thiếu link nhân viên"
          body="Mở đúng link chủ thiệp cấp (có mã s=…), hoặc xin cấp lại trong studio."
          primary={{ label: 'Về trang chủ', href: '/' }}
        />
      </main>
    );
  }

  if (!roster && loadError) {
    return (
      <main className="min-h-screen bg-[#1a1612] px-4 py-12">
        <ErrorState
          title="Không mở được quầy check-in"
          body={loadError}
          primary={{
            label: 'Thử lại',
            onClick: () => token && void loadRoster(token),
          }}
        />
      </main>
    );
  }

  if (!roster) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1612] text-primary-foreground">
        Đang tải danh sách khách…
      </main>
    );
  }

  const arrived = roster.guests
    .filter((g) => g.checkedInAt)
    .reduce((s, g) => s + g.partySize, 0);
  const total = roster.guests.reduce((s, g) => s + g.partySize, 0);
  const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;
  const stale = rosterAgeHours(roster) > 2;
  const hits = searchGuests(roster.guests, q);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-[#1a1612] text-primary-foreground">
      <header className="space-y-2 px-4 py-4">
        <p className="text-xs uppercase tracking-micro text-warning">
          Check-in
        </p>
        <div className="flex items-end justify-between gap-3">
          <p className="font-serif text-2xl">
            {arrived}/{total}
          </p>
          {queueLen > 0 ? (
            <span className="rounded bg-warning/20 px-2 py-1 text-xs text-warning">
              {queueLen} chờ đồng bộ
            </span>
          ) : null}
        </div>
        <Progress value={pct} className="bg-white/10" />
        {stale ? (
          <p className="text-xs text-warning">
            Danh sách cũ hơn 2 giờ — sẽ làm mới khi có mạng.
          </p>
        ) : null}
        {loadError ? (
          <p className="text-xs text-warning">{loadError}</p>
        ) : null}
      </header>

      <div className="relative flex-1 px-4 pb-24">
        {state.mode === 'scan' ? (
          <div className="space-y-3">
            {cameraDenied ? (
              <EmptyState
                className="text-primary-foreground"
                title="Chưa có quyền camera"
                body="Trên iPhone: Cài đặt → Safari → Camera. Hoặc dùng tìm theo tên bên dưới."
                primary={{
                  label: 'Tìm theo tên',
                  onClick: () => dispatch({ type: 'search' }),
                }}
              />
            ) : (
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/20 bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-[18%] border-2 border-warning/80" />
                <div className="pointer-events-none absolute left-[18%] right-[18%] top-1/2 h-0.5 bg-warning" />
              </div>
            )}
            <Input
              className="bg-white/5 text-primary-foreground"
              placeholder="Gõ mã VP-… nếu camera hỏng"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handlePassCode((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
        ) : null}

        {state.mode === 'success' && state.guest ? (
          <Overlay tone="ok">
            <p className="font-serif text-3xl">{state.guest.name}</p>
            <p className="mt-1 text-sm opacity-80">
              {state.guest.group ?? 'Khách'}
            </p>
            {state.guest.tableLabel ? (
              <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-2 text-lg font-medium">
                {state.guest.tableLabel}
              </p>
            ) : null}
            <p className="mt-3 text-sm opacity-80">
              Đi cùng {Math.max(0, state.guest.partySize - 1)} người
            </p>
          </Overlay>
        ) : null}

        {state.mode === 'dup' && state.guest ? (
          <Overlay tone="warn">
            <p className="font-serif text-2xl">{state.guest.name}</p>
            <p className="mt-2 text-sm">
              Khách này đã check-in lúc{' '}
              {state.dupAt
                ? new Date(state.dupAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </p>
            {state.guest.tableLabel ? (
              <p className="mt-3 text-lg">{state.guest.tableLabel}</p>
            ) : null}
            <p className="mt-3 text-sm opacity-80">
              Đi cùng {Math.max(0, state.guest.partySize - 1)} người
            </p>
            <p className="mt-4 text-sm opacity-90">Mời khách vào luôn.</p>
          </Overlay>
        ) : null}

        {state.mode === 'invalid' ? (
          <Overlay tone="warn">
            <p className="font-serif text-2xl">Không nhận mã này</p>
            <p className="mt-2 text-sm opacity-90">
              Mã không thuộc tiệc đang check-in. Kiểm tra lại thẻ vào cổng.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => dispatch({ type: 'search' })}
              >
                Tìm theo tên
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  lastScanRef.current = '';
                  dispatch({ type: 'scan' });
                }}
              >
                Quét lại
              </Button>
            </div>
          </Overlay>
        ) : null}

        {state.mode === 'search' ? (
          <div className="space-y-3">
            <Input
              autoFocus
              className="bg-white/5 text-primary-foreground"
              placeholder="Tìm tên / SĐT (không cần dấu)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {hits.length === 0 ? (
              <EmptyState
                className="text-primary-foreground"
                title="Không thấy khách"
                body="Thêm khách tại cửa nếu họ không có trong danh sách."
                primary={{
                  label: 'Thêm khách tại cửa',
                  onClick: () => dispatch({ type: 'walkin' }),
                }}
              />
            ) : (
              <ul className="space-y-2">
                {hits.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 border border-white/15 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs opacity-70">
                        {[g.group, g.tableLabel, `${g.partySize} người`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {g.checkedInAt ? (
                      <span className="text-xs text-warning">Đã vào</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const view = applyLocalOk(g.id);
                          if (view) dispatch({ type: 'success', guest: view });
                          if (token) {
                            void checkinApi
                              .manual(token, { guestId: g.id })
                              .catch(() => undefined);
                          }
                        }}
                      >
                        Check-in
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {state.mode === 'walkin' ? (
          <div className="space-y-3">
            <BaseTextField
              label="Tên khách"
              labelClassName="text-primary-foreground"
              className="bg-white/5 text-primary-foreground"
              value={walkName}
              onChange={(e) => setWalkName(e.target.value)}
            />
            <BaseTextField
              label="Số người"
              labelClassName="text-primary-foreground"
              className="bg-white/5 text-primary-foreground"
              type="number"
              min={1}
              value={walkSize}
              onChange={(e) => setWalkSize(e.target.value)}
            />
            <Button
              type="button"
              disabled={!walkName.trim() || !token}
              onClick={() => {
                if (!token) return;
                void checkinApi
                  .walkIn(token, {
                    name: walkName.trim(),
                    partySize: Math.max(1, Number(walkSize) || 1),
                  })
                  .then((res) => {
                    if (res.result === 'ok') {
                      dispatch({ type: 'success', guest: res.guest });
                      void loadRoster(token);
                      setWalkName('');
                    }
                  })
                  .catch(() => dispatch({ type: 'invalid' }));
              }}
            >
              Check-in ngay
            </Button>
          </div>
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md gap-2 border-t border-white/10 bg-[#1a1612]/95 px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant={state.mode === 'scan' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => {
            lastScanRef.current = '';
            dispatch({ type: 'scan' });
          }}
        >
          Quét
        </Button>
        <Button
          type="button"
          size="sm"
          variant={state.mode === 'search' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => dispatch({ type: 'search' })}
        >
          Tìm tên
        </Button>
        <Button
          type="button"
          size="sm"
          variant={state.mode === 'walkin' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => dispatch({ type: 'walkin' })}
        >
          Walk-in
        </Button>
      </nav>
    </main>
  );
}

function Overlay({
  tone,
  children,
}: {
  tone: 'ok' | 'warn';
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[360px] flex-col items-center justify-center rounded-lg px-6 py-10 text-center ${
        tone === 'ok' ? 'bg-[#2d4a35]' : 'bg-[#4a3a22]'
      }`}
    >
      {children}
    </div>
  );
}

export default CheckinPage;
