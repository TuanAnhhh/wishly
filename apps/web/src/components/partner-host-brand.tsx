import { useQuery } from '@tanstack/react-query';
import { partnerApi, queryKeys } from '@wishly/api-client';
import { useEffect } from 'react';

/**
 * Stage-1 subdomain: `{sub}.thiepviet.vn` (or `*.localhost` in dev).
 * Custom domains deferred — API always returns customDomainDeferred: true.
 */
function detectSubdomain(): string | null {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  const parts = host.split('.');
  if (parts.length < 3) return null;
  const sub = parts[0]!;
  if (['www', 'api', 'studio', 'app'].includes(sub)) return null;
  return sub;
}

export function PartnerHostBrand() {
  const sub = detectSubdomain();
  const q = useQuery({
    queryKey: queryKeys.partner.publicBrand(sub ?? ''),
    queryFn: () => partnerApi.publicBrand(sub!),
    enabled: Boolean(sub),
    retry: false,
  });

  useEffect(() => {
    if (!q.data?.color) return;
    document.documentElement.style.setProperty('--partner-accent', q.data.color);
    if (q.data.partnerName) {
      document.title = q.data.partnerName;
    }
  }, [q.data]);

  return null;
}
