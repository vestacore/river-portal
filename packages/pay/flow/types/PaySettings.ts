import type { ProviderName } from '@river/pay-facts';
import type { RoutingRule } from './RoutingRule.ts';

/**
 * The constitution of this payment river: its commission, how long an invoice stands, how it
 * routes, and which providers this deployment has mounted — an order is routed only to a provider
 * that its merchant has connected and that is there to carry it.
 */
export type PaySettings = {
  feeBps: number;
  invoiceTtlHours: number;
  routing: readonly RoutingRule[];
  mounted: readonly ProviderName[];
};
