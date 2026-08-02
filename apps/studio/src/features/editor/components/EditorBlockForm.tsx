import { useEditorStore } from '../stores/editorStore';
import { BlockForm } from './BlockForm';

const EMPTY: Record<string, unknown> = {};

/** Store-connected `BlockForm` for whichever block is currently selected. */
export function EditorBlockForm() {
  const activeKey = useEditorStore((s) => s.activeKey);
  const activeData = useEditorStore((s) => s.content[s.activeKey]);
  const patchActiveBlock = useEditorStore((s) => s.patchActiveBlock);

  return (
    <BlockForm
      blockKey={activeKey}
      value={(activeData as Record<string, unknown> | undefined) ?? EMPTY}
      onChange={patchActiveBlock}
    />
  );
}
