import { commit, type CommandEnv } from '@river/log';

/** Takes a published report down (for example after consent is withdrawn). */
export async function withdrawReport(env: CommandEnv, input: { reportId: string; reason: string }): Promise<void> {
  await commit(env, [
    { type: 'publication.Withdrawn', aggregate: { kind: 'publication', id: input.reportId }, visibility: 'public', payload: { publicationKind: 'report', reason: input.reason } },
  ]);
}
