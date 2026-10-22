import type { InstrumentDetail } from '@river/psp-facts';
import { issuerOfBin } from './issuerOfBin.ts';
import type { CardProfile, CardScheme } from './types/Issuer.ts';

/**
 * What routing and pricing need to know of a card, from what the payer's browser sent: the issuer by the
 * BIN, the scheme, the product and whether it is domestic for the merchant's country. A card whose stated
 * country differs from the issuer of its range is taken as a foreign card of an unknown bank.
 */
export function cardProfileOf(detail: InstrumentDetail | null | undefined, homeCountry: string): CardProfile {
  const found = issuerOfBin(detail?.bin);
  const stated = detail?.issuerCountry;
  const issuer = found && (!stated || stated === found.issuer.country) ? found : null;
  const scheme: CardScheme = (detail?.brand as CardScheme | undefined) ?? issuer?.scheme ?? 'other';
  const country = stated ?? issuer?.issuer.country ?? homeCountry;
  return { issuer: issuer?.issuer.id ?? null, scheme, product: issuer?.product ?? 'other', domestic: country === homeCountry };
}
