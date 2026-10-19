import { formatDate, type Locale } from '@river/i18n';
import type { RiverRow } from '@river/pay-views';
import type { Dictionary } from '@/lib/dictionary/types';

const tones: Record<RiverRow['kind'], string> = {
  gesture: 'bg-sunrise-500 text-ink-900', figure: 'bg-river-100 text-river-900', intention: 'bg-teal-100 text-teal-600', answer: 'bg-teal-600 text-paper', report: 'bg-ink-900 text-paper',
};

function shown(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/**
 * The stream of one order, exactly as it was written: every fact with its number, who gave it, what
 * it follows from, and its payload as stored. Facts are grouped by wave — one wave is one fragment,
 * settled in one transaction. Nothing is reworded or hidden but the pay key's hash, cut to a fingerprint.
 */
export function RiverRows({ rows, t, locale }: { rows: RiverRow[]; t: Dictionary['pay']; locale: Locale }) {
  const o = t.operator;
  const waves = [...new Set(rows.map((row) => row.wave))];
  return (
    <div>
      <ul className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
        {(Object.keys(tones) as Array<RiverRow['kind']>).map((kind) => (
          <li key={kind} className="flex items-center gap-2"><span className={`annot px-1.5 py-0.5 text-[0.62rem] ${tones[kind]}`}>{o.kinds[kind]}</span>{o.kindsHelp[kind]}</li>
        ))}
      </ul>
      <ol className="space-y-6">
        {waves.map((wave) => {
          const facts = rows.filter((row) => row.wave === wave);
          return (
            <li key={wave} className="grid gap-x-6 sm:grid-cols-[5.5rem_1fr]">
              <div className="border-t border-graphite/60 pt-3 text-ink-500">
                <p className="annot">{o.wave} {wave}</p>
                <p className="mt-1 font-mono text-[0.68rem] leading-snug">{formatDate(facts[0]?.at ?? '', locale, true)}</p>
              </div>
              <ol className="border-t border-graphite/60">
                {facts.map((row) => (
                  <li key={row.seq} id={`fact-${row.seq}`} className="grid gap-x-4 gap-y-1 border-b border-graphite/20 py-3 sm:grid-cols-[2.5rem_7.5rem_1fr]">
                    <span className="font-mono text-sm text-ink-500">#{row.seq}</span>
                    <span><span className={`annot inline-block px-1.5 py-0.5 text-[0.62rem] ${tones[row.kind]}`}>{o.kinds[row.kind]}</span></span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <b className="font-mono text-sm text-ink-900">{row.type}</b>
                        <span className="text-sm text-ink-700">{(t.facts as Record<string, string>)[row.type] ?? ''}</span>
                      </p>
                      <p className="mt-1 font-mono text-[0.72rem] text-ink-500">
                        {row.who}
                        {row.answering !== null ? <> · {o.answers} <a className="underline underline-offset-2" href={`#fact-${row.answering}`}>#{row.answering}</a></> : row.causedBy !== null ? <> · {o.follows} <a className="underline underline-offset-2" href={`#fact-${row.causedBy}`}>#{row.causedBy}</a></> : null}
                      </p>
                      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.78rem] leading-snug">
                        {Object.entries(row.payload).map(([key, value]) => (
                          <div key={key} className="flex min-w-0 gap-1.5"><dt className="text-ink-500">{key}</dt><dd className="break-all text-ink-900">{shown(value)}</dd></div>
                        ))}
                      </dl>
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
