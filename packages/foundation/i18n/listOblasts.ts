import { oblasts } from './data/oblasts.ts';
import { oblastName } from './oblastName.ts';
import type { Locale } from './types/Locale.ts';

/** Oblasts as select options, sorted alphabetically in the given locale. */
export function listOblasts(locale: Locale): Array<{ id: string; label: string }> {
  const collator = new Intl.Collator(locale);
  return oblasts
    .map((o) => ({ id: o.id, label: oblastName(o.id, locale) }))
    .sort((a, b) => collator.compare(a.label, b.label));
}
