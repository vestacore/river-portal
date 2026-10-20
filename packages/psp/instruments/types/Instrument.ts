import type { LocalisedText } from '@river/i18n';
import type { Currency, FactType, InstrumentId, Rail } from '@river/psp-facts';

export type InstrumentFamily = 'card' | 'wallet' | 'account' | 'credit' | 'crypto' | 'cash';

/** What an instrument can do after the mouth. */
export type InstrumentCapabilities = {
  refunds: boolean;
  partialRefunds: boolean;
  recurring: boolean;
  manualCapture: boolean;
  disputes: boolean;
  split: boolean;
};

/**
 * One payment instrument. `course` is the line of bridges a successful attempt crosses after the
 * payer chose it, in order, up to the capture; screening, distribution and the mouth are the same for
 * every instrument. `push`: the payer sends the money (a transfer, a QR, cash, a chain) rather than the
 * merchant taking it. `settlementDays` is when shares can be paid out at the earliest.
 */
export type InstrumentDefinition = {
  id: InstrumentId;
  family: InstrumentFamily;
  rail: Rail;
  push: boolean;
  course: readonly FactType[];
  capabilities: InstrumentCapabilities;
  regions: readonly ('UA' | 'EU')[];
  currencies: readonly Currency[];
  settlementDays: number;
  typicalFeeBps: number;
  fixedFeeMinor: number;
  label: LocalisedText;
  description: LocalisedText;
  payerHint: LocalisedText;
};

/** An acquirer, a bank or a provider that carries a rail; a route chooses one per attempt. */
export type Acquirer = {
  id: string;
  name: string;
  rails: readonly Rail[];
  regions: readonly ('UA' | 'EU')[];
  approvalBps: number;
  standIn: true;
};
