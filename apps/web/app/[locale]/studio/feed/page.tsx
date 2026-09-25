import { readFeedQueue } from '@river/feed';
import { formatDate, pickText } from '@river/i18n';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/Field';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';
import { publishFeedItemAction, rejectFeedItemAction, withdrawFeedItemAction } from '../actions';

/** Feed review: AI or editor drafts are edited in both languages, then published or rejected by a person. */
export default async function StudioFeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.studio;
  const runtime = await getRuntime();
  const items = await readFeedQueue(runtime.store, runtime.config.orgId);
  const suggested = items.filter((i) => i.status === 'suggested');
  const published = items.filter((i) => i.status === 'published');
  return (
    <div className="grid gap-10">
      <section>
        <h2 className="mb-1 text-xl font-bold">{t.suggestions}</h2>
        <p className="mb-4 text-sm text-ink-500">{t.suggestNote}</p>
        {suggested.length === 0 ? <p className="text-ink-500">{dict.common.none}</p> : (
          <ul className="grid gap-4">
            {suggested.map((item) => (
              <li key={item.id}>
                <form action={publishFeedItemAction} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line/60">
                  <input type="hidden" name="itemId" value={item.id} />
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone="teal">{dict.feed.kinds[item.kind]}</Badge>
                    <Badge tone={item.source === 'vertex' ? 'sunrise' : 'ink'}>{t.source}: {item.source}{item.model ? ` · ${item.model}` : ''}</Badge>
                    <span className="ml-auto text-ink-500">{formatDate(item.createdAt, locale, true)}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-semibold">English (UK)<textarea name="textEn" rows={4} defaultValue={item.text['en-GB']} className={`${inputClass} mt-1 font-normal`} /></label>
                    <label className="text-sm font-semibold">Українська<textarea name="textUk" lang="uk" rows={4} defaultValue={item.text.uk} className={`${inputClass} mt-1 font-normal`} /></label>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="chamfer px-5 py-2 font-bold text-white [--cut:8px] [--fill:var(--color-teal-600)] hover:[--fill:var(--color-teal-500)]">{t.accept}</button>
                    <button type="submit" formAction={rejectFeedItemAction} className="border border-graphite/30 px-5 py-2 font-semibold text-ink-700 hover:border-graphite">{t.reject}</button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">{t.published}</h2>
        <ul className="grid gap-3">
          {published.map((item) => (
            <li key={item.id} className="flex items-start gap-3 border-t border-graphite/60 pt-3">
              <Badge tone="teal">{dict.feed.kinds[item.kind]}</Badge>
              <p className="flex-1 text-sm">{pickText(item.text, locale)}</p>
              <form action={withdrawFeedItemAction}><input type="hidden" name="itemId" value={item.id} /><button className="border border-attention-500/40 px-3 py-1 text-xs font-semibold text-attention-500">{t.withdraw}</button></form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
