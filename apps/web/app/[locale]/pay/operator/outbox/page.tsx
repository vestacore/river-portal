import Link from 'next/link';
import { formatDate, segmentForLocale } from '@river/i18n';
import { providerLabels, type ProviderName } from '@river/pay-facts';
import { getPayRuntime, readWaiting } from '@river/pay-runtime';
import { SubmitButton } from '@/components/pay/SubmitButton';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { carryAction, tickAction } from '@/lib/pay/actions';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ carried?: string; left?: string; expired?: string; abandoned?: string }> };

/**
 * The outbox: what the figure has asked of a bank and no bank has yet answered. Where this process
 * is the whole river, a steward may carry what waits across and let time pass; where banks and the
 * clock are functions, this page only reads.
 */
export default async function OperatorOutbox({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const operator = await requireOperator(locale);
  const dict = getDictionary(locale);
  const t = dict.pay.operator.outbox;
  const [runtime, query] = await Promise.all([getPayRuntime(), searchParams]);
  const waiting = await readWaiting(runtime);
  const here = runtime.config.door.at === 'here';
  const segment = segmentForLocale(locale);
  const said = query.carried !== undefined ? t.carried.replace('{n}', String(Number(query.carried) || 0)).replace('{left}', String(Number(query.left) || 0))
    : query.expired !== undefined ? t.ticked.replace('{n}', String(Number(query.expired) || 0)).replace('{m}', String(Number(query.abandoned) || 0)) : null;
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <p className="mt-2 max-w-3xl text-ink-500">{t.lead}</p>
      </section>
      {said ? <p className="annot border border-teal-500/50 bg-teal-100 px-4 py-2.5 text-ink-900" role="status">{said}</p> : null}
      {waiting.length === 0 ? <p className="text-ink-500">{t.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-t border-graphite/60 text-left text-[0.95rem]">
            <thead className="annot text-ink-500">
              <tr className="border-b border-graphite/30">{[t.bank, t.intention, t.order, t.attempts, t.lastError, t.since].map((label) => <th key={label} scope="col" className="py-3 pr-4 font-normal">{label}</th>)}</tr>
            </thead>
            <tbody>
              {waiting.map((entry) => (
                <tr key={`${entry.stream}-${entry.seq}`} className="border-b border-graphite/20 align-top">
                  <td className="py-3 pr-4 font-semibold text-ink-900">{providerLabels[entry.controller as ProviderName] ?? entry.controller}</td>
                  <td className="py-3 pr-4 font-mono text-sm">{entry.type} <span className="text-ink-500">#{entry.seq}</span></td>
                  <td className="py-3 pr-4"><Link className="font-mono text-sm underline decoration-graphite/30 underline-offset-4" href={href(locale, `/pay/operator/orders/${entry.stream}`)}>{entry.stream}</Link></td>
                  <td className="py-3 pr-4 tabular-nums">{entry.attempts}</td>
                  <td className="py-3 pr-4 text-ink-700">{entry.lastError ?? '—'}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-ink-500">{formatDate(entry.at, locale, true)}{entry.stale ? <Badge tone="attention" className="ml-2">!</Badge> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {here && operator.canAct ? (
        <section className="flex flex-wrap items-start gap-x-10 gap-y-6 border-t border-graphite/25 pt-8">
          <form action={carryAction}><input type="hidden" name="localeSegment" value={segment} /><SubmitButton variant="secondary" size="sm">{t.carry}</SubmitButton></form>
          <form action={tickAction} className="max-w-md">
            <input type="hidden" name="localeSegment" value={segment} />
            <SubmitButton variant="outline" size="sm">{t.tick}</SubmitButton>
            <p className="mt-2 text-sm text-ink-500">{t.tickNote}</p>
          </form>
        </section>
      ) : here ? null : <p className="max-w-3xl text-sm text-ink-500">{t.remote}</p>}
    </div>
  );
}
