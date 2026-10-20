import { contractStatusAt, type Contract, type ContractStatus } from '@river/psp-contracts';
import type { Tone } from '../../panels/Value';

const dayMs = 86_400_000;

/** The tone each contract status is drawn in, the same in every panel. */
export const contractTone: Record<ContractStatus, Tone> = { draft: 'neutral', sent: 'info', signed: 'info', active: 'success', suspended: 'warning', terminated: 'danger', expired: 'danger' };

/**
 * The steps a contract may take from the status it is recorded in. The runtime (`advanceContract`) holds
 * the same map and refuses anything else; it is repeated here only to offer no button it would refuse.
 */
export const contractSteps: Partial<Record<ContractStatus, ContractStatus[]>> = { draft: ['sent'], sent: ['signed', 'draft'], signed: ['active'], active: ['suspended', 'terminated'], suspended: ['active', 'terminated'], expired: ['active'] };

/** Whole days until a contract ends, or null for an open-ended one. */
export function daysLeft(ct: Contract, now: string): number | null {
  return ct.validTo ? Math.ceil((Date.parse(ct.validTo) - Date.parse(now)) / dayMs) : null;
}

/** A contract in force that ends within `days` and will not renew itself: someone has to act. */
export function endsSoon(ct: Contract, now: string, days = 30): boolean {
  const left = daysLeft(ct, now);
  const status = contractStatusAt(ct, now);
  return left !== null && left >= 0 && left <= days && ct.renewal === 'manual' && (status === 'active' || status === 'signed');
}
