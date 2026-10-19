import type { Currency } from './Currency.ts';
import type { ProviderName } from './ProviderName.ts';

/** `providerCapture.Requested` — an intention: ask the provider to capture an approved session, for the invoice's amount. */
export type ProviderCaptureRequested = {
  provider: ProviderName;
  sessionRef: string;
  orderId: string;
  amountMinor: number;
  currency: Currency;
};
