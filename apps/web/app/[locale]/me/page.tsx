import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { costKinds, readFlow, readFlowsByCarrier, readSharedThanks, type Flow } from '@river/flows';
import { readGiftsByGiver, giftStatuses } from '@river/gifts';
import { formatDate, formatMoney, oblastName, pickText, segmentForLocale } from '@river/i18n';
import { hasRole, isStaff } from '@river/identity';
import { findCategory, readNeedsByPerson, type TimelineCode } from '@river/needs';
import { readReport } from '@river/reports';
import { findPersona, getRuntime } from '@river/runtime';
import { ConfirmForm } from '@/components/site/ConfirmForm';
import { PageHead } from '@/components/site/PageHead';
import { QuickExitFor } from '@/components/site/QuickExitFor';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { Timeline } from '@/components/ui/Timeline';
import { costCurrencies } from '@/lib/costCurrencies';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getIdentity } from '@/lib/getIdentity';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import { confirmMineAction, handOverAction } from './actions';
import { CarrierCostForm } from './CarrierCostForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).me.title, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

const journey: TimelineCode[] = ['submitted', 'acknowledged', 'triaged', 'matched', 'dispatched', 'delivered', 'confirmed'];

/**
 * My river: the signed-in person's own part of the river, by role. Recipients follow and confirm
 * their requests; givers see where each gift went and the thanks shared with them; carriers hand
 * deliveries over and record costs; staff are pointed to the studio.
 */
