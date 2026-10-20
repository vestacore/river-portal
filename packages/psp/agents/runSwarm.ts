import { analystInsights } from './analystInsights.ts';
import { clerkInsights } from './clerkInsights.ts';
import { collectorInsights } from './collectorInsights.ts';
import { consultSwarm } from './consultSwarm.ts';
import { copilotInsights } from './copilotInsights.ts';
import { reconcilerInsights } from './reconcilerInsights.ts';
import { routerInsights } from './routerInsights.ts';
import { sentinelInsights } from './sentinelInsights.ts';
import { treasurerInsights } from './treasurerInsights.ts';
import type { AgentId, InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';

const analysers: Record<AgentId, (input: SwarmInput) => InsightDraft[]> = {
  sentinel: sentinelInsights, router: routerInsights, reconciler: reconcilerInsights, collector: collectorInsights,
  analyst: analystInsights, clerk: clerkInsights, copilot: copilotInsights, treasurer: treasurerInsights,
};

/**
 * One round of the swarm over the projections of one moment: every enabled agent reads, then they
 * consult each other. Pure: it writes nothing — the runtime records what comes out as insights, and only
 * a person (or a unit's policy, for low-risk proposals) turns a proposal into a fact.
 */
export function runSwarm(input: SwarmInput, enabled: readonly AgentId[] = Object.keys(analysers) as AgentId[]): InsightDraft[] {
  return consultSwarm(enabled.flatMap((agent) => analysers[agent](input)), input);
}
