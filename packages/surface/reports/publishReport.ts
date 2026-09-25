import { commit, type CommandEnv } from '@river/log';
import { readReport } from './readReport.ts';
import { safetyDelayDays } from './safetyDelayDays.ts';
import type { PublishOutcome } from './types/PublishOutcome.ts';

/**
 * DP-09 then DP-10: consent check first, then publication. Reports carry only pseudonymised facts
 * and consented thanks, so the consent check clears them. Inside the safety delay the editor must
 * explicitly acknowledge the override, which is logged.
 */
export async function publishReport(env: CommandEnv, input: { reportId: string; acknowledgeSafetyDelay: boolean }): Promise<PublishOutcome> {
  const report = await readReport(env.store, env.ctx.orgId, input.reportId);
  if (!report) return { ok: false, reason: 'not_found' };
  const now = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const arrived = report.facts.arrivedAt ? new Date(report.facts.arrivedAt) : now;
  const daysSinceDelivery = Math.floor((now.getTime() - arrived.getTime()) / 86_400_000);
  const insideDelay = daysSinceDelivery < safetyDelayDays();
  if (insideDelay && !input.acknowledgeSafetyDelay) return { ok: false, reason: 'safety_delay', daysSinceDelivery };
  const aggregate = { kind: 'publication', id: report.id };
  await commit(env, [
    { type: 'publication.ConsentChecked', aggregate, visibility: 'team', payload: { publicationKind: 'report', result: 'cleared', gratitudeIncluded: report.facts.gratitude !== null } },
    { type: 'publication.Published', aggregate, visibility: 'public', payload: { publicationKind: 'report', safetyOverride: insideDelay, daysSinceDelivery } },
    { type: 'flow.Reported', aggregate: { kind: 'flow', id: report.flowId }, visibility: 'team', payload: { reportId: report.id } },
  ]);
  return { ok: true };
}
