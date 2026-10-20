import type { Permission } from '@river/psp-access';
import type { ProposalKind } from '@river/psp-agents';
import { applyProposal } from './applyProposal.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

const needs: Record<ProposalKind, Permission> = {
  open_alert: 'aml.review', hold_payouts: 'aml.review', escalate_alert: 'aml.review', close_alert: 'aml.review',
  shift_route: 'policies.write', send_reminder: 'orders.write', investigate_break: 'flows.read', prepare_evidence: 'disputes.respond',
  retry_deliveries: 'webhooks.manage', fix_endpoint: 'webhooks.manage', prefund_payouts: 'payouts.read',
};

/**
 * A person decides an agent's proposal. Accepting it needs both the right to decide on agents and the
 * right the proposal itself would use — an agent never lends a person a power they do not have. The
 * decision, either way, is recorded with the insight and in the audit trail.
 */
export function decideInsight(world: World, actor: Actor, insightId: string, accept: boolean, at: string): CommandResult {
  const insight = world.insights.find((i) => i.id === insightId);
  if (!insight || insight.status !== 'open') return { ok: false, error: 'nothing_to_decide' };
  const denied = guard(world, actor, 'agents.decide', insight.unitId, at) ?? (accept && insight.proposal ? guard(world, actor, needs[insight.proposal.kind], insight.unitId, at) : null);
  if (denied) return { ok: false, error: denied };
  if (actor.kind !== 'person') return { ok: false, error: 'a person decides' };
  insight.decidedBy = actor.personId;
  insight.decidedAt = at;
  if (accept) { applyProposal(world, insight, actor.personId, at); insight.status = 'applied'; }
  else insight.status = 'declined';
  recordAudit(world, { personId: actor.personId, role: actor.role, unitId: insight.unitId, action: accept ? 'insight.accept' : 'insight.decline', target: insight.id, detail: insight.title, at });
  return { ok: true, value: { insightId } };
}
