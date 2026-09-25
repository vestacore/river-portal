import { approvalLimitMinor, readFlows } from '@river/flows';
import { formatDate, formatMoney, oblastName } from '@river/i18n';
import { hasRole } from '@river/identity';
import { getRuntime } from '@river/runtime';
import { settingText } from '@river/settings';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSettings } from '@/lib/loadSettings';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { approveCostAction } from '../actions';

/**
 * Tolls (DP-06): costs waiting for approval. A coordinator approves within the limit in settings;
 * the Finance Steward approves anything. Each cost shows the rate used to convert it.
 */
export default async function TollsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { identity, canAct } = await requireStage('tolls', locale);
  const dict = getDictionary(locale);
  const t = dict.studio.tolls;
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const flows = await readFlows(runtime.store, runtime.config.orgId);
  const currency = settingText(settings, 'money.reportingCurrency');
  const limit = approvalLimitMinor(settings);
  const steward = hasRole(identity, 'finance_steward', 'administrator');
  const rows = flows.flatMap((f) => f.costs.map((c) => ({ flow: f, cost: c })));
  const pending = rows.filter((r) => r.cost.status === 'submitted').sort((a, b) => a.cost.at.localeCompare(b.cost.at));
  const approved = rows.filter((r) => r.cost.status === 'approved').sort((a, b) => b.cost.at.localeCompare(a.cost.at)).slice(0, 8);
  const table = (list: typeof rows, withAction: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-t border-graphite/60 text-left text-[0.95rem]">
        <thead className="annot text-ink-500">
          <tr className="border-b border-graphite/30">
            <th scope="col" className="py-3 pr-4 font-normal">{t.route}</th>
            <th scope="col" className="py-3 pr-4 font-normal">{t.kind}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{t.amount}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{t.converted.replace('{currency}', currency)}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{t.rate}</th>
            <th scope="col" className="py-3 font-normal"><span className="sr-only">{dict.studio.approve}</span></th>
          </tr>
        </thead>
        <tbody>
          {list.map(({ flow, cost }) => {
            const allowed = canAct && (steward || cost.reportingMinor <= limit);
            return (
              <tr key={cost.id} className="border-b border-graphite/20 align-top">
                <td className="py-3 pr-4">{flow.fromLabel ?? '—'} → {oblastName(flow.oblastId, locale)}<span className="annot block text-ink-500">{formatDate(cost.at, locale)}</span></td>
                <td className="py-3 pr-4">{dict.costKinds[cost.kind]}{cost.note ? <span className="block text-sm text-ink-500">{cost.note}</span> : null}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(cost.amountMinor, cost.currency, locale)}</td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums">{formatMoney(cost.reportingMinor, cost.reportingCurrency, locale)}</td>
                <td className="py-3 pr-4 text-right font-mono text-sm text-ink-500">{cost.fxRate}</td>
                <td className="py-3 text-right">
                  {!withAction ? <Badge tone="teal">✓</Badge> : allowed ? (
                    <form action={approveCostAction}><input type="hidden" name="flowId" value={flow.id} /><input type="hidden" name="costId" value={cost.id} /><button className="chamfer px-3 py-1.5 text-sm font-semibold [--cut:6px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]">{dict.studio.approve}</button></form>
                  ) : <span className="annot text-ink-500">{cost.reportingMinor > limit ? t.aboveLimit : dict.studio.readOnly}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="space-y-14">
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold">{t.title}</h2><p className="mt-1 max-w-2xl text-ink-500">{t.lead}</p></div>
          <p className="annot border border-graphite/30 px-3 py-2 text-ink-700">{t.limit}: <b className="text-ink-900">{formatMoney(limit, currency, locale)}</b></p>
        </div>
        {pending.length === 0 ? <p className="text-ink-500">{t.none}</p> : table(pending, true)}
      </section>
      {approved.length > 0 ? <section><h3 className="annot mb-3 text-ink-500">{t.approved}</h3>{table(approved, false)}</section> : null}
    </div>
  );
}
