import { Link } from 'react-router-dom';

type Props = {
  eventDate?: string | null;
  /** P11 (post-event album) isn't built yet — omit until it exists. */
  albumUrl?: string | null;
};

/** Copy ported verbatim from secondary-states.md §Group 2 "Hết hạn hiển thị". */
export function ExpiredState({ eventDate, albumUrl }: Props) {
  const dateText = eventDate
    ? new Date(eventDate).toLocaleDateString('vi-VN')
    : null;

  return (
    <div className="border-b border-border bg-muted px-4 py-10 text-center">
      <h1 className="font-serif text-2xl leading-[1.3]">
        Thiệp này đã ngừng hiển thị
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-secondary-foreground">
        Thiệp mời có thời hạn 12 tháng kể từ ngày phát hành.
        {dateText ? ` Tiệc cưới đã diễn ra ngày ${dateText}.` : ''}
      </p>
      {albumUrl ? (
        <Link
          to={albumUrl}
          className="mt-5 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Xem album ảnh cưới
        </Link>
      ) : null}
      <p className="mt-4 text-xs text-secondary-foreground">
        Là gia chủ và muốn mở lại thiệp? Đăng nhập rồi gia hạn trong Trang tài
        khoản.
      </p>
    </div>
  );
}

export default ExpiredState;
