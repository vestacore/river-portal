import type { Contract, ContractStatus } from './types/Contract.ts';

/** A contract's status at `now`: an active or signed one past its end date has expired, unless it renews itself. */
export function contractStatusAt(contract: Contract, now: string): ContractStatus {
  if ((contract.status === 'active' || contract.status === 'signed') && contract.validTo && contract.validTo < now && contract.renewal === 'manual') return 'expired';
  if (contract.status === 'signed' && contract.validFrom <= now) return 'active';
  return contract.status;
}
