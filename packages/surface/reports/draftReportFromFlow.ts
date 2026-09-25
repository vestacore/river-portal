import { plainToRichDoc, renderRichText, type RichText } from '@river/content';
import { locales, type Locale } from '@river/i18n';
import { newId } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import { settingText } from '@river/settings';
import { collectReportFacts } from './collectReportFacts.ts';
import { composeReportText } from './composeReportText.ts';

/** Generates a private report from a flow's records, in every locale, ready to edit in the studio. */
export async function draftReportFromFlow(env: CommandEnv, input: { flowId: string }): Promise<string> {
  const facts = await collectReportFacts(env.store, env.ctx.orgId, input.flowId, settingText(env.settings, 'money.reportingCurrency'));
  const reportId = newId('report', env.ctx.at ? new Date(env.ctx.at) : new Date());
  const title = {} as Record<Locale, string>;
  const body = {} as Record<Locale, RichText>;
  for (const locale of locales) {
    const text = composeReportText(facts, locale);
    const doc = plainToRichDoc(text.paragraphs.join('\n\n'));
    title[locale] = text.title;
    body[locale] = { doc, html: renderRichText(doc, 'rich') };
  }
  await commit(env, [
    { type: 'report.Generated', aggregate: { kind: 'report', id: reportId }, visibility: 'team', payload: { flowId: input.flowId, campaignId: facts.campaignId, facts, title, body } },
  ]);
  return reportId;
}
