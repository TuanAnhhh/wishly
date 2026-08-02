import { Outlet, useParams } from 'react-router-dom';
import { resolveBackTo, useLeafHandle } from '../../app/route-handle';
import { StudioLayout } from './StudioLayout';
import { useDocumentTitle } from './useDocumentTitle';

/**
 * Layout route for the standard studio chrome. Renders once for the whole
 * group; per-route differences come from the route's `handle`.
 */
export function StudioShellRoute() {
  const handle = useLeafHandle();
  const params = useParams();
  const HeaderRight = handle.HeaderRight;
  useDocumentTitle(handle.title);

  return (
    <StudioLayout
      backTo={resolveBackTo(handle.backTo, params)}
      maxWidth={handle.maxWidth}
      headerMaxWidth={handle.headerMaxWidth}
      contentClassName={handle.contentClassName}
      hideFooter={handle.hideFooter}
      sticky={handle.sticky}
      fullBleed={handle.fullBleed}
      headerRight={HeaderRight ? <HeaderRight /> : null}
    >
      <Outlet />
    </StudioLayout>
  );
}

export default StudioShellRoute;
