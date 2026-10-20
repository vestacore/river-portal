import type { InstrumentId } from '@river/psp-facts';
import type { Waiting } from '@river/psp-runtime';

/** What the pay page shows after each step: where the attempt stands, what it waits for, and what to show the payer. */
export type PayState = {
  state: 'choose' | Waiting;
  sessionId: string | null;
  instrument: InstrumentId | null;
  failure: string | null;
  paymentId: string | null;
  receiptId: string | null;
  bridges: number;
  waitingFor: string | null;
  instructions: { iban?: string; reference?: string; code?: string; expiresAt?: string; network?: string; address?: string };
};
