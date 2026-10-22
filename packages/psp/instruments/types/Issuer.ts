import type { LocalisedText } from '@river/i18n';

/** A card's product as interchange reads it. */
export type CardProduct = 'debit' | 'credit' | 'premium' | 'commercial' | 'other';

/** A card scheme. */
export type CardScheme = 'visa' | 'mastercard' | 'prostir' | 'amex' | 'other';

/**
 * A bank that issues cards. `acquirerIds` are its own acquiring arms: a card of this bank routed to one
 * of them is an on-us payment — the bank is on both sides, and no interchange passes to another bank.
 * `bins` are the leading digits of its cards, with the scheme and product each range carries.
 */
export type Issuer = {
  id: string;
  name: LocalisedText;
  country: string;
  acquirerIds: readonly string[];
  bins: ReadonlyArray<{ prefix: string; scheme: CardScheme; product: CardProduct }>;
};

/** What routing and pricing need to know of a card: who issued it, its scheme and product, and whether it is domestic. */
export type CardProfile = {
  issuer: string | null;
  scheme: CardScheme;
  product: CardProduct;
  domestic: boolean;
};
