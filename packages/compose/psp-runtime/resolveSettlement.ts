import { formatMoney } from '@river/i18n';
import type { SettlementResolved } from '@river/psp-facts';
import { resolutionLabels } from '@river/psp-settlement';
import { appendFacts } from './appendFacts.ts';
import { guard } from './guard.ts';
import { reconcileSettlements } from './reconcileSettlements.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * A person records what was decided about a settlement batch's difference: accepted as it stands, a claim
 * raised with the provider, written off, or corrected — with the amount the decision concerns and a note.
 * It needs the right to reconcile at the batch's store, or at its merchant when the batch has no store; a
 * batch whose three sides agree has nothing to decide. The decision becomes a fact of the batch's own
 * stream, and a line of the audit trail.
 */
export function resolveSettlement(world: World, actor: Actor, batchId: string, resolution: SettlementResolved['resolution'], amountMinor: number, note: string, at: string): CommandResult<{ batchId: string }> {
  const view = world.views.settlements.get(batchId);
  if (!view) return { ok: false, error: 'not_found' };
  const unitId = view.storeId ?? view.merchantId;
  const denied = guard(world, actor, 'reconciliation.write', unitId, at);
  if (denied || actor.kind !== 'person') return { ok: false, error: denied ?? 'a cabinet action needs a person' };
  if (!Object.hasOwn(resolutionLabels, resolution)) return { ok: false, error: 'resolution_required' };
  if (!Number.isInteger(amountMinor) || amountMinor < 0) return { ok: false, error: 'invalid_amount' };
  const row = reconcileSettlements(world, at).find((r) => r.view.batchId === batchId);
  if (!row || row.reconciliation.differences.length === 0) return { ok: false, error: 'nothing_to_decide' };
  const text = note.trim().slice(0, 400);
  appendFacts(world, batchId, [{ type: 'settlement.Resolved', payload: { batchId, resolution, amountMinor, note: text, by: actor.personId } }], { via: 'door', actor: actor.personId, role: actor.role }, at);
  const label = resolutionLabels[resolution];
  recordAudit(world, {
    personId: actor.personId, role: actor.role, unitId, action: `settlement.${resolution}`, target: batchId,
    detail: { 'en-GB': `${label['en-GB']}: ${formatMoney(amountMinor, view.currency, 'en-GB')}${text ? ` — ${text}` : ''}`, uk: `${label.uk}: ${formatMoney(amountMinor, view.currency, 'uk')}${text ? ` — ${text}` : ''}` },
    at,
  });
  return { ok: true, value: { batchId } };
}
