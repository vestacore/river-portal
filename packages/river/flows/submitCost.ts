import { commit, type CommandEnv } from '@river/log';
import { costDrafts } from './costDrafts.ts';
import { readFlow } from './readFlow.ts';
import type { CostInput } from './types/CostInput.ts';

/** A carrier (or coordinator) records a cost on the way; it always waits for approval (DP-06). */
export async function submitCost(env: CommandEnv, input: { flowId: string; cost: CostInput }): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  if (!flow) throw new Error(`Unknown flow ${input.flowId}`);
  await commit(env, costDrafts(env, flow, input.cost, false));
}
