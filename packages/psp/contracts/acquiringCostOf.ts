import { interchangeBps, schemeFeeBps } from './data/interchange.ts';
import type { AcquiringCost, AcquiringTerms, PricedCard } from './types/Acquiring.ts';

/**
 * What one card payment costs the merchant under its terms with an acquirer. An on-us card under an on-us
 * clause is priced at that rate, with no interchange to another bank; a blended rate is one figure; IC++
 * shows the interchange, the scheme's fee and the acquirer's markup. Integer minor units, rounded half up,
 * never more than the amount.
 */
export function acquiringCostOf(terms: AcquiringTerms, card: PricedCard, amountMinor: number): AcquiringCost {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw new Error(`Amount must be whole minor units, got ${amountMinor}`);
  const part = (bps: number) => Math.floor((amountMinor * bps + 5_000) / 10_000);
  const cap = (n: number) => Math.min(amountMinor, n);
  if (card.onUs && terms.onUsBps !== null) return { model: 'on_us', interchangeMinor: 0, schemeMinor: null, markupMinor: null, totalMinor: cap(part(terms.onUsBps) + terms.fixedMinor) };
  if (terms.model === 'blended') return { model: 'blended', interchangeMinor: null, schemeMinor: null, markupMinor: null, totalMinor: cap(part(terms.blendedBps ?? 0) + terms.fixedMinor) };
  const ic = !card.domestic ? interchangeBps.crossBorder : card.scheme === 'prostir' ? interchangeBps.prostir : interchangeBps.domestic[card.product] ?? interchangeBps.domestic.other!;
  const interchange = part(ic);
  const scheme = part(schemeFeeBps[card.scheme] ?? schemeFeeBps.other!);
  const markup = part(terms.markupBps ?? 0) + terms.fixedMinor;
  return { model: 'ic_plus_plus', interchangeMinor: interchange, schemeMinor: scheme, markupMinor: markup, totalMinor: cap(interchange + scheme + markup) };
}
