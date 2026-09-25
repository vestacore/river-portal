import { createElement } from 'react';
import { resolveBlock, type BlockMap } from '@river/content';
import { segmentForLocale, type Locale } from '@river/i18n';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { isEditMode } from '@/lib/isEditMode';
import { EditableBlock } from './EditableBlock';

/**
 * A site text that editors can change in place. Server-rendered HTML for everyone; in edit mode
 * (studio or local surface only) it becomes an inline editor.
 */
export async function Editable({ blocks, blockId, locale, as = 'div', className = '' }: { blocks: BlockMap; blockId: string; locale: Locale; as?: string; className?: string }) {
  const block = resolveBlock(blocks, blockId, locale);
  const cls = block.mode === 'rich' ? `prose-river ${className}` : className;
  if (!(await isEditMode())) return createElement(as, { className: cls, dangerouslySetInnerHTML: { __html: block.html } });
  return <EditableBlock blockId={blockId} localeSegment={segmentForLocale(locale)} mode={block.mode} html={block.html} doc={block.doc} as={as} className={cls} labels={getDictionary(locale).edit} />;
}
