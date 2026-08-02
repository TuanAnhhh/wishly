import { useMemo } from 'react';
import type { ComponentType } from 'react';
import { useMatches, type Params } from 'react-router-dom';

export type CrumbContext = { invitationName?: string };

/**
 * Static per-route config read by the shell layout routes, so pages render
 * content only and the chrome is declared next to the route.
 */
export type RouteHandle = {
  /** Breadcrumb label. Function form receives context the shell can resolve. */
  crumb?: string | ((ctx: CrumbContext) => string);
  title?: string; /** Page title. */
  maxWidth?: string;
  headerMaxWidth?: string;
  contentClassName?: string;
  hideFooter?: boolean;
  /** Keep the header pinned while scrolling (long form pages). */
  sticky?: boolean;
  /** Page owns its horizontal rhythm — full-width bands instead of one column. */
  fullBleed?: boolean;
  /** Function form for routes whose back target depends on params. */
  backTo?: string | ((params: Params) => string);
  /** Rendered on the right of the header. Fetches its own data. */
  HeaderRight?: ComponentType;
};

/** Merge handles from root to leaf so layout routes can set defaults. */
export function useLeafHandle(): RouteHandle {
  const matches = useMatches();
  return useMemo(
    () =>
      matches.reduce<RouteHandle>(
        (acc, match) => Object.assign(acc, (match.handle as RouteHandle) ?? {}),
        {}
      ),
    [matches]
  );
}

export function resolveBackTo(
  backTo: RouteHandle['backTo'],
  params: Params
): string | undefined {
  return typeof backTo === 'function' ? backTo(params) : backTo;
}

export function resolveCrumb(
  crumb: RouteHandle['crumb'],
  ctx: CrumbContext
): string | undefined {
  return typeof crumb === 'function' ? crumb(ctx) : crumb;
}
