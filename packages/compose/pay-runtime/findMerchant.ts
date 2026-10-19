import type { Merchant } from './types/Merchant.ts';
import type { PayConfig } from './types/PayConfig.ts';

/** The merchant with this id, or undefined. */
export function findMerchant(config: PayConfig, merchantId: string): Merchant | undefined {
  return config.merchants.find((m) => m.id === merchantId);
}
