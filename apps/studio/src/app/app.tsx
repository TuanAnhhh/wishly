import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorState } from '@wishly/ui';
import { UpgradeSteps } from '../components/header/UpgradeSteps';
import { StudioShellRoute } from '../components/layout/StudioShellRoute';
import type { RouteHandle } from './route-handle';
import { DashboardPage } from './dashboard/page';
import { CreatePage } from './create/page';
import { EditDataRoute } from './edit/EditDataRoute';
import { EditPage } from './edit/page';
import { GuestsPage } from './guests/page';
import { SeatingPage } from './seating/page';
import { SeatingPrintPage } from './seating/print-page';
import { StaffPage } from './staff/page';
import { UiPatternsPage } from './dev/ui-patterns-page';
import { UpgradePage } from './upgrade/page';
import { PrivacyPage } from './settings/privacy-page';
import { PostEventPage } from './post-event/page';
import { PartnerLayout } from './partner/layout';
import { PartnerClientsPage } from './partner/clients-page';
import { PartnerBrandPage } from './partner/brand-page';
import { PartnerTemplatesPage } from './partner/templates-page';
import { PartnerTeamPage } from './partner/team-page';
import { PartnerBillingPage } from './partner/billing-page';
import { PartnerAcceptPage } from './partner/accept-page';

function StudioNotFound() {
  return (
    <main className="min-h-screen">
      <ErrorState
        tone="warn"
        title="Trang bạn tìm không có ở đây"
        body="Quay về danh sách thiệp hoặc tạo thiệp mới."
        primary={{ label: 'Về trang chủ', href: '/dashboard' }}
        secondary={{ label: 'Tạo thiệp mới', href: '/create' }}
      />
    </main>
  );
}

const handle = (h: RouteHandle) => h;

/**
 * Headless render target for tools/verify-template.ts — no shell, no chrome,
 * bypasses `StudioShellRoute` auth. Must never reach production.
 *
 * Gated on `import.meta.env.DEV`, which `vite build` (production mode by
 * default) inlines as the literal `false` — so at runtime `devOnlyRoutes` is
 * always `[]` in the shipped bundle and this route is never registered with
 * the router. That's the actual security guarantee (plain JS evaluation,
 * not bundler optimization): even if the `template-verify-page` chunk file
 * still ends up emitted in `dist/assets/` (observed in a local prod build —
 * Rollup/Rolldown doesn't always physically delete an async-imported chunk
 * just because the only call site is dead code), nothing in the running app
 * can ever construct a route pointing at it. Do not switch this to a static
 * top-level import of the page — that would defeat even the chunk-splitting.
 */
const devOnlyRoutes = import.meta.env.DEV
  ? [
      {
        path: '/_dev/templates/verify',
        lazy: () =>
          import('./dev/template-verify-page').then((m) => ({
            Component: m.TemplateVerifyPage,
          })),
      },
      {
        path: '/_dev/templates/thumbs',
        lazy: () =>
          import('./dev/template-thumb-gallery-page').then((m) => ({
            Component: m.TemplateThumbGalleryPage,
          })),
      },
    ]
  : [];

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  ...devOnlyRoutes,

  {
    element: <StudioShellRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
        handle: handle({
          title: 'Thiệp của bạn',
        }),
      },
      {
        path: '/create',
        element: <CreatePage />,
        handle: handle({
          title: 'Tạo thiệp mới',
          crumb: 'Tạo thiệp mới',
          fullBleed: true,
          contentClassName: '',
        }),
      },
      {
        path: '/upgrade/:invitationId',
        element: <UpgradePage />,
        handle: handle({
          title: 'Nâng cấp gói',
          crumb: 'Nâng cấp gói',
          maxWidth: 'max-w-4xl',
          headerMaxWidth: 'max-w-6xl',
          contentClassName: 'py-8 sm:py-12',
          backTo: (params) => `/edit/${params.invitationId}`,
          HeaderRight: UpgradeSteps,
        }),
      },
      {
        path: '/dev/ui-patterns',
        element: <UiPatternsPage />,
        handle: handle({
          title: 'UI Patterns Playground',
          crumb: 'UI Patterns',
          maxWidth: 'max-w-3xl',
          contentClassName: 'space-y-8 py-8',
        }),
      },
      {
        path: '/partner/accept',
        element: <PartnerAcceptPage />,
        handle: handle({
          title: 'Nhận lời mời',
          maxWidth: 'max-w-xl',
          contentClassName: 'py-16',
        }),
      },
    ],
  },

  {
    path: '/edit/:id',
    element: <EditDataRoute />,
    handle: handle({
      crumb: (ctx) => ctx.invitationName ?? 'Thiệp mời',
    }),
    children: [
      { index: true, element: <EditPage /> },
      { path: 'seating/print', element: <SeatingPrintPage /> },
      {
        element: <StudioShellRoute />,
        children: [
          {
            path: 'guests',
            element: <GuestsPage />,
            handle: handle({
              title: 'Quản lý khách mời',
              crumb: 'Quản lý khách mời',
              contentClassName: 'space-y-6 py-8',
            }),
          },
          {
            path: 'seating',
            element: <SeatingPage />,
            handle: handle({
              title: 'Sơ đồ bàn tiệc',
              crumb: 'Sơ đồ bàn tiệc',
              contentClassName: 'space-y-4 py-8',
            }),
          },
          {
            path: 'staff',
            element: <StaffPage />,
            handle: handle({
              title: 'Nhân viên check-in',
              crumb: 'Nhân viên check-in',
              maxWidth: 'max-w-2xl',
            }),
          },
          {
            path: 'privacy',
            element: <PrivacyPage />,
            handle: handle({
              title: 'Cài đặt riêng tư',
              crumb: 'Cài đặt riêng tư',
              maxWidth: 'max-w-xl',
              contentClassName: 'space-y-8 py-10',
            }),
          },
          {
            path: 'post-event',
            element: <PostEventPage />,
            handle: handle({
              title: 'Sau sự kiện',
              crumb: 'Sau sự kiện',
              maxWidth: 'max-w-4xl',
              contentClassName: 'space-y-6 py-8',
            }),
          },
        ],
      },
    ],
  },

  {
    path: '/partner',
    element: <PartnerLayout />,
    children: [
      { index: true, element: <PartnerClientsPage /> },
      { path: 'brand', element: <PartnerBrandPage /> },
      { path: 'templates', element: <PartnerTemplatesPage /> },
      { path: 'team', element: <PartnerTeamPage /> },
      { path: 'billing', element: <PartnerBillingPage /> },
    ],
  },

  { path: '*', element: <StudioNotFound /> },
]);

export default router;
