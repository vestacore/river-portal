import Link from 'next/link';
import { listBlockDefinitions, resolveBlock } from '@river/content';
import { settingTokens } from '@river/settings';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();

/** Every text of the public site, grouped by page; edited here, never on the public pages (ADR-0022). */
export default async function TextsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { canAct } = await requireStage('surface', locale);
  const dict = getDictionary(locale);
  const t = dict.studio.texts;
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const tokens = settingTokens(settings, locale);
  const groups = new Map<string, ReturnType<typeof listBlockDefinitions>[number][]>();
  for (const d of listBlockDefinitions()) {
    const key = d.id.split('.')[0] as string;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return (
    <div>
      <p className="mb-8 max-w-2xl text-ink-500">{t.lead}</p>
      <div className="grid gap-12">
        {[...groups.entries()].map(([group, defs]) => (
          <section key={group}>
            <h2 className="annot mb-3 text-ink-500">{group}</h2>
            <ul className="grid gap-2">
              {defs.map((d) => {
                const preview = plain(resolveBlock(site.blocks, d.id, locale, tokens).html);
                return (
                  <li key={d.id}>
                    <Link href={href(locale, `/studio/surface/texts/${encodeURIComponent(d.id)}`)} className="grid gap-1 border-t border-graphite/40 py-3 hover:bg-paper-deep/60 sm:grid-cols-[16rem_1fr_auto] sm:items-baseline sm:gap-4">
                      <span className="font-semibold text-ink-900">{d.label}<span className="annot block font-normal text-ink-500">{d.id}</span></span>
                      <span className="truncate text-sm text-ink-500">{preview.slice(0, 160)}</span>
                      <span className="flex items-center gap-3">
                        {site.blocks[d.id] ? <Badge tone="sunrise">{dict.studio.settingsPage.source.custom}</Badge> : null}
                        <span className="annot text-ink-900">{canAct ? t.edit : dict.common.seeAll}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
