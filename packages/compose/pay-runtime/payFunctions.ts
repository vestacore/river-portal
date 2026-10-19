import { handleDischarge } from './handleDischarge.ts';
import { handleIngest } from './handleIngest.ts';
import { handlePaypalWebhook } from './handlePaypalWebhook.ts';
import { handleStripeWebhook } from './handleStripeWebhook.ts';
import { handleTick } from './handleTick.ts';
import type { FunctionRequest } from './types/FunctionRequest.ts';
import type { FunctionResponse } from './types/FunctionResponse.ts';
import type { PayFunctionName } from './types/PayFunctionName.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/** The functions of the river by name: what each deployed function runs, and nothing more. */
export const payFunctions: Readonly<Record<PayFunctionName, (runtime: PayRuntime, request: FunctionRequest) => Promise<FunctionResponse>>> = {
  ingest: handleIngest,
  'webhook-stripe': handleStripeWebhook,
  'webhook-paypal': handlePaypalWebhook,
  discharge: handleDischarge,
  tick: handleTick,
};
