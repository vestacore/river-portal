import { canDecideRequest } from '@river/psp-access';
import { grantRole } from './grantRole.ts';
import { grantText } from './grantText.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * Decides an access request: never one's own; approving grants the role, unless it breaks a separation
 * of duties. Either way the decision is a line of the audit trail.
 */
export function decideRequest(world: World, actor: Actor, requestId: string, approve: boolean, at: string): CommandResult {
  const request = world.requests.find((r) => r.id === requestId);
  if (!request) return { ok: false, error: 'not_found' };
  if (request.status !== 'pending') return { ok: false, error: 'already decided' };
  if (actor.kind !== 'person') return { ok: false, error: 'a person decides' };
  if (!canDecideRequest(request, actor.personId)) return { ok: false, error: 'not yours to decide' };
  const denied = guard(world, actor, 'grants.write', request.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (approve) {
    const granted = grantRole(world, actor, { personId: request.personId, role: request.role, unitId: request.unitId }, at);
    if (!granted.ok) return granted;
  }
  request.status = approve ? 'approved' : 'rejected';
  request.decidedBy = actor.personId;
  request.decidedAt = at;
  recordAudit(world, { personId: actor.personId, role: actor.role, unitId: request.unitId, action: approve ? 'request.approve' : 'request.reject', target: requestId, detail: grantText(world, request.personId, request.role, request.unitId), at });
  return { ok: true, value: { requestId } };
}
