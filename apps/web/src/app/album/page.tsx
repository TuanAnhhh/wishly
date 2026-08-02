import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { albumApi, queryKeys } from '@wishly/api-client';
import {
  BaseTextField,
  Button,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '@wishly/ui';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type FileProgress = {
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

const MAX_BYTES = 8 * 1024 * 1024;

export function AlbumPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [uploaderName, setUploaderName] = useState('');
  const [progress, setProgress] = useState<FileProgress[]>([]);

  const album = useQuery({
    queryKey: queryKeys.album.public(slug ?? ''),
    queryFn: () => albumApi.getPublic(slug!),
    enabled: Boolean(slug),
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      if (!slug) return;
      const name = uploaderName.trim() || 'Khách';
      const list = Array.from(files);
      setProgress(list.map((f) => ({ name: f.name, status: 'uploading' })));

      await Promise.all(
        list.map(async (file, i) => {
          try {
            if (file.size > MAX_BYTES) {
              throw new Error('Ảnh vượt quá 8MB.');
            }
            if (!file.type.startsWith('image/')) {
              throw new Error('Chỉ nhận ảnh JPEG/PNG/WebP/GIF.');
            }
            const contentType = (
              ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
                file.type
              )
                ? file.type
                : 'image/jpeg'
            ) as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

            const presign = await albumApi.presign(slug, {
              filename: file.name,
              contentType,
              byteSize: file.size,
            });
            const put = await fetch(presign.uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': contentType },
              body: file,
            });
            if (!put.ok) throw new Error('Tải lên lưu trữ thất bại.');
            await albumApi.uploadPhotos(slug, {
              mediaKeys: [presign.key],
              uploaderName: name,
            });
            setProgress((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, status: 'done' } : p
              )
            );
          } catch (e) {
            setProgress((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? {
                      ...p,
                      status: 'error',
                      error: e instanceof Error ? e.message : 'Lỗi tải lên',
                    }
                  : p
              )
            );
          }
        })
      );
    },
    onSettled: () => {
      if (slug) void qc.invalidateQueries({ queryKey: queryKeys.album.public(slug) });
    },
  });

  if (album.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <LoadingSkeleton variant="invitation" />
      </main>
    );
  }

  if (album.isError || !album.data || !slug) {
    return (
      <main className="min-h-screen">
        <ErrorState
          tone="warn"
          title="Không mở được album"
          body="Link có thể sai hoặc thiệp chưa xuất bản."
          primary={{ label: 'Về trang chủ', href: '/' }}
        />
      </main>
    );
  }

  const data = album.data;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-secondary-foreground">
          <Link to={`/${slug}`} className="underline-offset-4 hover:underline">
            ← Về thiệp
          </Link>
        </p>
        <h1 className="font-serif text-3xl">{data.title}</h1>
        <p className="text-sm text-secondary-foreground">
          {data.canUpload
            ? 'Gửi ảnh kỷ niệm — ảnh hiện sau khi gia chủ duyệt.'
            : 'Album đã đóng upload — vẫn xem và tải được ảnh đã duyệt.'}
        </p>
      </header>

      {data.canUpload ? (
        <section className="space-y-3 border border-border p-4">
          <BaseTextField
            id="uploader"
            label="Tên của bạn"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  void upload.mutateAsync(e.target.files);
                }
                e.target.value = '';
              }}
            />
            <Button type="button" asChild>
              <span>Chọn ảnh tải lên</span>
            </Button>
          </label>
          {progress.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {progress.map((p) => (
                <li key={p.name + p.status}>
                  {p.name}:{' '}
                  {p.status === 'uploading'
                    ? 'Đang tải…'
                    : p.status === 'done'
                      ? 'Đã gửi — chờ duyệt'
                      : p.error}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild>
          <a href={albumApi.zipUrl(slug)}>Tải cả album (ZIP)</a>
        </Button>
      </div>

      {data.photos.length === 0 ? (
        <EmptyState
          title="Chưa có ảnh công khai"
          body="Ảnh mới sẽ hiện ở đây sau khi gia chủ duyệt."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.photos.map((p) => (
            <li key={p.id} className="space-y-1">
              <img
                src={p.url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <p className="truncate text-xs text-secondary-foreground">
                {p.uploaderName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default AlbumPage;
