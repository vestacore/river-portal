import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findBlockDefinition, resolveBlock } from '@river/content';
import { settingTokens } from '@river/settings';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { BlockEditor } from './BlockEditor';

// Where each group of texts appears on the public site.
const shownOn = (id: string): string => {
  const [group, second] = id.split('.');
  if (group === 'policy') return `/policies/${second}`;
  return ({ ask: '/ask', give: '/give', about: '/about', faq: '/faq' } as Record<string, string>)[group as string] ?? '/';
};

/** One site text: the editor for both languages, the tokens it may use, and how it reads now. */
export default async function BlockPage({ params }: { params: Promise<{ locale: string; blockId: string }> }) {
  const { locale: segment, blockId: raw } = await params;
  const locale = resolveLocale(segment);
  const { canAct } = await requireStage('surface', locale);
  const blockId = decodeURIComponent(raw);
  const definition = findBlockDefinition(blockId);
  if (!definition) notFound();
  const dict = getDictionary(locale);
  const t = dict.studio.texts;
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const tokens = settingTokens(settings, locale);
  const en = resolveBlock(site.blocks, blockId, 'en-GB', settingTokens(settings, 'en-GB'));
  const uk = resolveBlock(site.blocks, blockId, 'uk', settingTokens(settings, 'uk'));
  return (
    <div>
      <p className="mb-6"><Link className="annot text-ink-500 hover:text-ink-900" href={href(locale, '/studio/surface/texts')}>← {t.back}</Link></p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-semibold">{definition.label}</h2><p className="annot mt-1 text-ink-500">{definition.id} · {definition.mode}</p></div>
        <Link className="annot inline-flex items-center gap-2 text-ink-700 underline underline-offset-4" href={href(locale, shownOn(blockId))}><Icon name="external" className="size-3.5" />{t.view}</Link>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          {canAct ? (
            <BlockEditor blockId={blockId} mode={definition.mode} labels={dict.edit} versions={[
              { segment: 'en-gb', label: 'English (UK)', doc: en.doc },
              { segment: 'uk', label: 'Українська', doc: uk.doc },
            ]} />
          ) : null}
          <div className="grid gap-6 md:grid-cols-2">
            {([['English (UK)', en.html, 'en-GB'], ['Українська', uk.html, 'uk']] as const).map(([label, html, lang]) => (
              <figure key={lang} className="sketch bg-paper p-5">
                <figcaption className="annot mb-3 text-ink-500">{label}</figcaption>
                <div lang={lang} className={definition.mode === 'rich' ? 'prose-river text-[0.95rem]' : 'text-xl font-semibold'} dangerouslySetInnerHTML={{ __html: html }} />
              </figure>
            ))}
          </div>
        </div>
        <aside>
          <h3 className="annot mb-3 text-ink-500">{t.tokens}</h3>
          <dl className="border-t border-graphite/50 text-sm">
            {Object.entries(tokens).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[11rem_1fr] gap-3 border-b border-graphite/15 py-2">
                <dt className="font-mono text-xs text-ink-900">{`{{${key}}}`}</dt>
                <dd className="truncate text-ink-500" title={value}>{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
