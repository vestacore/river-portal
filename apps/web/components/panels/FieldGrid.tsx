import type { Locale } from '@river/i18n';
import { Value, type Cell } from './Value';

/**
 * A panel of fields: a record read as label-and-value pairs, in sections — the same `Cell` grammar as a
 * table, so a payment's amount reads the same in its row and on its page.
 */
export type Field = { label: string; cell: Cell; wide?: boolean };

export function FieldGrid({ fields, locale, columns = 3 }: { fields: Field[]; locale: Locale; columns?: 2 | 3 | 4 }) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${cols}`}>
      {fields.map((f) => (
        <div key={f.label} className={`min-w-0 border-t border-graphite/15 pt-2 ${f.wide ? 'sm:col-span-2 lg:col-span-full' : ''}`}>
          <dt className="annot text-[0.6rem] text-ink-500">{f.label}</dt>
          <dd className="mt-1 break-words text-[0.92rem]"><Value cell={f.cell} locale={locale} /></dd>
        </div>
      ))}
    </dl>
  );
}
