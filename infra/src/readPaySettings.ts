import * as pulumi from '@pulumi/pulumi';
import type { PaySettings } from './types/PaySettings';

const modes = ['off', 'simulated', 'connected'] as const;

/**
 * Reads the payment river's stack configuration (adr/records/ADR-0025). Nothing is created unless
 * `river-portal:payEnabled` is true. A connected provider must come with its secrets, so a
 * half-configured river fails at preview, not at the first payment.
 */
export function readPaySettings(): PaySettings {
  const config = new pulumi.Config('river-portal');
  const mode = (key: string) => modes.find((m) => m === config.get(key)) ?? 'off';
  const settings: PaySettings = {
    enabled: config.getBoolean('payEnabled') ?? false,
    database: config.get('payDatabase') ?? 'river-pay',
    feeBps: config.getNumber('payFeeBps') ?? 250,
    invoiceTtlHours: config.getNumber('payInvoiceTtlHours') ?? 72,
    sessionTtlMinutes: config.getNumber('paySessionTtlMinutes') ?? 180,
    stripeMode: mode('payStripeMode'),
    paypalMode: mode('payPaypalMode'),
    paypalApiBase: config.get('payPaypalApiBase') ?? 'https://api-m.sandbox.paypal.com',
    merchants: JSON.stringify(config.getObject<unknown[]>('payMerchants') ?? []),
    routing: config.getObject<unknown[]>('payRouting') ? JSON.stringify(config.getObject<unknown[]>('payRouting')) : undefined,
    allowSimulated: config.getBoolean('payAllowSimulated') ?? false,
    allowLive: config.getBoolean('payAllowLive') ?? false,
    tickSchedule: config.get('payTickSchedule') ?? '*/10 * * * *',
    secrets: {
      stripeSecretKey: config.getSecret('payStripeSecretKey'),
      stripeWebhookSecret: config.getSecret('payStripeWebhookSecret'),
      paypalClientId: config.getSecret('payPaypalClientId'),
      paypalSecret: config.getSecret('payPaypalSecret'),
      paypalWebhookId: config.getSecret('payPaypalWebhookId'),
    },
  };
  if (!settings.enabled) return settings;
  const { secrets } = settings;
  if (!/^[a-z][a-z0-9-]{2,61}[a-z0-9]$/.test(settings.database)) throw new Error('payDatabase must be a Firestore database id: 4 to 63 lower-case letters, digits and hyphens, starting with a letter');
  // What the functions would refuse at start is refused here, at preview.
  const mounted = (['stripe', 'paypal'] as const).filter((name) => (name === 'stripe' ? settings.stripeMode : settings.paypalMode) !== 'off');
  const merchants = config.getObject<Array<{ id?: unknown; name?: unknown; providers?: unknown }>>('payMerchants') ?? [];
  if (merchants.length === 0) throw new Error('river-portal:payMerchants must name at least one merchant: { id, name, providers }');
  for (const merchant of merchants) {
    const providers = Array.isArray(merchant.providers) ? (merchant.providers as unknown[]) : [];
    if (typeof merchant.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(merchant.id) || typeof merchant.name !== 'string' || merchant.name.length === 0 || providers.length === 0) {
      throw new Error('Each of payMerchants needs an id (lower-case letters, digits, hyphens), a name and at least one provider');
    }
    const absent = providers.filter((p) => !(mounted as readonly unknown[]).includes(p));
    if (absent.length > 0) throw new Error(`Merchant ${merchant.id} is connected to ${absent.join(', ')}, which this stack does not mount (mounted: ${mounted.join(', ') || 'none'})`);
  }
  if (settings.stripeMode === 'off' && settings.paypalMode === 'off') throw new Error('river-portal:payEnabled needs payStripeMode or payPaypalMode to be simulated or connected');
  if (settings.stripeMode === 'connected' && (!secrets.stripeSecretKey || !secrets.stripeWebhookSecret)) throw new Error('payStripeMode: connected needs the secrets payStripeSecretKey and payStripeWebhookSecret');
  if (settings.paypalMode === 'connected' && (!secrets.paypalClientId || !secrets.paypalSecret || !secrets.paypalWebhookId)) throw new Error('payPaypalMode: connected needs the secrets payPaypalClientId, payPaypalSecret and payPaypalWebhookId');
  if ((settings.stripeMode === 'simulated' || settings.paypalMode === 'simulated') && !settings.allowSimulated) throw new Error('A simulated provider settles orders nobody paid: set payAllowSimulated: true to accept that for a sandbox');
  return settings;
}
