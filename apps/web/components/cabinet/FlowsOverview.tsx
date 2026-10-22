import Link from 'next/link';
import { pickText, pluralise, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { stageCatalogue, type Currency } from '@river/psp-facts';
import { findInstrument } from '@river/psp-instruments';
import { invoiceDueMinor, invoiceStatusAt } from '@river/psp-invoice';
import type { World } from '@river/psp-runtime';
import { approvalByAcquirer, instrumentMix, kpisOf, outcomesByDay, stageFunnel, volumeByDay } from '@river/psp-views';
import { sessionColumns, type Ctx } from '@/lib/columns';
import { count, money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { scoped } from '@/lib/scoped';
import { HBars } from '../charts/HBars';
import { LineChart } from '../charts/LineChart';
import { RiverFunnel } from '../charts/RiverFunnel';
import { StackedBars } from '../charts/StackedBars';
import { DataTable } from '../panels/DataTable';
import { Metric } from '../panels/Metric';
import { Panel } from '../panels/Panel';
import { InsightCard } from './InsightCard';
import { providerName } from './connections/providerName';

const day = 86_400_000;

/**
 * The dashboard of a scope's flows: headline figures, the money by day, attempts by how they ended, the
 * funnel as a river, the mix of instruments, the acquirers' approvals, what waits for someone, the
 * newest attempts and the agents' proposals. Every figure is a fold of the boundaries' views. On the retail
 * stand the words follow its assembly: holds wait for picking, fees are the banks' acquiring fees, and
 * providers are named.
 */
export function FlowsOverview({ w, visible, locale, ctx, role, days, back, canDecide, personName }: { w: World; visible: ReadonlySet<string>; locale: Locale; ctx: Ctx; role: string; days: number; back: string; canDecide: boolean; personName: (id: string) => string }) {
  const t = lt(locale);
  const retail = w.stand === 'retail';
  const now = ctx.now;
  const from = new Date(Date.parse(now) - days * day).toISOString();
  const { sessions, payments, invoices } = scoped(w, visible);
  const currencies = (['UAH', 'EUR'] as Currency[]).filter((c) => payments.some((p) => p.currency === c));
  const main = currencies[0] ?? 'UAH';
  const k = kpisOf(sessions, payments, main, from);
  const kEur = currencies.includes('EUR') && main !== 'EUR' ? kpisOf(sessions, payments, 'EUR', from) : null;
  const series = volumeByDay(payments, main, days, now);
  const dayLabel = (d: string) => new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(d));
  const recentSessions = sessions.filter((s) => s.openedAt >= from);
  const funnel = stageFunnel(recentSessions).map((f) => ({ label: pickText(stageCatalogue.find((s) => s.stage === f.stage)!.label, locale), reached: f.reached }));
  const mix = instrumentMix(payments.filter((p) => p.capturedAt && p.capturedAt >= from), main);
  const approvals = approvalByAcquirer(recentSessions).slice(0, 8);
  const toCapture = payments.filter((p) => p.status === 'authorised');
  const held = sessions.filter((s) => s.outcome === 'review');
  const overdue = invoices.filter((i) => invoiceStatusAt(i, now) === 'overdue');
  const disputes = payments.flatMap((p) => p.disputes.filter((d) => d.status === 'open').map((d) => ({ p, d })));
  const waitingFunds = sessions.filter((s) => s.outcome === 'awaiting_funds');
  const audience = new Set(agentCatalogue.filter((a) => a.audience.includes(role as never)).map((a) => a.id));
  const insights = w.insights.filter((i) => i.status === 'open' && audience.has(i.agent) && visible.has(i.unitId)).slice(0, 4);
  const queue: Array<[string, number, string, string]> = [
    retail
      ? [t('Holds awaiting picking', 'Блокування, що чекають на комплектацію'), toCapture.length, ctx.link('/payments?status=authorised'), t('captured after picking, less the bonus points', 'списання після комплектації, за вирахуванням бонусних балів')]
      : [t('Holds to capture', 'Блокування до списання'), toCapture.length, ctx.link('/payments?status=authorised'), t('manual capture at shipment', 'ручне списання при відвантаженні')],
    [t('Held for review', 'Затримано на перевірку'), held.length, ctx.link('/sessions?outcome=review'), retail ? t('risk and fraud; money that did not match, an operator', 'ризики й антифрод; кошти, що не збіглися, — оператор') : t('compliance; money that did not match, an operator', 'комплаєнс; кошти, що не збіглися, — операціоніст')],
    [t('Waiting for pushed money', 'Чекають надісланих коштів'), waitingFunds.length, ctx.link('/sessions?outcome=awaiting_funds'), retail ? t('bank transfers and QR payments', 'банківські перекази й оплати за QR') : t('transfers, cash codes, debits', 'перекази, коди готівки, списання')],
    [t('Overdue invoices', 'Прострочені інвойси'), overdue.length, ctx.link('/invoices?status=overdue'), money(overdue.reduce((s, i) => s + invoiceDueMinor(i), 0), main, locale)],
    [t('Disputes to answer', 'Спори до відповіді'), disputes.length, ctx.link('/disputes'), t('evidence before the deadline', 'докази до строку')],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label={t(`Captured, ${days} days`, `Списано, ${days} днів`)} value={money(k.grossMinor, main, locale, true)} note={kEur ? `+ ${money(kEur.grossMinor, 'EUR', locale, true)}` : `${count(k.payments, locale)} ${t('payments', 'платежів')}`} spark={series.slice(-14).map((p) => p.value)} />
        <Metric label={t('Payments', 'Платежі')} value={count(k.payments + (kEur?.payments ?? 0), locale)} note={`${t('average', 'середній')} ${money(k.averageMinor, main, locale)}`} />
        <Metric label={t('Approved', 'Схвалено')} value={percent(k.approvalBps, locale)} note={t('of attempts that reached an answer', 'спроб, що отримали відповідь')} tone={k.approvalBps > 9_000 ? 'success' : 'warning'} />
        <Metric label={t('Conversion', 'Конверсія')} value={percent(k.conversionBps, locale)} note={`${count(k.succeeded, locale)} / ${count(k.sessions, locale)} ${t('sessions', 'сесій')}`} />
        <Metric label={t('Refunded', 'Повернено')} value={money(k.refundedMinor, main, locale, true)} note={percent(k.refundBps, locale)} />
        <Metric label={retail ? t('Acquiring fees', 'Комісії еквайрингу') : t('Fees earned', 'Комісій нараховано')} value={money(k.feeMinor, main, locale, true)} note={`${retail ? `${t('paid to banks and providers', 'сплачено банкам і провайдерам')} · ` : ''}${pluralise(k.disputes, locale, locale === 'uk' ? { one: '{n} спір', few: '{n} спори', many: '{n} спорів', other: '{n} спору' } : { one: '{n} dispute', other: '{n} disputes' })}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={t(`Captured per day, ${main}`, `Списано за день, ${main}`)} note={t('The capture bridge of every session in scope, folded by day.', 'Міст списання кожної сесії в межах, згорнутий за днями.')}>
          <LineChart series={[{ label: t('captured', 'списано'), points: series, tone: 'river' }]} format={(v) => money(v, main, locale, true)} dayLabel={dayLabel} />
        </Panel>
        <Panel title={t('Waiting for someone', 'Чекає на когось')} note={t('Where the river stops until a person or the world acts.', 'Де ріка зупиняється, доки не дія людина чи світ.')}>
          <ul className="divide-y divide-graphite/15">
            {queue.map(([label, n, path, note]) => (
              <li key={label}><Link href={path} className="flex items-center justify-between gap-3 py-2.5 hover:bg-paper-deep"><span><span className="block text-[0.9rem] text-ink-900">{label}</span><span className="annot text-[0.58rem] text-ink-500">{note}</span></span><span className={`font-mono text-lg ${n > 0 ? 'text-sunrise-600' : 'text-ink-300'}`}>{n}</span></Link></li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={t('The funnel of the river', 'Воронка ріки')} note={t(`How many of the ${count(recentSessions.length, locale)} attempts of the last ${days} days reached each stage.`, `Скільки з ${count(recentSessions.length, locale)} спроб за останні ${days} днів дійшли до кожної стадії.`)}>
        <RiverFunnel stages={funnel} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t('Sessions by how they ended', 'Сесії за результатом')}>
          <StackedBars rows={outcomesByDay(sessions, days, now)} dayLabel={dayLabel} unit={t('sessions', 'сесій')} stacks={[
            { key: 'succeeded', label: t('succeeded', 'успішні'), fill: 'var(--color-teal-500)' },
            { key: 'failed', label: t('failed', 'невдалі'), fill: 'var(--color-attention-500)' },
            { key: 'abandoned', label: t('abandoned', 'покинуті'), fill: 'var(--color-ink-300)' },
            { key: 'expired', label: t('expired', 'сплили'), fill: 'var(--color-sunrise-300)' },
            { key: 'open', label: t('still open', 'ще тривають'), fill: 'var(--color-river-600)', hatch: true },
          ]} />
        </Panel>
        <Panel title={t(`Instruments, ${main}`, `Інструменти, ${main}`)} note={t('Captured money by instrument — every one first-class.', 'Списані кошти за інструментами — усі рівноправні.')}>
          <HBars rows={mix.map((m) => ({ label: pickText(findInstrument(m.instrument).label, locale), value: m.amountMinor, display: money(m.amountMinor, main, locale, true), note: count(m.count, locale) }))} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title={t('Acquirers and banks', 'Еквайри та банки')} note={t('Approval of the attempts each carried.', 'Схвалення спроб, які кожен провів.')}>
          <HBars rows={approvals.map((a) => ({ label: retail ? providerName(a.acquirer, locale, w.stand) : a.acquirer, value: a.approvalBps, display: percent(a.approvalBps, locale), note: `${a.approved + a.refused}`, tone: a.approvalBps < 9_000 ? 'attention' : 'teal' }))} />
        </Panel>
        <Panel title={t('The agents propose', 'Агенти пропонують')} actions={<Link href={ctx.link('/agents')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All proposals', 'Усі пропозиції')} →</Link>}>
          {insights.length === 0 ? <p className="text-ink-500">{t('Nothing waits for you.', 'Нічого не чекає на вас.')}</p> : (
            <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={ctx.link} back={back} canDecide={canDecide} personName={personName} />)}</div>
          )}
        </Panel>
      </div>

      <Panel title={t('Newest attempts', 'Найновіші спроби')} flush actions={<Link href={ctx.link('/sessions')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All sessions', 'Усі сесії')} →</Link>}>
        <div className="px-1"><DataTable columns={sessionColumns(ctx)} rows={sessions.slice(0, 10)} locale={locale} link={(s) => ctx.link(`/sessions/${s.sessionId}`)} query={{}} total={10} /></div>
      </Panel>
    </div>
  );
}
