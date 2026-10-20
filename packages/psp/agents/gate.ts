// @river/psp-agents — the swarm (adr/records/ADR-0026): agents read projections, write only insights in their
// own namespace, consult each other, and propose; people decide, the unit's policy says what is low-risk
// enough to be carried out alone, and the machine records both. In this demo the agents are deterministic.
export { agentIds, proposalKinds } from './types/Agent.ts';
export type { AgentId, ProposalKind, Audience, AgentDefinition, InsightSubject, Proposal, InsightDraft, Insight } from './types/Agent.ts';
export type { SwarmInput } from './types/SwarmInput.ts';
export { agentCatalogue } from './data/agentCatalogue.ts';
export { runSwarm } from './runSwarm.ts';
export { consultSwarm } from './consultSwarm.ts';
