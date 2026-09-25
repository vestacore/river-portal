import type { SnippetAssistant } from '@river/assist';
import { richDocToPlain } from '@river/content';
import { formatMoney, oblastName } from '@river/i18n';
import { newId } from '@river/kernel';
import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { readReport } from '@river/reports';

/**
 * Asks the assistant to turn a (private) report into short feed items. Suggestions are stored as
 * drafts (`team`) for an editor to edit, accept or reject — never published automatically.
 */
export async function suggestFeedItems(env: CommandEnv, input: { reportId: string }, assistant: SnippetAssistant): Promise<string[]> {
  const report = await readReport(env.store, env.ctx.orgId, input.reportId);
  if (!report) throw new Error(`Unknown report ${input.reportId}`);
  const result = await assistant({
    title: report.title,
    body: { 'en-GB': richDocToPlain(report.body['en-GB'].doc), uk: richDocToPlain(report.body.uk.doc) },
    facts: {
      region: oblastName(report.facts.oblastId, 'en-GB'),
      regionUkGenitive: oblastName(report.facts.oblastId, 'uk', 'gen'),
      households: report.facts.recipients.length,
      gifts: report.facts.giftsCount,
      deliveryCosts: formatMoney(report.facts.costsMinor, report.facts.currency, 'en-GB'),
      ...(report.facts.gratitude ? { consentedThanks: report.facts.gratitude.text } : {}),
    },
    maxItems: 4,
  });
  const at = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const ids = result.suggestions.map(() => newId('feed', at));
  const drafts: EventDraft[] = [
    { type: 'ai.SuggestionMade', aggregate: { kind: 'report', id: report.id }, visibility: 'team', payload: { purpose: 'feed', source: result.source, model: result.model, count: ids.length, feedItemIds: ids } },
    ...result.suggestions.map((s, i): EventDraft => ({
      type: 'publication.Drafted',
      aggregate: { kind: 'publication', id: ids[i] as string },
      visibility: 'team',
      payload: { publicationKind: 'feedItem', kind: s.kind, text: s.text, reportId: report.id, campaignId: report.campaignId, oblastId: report.facts.oblastId, source: result.source, model: result.model },
    })),
  ];
  await commit(env, drafts);
  return ids;
}