export default async function MePage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const identity = await getIdentity(locale);
  if (!identity) notFound();
  const dict = getDictionary(locale);
  const t = dict.me;
  const [runtime, settings, site] = await Promise.all([getRuntime(), loadSettings(), loadSite()]);
  const orgId = runtime.config.orgId;
  const personId = identity.personId ?? '';
  const segment = segmentForLocale(locale);

  const needs = hasRole(identity, 'recipient') ? await readNeedsByPerson(runtime.store, orgId, personId) : null;
  const gifts = hasRole(identity, 'giver', 'sponsor') ? await readGiftsByGiver(runtime.store, orgId, personId) : null;
  const legs = hasRole(identity, 'carrier') ? await readFlowsByCarrier(runtime.store, orgId, personId) : null;

  // For each gift's flow: where it went, the public report (if published) and the thanks shared.
  const flowIds = [...new Set((gifts ?? []).map((g) => g.flowId).filter((id): id is string => Boolean(id)))];
  const traces = new Map<string, { flow: Flow; reportId: string | null; thanks: Array<{ text: string; locale: string; writtenAt: string }> }>();
  for (const id of flowIds) {
    const flow = await readFlow(runtime.store, orgId, id);
    if (!flow) continue;
    const report = flow.reportId ? await readReport(runtime.store, orgId, flow.reportId) : null;
    traces.set(id, { flow, reportId: report?.status === 'published' ? report.id : null, thanks: await readSharedThanks(runtime.store, orgId, id) });
  }
  const campaignTitle = (id: string | null) => pickText(site.campaigns.find((c) => c.id === id)?.title, locale);
  const home = findPersona(identity.personaId)?.home;

  return (
    <>
      {needs ? <QuickExitFor settings={settings} dict={dict} /> : null}
      <PageHead sheet={`${dict.common.sheet} 09`} title={t.title} lead={<>{identity.name} · <span className="annot">{identity.roles.map((r) => dict.roles[r]).join(' · ')}</span></>} />
      <Container className="space-y-20 py-16">
        {isStaff(identity) ? (
          <section className="chamfer flex flex-wrap items-center justify-between gap-6 p-7 [--cut:24px] [--fill:var(--color-paper-deep)]">
            <h2 className="text-2xl font-semibold">{t.staffTitle}</h2>
            <Button href={href(locale, home && home.startsWith('/studio') ? home : '/studio')} variant="secondary">{t.openStudio}<Icon name="arrow" className="size-4" /></Button>
          </section>
        ) : null}

        {needs ? (
          <section>
            <h2 className="mb-8 text-3xl font-semibold">{t.requests}</h2>
            {needs.length === 0 ? <p className="text-ink-500">{t.noRequests}</p> : (
              <div className="grid gap-10">
                {needs.map((n) => {
                  const done = new Map(n.timeline.map((e) => [e.code, e.at]));
                  const steps = journey.map((code) => ({ label: dict.track.timeline[code], when: done.has(code) ? formatDate(done.get(code) as string, locale, true) : undefined, done: done.has(code) }));
                  const canConfirm = n.status === 'in_delivery' || n.status === 'delivered';
                  return (
                    <article key={n.id} className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
                      <div className="sketch bg-paper p-7">
                        <p className="mb-6 flex flex-wrap items-center gap-3"><b className="text-lg">{pickText(findCategory(n.categoryId)?.label, locale)}</b><Badge tone="teal">{dict.statuses[n.status]}</Badge></p>
                        <Timeline steps={steps} />
                      </div>
                      <div className="sketch bg-paper p-7">
                        {canConfirm ? <ConfirmForm action={confirmMineAction.bind(null, n.id)} localeSegment={segment} t={dict.track} /> : (
                          <div className="grid h-full place-items-center text-center text-ink-500">
                            <div><Icon name={n.status === 'confirmed' ? 'heart' : 'route'} className="mx-auto size-12 text-teal-500" /><p className="mt-3">{n.status === 'confirmed' ? dict.track.confirmedText : dict.track.timeline.acknowledged}</p></div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {gifts ? (
          <section>
            <h2 className="mb-8 text-3xl font-semibold">{t.giving}</h2>
            {gifts.length === 0 ? <p className="text-ink-500">{t.noGifts}</p> : (
              <ul className="grid gap-8">
                {gifts.map((g) => {
                  const trace = g.flowId ? traces.get(g.flowId) : undefined;
                  const reached = giftStatuses.indexOf(g.status);
                  return (
                    <li key={g.id} className="border-t border-graphite/60 pt-5">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <b className="text-lg">{dict.give.kinds[g.kind]}</b>
                        {g.amountMinor ? <span className="font-display text-xl font-semibold tabular-nums">{formatMoney(g.amountMinor, g.currency ?? 'GBP', locale)}</span> : null}
                        <span className="text-ink-500">{g.description || campaignTitle(g.campaignId) || dict.give.anyCampaign}</span>
                        <span className="annot ml-auto text-ink-500">{formatDate(g.pledgedAt, locale)}</span>
                      </div>
                      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label={t.trace}>
                        {giftStatuses.map((s, i) => (
                          <li key={s} className={`border-t-2 pt-2 text-xs sm:text-sm ${i <= reached ? 'border-teal-500 text-ink-900' : 'border-graphite/20 text-ink-300'}`}>{t.giftStatus[s]}</li>
                        ))}
                      </ol>
                      {trace ? (
                        <div className="mt-4 space-y-3 text-[0.95rem]">
                          <p className="text-ink-700">
                            <Icon name="route" className="mr-1.5 inline size-4 text-teal-600" />
                            {oblastName(trace.flow.oblastId, locale)} · {dict.flowStatuses[trace.flow.status]}{trace.flow.arrivedAt ? ` · ${formatDate(trace.flow.arrivedAt, locale)}` : ''}
                            {trace.reportId ? <> · <Link className="font-semibold underline decoration-sunrise-500 decoration-2 underline-offset-4" href={href(locale, `/reports/${trace.reportId}`)}>{t.report}</Link></> : null}
                          </p>
                          {trace.thanks.map((th) => (
                            <blockquote key={th.writtenAt} lang={th.locale === 'uk' ? 'uk' : 'en-GB'} className="border-l-2 border-sunrise-500 pl-4 italic text-ink-900">
                              {th.locale === 'uk' ? `«${th.text}»` : `“${th.text}”`}
                            </blockquote>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {legs ? (
          <section>
            <h2 className="mb-8 text-3xl font-semibold">{t.legs}</h2>
            {legs.length === 0 ? <p className="text-ink-500">{t.noLegs}</p> : (
              <ul className="grid gap-10 lg:grid-cols-2">
                {legs.map((flow) => (
                  <li key={flow.id} className="sketch space-y-4 bg-paper p-6">
                    <p className="flex flex-wrap items-center gap-3"><Badge tone={flow.status === 'in_motion' ? 'sunrise' : 'teal'}>{dict.flowStatuses[flow.status]}</Badge><span className="annot text-ink-500">{flow.dispatchedAt ? formatDate(flow.dispatchedAt, locale) : ''}</span></p>
                    <p className="text-lg font-semibold">{flow.fromLabel} → {oblastName(flow.oblastId, locale)}</p>
                    {flow.costs.length > 0 ? (
                      <ul className="divide-y divide-graphite/15 border-y border-graphite/30 text-sm">
                        {flow.costs.map((c) => (
                          <li key={c.id} className="flex items-center gap-3 py-2">
                            <span>{dict.costKinds[c.kind]}</span>
                            <span className="tabular-nums text-ink-700">{formatMoney(c.amountMinor, c.currency, locale)}</span>
                            <Badge tone={c.status === 'approved' ? 'teal' : 'sunrise'} className="ml-auto">{c.status === 'approved' ? t.approved : dict.studio.tolls.waiting}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {flow.status === 'in_motion' ? (
                      <form action={handOverAction}><input type="hidden" name="flowId" value={flow.id} /><button type="submit" className="chamfer px-5 py-2.5 font-semibold text-ink-900 [--cut:8px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)]">{t.markHandedOver}</button></form>
                    ) : null}
                    {flow.status === 'in_motion' || flow.status === 'arrived' ? (
                      <CarrierCostForm flowId={flow.id} kinds={costKinds.map((k) => [k, dict.costKinds[k]])} currencies={costCurrencies(settings)}
                        t={{ addCost: t.addCost, costSent: t.costSent, costAmount: dict.studio.costAmount, currency: dict.studio.currency, costNote: dict.studio.costNote, kind: dict.studio.costs, error: t.costError }} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </Container>
    </>
  );
}
