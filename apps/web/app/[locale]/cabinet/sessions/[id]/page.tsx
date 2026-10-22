import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { factCatalogue, stageCatalogue } from '@river/psp-facts';
import { riskReasonLabels } from '@river/psp-risk';
import { riverOfSession } from '@river/psp-runtime';
import { sessionOutcomeLabels } from '@river/psp-session';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { RoutingDecision } from '@/components/cabinet/routing/RoutingDecision';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { BridgeTable } from '@/components/river/BridgeTable';
import { SessionRiver } from '@/components/river/SessionRiver';
import { captureAction, reviewAction, voidAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { instrumentCell } from '@/lib/columns';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { acquirerName } from '@/lib/routing/acquirerName';
import { readQuery } from '@/lib/table';
import { sessionTone } from '@/lib/tones';

/**
 * One payment session — one attempt to pay, the river itself. Its bridges are drawn as it ran, each with
 * the views it formed; below, every bridge as stored, field by field; then the payment's life after the
 * mouth. Where the attempt waits for a person who may act, the action is here.
 */
export default async function SessionPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const river = riverOfSession(c.w, id);
  if (!river || !c.visible.has(river.session.unitId)) notFound();
  const s = river.session;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const labels = Object.fromEntries(factCatalogue.map((d) => [d.type, pickText(d.label, locale)]));
  const stageLabels = { ...Object.fromEntries(stageCatalogue.map((x) => [x.stage, pickText(x.label, locale)])), after: t('closing', 'завершення') };
  const back = c.link(`/sessions/${id}`);
  const ended = s.outcome === 'succeeded' ? 'succeeded' : s.outcome === 'failed' || s.outcome === 'abandoned' || s.outcome === 'expired' ? 'failed' : 'open';
  const payment = s.paymentId ? c.w.views.payments.get(s.paymentId) : undefined;
  const insights = c.w.insights.filter((i) => (i.subject.id === id || (s.paymentId && i.subject.id === s.paymentId) || i.evidence.some((e) => e.id === id)) && agentCatalogue.some((a) => a.id === i.agent));
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  const button = 'chamfer px-3.5 py-2 text-[0.82rem] font-semibold [--cut:6px]';
  return (
    <>
      <CabinetHead kicker={`${t('Payment session', 'Платіжна сесія')} · ${c.unitName(s.unitId)}`} title={<span className="font-mono text-[1.4rem]">{s.sessionId}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="text-lg font-semibold tabular-nums text-ink-900">{money(s.amountMinor, s.currency, locale)}</span><Status label={pickText(sessionOutcomeLabels[s.outcome], locale)} tone={sessionTone[s.outcome]} />{s.mismatch && s.outcome === 'review' ? <span className="text-[0.9rem] text-attention-500">{t('arrived', 'надійшло')} {money(s.mismatch.gotMinor, s.currency, locale)} · {t('due', 'належало')} {money(s.mismatch.expectedMinor, s.currency, locale)}</span> : s.failure ? <span className="font-mono text-[0.8rem] text-attention-500">{s.failure.code}: {s.failure.reason}</span> : null}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {s.outcome === 'review' && s.review && s.mismatch && (c.may('aml.review', s.unitId) || c.may('payments.capture', s.unitId)) ? (
              <>
                <form action={reviewAction}>{hidden('sessionId', id)}{hidden('decision', 'clear')}{hidden('kind', 'mismatch')}{hidden('back', back)}<button type="submit" className={`${button} text-paper [--fill:var(--color-teal-600)]`}>{t('Take', 'Прийняти')} {money(Math.min(s.mismatch.gotMinor, s.mismatch.expectedMinor), s.currency, locale)}</button></form>
                <form action={reviewAction}>{hidden('sessionId', id)}{hidden('decision', 'reject')}{hidden('kind', 'mismatch')}{hidden('back', back)}<button type="submit" className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Return to the payer', 'Повернути платнику')}</button></form>
              </>
            ) : s.outcome === 'review' && s.review && c.may('aml.review', s.unitId) ? (
              <>
                <form action={reviewAction}>{hidden('sessionId', id)}{hidden('decision', 'clear')}{hidden('back', back)}<button type="submit" className={`${button} text-paper [--fill:var(--color-teal-600)]`}>{t('Clear and let it go on', 'Дозволити й продовжити')}</button></form>
                <form action={reviewAction}>{hidden('sessionId', id)}{hidden('decision', 'reject')}{hidden('back', back)}<button type="submit" className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Reject', 'Відхилити')}</button></form>
              </>
            ) : null}
            {s.outcome === 'awaiting_capture' && s.paymentId && c.may('payments.capture', s.unitId) ? (
              <>
                <form action={captureAction}>{hidden('paymentId', s.paymentId)}{hidden('back', back)}<button type="submit" className={`${button} text-ink-900 [--fill:var(--color-sunrise-500)]`}>{t('Capture', 'Списати')} {money(s.amountMinor, s.currency, locale)}</button></form>
                <form action={voidAction}>{hidden('paymentId', s.paymentId)}{hidden('back', back)}<button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-700 hover:border-ink-900">{t('Release the hold', 'Зняти блокування')}</button></form>
              </>
            ) : null}
          </div>
        } />
      <Flash query={query} locale={locale} />
      <Panel title={t('The river of this attempt', 'Русло цієї спроби')} note={t('Each bridge is a fact of the session’s stream. The squares say which views it formed; open a bridge to see what changed.', 'Кожен міст — факт потоку сесії. Квадрати показують, які проєкції він сформував; відкрийте міст, щоб побачити зміни.')} flush>
        <div className="overflow-x-auto px-2 py-3">
          <SessionRiver bridges={river.bridges} labels={labels} stageLabels={stageLabels} ended={ended}
            legend={{ session: t('session', 'сесія'), order: t('order', 'замовлення'), invoice: t('invoice', 'інвойс'), payment: t('payment', 'платіж'), ledger: t('ledger', 'облік'), door: t('a person at the door', 'людина біля дверей'), figure: t('a figure of the machine', 'фігура машини'), world: t('the world: banks, clock', 'світ: банки, годинник') }} />
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t('The session’s view', 'Проєкція сесії')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Invoice', 'Інвойс'), cell: { kind: 'mono', value: c.w.views.invoices.get(s.invoiceId)?.number ?? s.invoiceId, href: c.link(`/invoices/${s.invoiceId}`) } },
            { label: t('Order', 'Замовлення'), cell: { kind: 'mono', value: c.w.views.orders.get(s.orderId)?.reference ?? s.orderId, href: c.link(`/orders/${s.orderId}`) } },
            { label: t('Payment', 'Платіж'), cell: s.paymentId ? { kind: 'mono', value: s.paymentId, href: c.link(`/payments/${s.paymentId}`) } : { kind: 'empty' } },
            { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(s.unitId), href: c.link(`/units/${s.unitId}`), sub: c.unitName(s.merchantId) } },
            { label: t('Instrument', 'Інструмент'), cell: instrumentCell(ctx, s.instrument, s.detail) },
            { label: t('Channel · locale · country', 'Канал · мова · країна'), cell: { kind: 'text', value: `${s.channel} · ${s.locale} · ${s.country}` } },
            { label: t('Opened', 'Відкрито'), cell: { kind: 'datetime', iso: s.openedAt } },
            { label: t('Closed', 'Закрито'), cell: { kind: 'datetime', iso: s.closedAt } },
            { label: t('Expires', 'Спливає'), cell: { kind: 'datetime', iso: s.expiresAt } },
            { label: t('Risk', 'Ризик'), cell: s.risk ? { kind: 'bar', share: s.risk.score / 100, label: `${s.risk.score} · ${s.risk.decision}`, tone: s.risk.level === 'high' ? 'danger' : s.risk.level === 'medium' ? 'warning' : 'success' } : { kind: 'empty' } },
            { label: t('Reasons', 'Причини'), cell: s.risk && s.risk.reasons.length ? { kind: 'tags', items: s.risk.reasons.map((r) => ({ label: pickText(riskReasonLabels[r as keyof typeof riskReasonLabels], locale) || r, tone: 'warning' as const })) } : { kind: 'empty' } },
            { label: t('Route', 'Маршрут'), cell: s.route ? { kind: 'text', value: `${s.route.rail} → ${acquirerName(s.route.acquirer, locale)}`, sub: s.route.rule } : { kind: 'empty' } },
            { label: t('Capture', 'Списання'), cell: s.captureMode ? { kind: 'text', value: s.captureMode === 'manual' ? t('manual, at shipment', 'ручне, при відвантаженні') : t('at once', 'одразу') } : { kind: 'empty' } },
            { label: t('Captured', 'Списано'), cell: { kind: 'money', minor: s.capturedMinor, currency: s.currency } },
            { label: c.w.feeRecipient === null ? t('Acquirer’s fee', 'Комісія еквайра') : t('PSP fee', 'Комісія PSP'), cell: { kind: 'money', minor: s.feeMinor, currency: s.currency, muted: true } },
          ]} />
        </Panel>
        <div className="space-y-6">
          {payment && payment.allocations.length > 0 ? (
            <Panel title={t('Distribution: where the money went', 'Розподіл: куди пішли гроші')} note={t('Formed at the distribution event; refunds take back from the same shares.', 'Сформовано подією розподілу; повернення забирають з тих самих часток.')}>
              <ul className="divide-y divide-graphite/15">
                {payment.allocations.map((a) => (
                  <li key={`${a.recipientUnitId}${a.rule}`} className="flex items-center justify-between gap-3 py-2 text-[0.88rem]">
                    <span><span className="text-ink-900">{a.recipientUnitId.startsWith('acq:') ? acquirerName(a.recipientUnitId, locale) : c.unitName(a.recipientUnitId)}</span><span className="annot ml-2 text-[0.58rem] text-ink-500">{a.role}{a.holdUntil ? ` · ${t('held until', 'утримано до')} ${a.holdUntil.slice(0, 10)}` : ''}</span></span>
                    <span className="tabular-nums text-ink-900">{money(a.amountMinor, a.currency, locale)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          {insights.length > 0 ? (
            <Panel title={t('What the agents saw here', 'Що тут побачили агенти')}>
              <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
            </Panel>
          ) : null}
        </div>
      </div>
      {s.route ? (
        <Panel title={t('Routing decision', 'Рішення маршрутизації')} note={t('Recorded at the routing bridge with every acquirer that was weighed; a replay of the session routes the same way.', 'Записано на мосту маршрутизації разом з усіма еквайрами, які зважувались; повтор сесії маршрутизує так само.')} className="mt-6"
          actions={<Link href={c.link('/routes')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('The routing studio', 'Студія маршрутизації')} →</Link>}>
          <RoutingDecision c={c} session={s} locale={locale} />
        </Panel>
      ) : null}
      <Panel title={t('Every bridge, as stored', 'Кожен міст, як записано')} note={t('The stream of this session: dense numbers, one wave per transaction, and what each fact formed.', 'Потік цієї сесії: щільна нумерація, одна хвиля на транзакцію, і що сформував кожен факт.')} className="mt-6" flush>
        <BridgeTable rows={river.bridges} locale={locale} currency={s.currency} />
      </Panel>
      {river.after.length > 0 ? (
        <Panel title={t('After the mouth: the payment’s own stream', 'Після гирла: власний потік платежу')} className="mt-6" flush>
          <BridgeTable rows={river.after} locale={locale} currency={s.currency} />
        </Panel>
      ) : null}
    </>
  );
}
