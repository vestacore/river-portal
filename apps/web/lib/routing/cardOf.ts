import type { InstrumentDetail } from '@river/psp-facts';
import { cardProfileOf, issuers, type CardProfile } from '@river/psp-instruments';
import type { World } from '@river/psp-runtime';

/**
 * What pricing knows of the card behind a session or a payment — issuer, scheme, product, domestic for the
 * merchant's country — and whether the acquirer that carried it belongs to the card's own bank (on-us).
 */
export function cardOf(w: World, input: { merchantId: string; detail: InstrumentDetail | null | undefined; acquirer: string }): { card: CardProfile; onUs: boolean } {
  const country = w.units.find((u) => u.id === input.merchantId)?.country ?? 'UA';
  const card = cardProfileOf(input.detail, country);
  const onUs = card.issuer !== null && (issuers.find((i) => i.id === card.issuer)?.acquirerIds ?? []).includes(input.acquirer);
  return { card, onUs };
}
