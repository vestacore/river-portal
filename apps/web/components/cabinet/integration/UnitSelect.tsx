import { pickText, type Locale } from '@river/i18n';
import type { World } from '@river/psp-runtime';
import { ancestorsOf, subtreeOf, type Unit } from '@river/psp-units';

/** The units of a reach a form may act at, in hierarchy order and indented as the hierarchy is. */
export function unitsFor(w: World, rootId: string, visible: ReadonlySet<string>, allow: (unit: Unit) => boolean = () => true): Unit[] {
  return subtreeOf(w.units, rootId).filter((u) => visible.has(u.id) && allow(u));
}

/** A labelled select of units, for a form that creates something at one of them (a key, an endpoint, a test order). */
export function UnitSelect({ w, rootId, units, locale, label, name = 'unitId', defaultValue }: { w: World; rootId: string; units: Unit[]; locale: Locale; label: string; name?: string; defaultValue?: string }) {
  const base = ancestorsOf(w.units, rootId).length;
  const depth = (id: string) => Math.max(0, ancestorsOf(w.units, id).length - base);
  return (
    <label className="text-[0.8rem] text-ink-700">{label}
      <select name={name} defaultValue={defaultValue ?? units[0]?.id} required className="mt-1 block max-w-[20rem] border border-graphite/30 bg-paper px-2 py-1.5 text-sm">
        {units.map((u) => <option key={u.id} value={u.id}>{`${'  '.repeat(depth(u.id))}${depth(u.id) > 0 ? '└ ' : ''}${pickText(u.name, locale)}`}</option>)}
      </select>
    </label>
  );
}
