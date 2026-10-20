import type { Metadata } from 'next';
import { pickText, segmentForLocale } from '@river/i18n';
import { roleLabels, scopesOf } from '@river/psp-access';
import { demoPersonas } from '@river/psp-runtime';
import { PageHead } from '@/components/site/PageHead';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { actAs, resetStand, signOut } from '@/lib/actions/demo';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { currentActor } from '@/lib/session';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Try a cabinet', 'Спробувати кабінет'), robots: { index: false, follow: false } };
}

const plate = 'chamfer inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]';

/**
 * The way into the demo: six people, one for each cabinet, each with the profiles (grants) they hold. Act
 * as one and the cabinet opens with their reach in the hierarchy; or pay as a customer, who needs no account.
 */
export default async function DemoPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; reset?: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const segment = segmentForLocale(locale);
  const { next, reset } = await searchParams;
  const w = world();
  const actor = await currentActor();
  const now = new Date().toISOString();
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-07`} title={t('Work in a cabinet', 'Попрацюйте в кабінеті')}
        lead={t('Choose a person. Each holds one or more profiles — a role at a unit of the hierarchy — and sees only that unit’s subtree. Everything you do goes through the same doors, checks and streams a real deployment would use; nothing leaves this stand.', 'Оберіть людину. Кожна має один чи кілька профілів — роль в одиниці ієрархії — і бачить лише піддерево цієї одиниці. Усе, що ви робите, проходить ті самі двері, перевірки й потоки, що й у справжньому розгортанні; нічого не виходить за межі стенда.')}>
        {actor ? (
          <form action={signOut} className="mt-8 flex flex-wrap items-center gap-4">
            <input type="hidden" name="locale" value={segment} />
            <span className="annot text-ink-700">{t('Now acting as', 'Зараз ви дієте як')} <b className="text-ink-900">{pickText(w.people.find((p) => p.id === actor.personId)?.name, locale)}</b></span>
            <button type="submit" className="annot border border-graphite/30 px-3 py-1.5 text-ink-700 hover:border-graphite">{t('Sign out', 'Вийти')}</button>
          </form>
        ) : null}
        {reset ? <p className="annot mt-6 text-teal-600">{t('The stand started again with a fresh history.', 'Стенд почався знову зі свіжою історією.')}</p> : null}
      </PageHead>
      <Container className="py-16">
        <ul className="grid gap-6 lg:grid-cols-2">
          {demoPersonas.map((persona) => {
            const person = w.people.find((p) => p.id === persona.personId)!;
            const scopes = scopesOf(w.grants, person.id, now);
            const active = actor?.personId === person.id;
            return (
              <li key={person.id} className={`sketch p-6 ${active ? 'bg-sunrise-100' : 'bg-paper'}`}>
                <p className="annot text-sunrise-600">{pickText(roleLabels[scopes[0]!.role], locale)}</p>
                <p className="mt-2 text-xl font-semibold text-ink-900">{pickText(person.name, locale)}</p>
                <p className="annot mt-1 text-ink-500">{pickText(person.title, locale)}</p>
                <p className="mt-3 text-[0.97rem] text-ink-700">{pickText(persona.description, locale)}</p>
                <div className="mt-5 grid gap-2">
                  {scopes.map((grant) => (
                    <form key={grant.id} action={actAs} className="flex flex-wrap items-center justify-between gap-3 border-t border-graphite/20 pt-3">
                      <input type="hidden" name="personId" value={person.id} />
                      <input type="hidden" name="grantId" value={grant.id} />
                      <input type="hidden" name="locale" value={segment} />
                      {next ? <input type="hidden" name="next" value={next} /> : null}
                      <span className="text-[0.93rem] text-ink-700"><b className="font-semibold text-ink-900">{pickText(roleLabels[grant.role], locale)}</b> · {pickText(w.units.find((u) => u.id === grant.unitId)?.name, locale)}</span>
                      <button type="submit" className={plate}>{active && actor?.grantId === grant.id ? <Icon name="check" className="size-4" /> : null}{t('Act as', 'Діяти як')}</button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <section className="chamfer p-7 [--cut:18px] [--fill:var(--color-paper-deep)]">
            <Icon name="card" className="size-7 text-teal-600" />
            <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('Or pay as a customer', 'Або сплатіть як клієнт')}</h2>
            <p className="mt-2 text-ink-700">{t('A payer needs no account: the pay link is the key. Buy from a demo shop and follow your payment down the river.', 'Платнику не потрібен обліковий запис: посилання на оплату і є ключем. Купіть щось у демо-магазині й простежте свій платіж руслом ріки.')}</p>
            <div className="mt-5"><Button href={href(locale, '/shop')} variant="secondary" size="sm">{t('Open the demo shops', 'Відкрити демо-магазини')}<Icon name="arrow" className="size-4" /></Button></div>
          </section>
          <section className="p-7 ring-1 ring-graphite/20">
            <Icon name="refresh" className="size-7 text-ink-700" />
            <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('Start the stand again', 'Почати стенд знову')}</h2>
            <p className="mt-2 text-ink-700">{t('The stand lives in memory: 75 days of history are replayed when it starts. Starting again forgets every change made in the cabinets.', 'Стенд живе в пам’яті: під час запуску відтворюється історія за 75 днів. Новий запуск забуває всі зміни, зроблені в кабінетах.')}</p>
            <form action={resetStand} className="mt-5"><input type="hidden" name="locale" value={segment} /><button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-900 hover:border-ink-900">{t('Replay the history', 'Відтворити історію')}</button></form>
          </section>
        </div>
      </Container>
    </>
  );
}
