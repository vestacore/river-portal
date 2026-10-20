import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * A compliance officer decides a merchant's onboarding: approved, the merchant may trade (once its
 * contract is active); rejected, it stays closed; or more information is asked for.
 */
export function decideOnboarding(world: World, actor: Actor, caseId: string, decision: 'approved' | 'rejected' | 'more_info', at: string): CommandResult {
  const kyb = world.onboarding.find((c) => c.id === caseId);
  if (!kyb) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'aml.review', kyb.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (decision === 'approved' && kyb.checks.some((c) => c.result === 'fail')) return { ok: false, error: 'a check failed' };
  kyb.status = decision;
  kyb.stage = decision === 'more_info' ? 'documents' : 'done';
  kyb.updatedAt = at;
  if (decision !== 'more_info') { kyb.decidedBy = actor.kind === 'person' ? actor.personId : null; kyb.decidedAt = at; }
  const unit = world.units.find((u) => u.id === kyb.unitId);
  if (unit && decision === 'approved') unit.status = 'active';
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: kyb.unitId, action: `onboarding.${decision}`, target: caseId, detail: unit?.name ?? { 'en-GB': caseId, uk: caseId }, at });
  return { ok: true, value: { caseId } };
}
