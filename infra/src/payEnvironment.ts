import type * as pulumi from '@pulumi/pulumi';
import type { PaySettings } from './types/PaySettings';
import type { Settings } from './types/Settings';

/**
 * The payment river's settings as environment variables — the same for every process that reads
 * them (packages/compose/pay-runtime/readPayConfig.ts). No secret is in here.
 */
export function payEnvironment(settings: Settings, pay: PaySettings): Record<string, pulumi.Input<string>> {
  return {
    PAY_FIRESTORE_DATABASE: pay.database,
    PAY_CARRY: 'outbox',
    PAY_FEE_BPS: String(pay.feeBps),
    PAY_INVOICE_TTL_HOURS: String(pay.invoiceTtlHours),
    PAY_SESSION_TTL_MINUTES: String(pay.sessionTtlMinutes),
    PAY_STRIPE_MODE: pay.stripeMode,
    PAY_PAYPAL_MODE: pay.paypalMode,
    PAY_PAYPAL_API_BASE: pay.paypalApiBase,
    PAY_MERCHANTS: pay.merchants,
    ...(pay.routing ? { PAY_ROUTING: pay.routing } : {}),
    ...(pay.allowSimulated ? { PAY_ALLOW_SIMULATED: '1' } : {}),
    ...(pay.allowLive ? { PAY_ALLOW_LIVE: '1' } : {}),
  };
}
