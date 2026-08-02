import { useEditorStore } from '../stores/editorStore';
import { PreviewFrame } from './PreviewFrame';

type Props = {
  /** Fill parent height and scroll inside the phone frame */
  fill?: boolean;
  /** Overrides the store's wide/mobile toggle — the fullscreen dialog is always mobile width. */
  wide?: boolean;
};

/** Store-connected `PreviewFrame`. */
export function EditorPreview({ fill = false, wide }: Props) {
  const content = useEditorStore((s) => s.content);
  const theme = useEditorStore((s) => s.theme);
  const blocks = useEditorStore((s) => s.blocks);
  const brandColor = useEditorStore((s) => s.brandColor);
  const eventType = useEditorStore((s) => s.eventType);
  const lang = useEditorStore((s) => s.previewLang);
  const storeWide = useEditorStore((s) => s.wide);

  return (
    <PreviewFrame
      content={content}
      theme={theme}
      blocks={blocks}
      wide={wide ?? storeWide}
      brandColor={brandColor}
      eventType={eventType ?? undefined}
      lang={lang}
      fill={fill}
    />
  );
}
