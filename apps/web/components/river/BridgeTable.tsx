import { pickText, type Locale } from '@river/i18n';
import { factDefinition, projectionLabels, stageCatalogue } from '@river/psp-facts';
import type { BridgeRow } from '@river/psp-views';
import { exact, money } from '@/lib/format';
import { lt } from '@/lib/lt';

const tone = { door: 'bg-sunrise-500 text-ink-900', figure: 'bg-river-100 text-river-900', world: 'bg-teal-600 text-paper' } as const;

function shown(field: string, value: unknown, currency: string, locale: Locale): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number' && (/Minor$/.test(field) || /^(Dr|Cr) /.test(field))) return money(value, currency, locale);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * The bridges of a stream as rows: number, moment, stage, the fact with its type, who spoke (a person at
 * the door, a figure of the machine, the world), what it follows from, its payload as stored — and, at the
 * right, what it formed: every view it changed, field by field, from → to.
 */
export function BridgeTable({ rows, locale, currency }: { rows: BridgeRow[]; locale: Locale; currency: string }) {
  const t = lt(locale);
  const who = (r: BridgeRow) => (r.origin.via === 'door' ? `${r.origin.role} · ${r.origin.actor}` : r.origin.via === 'figure' ? r.origin.by : r.origin.controller);
  return (
    <ol className="divide-y divide-graphite/15">
      {rows.map((r) => (
        <li key={r.seq} id={`b-${r.seq}`} className="grid gap-x-5 gap-y-2 px-4 py-3 target:bg-sunrise-100 lg:grid-cols-[3.5rem_9rem_minmax(0,1.1fr)_minmax(0,1fr)]">
          <span className="font-mono text-sm text-ink-500">#{r.seq}<span className="block text-[0.65rem]">{t('wave', 'хвиля')} {r.wave}</span></span>
          <span className="text-[0.8rem] text-ink-700"><span className="font-mono">{exact(r.at, locale)}</span>{r.stage ? <span className="annot block text-[0.58rem] text-sunrise-600">{pickText(stageCatalogue.find((s) => s.stage === r.stage)?.label, locale)}</span> : null}</span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1"><span className="font-semibold text-ink-900">{pickText(factDefinition(r.type).label, locale)}</span><span className="font-mono text-[0.75rem] text-ink-500">{r.type}</span></p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.75rem]">
              <span className={`annot px-1.5 py-0.5 text-[0.55rem] ${tone[r.speaker]}`}>{r.speaker === 'door' ? t('door', 'двері') : r.speaker === 'figure' ? t('figure', 'фігура') : t('world', 'світ')}</span>
              <span className="font-mono text-ink-500">{who(r)}</span>
              {r.causedBy !== null ? <a href={`#b-${r.causedBy}`} className="font-mono text-river-700 underline decoration-river-200">{t('follows', 'слідує з')} #{r.causedBy}</a> : null}
            </p>
            <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[0.72rem] leading-snug">
              {Object.entries(r.payload).filter(([k]) => !['sessionId'].includes(k)).map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-1"><dt className="text-ink-500">{k}</dt><dd className="break-all text-ink-900">{shown(k, v, currency, locale)}</dd></div>
              ))}
            </dl>
          </div>
          <div className="min-w-0 space-y-1.5">
            {r.formed.length === 0 ? <p className="annot text-[0.58rem] text-ink-300">{t('forms no view', 'не формує проєкцій')}</p> : r.formed.map((d) => (
              <div key={`${d.projection}${d.key}`} className="border-l-2 border-ink-900 pl-2">
                <p className="annot text-[0.58rem] text-ink-900">{pickText(projectionLabels[d.projection], locale)}{d.created ? ` · ${t('born', 'створено')}` : ''} <span className="font-mono normal-case tracking-normal text-ink-500">{d.key === 'journal' ? '' : d.key}</span></p>
                <ul className="font-mono text-[0.7rem] leading-snug text-ink-700">
                  {d.changes.slice(0, 7).map((c) => <li key={c.field}><span className="text-ink-500">{c.field}</span> {d.created || d.projection === 'ledger' ? '' : `${shown(c.field, c.from, currency, locale)} → `}<span className="text-ink-900">{shown(c.field, c.to, currency, locale)}</span></li>)}
                  {d.changes.length > 7 ? <li className="text-ink-300">+{d.changes.length - 7}</li> : null}
                </ul>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
