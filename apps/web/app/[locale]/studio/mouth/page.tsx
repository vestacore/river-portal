import Link from 'next/link';
import { formatDate, oblastName, pickText } from '@river/i18n';
import { findCategory, readNeedQueue } from '@river/needs';
import { getRuntime } from '@river/runtime';
import { inputClass } from '@/components/ui/Field';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { confirmByProxyAction } from '../actions';

/** The mouth (DP-08): deliveries handed over and waiting for the person to confirm. */
export default async function MouthPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { canAct } = await requireStage('mouth', locale);
  const dict = getDictionary(locale);
  const t = dict.studio.mouth;
  const runtime = await getRuntime();
  const waiting = (await readNeedQueue(runtime.store, runtime.config.orgId)).filter((n) => n.status === 'delivered');
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t.title}</h2>
      <p className="mb-8 mt-1 max-w-2xl text-ink-500">{t.lead}</p>
      {waiting.length === 0 ? <p className="text-ink-500">{t.none}</p> : (
        <ul className="grid gap-8 lg:grid-cols-2">
          {waiting.map((n) => {
            const handed = n.timeline.find((e) => e.code === 'delivered')?.at;
            return (
              <li key={n.id} className="sketch space-y-4 bg-paper p-6">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link className="text-lg font-semibold underline decoration-graphite/40 underline-offset-4 hover:decoration-sunrise-500" href={href(locale, `/studio/needs/${n.id}`)}>{pickText(findCategory(n.categoryId)?.label, locale)}</Link>
                  <span className="annot text-ink-500">{oblastName(n.oblastId, locale)}{handed ? ` · ${t.handedOver.replace('{date}', formatDate(handed, locale))}` : ''}</span>
                </p>
                {canAct ? (
                  <form action={confirmByProxyAction} className="space-y-3">
                    <input type="hidden" name="needId" value={n.id} />
                    <label className="block text-sm font-semibold">{t.note}<span className="block font-normal text-ink-500">{t.noteHint}</span>
                      <textarea name="note" required minLength={3} rows={2} className={`${inputClass} mt-1 font-normal`} />
                    </label>
                    <button type="submit" className="chamfer px-4 py-2 text-sm font-semibold text-paper [--cut:6px] [--fill:var(--color-teal-600)] hover:[--fill:var(--color-teal-500)]">{t.record}</button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
