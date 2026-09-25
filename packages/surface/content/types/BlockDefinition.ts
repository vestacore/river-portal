import type { LocalisedText } from '@river/i18n';

/**
 * An editable region of the site. `inline` blocks are headings and short lines (bold/italic only);
 * `rich` blocks allow paragraphs, lists, links and sub-headings.
 */
export type BlockDefinition = { id: string; mode: 'inline' | 'rich'; label: string; defaults: LocalisedText };
