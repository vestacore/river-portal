import { contractStatusAt } from './contractStatusAt.ts';
import type { Contract, Tariff } from './types/Contract.ts';

/** The tariff of a merchant's active contract at `now`, or null when it has none (it cannot take payments). */
export function activeTariffOf(contracts: readonly Contract[], tariffs: readonly Tariff[], merchantId: string, now: string): Tariff | null {
  const contract = contracts.find((c) => c.unitId === merchantId && c.tariffId && contractStatusAt(c, now) === 'active');
  return contract ? tariffs.find((t) => t.id === contract.tariffId) ?? null : null;
}
