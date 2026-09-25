import { commit, type CommandEnv } from '@river/log';

/**
 * DP-01: a coordinator reviews the request and opens it for matching.
 * Triage decides the path, never whether someone may ask.
 */
export async function triageNeed(env: CommandEnv, input: { needId: string; note?: string }): Promise<void> {
  const aggregate = { kind: 'need', id: input.needId };
  await commit(env, [
    { type: 'need.Triaged', aggregate, visibility: 'team', payload: { note: input.note ?? '' } },
    { type: 'need.Opened', aggregate, visibility: 'team', payload: {} },
  ]);
}
