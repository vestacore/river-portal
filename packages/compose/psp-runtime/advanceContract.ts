import { contractStatusAt, contractStatusLabels, contractSteps, type ContractStatus } from '@river/psp-contracts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * Moves a contract along its life: sent for signature, signed, active, suspended, terminated, renewed.
 * The step is taken from the contract's status today, as every page shows it — so an active contract
 * past its end date is expired, and renewing it makes it active for another year.
 */
export function advanceContract(world: World, actor: Actor, contractId: string, status: ContractStatus, at: string): CommandResult {
  const contract = world.contracts.find((c) => c.id === contractId);
  if (!contract) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'contracts.write', contract.unitId, at);
  if (denied) return { ok: false, error: denied };
  const today = contractStatusAt(contract, at);
  if (!contractSteps[today].includes(status)) return { ok: false, error: `${today} → ${status} is not a step` };
  contract.status = status;
  if (status === 'signed') { contract.signedAt = at; contract.signatories = contract.signatories.map((s) => ({ ...s, signedAt: at })); }
  if (status === 'active' && contract.validTo && contract.validTo < at) contract.validTo = new Date(Date.parse(at) + 365 * 86_400_000).toISOString();
  const by = actor.kind === 'person' ? actor.personId : 'system';
  const label = contractStatusLabels[status];
  contract.history.push({ at, by, what: { 'en-GB': `${contractStatusLabels[today]['en-GB']} → ${label['en-GB']}`, uk: `${contractStatusLabels[today].uk} → ${label.uk}` } });
  if (actor.kind === 'person') recordAudit(world, { personId: by, role: actor.role, unitId: contract.unitId, action: `contract.${status}`, target: contractId, detail: { 'en-GB': `${contract.number}: ${label['en-GB']}`, uk: `${contract.number}: ${label.uk}` }, at });
  return { ok: true, value: { contractId } };
}
