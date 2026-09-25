import Link from 'next/link';
import { readFlows } from '@river/flows';
import { formatDate, formatMoney, oblastName, pickText } from '@river/i18n';
import { findCategory, readNeedQueue } from '@river/needs';
import { getRuntime } from '@river/runtime';
import { settingText } from '@river/settings';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';

/** Channels: every delivery, from planned to reported, with its carrier and costs. */
export default async function ChannelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  await requireStage('channels', locale);
  const dict = getDictionary(locale);
  const t = dict.studio.channels;
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const [flows, needs] = await Promise.all([readFlows(runtime.store, runtime.config.orgId), readNeedQueue(runtime.store, runtime.config.orgId)]);
  const needLabel = (id: string) => pickText(findCategory(needs.find((n) => n.id === id)?.categoryId ?? '')?.label, locale) || id;
  const currency = settingText(settings, 'money.reportingCurrency');
  if (flows.length === 0) return <p className="text-ink-500">{t.none}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-t border-graphite/60 text-left text-[0.95rem]">
        <thead className="annot text-ink-500">
          <tr className="border-b border-graphite/30">
            <th scope="col" className="py-3 pr-4 font-normal">{t.status}</th>
            <th scope="col" className="py-3 pr-4 font-normal">{t.route}</th>
            <th scope="col" className="py-3 pr-4 font-normal">{t.carrier}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{t.costs}</th>
            <th scope="col" className="py-3 pr-4 font-normal">{t.dispatched}</th>
            <th scope="col" className="py-3 font-normal">{t.needs}</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f) => {
            const total = f.costs.reduce((s, c) => s + c.reportingMinor, 0);
            const pending = f.costs.filter((c) => c.status === 'submitted').length;
            return (
              <tr key={f.id} className="border-b border-graphite/20 align-top">
                <td className="py-3 pr-4"><Badge tone={f.status === 'in_motion' ? 'sunrise' : f.status === 'committed' || f.status === 'forming' ? 'river' : 'teal'}>{dict.flowStatuses[f.status]}</Badge></td>
                <td className="py-3 pr-4">{f.fromLabel ?? '—'} → {oblastName(f.oblastId, locale)}</td>
                <td className="py-3 pr-4">{f.carrier ? <>{f.carrier.name}<span className="block text-sm text-ink-500">{dict.carrierKinds[f.carrier.kind]}</span></> : '—'}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(total, currency, locale)}{pending > 0 ? <span className="annot block text-sunrise-600">{t.pending.replace('{n}', String(pending))}</span> : null}</td>
                <td className="py-3 pr-4 text-ink-500">{f.dispatchedAt ? formatDate(f.dispatchedAt, locale) : '—'}</td>
                <td className="py-3">
                  {f.needIds.map((id) => <Link key={id} className="block underline decoration-graphite/40 underline-offset-4 hover:decoration-sunrise-500" href={href(locale, `/studio/needs/${id}`)}>{f.status === 'committed' ? t.plan : needLabel(id)}</Link>)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
