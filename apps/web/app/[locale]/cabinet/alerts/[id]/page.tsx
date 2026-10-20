import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { alertKindLabels, alertStatusLabels, alertStatuses, riskReasonLabels } from '@river/psp-risk';
import { sessionOutcomeLabels } from '@river/psp-session';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { NoteTimeline } from '@/components/cabinet/compliance/NoteTimeline';
import { alertTone, kybStatusText, scoreTone } from '@/components/cabinet/compliance/tones';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { alertAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';
import { sessionTone } from '@/lib/tones';

/**
 * One monitoring alert: what was seen and about which attempt or payment, its notes in order, the form
 * that moves it along — investigating, escalated, reported, closed — and what the swarm made of it.
 */
export default async function AlertPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'aml.read');
  const { t } = c;
  const a = c.w.alerts.find((x) => x.id === id);
  if (!a || !c.visible.has(a.unitId)) notFound();
  const back = c.link(`/alerts/${id}`);
  const session = a.sessionId ? c.w.views.sessions.get(a.sessionId) : undefined;
  const kyb = c.w.onboarding.find((k) => k.unitId === a.unitId);
  const insights = c.w.insights.filter((i) => (i.subject.id === id || i.evidence.some((e) => e.id === id)) && agentCatalogue.some((g) => g.id === i.agent));
  const field = 'mt-1 block w-full border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  return (
    <>
      <CabinetHead kicker={`${t('Alert', 'Сповіщення')} · ${c.unitName(a.unitId)}`} title={<span className="font-mono text-[1.4rem]">{a.id}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="text-lg font-semibold text-ink-900">{pickText(alertKindLabels[a.kind], locale)}</span>{a.amountMinor > 0 ? <span className="tabular-nums text-ink-900">{money(a.amountMinor, a.currency, locale)}</span> : null}<Status label={pickText(alertStatusLabels[a.status], locale)} tone={alertTone[a.status]} /></span>} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={t('What was seen', 'Що помічено')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Kind', 'Вид'), cell: { kind: 'text', value: pickText(alertKindLabels[a.kind], locale) } },
            { label: t('Status', 'Статус'), cell: { kind: 'status', label: pickText(alertStatusLabels[a.status], locale), tone: alertTone[a.status] } },
            { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(a.unitId), href: c.link(`/units/${a.unitId}`) } },
            { label: t('Session', 'Сесія'), cell: a.sessionId ? { kind: 'mono', value: a.sessionId, href: session ? c.link(`/sessions/${a.sessionId}`) : undefined } : { kind: 'empty' } },
            { label: t('Payment', 'Платіж'), cell: a.paymentId ? { kind: 'mono', value: a.paymentId, href: c.w.views.payments.has(a.paymentId) ? c.link(`/payments/${a.paymentId}`) : undefined } : { kind: 'empty' } },
            { label: t('The attempt now', 'Спроба зараз'), cell: session ? { kind: 'status', label: pickText(sessionOutcomeLabels[session.outcome], locale), tone: sessionTone[session.outcome] } : { kind: 'empty' } },
            { label: t('Amount', 'Сума'), cell: a.amountMinor > 0 ? { kind: 'money', minor: a.amountMinor, currency: a.currency } : { kind: 'empty' } },
            { label: t('Risk score', 'Бал ризику'), cell: { kind: 'bar', share: a.score / 100, label: String(a.score), tone: scoreTone(a.score) } },
            { label: t('Assignee', 'Виконавець'), cell: a.assignee ? { kind: 'text', value: c.personName(a.assignee) } : { kind: 'empty' } },
            { label: t('Opened', 'Відкрито'), cell: { kind: 'datetime', iso: a.openedAt } },
            { label: t('Last moved', 'Востаннє змінено'), cell: { kind: 'datetime', iso: a.updatedAt } },
            { label: t('Onboarding of the unit', 'Онбординг одиниці'), cell: kyb ? { kind: 'link', label: kyb.id, href: c.link(`/onboarding/${kyb.id}`), sub: t(kybStatusText[kyb.status][0], kybStatusText[kyb.status][1]) } : { kind: 'empty' } },
            { label: t('Reasons', 'Причини'), cell: a.reasons.length ? { kind: 'tags', items: a.reasons.map((r) => ({ label: pickText(riskReasonLabels[r], locale), tone: 'warning' as const })) } : { kind: 'empty' }, wide: true },
          ]} />
        </Panel>
        <div className="space-y-6">
          {c.may('aml.review', a.unitId) ? (
            <Panel title={t('Move it along', 'Рух сповіщення')} note={t('The note joins the alert’s own record; every move is written to the audit trail.', 'Примітка додається до записів сповіщення; кожна зміна потрапляє в журнал аудиту.')}>
              <form action={alertAction} className="space-y-3">
                <input type="hidden" name="alertId" value={a.id} /><input type="hidden" name="back" value={back} />
                <label className="block text-[0.8rem] text-ink-700">{t('Status', 'Статус')}
                  <select name="status" defaultValue={a.status} className={field}>
                    {alertStatuses.map((s) => <option key={s} value={s}>{pickText(alertStatusLabels[s], locale)}</option>)}
                  </select>
                </label>
                <label className="block text-[0.8rem] text-ink-700">{t('Note', 'Примітка')}
                  <textarea name="note" rows={3} maxLength={400} placeholder={t('What you found, whom you asked, what was filed', 'Що ви з’ясували, кого запитали, що подали')} className={field} />
                </label>
                <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Record', 'Записати')}</button>
              </form>
            </Panel>
          ) : null}
          <Panel title={t('Notes', 'Нотатки')}>
            <NoteTimeline locale={locale} entries={a.notes.map((n) => ({ at: n.at, by: c.personName(n.by), text: pickText(n.text, locale) }))} empty={t('No notes yet.', 'Нотаток поки немає.')} />
          </Panel>
        </div>
      </div>
      {insights.length > 0 ? (
        <Panel title={t('What the swarm saw here', 'Що тут побачив рій')} className="mt-6">
          <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        </Panel>
      ) : null}
    </>
  );
}
