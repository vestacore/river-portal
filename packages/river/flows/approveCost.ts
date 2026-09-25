import { commit, type CommandEnv } from '@river/log';
import { readFlow } from './readFlow.ts';

/** DP-06: the Finance Steward approves a cost above the Lead Coordinator's limit. */
export async function approveCost(env: CommandEnv, input: { flowId: string; costId: string }): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  const cost = flow?.costs.find((c) => c.id === input.costId);
  if (!flow || !cost || cost.status === 'approved') return;
  const { id, status, at, ...rest } = cost;
  await commit(env, [
    {
      type: 'costRecord.Approved',
      aggregate: { kind: 'costRecord', id },
      visibility: 'public',
      payload: { ...rest, flowId: flow.id, campaignId: flow.campaignId, approvedAs: 'finance_steward' },
    },
  ]);
}
