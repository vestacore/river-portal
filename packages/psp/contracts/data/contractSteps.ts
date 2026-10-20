import type { ContractStatus } from '../types/Contract.ts';

/**
 * The steps a contract may take from its status today (`contractStatusAt`, not the stored one): sent for
 * signature or back to draft, signed, active, suspended and resumed, terminated — and an expired one
 * renewed. Terminated is final.
 */
export const contractSteps: Readonly<Record<ContractStatus, readonly ContractStatus[]>> = {
  draft: ['sent'],
  sent: ['signed', 'draft'],
  signed: ['active'],
  active: ['suspended', 'terminated'],
  suspended: ['active', 'terminated'],
  expired: ['active'],
  terminated: [],
};
