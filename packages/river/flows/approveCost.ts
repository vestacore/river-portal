import { commit, type CommandEnv } from '@river/log';
import { approvalLimitMinor } from './approvalLimitMinor.ts';
import { readFlow } from './readFlow.ts';

/**
 * DP-06: a coordinator approves costs within the Lead Coordinator's limit (settings); larger costs
 * need the Finance Steward, or an administrator acting as one. The capacity is recorded with the cost.
 */
export async function approveCost(env: CommandEnv, input: { flowId: string; costId: string }): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  const cost = flow?.costs.find((c) => c.id === input.costId);
  if (!flow || !cost || cost.status === 'approved') return;
  const role = env.ctx.actor.role;
  const steward = role === 'finance_steward' || role === 'administrator' || role === 'system';
  if (!steward && !(role === 'coordinator' && cost.reportingMinor <= approvalLimitMinor(env.settings))) {
    throw new Error('This cost needs the Finance Steward (DP-06)');
  }
  const { id, status, at, ...rest } = cost;
  await commit(env, [
    {
      type: 'costRecord.Approved',
      aggregate: { kind: 'costRecord', id },
      visibility: 'public',
      payload: { ...rest, flowId: flow.id, campaignId: flow.campaignId, approvedAs: steward ? 'finance_steward' : 'lead' },
    },
  ]);
}
