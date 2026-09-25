import type { Locale } from '@river/i18n';
import type { RichText } from './RichText.ts';

/** Edited blocks keyed by block id, as denormalised into page documents. */
export type BlockMap = Record<string, Partial<Record<Locale, RichText>>>;
