import { useMemo } from 'react';
import { Progress } from '@wishly/ui';
import { countFilledParts } from '../helpers/blockStatus';
import { useEditorStore } from '../stores/editorStore';

/** "x/y phần" completion bar. Owns its own subscription so keystrokes don't re-render the whole editor shell. */
export function EditorProgress() {
  const blocks = useEditorStore((s) => s.blocks);
  const content = useEditorStore((s) => s.content);

  const progress = useMemo(
    () => countFilledParts(blocks, content),
    [blocks, content]
  );
  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="border-t border-hairline px-4 py-2">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <Progress
          value={pct}
          className="h-1.5 flex-1 bg-border"
          aria-label={`Tiến độ hoàn thành ${progress.done} trên ${progress.total} phần`}
        />
        <p className="shrink-0 text-xs tabular-nums text-secondary-foreground">
          <span className="font-medium text-foreground">{progress.done}</span>
          /{progress.total} phần
          <span className="ml-1.5 hidden text-muted-foreground sm:inline">
            ({pct}%)
          </span>
        </p>
      </div>
    </div>
  );
}
