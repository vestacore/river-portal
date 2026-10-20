import Link from 'next/link';
import { pickText } from '@river/i18n';
import { riskReasonLabels } from '@river/psp-risk';
import { sessionOutcomeLabels, type SessionView } from '@river/psp-session';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { heldAt, reviewDecidedAt } from '@/components/cabinet/compliance/held';
import { scoreTone } from '@/components/cabinet/compliance/tones';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Value, type Cell } from '@/components/panels/Value';
import { reviewAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { instrumentCell } from '@/lib/columns';
import { ago, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery, sortAndPage } from '@/lib/table';
import { sessionTone } from '@/lib/tones';

type Row = { s: SessionView; at: string };

/**
 * The attempts the screening held for a person, longest waiting first: what the score saw, and the
 * decision — cleared, the attempt is routed and goes on down the river; rejected, it ends there with the
 * reason on record. Below, the holds decided lately and how each attempt went on.
 */
export default async function Reviews({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'aml.review');
  const { t } = c;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const back = c.link(`/reviews${query.unit ? `?unit=${query.unit}` : ''}`);
  const sessions = [...c.w.views.sessions.values()].filter((s) => c.visible.has(s.unitId));
  const held = sessions.filter((s) => s.outcome === 'review').map((s) => ({ s, at: heldAt(c.w, s), mismatch: s.mismatch })).sort((a, b) => a.at.localeCompare(b.at));
  const decided: Row[] = sessions.filter((s) => s.review && s.review.status !== 'open').map((s) => ({ s, at: reviewDecidedAt(c.w, s) })).sort((a, b) => b.at.localeCompare(a.at));
  const risk = (s: SessionView): Cell => (s.risk ? { kind: 'bar', share: s.risk.score / 100, label: String(s.risk.score), tone: scoreTone(s.risk.score) } : { kind: 'empty' });
  const reasons = (s: SessionView): Cell => (s.risk && s.risk.reasons.length ? { kind: 'tags', items: s.risk.reasons.map((r) => ({ label: pickText(riskReasonLabels[r as keyof typeof riskReasonLabels], locale) || r, tone: 'warning' as const })) } : { kind: 'empty' });
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  const input = 'mt-1 block w-full border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const columns: Column<Row>[] = [
    { key: 'session', label: t('Session', 'Сесія'), cell: ({ s }) => ({ kind: 'mono', value: s.sessionId, href: c.link(`/sessions/${s.sessionId}`) }), sort: ({ s }) => s.sessionId },
    { key: 'decided', label: t('Decided', 'Вирішено'), cell: ({ at }) => ({ kind: 'datetime', iso: at }), sort: ({ at }) => at },
    { key: 'decision', label: t('Decision', 'Рішення'), cell: ({ s }) => (s.review?.reason === 'mismatch'
      ? (s.review.status === 'cleared' ? { kind: 'status', label: t('taken', 'прийнято'), tone: 'success' } : { kind: 'status', label: t('returned', 'повернуто'), tone: 'warning' })
      : s.review?.status === 'cleared' ? { kind: 'status', label: t('cleared', 'дозволено'), tone: 'success' } : { kind: 'status', label: t('rejected', 'відхилено'), tone: 'danger' }), sort: ({ s }) => s.review?.status ?? '' },
    { key: 'by', label: t('Decided by', 'Хто вирішив'), cell: ({ s }) => (s.review?.by ? { kind: 'text', value: c.personName(s.review.by) } : { kind: 'empty' }), sort: ({ s }) => (s.review?.by ? c.personName(s.review.by) : '') },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: ({ s }) => ({ kind: 'unit', name: c.unitName(s.unitId) }), sort: ({ s }) => c.unitName(s.unitId) },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: ({ s }) => ({ kind: 'money', minor: s.amountMinor, currency: s.currency }), sort: ({ s }) => s.amountMinor },
    { key: 'risk', label: t('Risk', 'Ризик'), align: 'end', cell: ({ s }) => risk(s), sort: ({ s }) => s.risk?.score ?? -1 },
    { key: 'outcome', label: t('How it went on', 'Чим скінчилася'), cell: ({ s }) => ({ kind: 'status', label: pickText(sessionOutcomeLabels[s.outcome], locale), tone: sessionTone[s.outcome] }), sort: ({ s }) => s.outcome },
  ];
  const page = sortAndPage(decided, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Financial monitoring', 'Фінмоніторинг')} title={t('Held attempts', 'Затримані спроби')}
        lead={t('Attempts the screening stopped for a person. Clear one and it is routed and goes on down the river; reject it and it ends here, with your reason on record.', 'Спроби, які скринінг зупинив для людини. Дозвольте — і спробу буде маршрутизовано далі за течією; відхиліть — і вона завершиться тут, а ваша причина залишиться в записі.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <Panel title={`${t('Waiting for a decision', 'Чекають на рішення')} · ${held.length}`} tone={held.length > 0 ? 'attention' : 'plain'} flush
        note={held.length > 0 ? t('Longest waiting first. The alert behind each hold is closed with your decision.', 'Спершу ті, що чекають найдовше. Сповіщення, через яке спробу затримано, закривається разом із вашим рішенням.') : undefined}>
        {held.length === 0 ? <p className="p-4 text-ink-500">{t('Nothing is held. The river runs.', 'Нічого не затримано. Ріка тече.')}</p> : (
          <ul className="divide-y divide-graphite/20">
            {held.map(({ s, at, mismatch }) => (
              <li key={s.sessionId} className="grid gap-x-8 gap-y-4 px-4 py-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Link href={c.link(`/sessions/${s.sessionId}`)} className="font-mono text-[0.85rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{s.sessionId}</Link>
                    <span className="text-lg font-semibold tabular-nums text-ink-900">{money(s.amountMinor, s.currency, locale)}</span>
                    <span className="annot text-[0.6rem] text-ink-500">{t('held', 'затримано')} {ago(at, c.now, locale)}</span>
                  </div>
                  <div className="mt-3">
                    <FieldGrid locale={locale} columns={4} fields={[
                      { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(s.unitId), sub: s.merchantId !== s.unitId ? c.unitName(s.merchantId) : undefined } },
                      { label: t('Instrument', 'Інструмент'), cell: instrumentCell(ctx, s.instrument, s.detail) },
                      { label: t('Held since', 'Затримано з'), cell: { kind: 'datetime', iso: at } },
                      { label: t('Risk score', 'Бал ризику'), cell: risk(s) },
                    ]} />
                  </div>
                  <div className="mt-3">
                    {!mismatch ? <Value cell={reasons(s)} locale={locale} /> : (
                      <p className="text-[0.88rem] text-ink-700">
                        {t('The money that arrived does not match what was due', 'Кошти, що надійшли, не збігаються з належною сумою')}
                        {mismatch ? <span className="ml-2 tabular-nums text-attention-500">{t('arrived', 'надійшло')} {money(mismatch.gotMinor, s.currency, locale)} · {t('due', 'належало')} {money(mismatch.expectedMinor, s.currency, locale)}</span> : null}
                      </p>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  {mismatch && s.review?.status === 'open' ? (
                    <div className="space-y-3">
                      <p className="text-[0.85rem] text-ink-700">{t('Take what arrived — no more than was due; any shortfall stays due on the invoice — or return it to the payer and end the attempt.', 'Прийміть те, що надійшло, — не більше належного; нестача лишиться до сплати за інвойсом — або поверніть кошти платнику й завершіть спробу.')}</p>
                      <form action={reviewAction} className="flex items-end gap-2">
                        {hidden('sessionId', s.sessionId)}{hidden('decision', 'clear')}{hidden('kind', 'mismatch')}{hidden('back', back)}
                        <label className="min-w-0 flex-1 text-[0.8rem] text-ink-700">{t('Note', 'Примітка')}<input name="note" maxLength={160} placeholder={t('The payer confirmed a partial transfer', 'Платник підтвердив частковий переказ')} className={input} /></label>
                        <button type="submit" className="chamfer shrink-0 px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Take', 'Прийняти')} {money(Math.min(mismatch.gotMinor, mismatch.expectedMinor), s.currency, locale)}</button>
                      </form>
                      <form action={reviewAction} className="flex items-end gap-2">
                        {hidden('sessionId', s.sessionId)}{hidden('decision', 'reject')}{hidden('kind', 'mismatch')}{hidden('back', back)}
                        <label className="min-w-0 flex-1 text-[0.8rem] text-ink-700">{t('Reason', 'Причина')}<input name="note" maxLength={160} placeholder={t('The amount did not match', 'Сума не збіглася')} className={input} /></label>
                        <button type="submit" className="annot shrink-0 border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Return to the payer', 'Повернути платнику')}</button>
                      </form>
                    </div>
                  ) : s.review?.status === 'open' && c.may('aml.review', s.unitId) ? (
                    <div className="space-y-3">
                      <form action={reviewAction} className="flex items-end gap-2">
                        {hidden('sessionId', s.sessionId)}{hidden('decision', 'clear')}{hidden('back', back)}
                        <label className="min-w-0 flex-1 text-[0.8rem] text-ink-700">{t('Note', 'Примітка')}<input name="note" maxLength={160} placeholder={t('Checked: a known customer', 'Перевірено: відомий клієнт')} className={input} /></label>
                        <button type="submit" className="chamfer shrink-0 px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Clear', 'Дозволити')}</button>
                      </form>
                      <form action={reviewAction} className="flex items-end gap-2">
                        {hidden('sessionId', s.sessionId)}{hidden('decision', 'reject')}{hidden('back', back)}
                        <label className="min-w-0 flex-1 text-[0.8rem] text-ink-700">{t('Reason', 'Причина')}<input name="note" maxLength={160} placeholder={t('Rejected at review', 'Відхилено після перевірки')} className={input} /></label>
                        <button type="submit" className="annot shrink-0 border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Reject', 'Відхилити')}</button>
                      </form>
                    </div>
                  ) : (
                    <p className="text-[0.85rem] text-ink-500">{t('Another profile decides holds at this unit.', 'Затримки в цій одиниці вирішує інший профіль.')}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={t('Recently decided', 'Нещодавно вирішені')} note={t('Newest decision first, and how each attempt went on after it.', 'Спершу найновіші рішення — і чим після них скінчилася кожна спроба.')} className="mt-6" flush>
        <div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={({ s }) => c.link(`/sessions/${s.sessionId}`)} empty={t('No hold has been decided yet.', 'Ще жодної затримки не вирішено.')} /></div>
      </Panel>
    </>
  );
}
