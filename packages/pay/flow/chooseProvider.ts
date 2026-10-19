import { providerLabels, type Currency, type ProviderName } from '@river/pay-facts';
import type { Route } from './types/Route.ts';
import type { RoutingRule } from './types/RoutingRule.ts';

/**
 * Routes one attempt: the first rule that carries the currency and the amount, among the
 * merchant's connected providers. Providers that already failed for this order are tried last, so
 * a second attempt goes to another bank when there is one. Returns null when nothing carries it.
 */
export function chooseProvider(order: { amountMinor: number; currency: Currency; providers: readonly ProviderName[] }, routing: readonly RoutingRule[], failed: readonly ProviderName[]): Route | null {
  const fits = (rule: RoutingRule) => order.providers.includes(rule.provider) && rule.currencies.includes(order.currency) && (rule.maxMinor === null || order.amountMinor <= rule.maxMinor);
  const fresh = routing.find((rule) => fits(rule) && !failed.includes(rule.provider));
  if (fresh) return { provider: fresh.provider, reason: failed.length > 0 ? `${fresh.why} (after ${[...new Set(failed)].map((name) => providerLabels[name]).join(', ')} failed)` : fresh.why };
  const again = routing.find(fits);
  return again ? { provider: again.provider, reason: `${again.why} (no other provider is connected; trying again)` } : null;
}
