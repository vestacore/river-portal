import { providerNames, type ProviderName } from '@river/pay-facts';
import type { Merchant } from './types/Merchant.ts';

const text = (value: unknown, max: number): string | null => (typeof value === 'string' && value.length > 0 && value.length <= max ? value : null);

/**
 * Reads the merchants of a deployment from JSON (`PAY_MERCHANTS`, set in infra). Strict: a merchant
 * that cannot be read stops the process at start, rather than taking payments under a wrong name.
 */
export function parseMerchants(json: string): Merchant[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('PAY_MERCHANTS is not valid JSON');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('PAY_MERCHANTS must be a list of merchants');
  const merchants = parsed.map((raw: unknown, index): Merchant => {
    const m = (raw ?? {}) as Record<string, unknown>;
    const id = text(m.id, 40);
    const name = text(m.name, 80);
    const providers = Array.isArray(m.providers) ? m.providers.filter((p): p is ProviderName => (providerNames as readonly unknown[]).includes(p)) : [];
    if (!id || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(id) || !name || providers.length === 0 || providers.length !== (m.providers as unknown[]).length) {
      throw new Error(`PAY_MERCHANTS[${index}] needs an id (lower-case letters, digits, hyphens), a name and at least one known provider`);
    }
    return { id, name, providers: [...new Set(providers)], stripeAccount: text(m.stripeAccount, 64), paypalMerchantId: text(m.paypalMerchantId, 64) };
  });
  if (new Set(merchants.map((m) => m.id)).size !== merchants.length) throw new Error('PAY_MERCHANTS has two merchants with the same id');
  return merchants;
}
