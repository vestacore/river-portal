import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { acquiringCostOf, acquiringModelLabels, interchangeBps, schemeFeeBps } from '@river/psp-contracts';
import type { PaymentView } from '@river/psp-payment';
import { acquiringTermsFor } from '@river/psp-runtime';
import type { cabinet } from '@/lib/cabinet';
import { money, percent } from '@/lib/format';
import { acquirerName } from '@/lib/routing/acquirerName';
import { cardOf } from '@/lib/routing/cardOf';
import { cardProductText } from '@/lib/routing/cardProductText';
import { issuerName } from '@/lib/routing/issuerName';
import { rateBps } from '@/lib/routing/rateBps';
import { schemeText } from '@/lib/routing/schemeText';

/**
 * What one card payment cost to accept: the terms the acquirer applied, the price those terms give for
 * this card — interchange, scheme fees and the acquirer's markup, one blended rate, or the on-us rate —
 * the fee actually allocated at capture, and the settlement batch the acquirer paid it out in.
 */
export function CostOfAcceptance({ c, payment: p, locale }: { c: Awaited<ReturnType<typeof cabinet>>; payment: PaymentView; locale: Locale }) {
  const { t } = c;
  const terms = acquiringTermsFor(c.w, p.merchantId, p.acquirer, 'online');
  if (!terms) return <p className="text-[0.88rem] text-ink-500">{t('The group keeps no online terms with this acquirer, so the payment cannot be priced here.', 'Група не має онлайн-умов із цим еквайром, тож платіж тут не оцінити.')}</p>;
  const { card, onUs } = cardOf(c.w, p);
  const captured = p.capturedMinor > 0;
  const amount = captured ? p.capturedMinor : p.amountMinor;
  const cost = acquiringCostOf(terms, { scheme: card.scheme, product: card.product, domestic: card.domestic, onUs }, amount);
  const allocated = p.allocations.filter((a) => a.role === 'acquirer_fee').reduce((s, a) => s + a.amountMinor, 0);
  const batches = [...new Set(p.payouts.filter((x) => x.batchId.startsWith('stl_')).map((x) => x.batchId))];
  const contract = terms.contractId ? c.w.contracts.find((ct) => ct.id === terms.contractId) : undefined;
  const sum = (minor: number) => money(minor, p.currency, locale);
  const ic = !card.domestic ? interchangeBps.crossBorder : card.scheme === 'prostir' ? interchangeBps.prostir : interchangeBps.domestic[card.product] ?? interchangeBps.domestic.other ?? 0;
  const scheme = schemeFeeBps[card.scheme] ?? schemeFeeBps.other ?? 0;
  const fixed = terms.fixedMinor > 0 ? t(` + ${sum(terms.fixedMinor)} per payment`, ` + ${sum(terms.fixedMinor)} за платіж`) : '';
  const parts: Array<[string, string]> = cost.model === 'on_us'
    ? [[t(`On-us rate, ${percent(terms.onUsBps ?? 0, locale, 2)}${fixed}`, `Ставка on-us, ${percent(terms.onUsBps ?? 0, locale, 2)}${fixed}`), sum(cost.totalMinor)], [t('Interchange: none — the bank is on both sides', 'Interchange: немає — банк на обох боках'), sum(0)]]
    : cost.model === 'blended'
      ? [[t(`Blended rate, ${percent(terms.blendedBps ?? 0, locale, 2)}${fixed}`, `Єдина ставка, ${percent(terms.blendedBps ?? 0, locale, 2)}${fixed}`), sum(cost.totalMinor)]]
      : [
        [t(`Interchange, ${percent(ic, locale, 2)} — to the issuing bank`, `Interchange, ${percent(ic, locale, 2)} — банку-емітенту`), sum(cost.interchangeMinor ?? 0)],
        [t(`Scheme fees, ${percent(scheme, locale, 2)}`, `Збори платіжних систем, ${percent(scheme, locale, 2)}`), sum(cost.schemeMinor ?? 0)],
        [t(`Acquirer’s markup, ${percent(terms.markupBps ?? 0, locale, 2)}${fixed}`, `Маржа еквайра, ${percent(terms.markupBps ?? 0, locale, 2)}${fixed}`), sum(cost.markupMinor ?? 0)],
      ];
  const delta = allocated - cost.totalMinor;
  return (
    <div className="space-y-4 text-[0.88rem]">
      <p className="text-ink-700">
        <span className="font-semibold text-ink-900">{pickText(acquiringModelLabels[cost.model === 'on_us' ? 'on_us' : terms.model], locale)}</span>
        {' · '}{acquirerName(p.acquirer, locale)}{contract ? <> · <Link href={c.link(`/contracts/${contract.id}`)} className="font-mono text-[0.78rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{contract.number}</Link></> : null}
        <span className="block text-[0.8rem] text-ink-500">{pickText(terms.note, locale)}</span>
      </p>
      <p className="text-ink-700">{issuerName(card.issuer, locale, card.domestic)} · {schemeText(card.scheme, locale)} · {card.product !== 'other' ? cardProductText(card.product, locale) : card.domestic ? t('product not known', 'тип не відомий') : t('foreign card', 'іноземна картка')} · {onUs ? t('on-us: the card’s own bank accepted it', 'on-us: картку прийняв її власний банк') : t('not on-us', 'не on-us')}</p>
      <dl className="divide-y divide-graphite/15 border-y border-graphite/20">
        {parts.map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-3 py-1.5"><dt className="text-ink-700">{label}</dt><dd className="whitespace-nowrap tabular-nums text-ink-900">{value}</dd></div>)}
        <div className="flex items-baseline justify-between gap-3 py-1.5"><dt className="font-semibold text-ink-900">{captured ? t(`By the terms, on ${sum(amount)} captured`, `За умовами, на списані ${sum(amount)}`) : t(`By the terms, on ${sum(amount)} authorised`, `За умовами, на авторизовані ${sum(amount)}`)}</dt><dd className="whitespace-nowrap font-semibold tabular-nums text-ink-900">{sum(cost.totalMinor)}</dd></div>
        {captured ? (
          <div className="flex items-baseline justify-between gap-3 py-1.5">
            <dt className="text-ink-700">{t('Allocated to the acquirer at capture', 'Виділено еквайру при списанні')}<span className="block text-[0.78rem] text-ink-500">{t('effective rate', 'ефективна ставка')} {percent(rateBps(allocated, amount), locale, 2)} · {delta === 0 ? t('as the terms say', 'як за умовами') : t(`differs from the terms by ${sum(Math.abs(delta))}`, `відрізняється від умов на ${sum(Math.abs(delta))}`)}</span></dt>
            <dd className={`whitespace-nowrap tabular-nums ${delta === 0 ? 'text-ink-900' : 'text-attention-500'}`}>{sum(allocated)}</dd>
          </div>
        ) : null}
      </dl>
      {batches.length > 0 ? (
        <p className="text-ink-700">{t('Settled by the acquirer in', 'Еквайр розрахувався в пакеті')} {batches.map((b, i) => <span key={b}>{i > 0 ? ', ' : ''}<Link href={c.link(`/settlements/${b}`)} className="font-mono text-[0.78rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{b}</Link></span>)}<span className="block text-[0.8rem] text-ink-500">{t('The acquirer pays the amount less its fee straight to the group’s account; the platform holds no money.', 'Еквайр перераховує суму без своєї комісії напряму на рахунок групи; платформа коштів не тримає.')}</span></p>
      ) : captured ? <p className="text-[0.8rem] text-ink-500">{t('Not yet in a settlement batch: the acquirer settles the next business day.', 'Ще не в пакеті розрахунків: еквайр розраховується наступного робочого дня.')}</p> : null}
    </div>
  );
}
