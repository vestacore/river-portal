import Link from 'next/link';
import { notFound } from 'next/navigation';
import { carrierKinds, costKinds, fxRatesToGbp, readFlow } from '@river/flows';
import { readCampaigns, readGifts } from '@river/gifts';
import { formatDate, formatMoney, oblastName, pickText, segmentForLocale } from '@river/i18n';
import { readEvents } from '@river/log';
import { findCategory, readNeed } from '@river/needs';
import { readReports } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';
import { approveCostAction, draftReportAction, matchAction, recordDeliveryAction, triageAction } from '../../actions';
import { StatusBadge } from '../../StatusBadge';
import { DispatchForm } from './DispatchForm';

const button = 'chamfer px-5 py-2.5 font-semibold text-paper [--cut:8px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]';

/** One need, its private details, the next action on the river, and the audit trail. */
export default async function NeedPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const t = dict.studio;
  const runtime = await getRuntime();
  const orgId = runtime.config.orgId;
  const need = await readNeed(runtime.store, orgId, id);
  if (!need) notFound();
  const { record: n, details } = need;
  const flow = n.flowId ? await readFlow(runtime.store, orgId, n.flowId) : null;
  const events = [...(await readEvents(runtime.store, orgId, n.id)), ...(flow ? await readEvents(runtime.store, orgId, flow.id) : [])].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const available = n.status === 'open' || n.status === 'triaged' ? (await readGifts(runtime.store, orgId)).filter((g) => !g.flowId && (g.status === 'received' || g.status === 'pledged')) : [];
  const campaigns = await readCampaigns(runtime.store, orgId);
  const reportId = flow ? (flow.reportId ?? (await readReports(runtime.store, orgId)).find((r) => r.flowId === flow.id)?.id ?? null) : null;
  const demoToken = runtime.demoTrackingLinks[n.id];
  const money = (m: number, c: string) => formatMoney(m, c, locale);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-11 place-items-center rounded-xl bg-river-100 text-river-700"><Icon name={findCategory(n.categoryId)?.icon ?? 'dots'} /></span>
            <h2 className="text-2xl font-bold">{pickText(findCategory(n.categoryId)?.label, locale)}</h2>
            <StatusBadge status={n.status} label={dict.statuses[n.status]} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-ink-500">{t.where}</dt><dd className="font-semibold">{oblastName(n.oblastId, locale)}</dd></div>
            <div><dt className="text-ink-500">{t.who}</dt><dd className="font-semibold">{dict.ask.forWhom[n.forWhom]}{n.householdSize ? ` · ${n.householdSize}` : ''}</dd></div>
            <div><dt className="text-ink-500">{t.urgency}</dt><dd className="font-semibold">{dict.ask.urgency[n.urgency]}</dd></div>
            <div><dt className="text-ink-500">{t.received}</dt><dd className="font-semibold">{formatDate(n.submittedAt, locale, true)}</dd></div>
          </dl>
        </Card>

        <Card className="ring-2 ring-sunrise-300/60">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Icon name="lock" className="size-5 text-sunrise-600" />{t.details}<Badge tone="sunrise">{dict.common.private}</Badge></h3>
          <p className="mt-1 text-sm text-ink-500">{t.detailsNote}</p>
          {details ? (
            <dl className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2"><dt className="text-ink-500">{t.name}</dt><dd className="col-span-2 font-medium">{details.name}</dd></div>
              <div className="grid grid-cols-3 gap-2"><dt className="text-ink-500">{t.contact}</dt><dd className="col-span-2 font-medium">{dict.ask.channels[details.contactChannel]}: {details.contactValue}</dd></div>
              <div className="grid grid-cols-3 gap-2"><dt className="text-ink-500">{t.settlement}</dt><dd className="col-span-2 font-medium">{details.settlement}</dd></div>
              <div><dt className="text-ink-500">{t.words}</dt><dd lang={n.locale === 'uk' ? 'uk' : 'en-GB'} className="mt-1 rounded-2xl bg-sky-50 p-4 italic">{details.description}</dd></div>
            </dl>
          ) : null}
          {demoToken ? <p className="mt-4 text-sm"><Badge tone="ink">{t.demoLink}</Badge> <Link className="font-semibold text-river-700 underline" href={href(locale, `/track/${demoToken}`)}>/track/…</Link></p> : null}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-bold">{t.timeline}</h3>
          <ol className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="grid grid-cols-[9.5rem_1fr] gap-2">
                <time className="text-ink-500">{formatDate(e.occurredAt, locale, true)}</time>
                <span><code className="rounded bg-sky-50 px-1.5 py-0.5 text-[0.8rem] text-river-800">{e.type}</code> <span className="text-ink-500">· {e.actor.label ?? e.actor.role} · {e.visibility}</span></span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="lg:sticky lg:top-24">
          {n.status === 'acknowledged' || n.status === 'submitted' ? (
            <form action={triageAction}><input type="hidden" name="needId" value={n.id} /><button type="submit" className={button}>{t.triage}</button></form>
          ) : null}

          {n.status === 'open' || n.status === 'triaged' ? (
            <form action={matchAction} className="space-y-4">
              <h3 className="text-lg font-bold">{t.match}</h3>
              <p className="text-sm text-ink-500">{t.matchLead}</p>
              <input type="hidden" name="needId" value={n.id} />
              {available.length === 0 ? <p className="text-sm text-attention-500">{t.noGifts}</p> : (
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {available.map((g) => (
                    <li key={g.id}><label className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-line has-[:checked]:bg-teal-100/50">
                      <input type="checkbox" name="giftIds" value={g.id} className="mt-1 size-4 accent-teal-600" />
                      <span className="text-sm"><b>{dict.give.kinds[g.kind]}</b>{g.amountMinor ? ` · ${money(g.amountMinor, g.currency ?? 'GBP')}` : ''} <Badge tone={g.status === 'received' ? 'teal' : 'ink'}>{g.status}</Badge><br /><span className="text-ink-500">{g.description || g.displayName || '—'}</span></span>
                    </label></li>
                  ))}
                </ul>
              )}
              <label className="block text-sm font-semibold">{t.campaign}
                <select name="campaignId" className="mt-1 w-full rounded-xl px-3 py-2 ring-1 ring-line"><option value="">{t.noCampaign}</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{pickText(c.title, locale)}</option>)}</select>
              </label>
              <button type="submit" className={button} disabled={available.length === 0}>{t.match}</button>
            </form>
          ) : null}

          {flow ? (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold"><Icon name="route" className="size-5 text-teal-600" />{t.flow} <Badge tone="teal">{flow.status}</Badge></h3>
              {flow.carrier ? <p className="text-sm"><b>{dict.carrierKinds[flow.carrier.kind]}</b> · {flow.carrier.name} · {flow.fromLabel} → {oblastName(flow.oblastId, locale)}</p> : null}
              {flow.costs.length > 0 ? (
                <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
                  {flow.costs.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="font-medium">{dict.costKinds[c.kind]}</span>
                      <span className="text-ink-500">{money(c.amountMinor, c.currency)}{c.currency !== 'GBP' ? ` ≈ ${money(c.gbpMinor, 'GBP')}` : ''}</span>
                      {c.status === 'approved' ? <Badge tone="teal" className="ml-auto">✓</Badge> : (
                        <form action={approveCostAction} className="ml-auto"><input type="hidden" name="flowId" value={flow.id} /><input type="hidden" name="costId" value={c.id} /><button className="chamfer px-3 py-1 text-xs font-bold [--cut:5px] [--fill:var(--color-sunrise-500)]">{t.approve}</button></form>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
              {flow.status === 'committed' ? (
                <DispatchForm flowId={flow.id} t={t} carrierKinds={carrierKinds.map((k) => [k, dict.carrierKinds[k]])} costKinds={costKinds.map((k) => [k, dict.costKinds[k]])} currencies={Object.keys(fxRatesToGbp)} />
              ) : null}
              {flow.status === 'in_motion' ? (
                <form action={recordDeliveryAction}><input type="hidden" name="flowId" value={flow.id} /><button type="submit" className={button}>{t.recordDelivery}</button></form>
              ) : null}
              {(flow.status === 'arrived' || flow.status === 'confirmed' || flow.status === 'reported') && !reportId ? (
                <form action={draftReportAction}><input type="hidden" name="flowId" value={flow.id} /><input type="hidden" name="localeSegment" value={segmentForLocale(locale)} /><button type="submit" className={button}>{t.generateReport}</button></form>
              ) : null}
              {reportId ? <Link className="inline-block font-semibold text-river-700 underline" href={href(locale, `/studio/reports/${reportId}`)}>{t.openReport}</Link> : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
