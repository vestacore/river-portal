import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { acquiringModelLabels, type AcquiringTerms } from '@river/psp-contracts';
import type { cabinet } from '@/lib/cabinet';
import { money, percent } from '@/lib/format';
import { acquirerName } from '@/lib/routing/acquirerName';
import { bankName } from '@/lib/routing/bankName';

/**
 * A merchant's acquiring terms as a table: for each provider and channel, the pricing model, the rate or
 * the acquirer's markup over interchange and scheme fees, the fixed part, the on-us rate where the terms
 * have one, and the agreement they belong to.
 */
export function AcquiringTermsTable({ terms, c, locale, showProvider = true, compact = false }: { terms: readonly AcquiringTerms[]; c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; showProvider?: boolean; compact?: boolean }) {
  const { t } = c;
  const rate = (x: AcquiringTerms) => (x.model === 'ic_plus_plus'
    ? t(`interchange + scheme fees + ${percent(x.markupBps ?? 0, locale, 2)}`, `interchange + збори платіжних систем + ${percent(x.markupBps ?? 0, locale, 2)}`)
    : x.blendedBps ? percent(x.blendedBps, locale, 2) : x.fixedMinor ? t('fixed fee only', 'лише фіксована плата') : t('no fee', 'без комісії'));
  const head = [...(showProvider ? [t('Provider', 'Провайдер')] : []), t('Unit', 'Одиниця'), t('Channel', 'Канал'), t('Model', 'Модель'), t('Rate', 'Ставка'), t('Fixed part', 'Фіксована частина'), t('On-us rate', 'Ставка on-us'), t('Agreement', 'Договір'), ...(compact ? [] : [t('Note', 'Примітка')])];
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[0.86rem]">
        <thead><tr className="border-b border-ink-900/80">{head.map((h) => <th key={h} scope="col" className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
        <tbody>
          {terms.map((x) => {
            const contract = x.contractId ? c.w.contracts.find((ct) => ct.id === x.contractId) : undefined;
            const bank = bankName(x.acquirerId, locale);
            return (
              <tr key={x.id} className="border-b border-graphite/15 align-top">
                {showProvider ? <td className="min-w-[10rem] px-3 py-2"><span className="text-ink-900">{acquirerName(x.acquirerId, locale)}</span>{bank ? <span className="block text-[0.76rem] text-ink-500">{bank}</span> : null}</td> : null}
                <td className="px-3 py-2"><Link href={c.link(`/units/${x.merchantId}`)} className="text-ink-900 underline decoration-graphite/30 underline-offset-2 hover:decoration-sunrise-500">{c.unitName(x.merchantId)}</Link></td>
                <td className="px-3 py-2 text-ink-700">{x.channel === 'online' ? t('online', 'онлайн') : t('in store', 'у магазинах')}</td>
                <td className="px-3 py-2 text-ink-900">{pickText(acquiringModelLabels[x.model], locale)}</td>
                <td className="px-3 py-2 tabular-nums text-ink-900">{rate(x)}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{x.fixedMinor ? <span className="text-ink-900">{money(x.fixedMinor, c.w.units.find((u) => u.id === x.merchantId)?.currency ?? 'UAH', locale)}</span> : <span className="text-ink-300">—</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{x.onUsBps !== null ? <span className="text-ink-900">{percent(x.onUsBps, locale, 2)}</span> : <span className="text-ink-500">{t('no clause', 'без умови')}</span>}</td>
                <td className="px-3 py-2">{contract ? <Link href={c.link(`/contracts/${contract.id}`)} className="font-mono text-[0.78rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{contract.number}</Link> : <span className="text-ink-300">—</span>}</td>
                {compact ? null : <td className="min-w-[12rem] px-3 py-2 text-[0.8rem] text-ink-500">{pickText(x.note, locale)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
