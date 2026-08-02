import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { FieldDef } from '@wishly/contracts';
import {
  Button,
  BaseDropzone,
  BaseDropZoneArea,
  BaseDropzoneDescription,
  BaseDropzoneFileList,
  BaseDropzoneFileListItem,
  BaseDropzoneFileMessage,
  BaseDropzoneMessage,
  BaseDropzoneRemoveFile,
  BaseDropzoneRetryFile,
  BaseDropzoneTrigger,
  BaseInfiniteProgress,
  Label,
  useBaseDropzone,
} from '@wishly/ui';
import { uploadImage } from '../../../lib/api';
import { resolveMediaUrl } from '../../../lib/media-url';

type Props = {
  field: FieldDef;
  value: unknown;
  onChange: (key: string | null) => void;
};

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
} as const;

export function MediaField({ field, value, onChange }: Props) {
  const key = typeof value === 'string' ? value : null;
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const dropzone = useBaseDropzone({
    onDropFile: async (file) => {
      try {
        const result = await uploadImage(file);
        return { status: 'success' as const, result: result.key };
      } catch (e) {
        return {
          status: 'error' as const,
          error: e instanceof Error ? e.message : 'Không tải được ảnh.',
        };
      }
    },
    onFileUploaded: (uploadedKey) => {
      onChange(uploadedKey);
    },
    onRemoveFile: async () => {
      onChange(null);
    },
    validation: {
      accept: ACCEPT,
      maxSize: 8 * 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  });

  useEffect(() => {
    const current = dropzone.fileStatuses[0];
    if (!current) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(current.file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [dropzone.fileStatuses]);

  const sessionFile = dropzone.fileStatuses[0];
  const savedPreview = key ? resolveMediaUrl(key) : null;
  const previewSrc = localPreview ?? savedPreview;
  const hasImage = Boolean(sessionFile || key);

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      {field.help ? (
        <p className="text-sm text-secondary-foreground">{field.help}</p>
      ) : null}

      <BaseDropzone {...dropzone}>
        <div className="">
          {!hasImage ? (
            <BaseDropZoneArea className="min-h-40 flex-col gap-3">
              <div className="rounded-full bg-muted p-3">
                <ArrowUpTrayIcon className="size-5 text-muted-foreground" />
              </div>
              <BaseDropzoneDescription>
                Kéo ảnh vào đây
              </BaseDropzoneDescription>
              <BaseDropzoneTrigger>Chọn ảnh</BaseDropzoneTrigger>
            </BaseDropZoneArea>
          ) : null}

          <BaseDropzoneMessage />

          {sessionFile ? (
            <BaseDropzoneFileList>
              <BaseDropzoneFileListItem file={sessionFile}>
                <div className="flex items-start gap-3">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={sessionFile.fileName}
                      className="size-20 shrink-0 rounded-md object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {sessionFile.fileName}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        {sessionFile.status === 'error' ? (
                          <BaseDropzoneRetryFile variant="ghost" size="icon-sm">
                            <ArrowPathIcon className="size-4" />
                          </BaseDropzoneRetryFile>
                        ) : null}
                        <BaseDropzoneRemoveFile variant="ghost" size="icon-sm">
                          <XMarkIcon className="size-4" />
                        </BaseDropzoneRemoveFile>
                      </div>
                    </div>
                    <BaseInfiniteProgress status={sessionFile.status} />
                    <BaseDropzoneFileMessage />
                    {sessionFile.status === 'success' ? (
                      <p className="truncate font-mono text-xs text-secondary-foreground">
                        {sessionFile.result}
                      </p>
                    ) : null}
                  </div>
                </div>
              </BaseDropzoneFileListItem>
            </BaseDropzoneFileList>
          ) : null}

          {key && !sessionFile ? (
            <div className="flex items-start gap-3 rounded-md bg-muted/40 px-4 py-2">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={field.label}
                  className="size-20 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-card font-mono text-[10px] text-secondary-foreground">
                  đã lưu
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="truncate font-mono text-xs text-secondary-foreground">
                  {key}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <BaseDropZoneArea className="border-0 bg-transparent p-0">
                    <BaseDropzoneTrigger>Thay ảnh</BaseDropzoneTrigger>
                  </BaseDropZoneArea>
                  <Button
                    variant="link"
                    size="icon-xs"
                    onClick={() => onChange(null)}
                  >
                    <XMarkIcon />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {sessionFile ? (
            <BaseDropZoneArea className="border-0 bg-transparent p-0">
              <BaseDropzoneTrigger>Thay ảnh khác</BaseDropzoneTrigger>
            </BaseDropZoneArea>
          ) : null}
        </div>
      </BaseDropzone>
    </div>
  );
}
