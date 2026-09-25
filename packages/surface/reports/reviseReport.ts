import { isRichDoc, renderRichText } from '@river/content';
import type { Locale } from '@river/i18n';
import { commit, type CommandEnv } from '@river/log';

/** An editor revises a report's title and body in one locale (in the studio, with Tiptap). */
export async function reviseReport(env: CommandEnv, input: { reportId: string; locale: Locale; title: string; doc: unknown }): Promise<void> {
  if (!isRichDoc(input.doc)) throw new Error('Invalid document');
  const title = input.title.trim().slice(0, 160);
  await commit(env, [
    {
      type: 'report.Revised',
      aggregate: { kind: 'report', id: input.reportId },
      visibility: 'team',
      payload: { locale: input.locale, title, doc: input.doc, html: renderRichText(input.doc, 'rich') },
    },
  ]);
}
