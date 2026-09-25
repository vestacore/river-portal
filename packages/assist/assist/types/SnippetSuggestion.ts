import type { LocalisedText } from '@river/i18n';
import type { SnippetKind } from './SnippetKind.ts';

/** One proposed feed item, in both locales. */
export type SnippetSuggestion = { kind: SnippetKind; text: LocalisedText };
