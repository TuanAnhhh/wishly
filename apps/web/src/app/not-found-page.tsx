import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@wishly/ui';

/** Site-wide 404 — secondary-states.md Group 2 */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen">
      <ErrorState
        tone="warn"
        title="Trang bạn tìm không có ở đây"
        body="Đường dẫn có thể đã đổi hoặc bạn gõ nhầm. Quay về trang chủ hoặc xem thư viện mẫu thiệp."
        primary={{
          label: 'Về trang chủ',
          onClick: () => navigate('/'),
        }}
        secondary={{
          label: 'Xem mẫu thiệp',
          onClick: () => navigate('/templates'),
        }}
      />
    </main>
  );
}

export default NotFoundPage;
