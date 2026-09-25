import { commit, type CommandEnv } from '@river/log';

/** An editor declines a suggestion; it stays in the log for evaluating the assistant. */
export async function rejectFeedItem(env: CommandEnv, input: { itemId: string }): Promise<void> {
  await commit(env, [{ type: 'ai.SuggestionRejected', aggregate: { kind: 'publication', id: input.itemId }, visibility: 'team', payload: { publicationKind: 'feedItem' } }]);
}
