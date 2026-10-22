import { pickText, type Locale } from '@river/i18n';
import { acquiringModelLabels } from '@river/psp-contracts';
import type { World } from '@river/psp-runtime';
import { money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { routeExample } from '@/lib/routingFigures';
import { OnUsRouting } from './OnUsRouting';

/**
 * The on-us drawing for one example card, live: the stand's own online terms price the payment at each
 * card acquirer, and the routing function of the platform chooses, under the group's strategy and
 * approval threshold as they are set now.
 */
export function OnUsFigure({ w, locale, merchantId = 'rt-online', issuerId = 'bank-dnipro', amountMinor = 100_000 }: { w: World; locale: Locale; merchantId?: string; issuerId?: string; amountMinor?: number }) {
  const t = lt(locale);
  const ex = routeExample(w, { merchantId, issuerId, product: 'debit', amountMinor });
  const chosen = ex.options.find((o) => o.chosen);
  const strategyWord: Record<string, [string, string]> = { approval_first: ['approval first', 'спершу схвалення'], least_cost: ['least cost', 'найменша вартість'], on_us_first: ['on-us first', 'спершу on-us'] };
  const productWord: Record<string, [string, string]> = { debit: ['debit', 'дебетова'], credit: ['credit', 'кредитна'], premium: ['premium', 'преміальна'], commercial: ['corporate', 'корпоративна'] };
  const why = ex.choice.rule === 'on-us' || ex.choice.rule === 'least-cost:on-us'
    ? t('on-us: the card’s own bank, no interchange', 'on-us: власний банк картки, без interchange')
    : ex.choice.rule.startsWith('least-cost') ? t('the lowest expected fee', 'найменша очікувана комісія') : t('chosen by approval', 'обрано за схваленням');
  const termsText = (o: (typeof ex.options)[number]) => {
    const x = o.terms;
    const base = x.model === 'blended' ? `${pickText(acquiringModelLabels.blended, locale)} ${percent(x.blendedBps ?? 0, locale, 2)}` : `IC++ · ${t('markup', 'маржа')} ${percent(x.markupBps ?? 0, locale, 2)}`;
    return x.onUsBps !== null ? `${base} · on-us ${percent(x.onUsBps, locale, 2)}` : base;
  };
  const options = ex.options.map((o) => ({
    id: o.acquirer.id,
    name: pickText(o.acquirer.label, locale),
    terms: termsText(o),
    cost: money(o.cost.totalMinor, 'UAH', locale),
    rate: percent(Math.round((o.cost.totalMinor / amountMinor) * 10_000), locale, 2),
    approval: `${t('approval', 'схвалення')} ${percent(o.acquirer.approvalBps, locale)}`,
    parts: {
      interchange: o.cost.model === 'ic_plus_plus' ? o.cost.interchangeMinor ?? 0 : 0,
      scheme: o.cost.model === 'ic_plus_plus' ? o.cost.schemeMinor ?? 0 : 0,
      markup: o.cost.model === 'ic_plus_plus' ? o.cost.markupMinor ?? 0 : 0,
      blended: o.cost.model === 'blended' ? o.cost.totalMinor : 0,
      onUs: o.cost.model === 'on_us' ? o.cost.totalMinor : 0,
    },
    chosen: o.chosen,
    eligible: o.eligible,
    note: o.chosen ? why : !o.eligible ? t('approval below the threshold', 'схвалення нижче порогу') : chosen ? `+${money(o.cost.totalMinor - chosen.cost.totalMinor, 'UAH', locale)} ${t('against the chosen route', 'до обраного маршруту')}` : '',
  }));
  return (
    <div>
      <div className="overflow-x-auto"><div className="min-w-[720px]">
    <OnUsRouting
      card={{ number: `${ex.range.prefix.slice(0, 4)} •••• •••• ${ex.range.prefix.slice(0, 4)}`, bank: pickText(ex.issuer.name, locale), detail: `${ex.range.scheme === 'visa' ? 'Visa' : ex.range.scheme === 'mastercard' ? 'Mastercard' : 'ПРОСТІР'} · ${t(productWord[ex.range.product]?.[0] ?? ex.range.product, productWord[ex.range.product]?.[1] ?? ex.range.product)} · ${t('Ukraine', 'Україна')}`, directory: t('The card: its first digits name its bank', 'Картка: перші цифри називають її банк') }}
      decision={{ title: t('Routing decision', 'Рішення маршрутизації'), strategy: `${t('strategy', 'стратегія')}: ${t(strategyWord[ex.strategy]?.[0] ?? ex.strategy, strategyWord[ex.strategy]?.[1] ?? ex.strategy)}`, threshold: `${t('approval threshold', 'поріг схвалення')} ${percent(ex.minApprovalBps, locale, 0)}` }}
      options={options}
      legend={{ interchange: 'Interchange', scheme: t('Scheme fee', 'Збір системи'), markup: t('Acquirer’s markup', 'Маржа еквайра'), blended: t('Blended rate', 'Єдина ставка'), onUs: t('On-us rate', 'Ставка on-us'), amount: `${t('A payment of', 'Платіж на')} ${money(amountMinor, 'UAH', locale)} · ${t('the group’s terms', 'умови групи')}` }}
    />
      </div></div>
      {/* On a phone the drawing scrolls sideways; the same decision, as a list. */}
      <ol className="mt-4 grid gap-2 sm:hidden">
        {options.map((o) => (
          <li key={o.id} className={`border px-3 py-2.5 ${o.chosen ? 'border-teal-600 bg-teal-100' : 'border-graphite/25 bg-paper'} ${o.eligible ? '' : 'opacity-70'}`}>
            <p className="flex items-baseline justify-between gap-3"><b className="text-ink-900">{o.name}</b><b className={`tabular-nums ${o.chosen ? 'text-teal-600' : 'text-ink-900'}`}>{o.cost}</b></p>
            <p className="annot mt-0.5 text-[0.58rem] text-ink-500">{o.terms} · {o.rate} · {o.approval}</p>
            {o.note ? <p className={`annot mt-1 text-[0.58rem] ${o.chosen ? 'text-teal-600' : o.eligible ? 'text-ink-500' : 'text-attention-500'}`}>{o.note}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
