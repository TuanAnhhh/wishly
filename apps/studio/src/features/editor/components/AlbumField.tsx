import { useState } from 'react';
import type { FieldDef } from '@wishly/contracts';
import { Button, Label, LoadingSkeleton } from '@wishly/ui';
import { uploadImage } from '../../../lib/api';

const MAX_ALBUM = 12;

type Props = {
  field: FieldDef;
  value: unknown;
  onChange: (keys: string[]) => void;
};

type FileRow = {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'failed';
  percent?: number;
  error?: string;
  key?: string;
};

export function AlbumField({ field, value, onChange }: Props) {
  const keys = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];
  const [rows, setRows] = useState<FileRow[]>([]);

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const room = MAX_ALBUM - keys.length;
    if (room <= 0) {
      setRows([
        {
          name: 'album',
          status: 'failed',
          error: `Album tối đa ${MAX_ALBUM} ảnh.`,
        },
      ]);
      return;
    }
    const files = Array.from(fileList).slice(0, room);
    const initial: FileRow[] = files.map((f) => ({
      name: f.name,
      status: 'uploading',
      percent: 10,
    }));
    setRows(initial);

    // Upload each file independently — one failure must not block others.
    const results = await Promise.all(
      files.map(async (file, index) => {
        try {
          const result = await uploadImage(file);
          setRows((prev) =>
            prev.map((r, i) =>
              i === index
                ? { ...r, status: 'done', percent: 100, key: result.key }
                : r
            )
          );
          return result.key;
        } catch (e) {
          const message =
            e instanceof Error ? e.message : 'Không tải được ảnh.';
          setRows((prev) =>
            prev.map((r, i) =>
              i === index
                ? { ...r, status: 'failed', error: message }
                : r
            )
          );
          return null;
        }
      })
    );
    const uploaded = results.filter((k): k is string => Boolean(k));
    if (uploaded.length) {
      onChange([...keys, ...uploaded]);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={`album-${field.name}`}>{field.label}</Label>
      {field.help ? (
        <p className="text-sm text-secondary-foreground">{field.help}</p>
      ) : null}
      <p className="text-sm text-secondary-foreground">
        {keys.length}/{MAX_ALBUM} ảnh
      </p>
      <input
        id={`album-${field.name}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={keys.length >= MAX_ALBUM}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {rows.length ? (
        <div className="space-y-2">
          <LoadingSkeleton variant="upload" uploadFiles={rows} />
          {rows.some((r) => r.status === 'failed') ? (
            <p className="text-xs text-secondary-foreground">
              Ảnh lỗi không chặn các ảnh khác — chọn ảnh khác để thay.
            </p>
          ) : null}
        </div>
      ) : null}
      <ul className="space-y-2">
        {keys.map((key, index) => (
          <li
            key={key}
            className="flex items-center justify-between gap-2 border border-border px-3 py-2"
          >
            <span className="truncate font-mono text-xs">{key}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(keys.filter((_, i) => i !== index))}
            >
              Xóa
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
