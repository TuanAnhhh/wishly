export type FunnelStep =
  | 'landing_view'
  | 'onboarding_1'
  | 'onboarding_2'
  | 'onboarding_3'
  | 'onboarding_4'
  | 'signup_open'
  | 'claim';

const KEY = 'wishly_funnel';

type FunnelEvent = {
  step: FunnelStep;
  at: string;
  meta?: Record<string, string>;
};

function read(): FunnelEvent[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FunnelEvent[]) : [];
  } catch {
    return [];
  }
}

/** Lightweight funnel — sessionStorage + optional dataLayer. */
export function track(step: FunnelStep, meta?: Record<string, string>) {
  const event: FunnelEvent = {
    step,
    at: new Date().toISOString(),
    meta,
  };
  const next = [...read(), event];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  const w = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  w.dataLayer?.push({ event: 'wishly_funnel', step, ...meta });
}

export function getFunnelEvents(): FunnelEvent[] {
  return read();
}
