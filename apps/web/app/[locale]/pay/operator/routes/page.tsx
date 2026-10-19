import { formatNumber } from '@river/i18n';
import { providerLabels, providerNames } from '@river/pay-facts';
import { getPayRuntime } from '@river/pay-runtime';
import { FactTable } from '@/components/site/FactTable';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * The constitution of this payment river, as it was read at start: the commission, how long an
 * invoice stands, the routing table, how each provider is mounted, the merchants and their
 * connections, and how the river is wired. Shown, not edited — these are set in infra.
 */
export default async function OperatorRoutes({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  await requireOperator(locale);
  const t = getDictionary(locale).pay.operator.routes;
  const { config, store } = await getPayRuntime();
  const tone = { off: 'ink', simulated: 'sunrise', connected: 'teal' } as const;
  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <p className="mt-2 max-w-3xl text-ink-500">{t.lead}</p>
        <div className="mt-8 grid gap-px border border-graphite/30 bg-graphite/30 sm:grid-cols-3">
          <div className="bg-paper p-6"><h3 className="annot text-ink-500">{t.commission}</h3><p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink-900">{formatNumber(config.feeBps / 100, locale)}%</p></div>
          <div className="bg-paper p-6"><h3 className="annot text-ink-500">{t.invoiceStands}</h3><p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink-900">{t.hours.replace('{n}', String(config.invoiceTtlHours))}</p></div>
          <div className="bg-paper p-6"><h3 className="annot text-ink-500">{t.pageStands}</h3><p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink-900">{t.minutes.replace('{n}', String(config.sessionTtlMinutes))}</p></div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold">{t.routing}</h3>
        <p className="mb-5 mt-2 max-w-3xl text-ink-500">{t.routingLead}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-t border-graphite/60 text-left text-[0.95rem]">
            <thead className="annot text-ink-500">
              <tr className="border-b border-graphite/30">{[t.rule, t.providers, t.carries, t.limit, t.reason].map((label) => <th key={label} scope="col" className="py-3 pr-4 font-normal">{label}</th>)}</tr>
            </thead>
            <tbody>
              {config.routing.map((rule, i) => (
                <tr key={`${rule.provider}-${i}`} className="border-b border-graphite/20 align-top">
                  <td className="py-3 pr-4 font-mono text-sm text-ink-500">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3 pr-4 font-semibold text-ink-900">{providerLabels[rule.provider]}</td>
                  <td className="py-3 pr-4 font-mono text-sm">{rule.currencies.join(' · ')}</td>
                  <td className="py-3 pr-4 tabular-nums">{rule.maxMinor === null ? t.any : rule.currencies.map((c) => t.upTo.replace('{amount}', payMoney(rule.maxMinor ?? 0, c, locale))).join(' · ')}</td>
                  <td className="py-3 pr-4 text-ink-700">{rule.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <h3 className="mb-4 text-xl font-semibold">{t.providers}</h3>
          <FactTable rows={providerNames.map((name) => [providerLabels[name], <Badge key={name} tone={tone[config[name].mode]}>{t.mode[config[name].mode]}</Badge>])} />
        </section>
        <section>
          <h3 className="mb-4 text-xl font-semibold">{t.merchants}</h3>
          <FactTable rows={config.merchants.map((m) => [m.id, <>{m.name} <span className="text-ink-500">— {m.providers.map((p) => providerLabels[p]).join(', ')}</span></>])} />
        </section>
        <section className="lg:col-span-2">
          <h3 className="mb-4 text-xl font-semibold">{t.wiring}</h3>
          <FactTable rows={[
            [dictKey('door'), t.door[config.door.at]],
            [dictKey('carry'), t.carry[config.carry]],
            [t.store, <span key="s" className="font-mono text-sm">{store.driver}{store.driver === 'firestore' ? ` · ${config.database}` : ''} · {config.root}</span>],
          ]} />
        </section>
      </div>
    </div>
  );
}

// The two wiring settings are named by their environment variables: that is where an operator changes them.
function dictKey(setting: 'door' | 'carry'): string {
  return setting === 'door' ? 'PAY_DOOR_URL' : 'PAY_CARRY';
}
