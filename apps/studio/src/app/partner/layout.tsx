import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { partnerApi, queryKeys } from '@wishly/api-client';
import { Wordmark } from '@wishly/ui';

const links = [
  { to: '/partner', end: true, label: 'Khách hàng' },
  { to: '/partner/brand', label: 'Thương hiệu' },
  { to: '/partner/templates', label: 'Kho mẫu' },
  { to: '/partner/team', label: 'Nhân sự' },
  { to: '/partner/billing', label: 'Gói & hoá đơn' },
] as const;

export function PartnerLayout() {
  const me = useQuery({
    queryKey: queryKeys.partner.me(),
    queryFn: () => partnerApi.me(),
  });
  const partner = me.data?.partner;

  return (
    <div className="min-h-screen bg-[color-mix(in_srgb,var(--background)_92%,#e8e0d4)]">
      <header className="border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wordmark className="text-lg" />
            <span className="text-sm text-secondary-foreground">
              {partner?.name ?? 'Studio đối tác'}
            </span>
          </div>
          <NavLink
            to="/dashboard"
            className="text-sm underline-offset-4 hover:underline"
          >
            Thiệp cá nhân
          </NavLink>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="flex shrink-0 flex-row gap-2 overflow-x-auto md:w-44 md:flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={'end' in l ? l.end : false}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-secondary-foreground hover:bg-muted'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
