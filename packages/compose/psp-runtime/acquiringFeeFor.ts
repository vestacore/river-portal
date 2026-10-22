import { acquiringCostOf } from '@river/psp-contracts';
import { cardProfileOf, issuers } from '@river/psp-instruments';
import type { SessionView } from '@river/psp-session';
import { acquiringTermsFor } from './acquiringTermsFor.ts';
import type { World } from './types/World.ts';

/**
 * What the acquirer that carried an attempt charges the merchant for the amount captured, under the
 * merchant's own online terms: the on-us rate for a card of the acquirer's own bank where the terms have
 * one, otherwise the blended or IC++ price of the card. Nothing, when the merchant has no terms with it.
 */
export function acquiringFeeFor(world: World, session: SessionView, acquirerId: string, amountMinor: number): number {
  const terms = acquiringTermsFor(world, session.merchantId, acquirerId, 'online');
  if (!terms) return 0;
  const country = world.units.find((u) => u.id === session.merchantId)?.country ?? 'UA';
  const card = cardProfileOf(session.detail, country);
  const onUs = session.route?.rail === 'card' && card.issuer !== null && (issuers.find((i) => i.id === card.issuer)?.acquirerIds ?? []).includes(acquirerId);
  return acquiringCostOf(terms, { scheme: card.scheme, product: card.product, domestic: card.domestic, onUs }, amountMinor).totalMinor;
}
