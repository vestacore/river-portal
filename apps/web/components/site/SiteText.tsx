import { createElement } from 'react';
import { resolveBlock, type BlockMap } from '@river/content';
import type { Locale } from '@river/i18n';
import { settingTokens } from '@river/settings';
import { loadSettings } from '@/lib/loadSettings';

/**
 * A text of the public site: server-rendered HTML, with {{key}} tokens filled from the organisation's
 * settings. Texts are edited in the studio, never on public pages (adr/records/ADR-0022).
 */
export async function SiteText({ blocks, blockId, locale, as = 'div', className = '' }: { blocks: BlockMap; blockId: string; locale: Locale; as?: string; className?: string }) {
  const block = resolveBlock(blocks, blockId, locale, settingTokens(await loadSettings(), locale));
  return createElement(as, { className: block.mode === 'rich' ? `prose-river ${className}` : className, dangerouslySetInnerHTML: { __html: block.html } });
}
