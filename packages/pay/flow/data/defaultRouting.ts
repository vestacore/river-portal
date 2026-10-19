import type { RoutingRule } from '../types/RoutingRule.ts';

/** The first rule that fits an order, among the merchant's connected providers, carries it. */
export const defaultRouting: readonly RoutingRule[] = [
  { provider: 'paypal', currencies: ['USD', 'GBP'], maxMinor: 5_000, why: 'small USD and GBP payments go to PayPal' },
  { provider: 'stripe', currencies: ['EUR', 'USD', 'GBP', 'UAH'], maxMinor: null, why: 'Stripe carries every currency of the river' },
  { provider: 'paypal', currencies: ['EUR', 'USD', 'GBP'], maxMinor: null, why: 'PayPal carries EUR, USD and GBP' },
];
