import type { LocalisedText } from '@river/i18n';
import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { redactPii } from '@river/privacy';
import { readFeedItem } from './readFeedItem.ts';

/** DP-10 for feed items: an editor publishes the (possibly edited) text. Accepting an AI suggestion is logged. */
export async function publishFeedItem(env: CommandEnv, input: { itemId: string; text: LocalisedText }): Promise<void> {
  const item = await readFeedItem(env.store, env.ctx.orgId, input.itemId);
  if (!item || item.status === 'published') return;
  const text = { 'en-GB': redactPii(input.text['en-GB'].trim()).slice(0, 400), uk: redactPii(input.text.uk.trim()).slice(0, 400) };
  const aggregate = { kind: 'publication', id: item.id };
  const drafts: EventDraft[] = [];
  if (item.source !== 'editor') {
    const edited = text['en-GB'] !== item.text['en-GB'] || text.uk !== item.text.uk;
    drafts.push({ type: 'ai.SuggestionAccepted', aggregate, visibility: 'team', payload: { edited } });
  }
  drafts.push({ type: 'publication.Published', aggregate, visibility: 'public', payload: { publicationKind: 'feedItem', text } });
  await commit(env, drafts);
}
