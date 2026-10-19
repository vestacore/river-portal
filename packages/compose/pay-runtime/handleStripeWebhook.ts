import { receiveStripeEvent } from './receiveStripeEvent.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * Stripe's bank function: public, and it believes nothing unsigned. 200 for what entered and for
 * what is not this river's business (so Stripe stops sending it); 400 for a bad signature.
 */
export async function handleStripeWebhook(runtime: PayRuntime, request: FunctionRequest): Promise<FunctionResponse> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const outcome = await receiveStripeEvent(runtime, { payload: request.body, signature: request.headers['stripe-signature'] ?? '' });
  return { status: outcome === 'rejected' ? 400 : outcome === 'unavailable' ? 503 : 200, body: { outcome } };
}
