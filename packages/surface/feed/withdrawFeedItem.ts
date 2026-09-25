import { commit, type CommandEnv } from '@river/log';

/** Takes a published feed item down. */
export async function withdrawFeedItem(env: CommandEnv, input: { itemId: string }): Promise<void> {
  await commit(env, [{ type: 'publication.Withdrawn', aggregate: { kind: 'publication', id: input.itemId }, visibility: 'public', payload: { publicationKind: 'feedItem', reason: 'editor' } }]);
}
