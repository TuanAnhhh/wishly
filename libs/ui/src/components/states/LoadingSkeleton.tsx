import { cn } from '../../lib/utils.js';
import { Skeleton } from '../ui/skeleton.js';

export type LoadingSkeletonVariant =
  | 'invitation'
  | 'guest-list'
  | 'upload'
  | 'publish';

export type LoadingSkeletonProps = {
  variant: LoadingSkeletonVariant;
  className?: string;
  /** guest-list: how many skeleton rows (default 4, then progressive). */
  rows?: number;
  /** publish: which of the 4 checklist steps are done (0–4). */
  publishStep?: number;
  /** upload: file rows to show. */
  uploadFiles?: Array<{
    name: string;
    status: 'pending' | 'uploading' | 'done' | 'failed';
    percent?: number;
    error?: string;
  }>;
};

const PUBLISH_STEPS = [
  'Kiểm tra nội dung và ảnh',
  'Tạo link riêng cho khách',
  'Dựng ảnh preview',
  'Bật RSVP',
] as const;

export function LoadingSkeleton({
  variant,
  className,
  rows = 4,
  publishStep = 0,
  uploadFiles = [],
}: LoadingSkeletonProps) {
  if (variant === 'invitation') {
    return (
      <div
        data-slot="loading-skeleton"
        data-variant="invitation"
        className={cn('mx-auto w-full max-w-lg px-4 py-8', className)}
        aria-busy
        aria-label="Đang mở thiệp"
      >
        {/* Cover — matches guest invitation layout to keep CLS ≤ 0.05 */}
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <div className="mt-8 flex flex-col items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-px w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="mt-8 aspect-[3/2] w-full rounded-lg" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (variant === 'guest-list') {
    return (
      <div
        data-slot="loading-skeleton"
        data-variant="guest-list"
        className={cn('space-y-4', className)}
        aria-busy
        aria-label="Đang tải danh sách khách"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <ul className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-border py-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (variant === 'upload') {
    return (
      <ul
        data-slot="loading-skeleton"
        data-variant="upload"
        className={cn('space-y-2', className)}
        aria-busy={uploadFiles.some((f) => f.status === 'uploading')}
      >
        {uploadFiles.map((file) => (
          <li
            key={file.name}
            className="flex flex-col gap-1 border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{file.name}</span>
              <span className="shrink-0 text-xs text-secondary-foreground">
                {file.status === 'done'
                  ? 'Xong'
                  : file.status === 'failed'
                    ? 'Lỗi'
                    : file.status === 'uploading'
                      ? `${file.percent ?? 0}%`
                      : 'Chờ'}
              </span>
            </div>
            {file.status === 'uploading' ? (
              <Skeleton className="h-1.5 w-full" />
            ) : null}
            {file.status === 'failed' && file.error ? (
              <p className="text-xs text-destructive">{file.error}</p>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  // publish
  const step = Math.max(0, Math.min(PUBLISH_STEPS.length, publishStep));
  return (
    <div
      data-slot="loading-skeleton"
      data-variant="publish"
      className={cn(
        'mx-auto flex max-w-sm flex-col items-center px-4 py-10 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Skeleton className="size-12 rounded-full" />
      <p className="mt-4 font-serif text-xl">Đang xuất bản thiệp…</p>
      <p className="mt-2 text-sm text-secondary-foreground">
        Đừng đóng trang này — quá trình mất khoảng 20 giây.
      </p>
      <ol className="mt-6 w-full space-y-2 text-left text-sm">
        {PUBLISH_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-2',
                done && 'text-success',
                current && 'text-foreground',
                !done && !current && 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-xs',
                  done && 'border-success bg-success text-primary-foreground',
                  current && 'border-primary'
                )}
                aria-hidden
              >
                {done ? '✓' : i + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
