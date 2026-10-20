import type { Insight } from '@river/psp-agents';
import { appendFacts } from './appendFacts.ts';
import { openAlert } from './openAlert.ts';
import { recordAudit } from './recordAudit.ts';
import { remindInvoice } from './remindInvoice.ts';
import type { World } from './types/World.ts';

/**
 * Carries out an accepted proposal. What touches money or a person's standing goes through the same
 * doors a person would use; nothing here writes a payment fact a person could not write themselves.
 */
export function applyProposal(world: World, insight: Insight, by: string, at: string): void {
  const p = insight.proposal;
  if (!p) return;
  const params = p.params;
  switch (p.kind) {
    case 'send_reminder': remindInvoice(world, String(params.invoiceId), Number(params.step ?? 0), (params.channel as 'email' | 'sms' | 'messenger') ?? 'email', by, at); break;
    case 'retry_deliveries': {
      world.counters.fixedKvgEndpoint = 1;
      const ids = new Set((params.deliveries as string[] | undefined) ?? []);
      for (const d of world.deliveries.filter((x) => ids.has(x.id) && x.status === 'failed')) {
        const seq = (world.counters.delivery ?? 0) + 1;
        world.counters.delivery = seq;
        world.deliveries.push({ ...d, id: `whd_${seq.toString(36).toUpperCase().padStart(6, '0')}`, at, attempt: d.attempt + 1, status: 'delivered', httpStatus: 200, durationMs: 140, error: null, nextRetryAt: null });
        d.nextRetryAt = null;
      }
      break;
    }
    case 'open_alert': {
      const sessionId = (params.sessions as string[] | undefined)?.[0] ?? null;
      const session = sessionId ? world.views.sessions.get(sessionId) : undefined;
      openAlert(world, { kind: 'velocity', unitId: insight.unitId, sessionId, paymentId: null, amountMinor: session?.amountMinor ?? 0, currency: session?.currency ?? 'EUR', score: 80, reasons: ['velocity'], at });
      break;
    }
    case 'hold_payouts': if (!world.heldPayouts.includes(String(params.paymentId))) world.heldPayouts.push(String(params.paymentId)); break;
    case 'shift_route': {
      const entity = String(params.entity);
      world.routeWeights[entity] = { ...(world.routeWeights[entity] ?? {}), [String(params.to)]: 80, [String(params.from)]: 20 };
      break;
    }
    case 'escalate_alert':
    case 'close_alert': {
      const alert = world.alerts.find((a) => a.id === params.alertId);
      if (alert) { alert.status = p.kind === 'escalate_alert' ? 'escalated' : alert.kind === 'threshold' ? 'reported' : 'closed'; alert.updatedAt = at; alert.notes.push({ at, by, text: p.effect }); }
      break;
    }
    case 'prepare_evidence': {
      const payment = world.views.payments.get(String(params.paymentId));
      if (payment) appendFacts(world, payment.paymentId, [{ type: 'dispute.Evidenced', payload: { paymentId: payment.paymentId, disputeId: String(params.disputeId), documents: insight.evidence.length, by } }], { via: 'door', actor: by, role: 'operator' }, at);
      break;
    }
    default: break;
  }
  recordAudit(world, { personId: by, role: by === 'policy' ? 'policy' : 'agent', unitId: insight.unitId, action: `proposal.${p.kind}`, target: insight.id, detail: p.effect, at });
}
