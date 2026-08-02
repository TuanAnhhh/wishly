import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@wishly/ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Site-wide 500 — never expose stack / internal codes to the user. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Dev-only; production should go to a log sink without PII.
    if (import.meta.env.DEV) {
      console.error('AppErrorBoundary', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen">
        <ErrorState
          tone="error"
          title="Hệ thống của chúng tôi đang gặp sự cố"
          body="Đây là lỗi phía chúng tôi, không phải do bạn. Thiệp, danh sách khách và phản hồi của bạn vẫn an toàn."
          primary={{
            label: 'Tải lại trang',
            onClick: () => window.location.reload(),
          }}
          secondary={{
            label: 'Nhắn Zalo cho hỗ trợ',
            href: 'https://zalo.me/',
          }}
          hint="Hotline 1900 6868 · 8:00–21:00"
        />
      </main>
    );
  }
}
