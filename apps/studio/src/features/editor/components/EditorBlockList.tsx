import { useEditorStore } from '../stores/editorStore';
import { BlockList } from './BlockList';

/** Store-connected `BlockList` — renders the same list on desktop and in the mobile sheet. */
export function EditorBlockList() {
  const blocks = useEditorStore((s) => s.blocks);
  const content = useEditorStore((s) => s.content);
  const activeKey = useEditorStore((s) => s.activeKey);
  const setActiveKey = useEditorStore((s) => s.setActiveKey);
  const toggleBlock = useEditorStore((s) => s.toggleBlock);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);

  return (
    <BlockList
      blocks={blocks}
      content={content}
      activeKey={activeKey}
      onSelect={setActiveKey}
      onToggle={toggleBlock}
      onReorder={reorderBlocks}
    />
  );
}
