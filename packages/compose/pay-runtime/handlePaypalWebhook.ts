import { receivePaypalEvent } from './receivePaypalEvent.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/** PayPal's bank function: public, and it believes only what PayPal confirms it sent. */
export async function handlePaypalWebhook(runtime: PayRuntime, request: FunctionRequest): Promise<FunctionResponse> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const outcome = await receivePaypalEvent(runtime, { headers: request.headers, body: request.body });
  return { status: outcome === 'rejected' ? 400 : outcome === 'unavailable' ? 503 : 200, body: { outcome } };
}
