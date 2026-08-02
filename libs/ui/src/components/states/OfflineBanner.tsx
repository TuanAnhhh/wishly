import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';

export type OfflineBannerProps = {
  /** Force visible (e.g. after a failed PATCH while still "online" briefly). */
  forced?: boolean;
  onRetry?: () => void;
  className?: string;
};

/**
 * Persistent editor banner. Copy from secondary-states.md:
 * reassures work is saved locally; editing continues offline.
 */
export function OfflineBanner({
  forced = false,
  onRetry,
  className,
}: OfflineBannerProps) {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline && !forced) return null;

  return (
    <div
      role="status"
      data-slot="offline-banner"
      className={cn(
        'sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-warning bg-warning/15 px-4 py-3 text-sm text-foreground',
        className
      )}
    >
      <p className="min-w-0 flex-1 leading-snug">
        Đang mất kết nối. Nội dung của bạn đã được lưu tạm trên máy — soạn tiếp
        bình thường, chúng tôi tự đồng bộ khi có mạng lại.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onRetry?.();
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            setOffline(false);
          }
        }}
      >
        Thử kết nối lại
      </Button>
    </div>
  );
}
