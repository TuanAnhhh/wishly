import { Fragment } from 'react';
import { Link, useMatches } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@wishly/ui';
import { resolveCrumb, type RouteHandle } from '../../app/route-handle';
import { useOptionalInvitation } from '../../app/edit/invitation-context';
import { invitationTitle } from '../../lib/invitation-name';

const HOME = { pathname: '/dashboard', label: 'Thiệp của bạn' };

/**
 * Single breadcrumb trail built from `handle.crumb` on the matched routes,
 * replacing the per-page back links.
 */
export function Breadcrumbs() {
  const matches = useMatches();
  const invitation = useOptionalInvitation();
  const invitationName = invitation
    ? invitationTitle(invitation.invitation)
    : undefined;

  const matched = matches.flatMap((match) => {
    const label = resolveCrumb((match.handle as RouteHandle)?.crumb, {
      invitationName,
    });
    return label ? [{ pathname: match.pathname, label }] : [];
  });

  if (matched.length === 0) return null;

  // The dashboard is the studio's home but not a route ancestor, so lead with it.
  const trail =
    matched[0].pathname === HOME.pathname ? matched : [HOME, ...matched];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <Fragment key={item.pathname}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.pathname}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default Breadcrumbs;
