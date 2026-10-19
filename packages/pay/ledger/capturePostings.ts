import type { Posting } from '@river/pay-facts';
import type { CaptureInput } from './types/CaptureInput.ts';

/**
 * The double entry of one captured payment. The provider holds the whole amount (debit, its
 * clearing account); the merchant is owed the net and the platform its fee (credits). The three
 * lines always balance: the fee is taken from the amount, never added to it.
 */
export function capturePostings(input: CaptureInput): Posting[] {
  const net = input.amountMinor - input.feeMinor;
  if (net < 0) throw new Error('The fee exceeds the amount');
  const postings: Posting[] = [
    { account: `provider:${input.provider}:clearing`, side: 'debit', amountMinor: input.amountMinor, currency: input.currency },
    { account: `merchant:${input.merchantId}:payable`, side: 'credit', amountMinor: net, currency: input.currency },
  ];
  if (input.feeMinor > 0) postings.push({ account: 'platform:fees', side: 'credit', amountMinor: input.feeMinor, currency: input.currency });
  return postings;
}
