/**
 * What the river may know about the instrument a payer used — never a full card number, never a name.
 * Card: brand and last four. Bank: the bank's name. Wallet: the wallet. Credit: the number of parts.
 */
export type InstrumentDetail = {
  brand?: 'visa' | 'mastercard' | 'prostir' | 'amex';
  last4?: string;
  bin?: string;
  issuerCountry?: string;
  bank?: string;
  wallet?: string;
  network?: string;
  parts?: number;
};
