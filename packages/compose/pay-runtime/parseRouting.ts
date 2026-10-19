import { currencies, providerNames, type Currency, type ProviderName } from '@river/pay-facts';
import type { RoutingRule } from '@river/pay-flow';

/** Reads the routing table of a deployment from JSON (`PAY_ROUTING`, set in infra). The order of the rules is their priority. */
export function parseRouting(json: string): RoutingRule[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('PAY_ROUTING is not valid JSON');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('PAY_ROUTING must be a list of rules');
  return parsed.map((raw: unknown, index): RoutingRule => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const list = Array.isArray(r.currencies) ? r.currencies : [];
    const carried = list.filter((c): c is Currency => (currencies as readonly unknown[]).includes(c));
    const max = r.maxMinor === null || r.maxMinor === undefined ? null : Number(r.maxMinor);
    if (!(providerNames as readonly unknown[]).includes(r.provider) || carried.length === 0 || carried.length !== list.length || (max !== null && (!Number.isInteger(max) || max <= 0)) || typeof r.why !== 'string' || r.why.length === 0 || r.why.length > 160) {
      throw new Error(`PAY_ROUTING[${index}] needs a known provider, known currencies, a whole maxMinor or null, and a reason`);
    }
    return { provider: r.provider as ProviderName, currencies: carried, maxMinor: max, why: r.why };
  });
}
