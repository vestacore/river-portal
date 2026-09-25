import { newId } from '@river/kernel';
import type { CommandEnv, EventDraft } from '@river/log';
import { settingText } from '@river/settings';
import { approvalLimitMinor } from './approvalLimitMinor.ts';
import { fxRateFor } from './fxRateFor.ts';
import type { CostInput } from './types/CostInput.ts';
import type { CostSubmittedPayload } from './types/CostSubmittedPayload.ts';
import type { Flow } from './types/Flow.ts';

/**
 * Drafts `costRecord.Submitted` for a cost, converted to the reporting currency at the rate in
 * settings (recorded with the cost), plus `costRecord.Approved` when `approveWithin` allows it and
 * the amount is within the Lead Coordinator's limit. Package-internal helper.
 */
export function costDrafts(env: CommandEnv, flow: Flow, cost: CostInput, approveWithin: boolean): EventDraft[] {
  const rate = fxRateFor(env.settings, cost.currency);
  if (rate === null) throw new Error(`No conversion rate for ${cost.currency}`);
  const at = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const aggregate = { kind: 'costRecord', id: newId('cost', at) };
  const payload: CostSubmittedPayload = {
    flowId: flow.id, campaignId: flow.campaignId, kind: cost.kind, amountMinor: cost.amountMinor, currency: cost.currency,
    fxRate: rate, reportingCurrency: settingText(env.settings, 'money.reportingCurrency'), reportingMinor: Math.round(cost.amountMinor * rate), note: cost.note,
  };
  const drafts: EventDraft[] = [{ type: 'costRecord.Submitted', aggregate, visibility: 'team', payload }];
  if (approveWithin && payload.reportingMinor <= approvalLimitMinor(env.settings)) {
    drafts.push({ type: 'costRecord.Approved', aggregate, visibility: 'public', payload: { ...payload, approvedAs: 'lead' } });
  }
  return drafts;
}
