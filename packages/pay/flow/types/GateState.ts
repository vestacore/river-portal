import type { InvoiceIssued } from '@river/pay-facts';
import type { AttemptState } from './AttemptState.ts';

/**
 * What the checkout gate holds: the invoice, the payer's word, the attempts, and what shuts the
 * gate for good. The payer's word (`asked`) is spent when an attempt starts — a provider is routed,
 * or the gate refuses.
 */
export type GateState = AttemptState & {
  invoice: InvoiceIssued | null;
  asked: boolean;
  paid: boolean;
  cancelled: boolean;
  flagged: boolean;
};
