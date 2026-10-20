import type { Locale } from '@river/i18n';
import { pickText } from '@river/i18n';
import type { World } from '@river/psp-runtime';
import { ancestorsOf, subtreeOf } from '@river/psp-units';
import { lt } from '@/lib/lt';
import type { Query } from '@/lib/table';

/**
 * Narrows a page to one unit of the reader's reach — and with it, that unit's whole subtree. A plain
 * GET form: it keeps the page's other parameters.
 */
export function ScopePicker({ w, rootId, focus, locale, query }: { w: World; rootId: string; focus: string; locale: Locale; query: Query }) {
  const t = lt(locale);
  const reach = subtreeOf(w.units, rootId);
  const depth = (id: string) => ancestorsOf(w.units, id).length - ancestorsOf(w.units, rootId).length;
  return (
    <form className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
      {Object.entries(query).filter(([k, v]) => v && k !== 'unit' && k !== 'page').map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <label className="annot text-[0.6rem] text-ink-500" htmlFor="unit-scope">{t('Unit', 'Одиниця')}</label>
      <select id="unit-scope" name="unit" defaultValue={focus} className="min-w-0 max-w-[18rem] flex-1 border border-graphite/30 bg-paper px-2 py-1.5 text-[0.85rem] focus:border-ink-900 focus:outline-none sm:flex-none">
        {reach.map((u) => <option key={u.id} value={u.id}>{`${'\u00a0\u00a0'.repeat(depth(u.id))}${depth(u.id) > 0 ? '└ ' : ''}${pickText(u.name, locale)}`}</option>)}
      </select>
      <button type="submit" className="annot border border-ink-900 px-2.5 py-1.5 text-ink-900 hover:bg-ink-900 hover:text-paper">{t('Show', 'Показати')}</button>
    </form>
  );
}
