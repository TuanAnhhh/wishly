import { InvitationRenderer } from '@wishly/templates';
import { ScrollArea } from '@wishly/ui';
import { resolveMediaUrl } from '../../../lib/media-url';

type Props = {
  content: Record<string, unknown>;
  theme: { paletteId: string; fontId: string };
  blocks: Array<{ key: string; enabled: boolean; order: number }>;
  wide?: boolean;
  brandColor?: string | null;
  eventType?: string;
  lang?: 'vi' | 'en';
  /** Fill parent height and scroll inside the phone frame */
  fill?: boolean;
};

export function PreviewFrame({
  content,
  theme,
  blocks,
  wide,
  brandColor,
  eventType,
  lang = 'vi',
  fill = false,
}: Props) {
  const width = wide ? 720 : 390;

  const renderer = (
    <InvitationRenderer
      content={content}
      theme={theme}
      blocks={blocks as never}
      resolveMedia={resolveMediaUrl}
      brandColor={brandColor}
      lang={lang}
      interactions={{
        eventType: eventType as never,
        lang,
        entryPass:
          eventType === 'CORPORATE'
            ? {
              passCode: 'DEMO-001',
              guestName: 'Nguyễn Văn A',
              tableLabel: 'Bàn 3',
            }
            : null,
      }}
    />
  );

  const frame = (
    <div
      className={
        wide
          ? 'bg-card shadow-card'
          : 'bg-card shadow-card'
      }
      style={{ width: wide ? width : width + 16 }}
    >
      <div className={`overflow-hidden bg-card`}>
        {renderer}
      </div>
    </div>
  );

  return fill ? (
    <ScrollArea className="h-full bg-muted">
      <div className="flex justify-center py-6">{frame}</div>
    </ScrollArea>
  ) : (
    <div className="flex justify-center overflow-auto bg-muted p-4">{frame}</div>
  );
}
