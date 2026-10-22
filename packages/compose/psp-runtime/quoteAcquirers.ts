import { acquiringCostOf } from '@river/psp-contracts';
import type { InstrumentDetail, Rail } from '@river/psp-facts';
import type { RouteQuote } from '@river/psp-flow';
import { acquirersFor, cardProfileOf, issuers } from '@river/psp-instruments';
import { acquiringTermsFor } from './acquiringTermsFor.ts';
import { regionOf } from './regionOf.ts';
import type { World } from './types/World.ts';

/**
 * What each connected provider of a rail would charge the merchant for one online payment, under the
 * merchant's own acquiring terms — and whether the card is the provider's own bank's (on-us). A provider
 * without terms gives no quote: routing by cost cannot choose it.
 */
export function quoteAcquirers(world: World, input: { merchantId: string; unitId: string; rail: Rail; detail: InstrumentDetail | null; amountMinor: number }): { quotes: RouteQuote[]; issuer: string | null } {
  const country = world.units.find((u) => u.id === input.merchantId)?.country ?? 'UA';
  const card = cardProfileOf(input.detail, country);
  const own = card.issuer ? issuers.find((i) => i.id === card.issuer)?.acquirerIds ?? [] : [];
  const quotes: RouteQuote[] = [];
  for (const acquirer of acquirersFor(input.rail, regionOf(world, input.unitId), world.providers)) {
    const terms = acquiringTermsFor(world, input.merchantId, acquirer.id, 'online');
    if (!terms) continue;
    const onUs = input.rail === 'card' && own.includes(acquirer.id);
    quotes.push({ acquirer: acquirer.id, onUs, feeMinor: acquiringCostOf(terms, { scheme: card.scheme, product: card.product, domestic: card.domestic, onUs }, input.amountMinor).totalMinor });
  }
  return { quotes, issuer: input.rail === 'card' ? card.issuer : null };
}
