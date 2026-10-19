import type { SimulatedOutcome } from '@river/pay-providers';

/**
 * A gesture on its way to the door, as a message: the same value whether the door is in this
 * process or behind a wire. The door admits these and nothing else — a provider's capture or a
 * ledger entry can never be said here. `simulateOutcome` is admitted only for a stand-in provider,
 * and only from the payer whose session it is.
 */
export type DoorAct =
  | { act: 'placeOrder'; merchantId: string; input: Record<string, string> }
  | { act: 'requestCheckout'; by: { payKey: string } | { orderId: string; payerRef: string } }
  | { act: 'cancelOrder'; orderId: string; by: { role: 'merchant' | 'operator'; id: string }; reason: string }
  | { act: 'simulateOutcome'; sessionRef: string; outcome: SimulatedOutcome; by: { payKey: string } | { payerRef: string } };
