import { alertStatusLabels, type AlertStatus } from '@river/psp-risk';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** A compliance officer moves an alert along — investigating, escalated, reported, closed — with a note. */
export function updateAlert(world: World, actor: Actor, alertId: string, status: AlertStatus, note: string, at: string): CommandResult {
  const alert = world.alerts.find((a) => a.id === alertId);
  if (!alert) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'aml.review', alert.unitId, at);
  if (denied) return { ok: false, error: denied };
  const by = actor.kind === 'person' ? actor.personId : 'officer';
  alert.status = status;
  alert.assignee ??= by;
  alert.updatedAt = at;
  if (note) alert.notes.push({ at, by, text: { 'en-GB': note, uk: note } });
  if (actor.kind === 'person') recordAudit(world, { personId: by, role: actor.role, unitId: alert.unitId, action: `alert.${status}`, target: alertId, detail: note ? { 'en-GB': `${alertStatusLabels[status]['en-GB']}: ${note}`, uk: `${alertStatusLabels[status].uk}: ${note}` } : alertStatusLabels[status], at });
  return { ok: true, value: { alertId } };
}
