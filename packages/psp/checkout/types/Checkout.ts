import type { LocalisedText, Locale } from '@river/i18n';
import type { InstrumentId } from '@river/psp-facts';

/**
 * The pay page of one unit, as its policies make it. Everything here is inherited down the hierarchy:
 * a holding sets the accent, a merchant its support contacts, a store the order of instruments.
 */
export type CheckoutConfig = {
  unitId: string;
  merchantName: LocalisedText;
  monogram: string;
  supportEmail: string;
  supportPhone: string;
  accent: string;
  instruments: InstrumentId[];
  collectEmail: boolean;
  sessionMinutes: number;
  showSplit: boolean;
  /** Bonus points may pay part of the order: the merchant's bonus system is connected and the policy offers it. */
  loyalty: boolean;
  languages: Locale[];
  returnUrl: string;
};

export type CardBrand = 'visa' | 'mastercard' | 'prostir' | 'amex';

/** What the demo's stand-in issuer does with a test card. No real card is ever accepted. */
export type TestCard = {
  number: string;
  brand: CardBrand;
  outcome: 'approve' | 'challenge' | 'decline' | 'insufficient_funds';
  issuerCountry: string;
  label: LocalisedText;
};

export type CardError = 'number_incomplete' | 'number_invalid' | 'brand_unsupported' | 'not_a_test_card' | 'expiry_incomplete' | 'expiry_invalid' | 'cvc_incomplete';
