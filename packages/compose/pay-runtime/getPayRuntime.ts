import { createPayRuntime } from './createPayRuntime.ts';
import { readPayConfig } from './readPayConfig.ts';
import { seedPayDemo } from './seedPayDemo.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

const key = Symbol.for('river.pay.runtime');
type Holder = { [key]?: Promise<PayRuntime> };

async function create(): Promise<PayRuntime> {
  const config = readPayConfig();
  const runtime = await createPayRuntime(config);
  // The demo is made through the stand-ins, so it is seeded only where every provider is one.
  if (config.seed === 'demo' && config.stripe.mode === 'simulated' && config.paypal.mode === 'simulated') await seedPayDemo(runtime);
  return runtime;
}

/** The process-wide payment river (kept on globalThis so development hot reloads reuse it). */
export function getPayRuntime(): Promise<PayRuntime> {
  const holder = globalThis as Holder;
  holder[key] ??= create().catch((error: unknown) => {
    delete holder[key];
    throw error;
  });
  return holder[key];
}
