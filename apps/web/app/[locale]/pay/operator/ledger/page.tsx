import { providerLabels, type ProviderName } from '@river/pay-facts';
import { findMerchant, getPayRuntime } from '@river/pay-runtime';
import { ledgerSummary, readPostedOrders } from '@river/pay-views';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * The ledger: every posting the river wrote, checked for conservation — in each currency, debits
 * equal credits — and folded into what the providers hold, what the platform kept and what each
 * merchant is owed. Read from the same views the cabinets use — every order that has an entry, with
 * no limit: a ledger summed over a page of orders would balance and still be wrong.
 */
export default async function OperatorLedger({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  await requireOperator(locale);
  const t = getDictionary(locale).pay.operator.ledger;
  const runtime = await getPayRuntime();
  const ledger = ledgerSummary(await readPostedOrders(runtime.store, runtime.root));
  const entries = ledger.totals.reduce((n, total) => n + total.orders, 0);
  const account = (name: string) => {
    const [kind, id] = name.split(':');
    if (kind === 'provider') return t.accounts.clearing.replace('{provider}', providerLabels[id as ProviderName] ?? id ?? name);
    if (kind === 'merchant') return t.accounts.payable.replace('{merchant}', findMerchant(runtime.config, id ?? '')?.name ?? id ?? name);
    return name === 'platform:fees' ? t.accounts.fees : name;
  };
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <p className="mt-2 max-w-3xl text-ink-500">{t.lead}</p>
        <p className={`chamfer mt-6 inline-flex items-center gap-3 px-5 py-3 font-semibold text-ink-900 [--cut:10px] ${ledger.balanced ? '[--fill:var(--color-teal-100)]' : '[--fill:var(--color-attention-100)]'}`}>
          <Icon name={ledger.balanced ? 'check' : 'close'} className={`size-5 ${ledger.balanced ? 'text-teal-600' : 'text-attention-500'}`} />
          {ledger.balanced ? t.conserved : t.broken}
          <span className="annot font-normal text-ink-500">{t.postings.replace('{n}', String(ledger.postings)).replace('{orders}', String(entries))}</span>
        </p>
      </section>
      {ledger.postings === 0 ? <p className="text-ink-500">{t.empty}</p> : (
        <>
          <section className="grid gap-px border border-graphite/30 bg-graphite/30 md:grid-cols-3">
            {([[t.captured, 'capturedMinor'], [t.payable, 'payableMinor'], [t.fees, 'feesMinor']] as const).map(([label, field]) => (
              <div key={field} className="bg-paper p-6">
                <h3 className="annot text-ink-500">{label}</h3>
                <ul className="mt-3 space-y-1">
                  {ledger.totals.map((total) => <li key={total.currency} className="font-display text-2xl font-semibold tabular-nums text-ink-900">{payMoney(total[field], total.currency, locale)}</li>)}
                </ul>
              </div>
            ))}
          </section>
          <section className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-t border-graphite/60 text-left text-[0.95rem]">
              <thead className="annot text-ink-500">
                <tr className="border-b border-graphite/30">
                  <th scope="col" className="py-3 pr-4 font-normal">{t.account}</th>
                  <th scope="col" className="py-3 pr-4 text-right font-normal">{t.debit}</th>
                  <th scope="col" className="py-3 text-right font-normal">{t.credit}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.balances.map((balance) => (
                  <tr key={`${balance.account}-${balance.currency}`} className="border-b border-graphite/20">
                    <td className="py-3 pr-4">{account(balance.account)}<span className="block font-mono text-[0.72rem] text-ink-500">{balance.account}</span></td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink-900">{balance.balanceMinor > 0 ? payMoney(balance.balanceMinor, balance.currency, locale) : ''}</td>
                    <td className="py-3 text-right tabular-nums text-ink-900">{balance.balanceMinor < 0 ? payMoney(-balance.balanceMinor, balance.currency, locale) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
