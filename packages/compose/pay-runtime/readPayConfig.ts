import { defaultRouting } from '@river/pay-flow';
import { demoMerchants } from './data/demoMerchants.ts';
import { payDefaults } from './data/payDefaults.ts';
import { parseMerchants } from './parseMerchants.ts';
import { parseRouting } from './parseRouting.ts';
import type { PayConfig } from './types/PayConfig.ts';
import { providerModes, type ProviderMode } from './types/ProviderMode.ts';

function whole(value: string | undefined, fallback: number, min: number, max: number, name: string): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} must be a whole number from ${min} to ${max}`);
  return n;
}

/**
 * Reads and checks the settings of the payment river. It refuses to start in three unsafe shapes:
 * the memory store in the cloud; live provider credentials without `PAY_ALLOW_LIVE=1` — this river
 * is minimal and has not been audited to move real money; and a stand-in provider beside a durable
 * store without `PAY_ALLOW_SIMULATED=1` — a stand-in settles orders that nobody paid.
 * A provider nobody declared is a stand-in only in a local river that keeps nothing (the memory
 * store, no mode set at all); anywhere else it is off.
 */
export function readPayConfig(env: Record<string, string | undefined> = process.env): PayConfig {
  const cloud = Boolean(env.K_SERVICE);
  const store = env.RIVER_STORE === 'firestore' ? 'firestore' : 'memory';
  if (store === 'memory' && cloud && env.RIVER_ALLOW_MEMORY !== '1') throw new Error('RIVER_STORE=memory is not allowed on Cloud Run');
  const durable = cloud || store === 'firestore';
  const declared = Boolean(env.PAY_STRIPE_MODE || env.PAY_PAYPAL_MODE);

  const mode = (value: string | undefined, name: string): ProviderMode => {
    if (value === undefined || value === '') return durable || declared ? 'off' : 'simulated';
    if (!(providerModes as readonly string[]).includes(value)) throw new Error(`${name} must be one of ${providerModes.join(', ')}`);
    return value as ProviderMode;
  };
  const stripe = { mode: mode(env.PAY_STRIPE_MODE, 'PAY_STRIPE_MODE'), secretKey: env.PAY_STRIPE_SECRET_KEY ?? '', webhookSecret: env.PAY_STRIPE_WEBHOOK_SECRET ?? '' };
  const paypal = {
    mode: mode(env.PAY_PAYPAL_MODE, 'PAY_PAYPAL_MODE'),
    clientId: env.PAY_PAYPAL_CLIENT_ID ?? '',
    secret: env.PAY_PAYPAL_SECRET ?? '',
    webhookId: env.PAY_PAYPAL_WEBHOOK_ID ?? '',
    apiBase: env.PAY_PAYPAL_API_BASE ?? payDefaults.paypalSandbox,
  };
  if (!/^https:\/\/api-m\.(sandbox\.)?paypal\.com$/.test(paypal.apiBase)) throw new Error('PAY_PAYPAL_API_BASE must be PayPal\'s sandbox or live API host');
  const live = /^(sk|rk)_live_/.test(stripe.secretKey) || (paypal.mode === 'connected' && paypal.apiBase !== payDefaults.paypalSandbox);
  if (live && env.PAY_ALLOW_LIVE !== '1') throw new Error('Live provider credentials are refused unless PAY_ALLOW_LIVE=1');

  const door: PayConfig['door'] = env.PAY_DOOR_URL ? { at: 'remote', url: env.PAY_DOOR_URL.replace(/\/+$/, '') } : { at: 'here' };
  if (door.at === 'remote' && !/^https:\/\//.test(door.url)) throw new Error('PAY_DOOR_URL must be an https URL');
  const standIn = stripe.mode === 'simulated' || paypal.mode === 'simulated';
  if (durable && door.at === 'here' && standIn && env.PAY_ALLOW_SIMULATED !== '1') throw new Error('A simulated provider beside a durable store needs PAY_ALLOW_SIMULATED=1');

  const off = (['stripe', 'paypal'] as const).filter((name) => (name === 'stripe' ? stripe.mode : paypal.mode) === 'off');
  // The merchants of a deployment are named in infra. The fictional ones exist only for a local
  // river, and there they are connected to whatever is mounted.
  const fictional = durable ? [] : demoMerchants.map((m) => ({ ...m, providers: m.providers.filter((p) => !off.includes(p)) })).filter((m) => m.providers.length > 0);
  const merchants = env.PAY_MERCHANTS ? parseMerchants(env.PAY_MERCHANTS) : fictional;
  const stranded = door.at === 'here' ? merchants.find((m) => m.providers.some((p) => off.includes(p))) : undefined;
  if (stranded) throw new Error(`Merchant ${stranded.id} is connected to a provider that is not mounted (${off.join(', ')})`);

  let bankUrls: Record<string, string> = {};
  if (env.PAY_BANK_URLS) {
    try {
      bankUrls = JSON.parse(env.PAY_BANK_URLS) as Record<string, string>;
    } catch {
      throw new Error('PAY_BANK_URLS is not valid JSON');
    }
    if (!bankUrls || typeof bankUrls !== 'object' || Object.values(bankUrls).some((url) => typeof url !== 'string' || !/^https:\/\//.test(url))) throw new Error('PAY_BANK_URLS must map each bank to an https URL');
  }

  const publicUrl = (env.PAY_PUBLIC_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s/]+$/.test(publicUrl)) throw new Error('PAY_PUBLIC_URL must be an origin, such as https://pay.example.org');

  const orgId = env.RIVER_ORG_ID ?? 'open-river-aid';
  return {
    orgId,
    root: `orgs/${orgId}`,
    store,
    projectId: env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT ?? null,
    database: env.PAY_FIRESTORE_DATABASE ?? env.RIVER_FIRESTORE_DATABASE ?? '(default)',
    seed: env.PAY_SEED === 'none' || store !== 'memory' || cloud ? 'none' : 'demo',
    feeBps: whole(env.PAY_FEE_BPS, payDefaults.feeBps, 0, payDefaults.maxFeeBps, 'PAY_FEE_BPS'),
    invoiceTtlHours: whole(env.PAY_INVOICE_TTL_HOURS, payDefaults.invoiceTtlHours, 1, payDefaults.maxInvoiceTtlHours, 'PAY_INVOICE_TTL_HOURS'),
    sessionTtlMinutes: whole(env.PAY_SESSION_TTL_MINUTES, payDefaults.sessionTtlMinutes, 30, 1_440, 'PAY_SESSION_TTL_MINUTES'),
    routing: env.PAY_ROUTING ? parseRouting(env.PAY_ROUTING) : [...defaultRouting],
    carry: env.PAY_CARRY === 'outbox' ? 'outbox' : 'inline',
    door,
    bankUrls,
    publicUrl,
    merchants,
    stripe,
    paypal,
  };
}
