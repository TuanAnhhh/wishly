import { Link } from 'react-router-dom';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { BaseDropdownMenu, Button } from '@wishly/ui';

export type GuestActionBarProps = {
  invitationId: string;
  onSendZalo: () => void;
};

/** Page heading + primary actions for Quản lý khách mời. */
export function GuestActionBar({
  invitationId,
  onSendZalo,
}: GuestActionBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h1 className="font-serif text-3xl leading-[1.25]">Quản lý khách mời</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to={`/edit/${invitationId}`}>Sửa thiệp</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/edit/${invitationId}/post-event`}>Thống kê</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/edit/${invitationId}/seating`}>Sơ đồ bàn tiệc</Link>
        </Button>
        <Button type="button" size="sm" onClick={onSendZalo}>
          Gửi thiệp qua Zalo
        </Button>
        <BaseDropdownMenu
          trigger={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Thêm thao tác"
            >
              <EllipsisHorizontalIcon className="size-4" />
            </Button>
          }
          items={[
            {
              label: 'Cài đặt riêng tư',
              render: (c) => <Link to={`/edit/${invitationId}/privacy`}>{c}</Link>,
            },
            {
              label: 'Quét check-in',
              render: (c) => <Link to={`/edit/${invitationId}/staff`}>{c}</Link>,
            },
            {
              label: 'Sau sự kiện',
              render: (c) => (
                <Link to={`/edit/${invitationId}/post-event`}>{c}</Link>
              ),
            },
          ]}
        />
      </div>
    </header>
  );
}

export default GuestActionBar;
