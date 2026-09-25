import type { SnippetKind } from '@river/assist';
import type { LocalisedText } from '@river/i18n';
import { newId } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';

/** An editor writes a feed item by hand. */
export async function draftFeedItem(env: CommandEnv, input: { kind: SnippetKind; text: LocalisedText; campaignId: string | null }): Promise<string> {
  const id = newId('feed', env.ctx.at ? new Date(env.ctx.at) : new Date());
  await commit(env, [
    { type: 'publication.Drafted', aggregate: { kind: 'publication', id }, visibility: 'team', payload: { publicationKind: 'feedItem', kind: input.kind, text: input.text, reportId: null, campaignId: input.campaignId, oblastId: null, source: 'editor', model: null } },
  ]);
  return id;
}
