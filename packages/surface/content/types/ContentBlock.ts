import type { Locale } from '@river/i18n';
import type { RichText } from './RichText.ts';

/** An edited block (`orgs/{org}/content/{blockId}`); missing locales fall back to defaults. */
export type ContentBlock = { id: string; text: Partial<Record<Locale, RichText>>; updatedAt: string; updatedBy: string };
