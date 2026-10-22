import type { Locale } from '@river/i18n';
import type { PspFact } from '@river/psp-facts';
import type { SessionView } from '@river/psp-session';
import type { cabinet } from '@/lib/cabinet';
import { money, percent } from '@/lib/format';
import { acquirerName } from '@/lib/routing/acquirerName';
import { bankName } from '@/lib/routing/bankName';
import { cardOf } from '@/lib/routing/cardOf';
import { cardProductText } from '@/lib/routing/cardProductText';
import { issuerName } from '@/lib/routing/issuerName';
import { railText } from '@/lib/routing/railText';
import { ruleText } from '@/lib/routing/ruleText';
import { schemeText } from '@/lib/routing/schemeText';
import { strategyText } from '@/lib/routing/strategyText';
import { FieldGrid, type Field } from '../../panels/FieldGrid';

/**
 * The routing decision of one attempt, as its stream recorded it: the strategy, the card — its issuing
 * bank, scheme and product, on-us or not — the acquirer chosen with its expected fee, the rule that chose
 * it in one line, and every acquirer that was weighed with its quote, approval rate and whether it qualified.
 */
export function RoutingDecision({ c, session, locale }: { c: Awaited<ReturnType<typeof cabinet>>; session: SessionView; locale: Locale }) {
  const { t } = c;
  const route = session.route;
  if (!route) return null;
  const fact = c.w.streams.get(session.sessionId)?.findLast((f): f is PspFact<'route.Chosen'> => f.type === 'route.Chosen');
  const alternatives = [...(fact?.payload.alternatives ?? [])].sort((a, b) => Number(b.acquirer === route.acquirer) - Number(a.acquirer === route.acquirer) || (a.feeMinor ?? Infinity) - (b.feeMinor ?? Infinity));
  const card = route.rail === 'card';
  const profile = cardOf(c.w, { merchantId: session.merchantId, detail: session.detail, acquirer: route.acquirer });
  const name = (id: string) => acquirerName(id, locale);
  const bank = bankName(route.acquirer, locale);
  const fields: Field[] = [
    { label: t('Strategy', 'Стратегія'), cell: route.strategy ? { kind: 'text', value: strategyText(route.strategy, locale).name } : { kind: 'empty' } },
    ...(card ? [
      { label: t('Issuing bank', 'Банк-емітент'), cell: { kind: 'text', value: issuerName(route.issuer ?? profile.card.issuer, locale, profile.card.domestic) } },
      { label: t('Card', 'Картка'), cell: { kind: 'text', value: `${schemeText(profile.card.scheme, locale)} · ${profile.card.product !== 'other' ? cardProductText(profile.card.product, locale) : profile.card.domestic ? t('product not known', 'тип не відомий') : t('foreign card', 'іноземна картка')}`, sub: profile.card.domestic ? t('domestic', 'вітчизняна') : t('issued abroad', 'випущена за кордоном') } },
      { label: 'On-us', cell: { kind: 'bool', value: route.onUs, yes: t('yes: the card’s own bank acquires it', 'так: картку приймає її власний банк'), no: t('no', 'ні') } },
    ] satisfies Field[] : [{ label: t('Rail', 'Рейка'), cell: { kind: 'text', value: railText(route.rail, locale) } } satisfies Field]),
    { label: t('Chosen', 'Обрано'), cell: { kind: 'text', value: name(route.acquirer), ...(bank ? { sub: bank } : {}) } },
    { label: t('Expected fee', 'Очікувана комісія'), cell: route.feeMinor !== null ? { kind: 'money', minor: route.feeMinor, currency: session.currency } : { kind: 'text', value: t('not priced here', 'тут не оцінюється'), sub: t('the PSP’s tariff applies', 'діє тариф PSP') } },
  ];
  return (
    <div className="space-y-4">
      <FieldGrid locale={locale} fields={fields} />
      <p className="border-l-2 border-sunrise-500 pl-3 text-[0.9rem] text-ink-700">{ruleText(route.rule, locale, name)}</p>
      {alternatives.length > 0 ? (
        <div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead><tr className="border-b border-ink-900/80">{[card ? t('Acquirer', 'Еквайр') : t('Provider', 'Провайдер'), t('Expected fee', 'Очікувана комісія'), t('Approval rate', 'Рівень схвалення'), 'On-us', t('Qualified', 'Пройшов відбір')].map((h, i) => <th key={h} scope="col" className={`annot px-3 py-2 text-[0.58rem] font-normal text-ink-500 ${i > 0 && i < 3 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
              <tbody>
                {alternatives.map((a) => {
                  const chosen = a.acquirer === route.acquirer;
                  return (
                    <tr key={a.acquirer} className={`border-b border-graphite/15 ${chosen ? 'bg-paper-deep' : ''}`}>
                      <td className="px-3 py-2"><span className={chosen ? 'font-semibold text-ink-900' : 'text-ink-900'}>{name(a.acquirer)}</span>{chosen ? <span className="annot ml-2 border border-ink-900 px-1.5 py-0.5 text-[0.52rem] text-ink-900">{t('chosen', 'обрано')}</span> : null}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-900">{a.feeMinor !== null ? money(a.feeMinor, session.currency, locale) : <span className="text-ink-300">{t('no terms', 'немає умов')}</span>}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-900">{percent(a.approvalBps, locale)}</td>
                      <td className="px-3 py-2 text-ink-700">{a.onUs ? t('yes', 'так') : t('no', 'ні')}</td>
                      <td className={`px-3 py-2 ${a.eligible ? 'text-teal-600' : 'text-attention-500'}`}>{a.eligible ? t('yes', 'так') : a.feeMinor === null ? (card ? t('no: no terms price the card', 'ні: умови не передбачають картку') : t('no: no terms with it', 'ні: немає умов')) : t('no: approval below the threshold', 'ні: схвалення нижче порогу')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[0.8rem] text-ink-500">{card
            ? t('Qualified: your terms with the acquirer price the card, and its approval rate meets the threshold that was in force. Expected fees are at the attempt’s amount, under your acquiring terms.', 'Пройшов відбір: ваші умови з еквайром передбачають картку, і його рівень схвалення не нижчий за чинний тоді поріг. Очікувані комісії — на суму спроби, за вашими умовами еквайрингу.')
            : t('Qualified: your terms with the provider price the payment, and its approval rate meets the threshold that was in force. Expected fees are at the attempt’s amount.', 'Пройшов відбір: ваші умови з провайдером передбачають платіж, і його рівень схвалення не нижчий за чинний тоді поріг. Очікувані комісії — на суму спроби.')}</p>
        </div>
      ) : null}
    </div>
  );
}
