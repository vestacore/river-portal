import Link from 'next/link';
import { pickText, segmentForLocale } from '@river/i18n';
import { hasRole } from '@river/identity';
import { getPayRuntime, listPayPersonas } from '@river/pay-runtime';
import { readAllOrders } from '@river/pay-views';
import { getRuntime, personaName } from '@river/runtime';
import { PageHead } from '@/components/site/PageHead';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { actAsAction } from '@/lib/actions/demoActions';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getIdentity } from '@/lib/getIdentity';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { actAsPayAction, leavePayAction } from '@/lib/pay/actions';
import { getPayActor } from '@/lib/pay/getPayActor';
import { getPayOperator } from '@/lib/pay/getPayOperator';
import { resolveLocale } from '@/lib/resolveLocale';

const card = 'sketch grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center';
const plate = 'chamfer inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]';

/**
 * The way into the payment river: its two banks and its stewards, each a cabinet; the door for a
 * payer who has only a link; and the five stages every payment passes. In a demo, anyone may act
 * as a seller, a payer or a steward.
 */
export default async function PayIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.pay;
  const segment = segmentForLocale(locale);
  const [portal, runtime, settings, identity, actor, operator] = await Promise.all([getRuntime(), getPayRuntime(), loadSettings(), getIdentity(locale), getPayActor(locale), getPayOperator(locale)]);
  const demo = portal.config.auth === 'demo';
  const personas = listPayPersonas(runtime.config);
  const now = new Date().toISOString();
  const payable = demo ? (await readAllOrders(runtime.store, runtime.root)).find((o) => o.status === 'invoiced' && o.invoice !== null && o.invoice.expiresAt > now && runtime.demoPayKeys[o.orderId]) : undefined;
  const stewards = [['helen', t.index.steward], ['priya', t.index.auditor]] as const;

  const bank = (role: 'merchant' | 'payer') => (
    <section>
      <h2 className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{t.index.banks[role]}</h2>
      <ul className="grid gap-5">
        {personas.filter((p) => p.role === role).map((p) => {
          const active = actor?.personaId === p.id;
          return (
            <li key={p.id} className={`${card} ${active ? 'bg-sunrise-100' : 'bg-paper'}`}>
              <div>
                <p className="text-lg font-semibold text-ink-900">{pickText(p.name, locale)}</p>
                <p className="annot mt-1 text-ink-500">{p.ref}</p>
                <p className="mt-2 text-[0.95rem] text-ink-700">{pickText(p.description, locale)}</p>
              </div>
              {active ? (
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <Link href={href(locale, `/pay/${role}`)} className={plate}><Icon name="check" className="size-4" />{t.index.open}</Link>
                  <form action={leavePayAction}><input type="hidden" name="localeSegment" value={segment} /><button type="submit" className="annot text-ink-500 underline underline-offset-4 hover:text-ink-900">{t.index.leave}</button></form>
                </div>
              ) : (
                <form action={actAsPayAction}>
                  <input type="hidden" name="personaId" value={p.id} />
                  <input type="hidden" name="localeSegment" value={segment} />
                  <button type="submit" className={plate}>{t.index.actAs}</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );

  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 10`} title={t.index.title} lead={t.index.lead} />
      <Container className="py-16">
        {demo ? (
          <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
            {bank('merchant')}
            {bank('payer')}
            <section>
              <h2 className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{t.index.banks.operator}</h2>
              <ul className="grid gap-5">
                {stewards.map(([personaId, text]) => {
                  const active = identity?.personaId === personaId;
                  return (
                    <li key={personaId} className={`${card} ${active ? 'bg-sunrise-100' : 'bg-paper'}`}>
                      <div>
                        <p className="text-lg font-semibold text-ink-900">{personaName(personaId, settings.profileId, locale)}</p>
                        <p className="annot mt-1 text-ink-500">{dict.roles[personaId === 'helen' ? 'finance_steward' : 'auditor']}</p>
                        <p className="mt-2 text-[0.95rem] text-ink-700">{text}</p>
                      </div>
                      {active ? <Link href={href(locale, '/pay/operator')} className={plate}><Icon name="check" className="size-4" />{t.index.open}</Link> : (
                        <form action={actAsAction}>
                          <input type="hidden" name="personaId" value={personaId} />
                          <input type="hidden" name="localeSegment" value={segment} />
                          <input type="hidden" name="next" value={`/${segment}/pay/operator`} />
                          <button type="submit" className={plate}>{t.index.actAs}</button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
            <section>
              <h2 className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{t.index.linkTitle}</h2>
              <div className="chamfer p-6 [--cut:18px] [--fill:var(--color-paper-deep)]">
                <Icon name="lock" className="size-7 text-teal-600" />
                <p className="mt-3 text-ink-700">{t.index.linkText}</p>
                {payable ? <div className="mt-5"><Button href={href(locale, `/pay/invoice/${runtime.demoPayKeys[payable.orderId]}`)} variant="secondary" size="sm">{t.index.linkOpen}<Icon name="arrow" className="size-4" /></Button></div> : null}
              </div>
            </section>
          </div>
        ) : (
          <div className="chamfer max-w-3xl p-7 [--cut:18px] [--fill:var(--color-paper-deep)]">
            <p className="text-ink-700">{t.index.notOpen}</p>
            {operator || hasRole(identity, 'finance_steward', 'administrator', 'auditor') ? <div className="mt-5"><Button href={href(locale, '/pay/operator')} variant="secondary" size="sm">{t.operator.role}<Icon name="arrow" className="size-4" /></Button></div> : null}
          </div>
        )}

        <section className="mt-24 border-t border-graphite/15 pt-16">
          <SectionHeading index="10.1" title={t.index.how} />
          <ol className="grid gap-x-8 gap-y-10 md:grid-cols-5">
            {t.index.steps.map((step, i) => (
              <li key={step.title} className="border-t-2 border-ink-900 pt-4">
                <span className="font-mono text-sm text-sunrise-600">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-1 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] text-ink-700">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Container>
    </>
  );
}
