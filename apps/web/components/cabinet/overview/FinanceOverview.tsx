import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { reconcileSettlements } from '@river/psp-runtime';
import { reconciliationStatusLabels, reconciliationStatuses, settlementChannelLabels, type ReconciliationStatus, type SettlementChannel } from '@river/psp-settlement';
import type { cabinet } from '@/lib/cabinet';
import { count, money, percent } from '@/lib/format';
import type { Query } from '@/lib/table';
import { StackedBars } from '../../charts/StackedBars';
import { DataTable, type Column } from '../../panels/DataTable';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';
import { ReconcilerFinding } from '../settlements/ReconcilerFinding';
import { amountOf, batchesText, businessDayIso, openStatuses, providerName, statusTone, unitOfBatch, type BatchRow } from '../settlements/reading';

const day = 86_400_000;

type StatusLine = { status: ReconciliationStatus; batches: number; amountMinor: number; oldest: string };
type FeeLine = { provider: string; batches: number; grossMinor: number; reportedMinor: number; expectedMinor: number; differing: number; toleranceMinor: number };
type RateLine = { provider: string; channel: SettlementChannel; batches: number; grossMinor: number; feeMinor: number; bps: number };

/**
 * The overview of the finance controller: how the last thirty days reconciled and which differences wait
 * for a decision, with the amounts they put in question; the credits the providers' reports already owe
 * and the bank has not yet credited — a list of what the reports say, not a forecast; each provider's fees
 * against what the terms give; the effective acquiring rate by provider and channel; and what the
 * Reconciler proposes.
 */
export function FinanceOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  const { t, w } = c;
  const now = Date.parse(c.now);
  const from = new Date(now - 30 * day).toISOString().slice(0, 10);
  const back = c.link(`${query.unit ? `?unit=${query.unit}` : ''}`);
  const provider = (id: string) => providerName(id, locale);
  const inReach = reconcileSettlements(w, c.now).filter((r) => c.visible.has(unitOfBatch(r.view)));
  const currency = inReach[0]?.view.currency ?? 'UAH';
  const own = inReach.filter((r) => r.view.currency === currency);
  const recent = own.filter((r) => r.view.businessDate >= from);
  const m = (minor: number, compact = false) => money(minor, currency, locale, compact);
  const signed = (minor: number) => `${minor > 0 ? '+' : ''}${m(minor)}`;
  const is = (r: BatchRow, ...statuses: ReconciliationStatus[]) => statuses.includes(r.reconciliation.status);
  const insights = w.insights.filter((i) => i.agent === 'reconciler' && c.visible.has(i.unitId))
    .sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.at.localeCompare(a.at)).slice(0, 6);
  const reconciler = (
    <Panel title={t('The Reconciler', 'Звіряльник')} note={t('What it found within your reach, open proposals first. It proposes; you decide.', 'Що він знайшов у ваших межах, спершу відкриті пропозиції. Він пропонує — вирішуєте ви.')}
      actions={<Link href={c.link('/agents')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All proposals', 'Усі пропозиції')} →</Link>}>
      {insights.length === 0 ? <p className="text-ink-500">{t('Nothing to report.', 'Нічого не помічено.')}</p> : (
        <div className="grid gap-3 xl:grid-cols-2">{insights.map((i) => <ReconcilerFinding key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
      )}
    </Panel>
  );
  if (inReach.length === 0) {
    return (
      <div className="space-y-6">
        <Panel title={t('Reconciliation', 'Звірка')}>
          <p className="text-ink-500">{c.stand === 'retail'
            ? t('No settlement batches within this scope. A batch belongs to its store, or to the merchant for online payments and bonus points.', 'У цих межах немає пакетів розрахунку. Пакет належить своєму магазину, а пакет онлайн-платежів чи бонусних балів — мерчанту.')
            : t('No settlement batches within your reach. Where the platform holds the money and pays it out itself, its payouts and ledger show where the money is.', 'У ваших межах немає пакетів розрахунку. Там, де платформа тримає гроші й сама їх виплачує, де вони, показують виплати й облік.')}</p>
        </Panel>
        {reconciler}
      </div>
    );
  }

  // Reconciliation over thirty days, and the differences waiting for a decision, of any date.
  const matched = recent.filter((r) => is(r, 'matched')).length;
  const matchedBps = recent.length ? Math.floor((matched / recent.length) * 10_000) : 0;
  const resolved = recent.filter((r) => is(r, 'resolved')).length;
  const awaiting = recent.filter((r) => is(r, 'awaiting_report', 'awaiting_credit')).length;
  const open = own.filter((r) => openStatuses.has(r.reconciliation.status));
  const byStatus: StatusLine[] = reconciliationStatuses.filter((s) => openStatuses.has(s)).map((status) => {
    const list = open.filter((r) => r.reconciliation.status === status);
    return { status, batches: list.length, amountMinor: list.reduce((s, r) => s + amountOf(r), 0), oldest: list.map((r) => r.view.businessDate).sort()[0] ?? '' };
  }).filter((x) => x.batches > 0);
  const openMinor = byStatus.reduce((s, x) => s + x.amountMinor, 0);
  const dates = Array.from({ length: 30 }, (_, i) => new Date(now - (30 - i) * day).toISOString().slice(0, 10));
  const byDate = new Map<string, BatchRow[]>();
  for (const r of recent) byDate.set(r.view.businessDate, [...(byDate.get(r.view.businessDate) ?? []), r]);
  const daily = dates.map((d) => {
    const list = byDate.get(d) ?? [];
    return { day: d, values: { matched: list.filter((r) => is(r, 'matched')).length, open: list.filter((r) => openStatuses.has(r.reconciliation.status)).length, resolved: list.filter((r) => is(r, 'resolved')).length, awaiting: list.filter((r) => is(r, 'awaiting_report', 'awaiting_credit')).length } };
  });
  const dayLabel = (d: string) => new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(businessDayIso(d)));

  // What the reports already say the bank owes: reported, not on the statement.
  const credits = own.filter((r) => r.view.reported && !r.view.credited && r.view.channel !== 'loyalty' && r.view.reported.netMinor > 0)
    .sort((a, b) => (a.view.reported?.valueDate ?? '').localeCompare(b.view.reported?.valueDate ?? '') || a.view.batchId.localeCompare(b.view.batchId));
  const creditsMinor = credits.reduce((s, r) => s + (r.view.reported?.netMinor ?? 0), 0);
  const overdue = credits.filter((r) => r.reconciliation.differences.some((d) => d.kind === 'credit')).length;

  // Each provider's fees in its reports, against what the terms give; and the fee as a share of the gross.
  const fees = new Map<string, FeeLine>();
  const rates = new Map<string, RateLine>();
  for (const r of recent) {
    const rep = r.view.reported;
    if (!rep || r.view.channel === 'loyalty') continue;
    const expected = r.reconciliation.expected?.feeMinor;
    if (expected !== null && expected !== undefined) {
      const f = fees.get(r.view.provider) ?? { provider: r.view.provider, batches: 0, grossMinor: 0, reportedMinor: 0, expectedMinor: 0, differing: 0, toleranceMinor: 0 };
      f.batches += 1; f.grossMinor += rep.grossMinor; f.reportedMinor += rep.feeMinor; f.expectedMinor += expected; f.toleranceMinor += Math.max(100, rep.count);
      if (r.reconciliation.differences.some((d) => d.kind === 'fee')) f.differing += 1;
      fees.set(r.view.provider, f);
    }
    if (rep.grossMinor <= 0) continue;
    const key = `${r.view.provider}|${r.view.channel}`;
    const x = rates.get(key) ?? { provider: r.view.provider, channel: r.view.channel, batches: 0, grossMinor: 0, feeMinor: 0, bps: 0 };
    x.batches += 1; x.grossMinor += rep.grossMinor; x.feeMinor += rep.feeMinor;
    rates.set(key, x);
  }
  const feeLines = [...fees.values()].sort((a, b) => (b.reportedMinor - b.expectedMinor) - (a.reportedMinor - a.expectedMinor) || b.reportedMinor - a.reportedMinor);
  const overMinor = feeLines.reduce((s, f) => s + Math.max(0, f.reportedMinor - f.expectedMinor), 0);
  const differing = feeLines.reduce((s, f) => s + f.differing, 0);
  const rateLines = [...rates.values()].map((x) => ({ ...x, bps: (x.feeMinor * 10_000) / x.grossMinor })).sort((a, b) => b.bps - a.bps);
  const grossMinor = rateLines.reduce((s, x) => s + x.grossMinor, 0);
  const feeMinor = rateLines.reduce((s, x) => s + x.feeMinor, 0);
  const maxBps = Math.max(1, ...rateLines.map((x) => x.bps));

  const statusColumns: Column<StatusLine>[] = [
    { key: 'status', label: t('Status', 'Статус'), cell: (x) => ({ kind: 'status', label: pickText(reconciliationStatusLabels[x.status], locale), tone: statusTone[x.status] }) },
    { key: 'batches', label: t('Batches', 'Пакети'), align: 'end', cell: (x) => ({ kind: 'count', n: x.batches }) },
    { key: 'amount', label: t('In question', 'Під питанням'), align: 'end', cell: (x) => ({ kind: 'money', minor: x.amountMinor, currency }) },
    { key: 'oldest', label: t('Oldest', 'Найдавніший'), cell: (x) => ({ kind: 'date', iso: x.oldest ? businessDayIso(x.oldest) : null }) },
  ];
  const creditColumns: Column<BatchRow>[] = [
    { key: 'value', label: t('Value date', 'Дата валютування'), cell: (r) => ({ kind: 'date', iso: r.view.reported ? businessDayIso(r.view.reported.valueDate) : null }) },
    { key: 'provider', label: t('Provider', 'Провайдер'), cell: (r) => ({ kind: 'text', value: provider(r.view.provider), sub: c.unitName(unitOfBatch(r.view)) }) },
    { key: 'net', label: t('Net in the report', 'Нетто за звітом'), align: 'end', cell: (r) => ({ kind: 'money', minor: r.view.reported?.netMinor ?? 0, currency }) },
    { key: 'status', label: t('Status', 'Статус'), cell: (r) => ({ kind: 'status', label: pickText(reconciliationStatusLabels[r.reconciliation.status], locale), tone: statusTone[r.reconciliation.status] }) },
  ];
  const feeColumns: Column<FeeLine>[] = [
    { key: 'provider', label: t('Provider', 'Провайдер'), cell: (f) => ({ kind: 'text', value: provider(f.provider), sub: t(`${batchesText(f.batches, locale)}${f.differing ? `; the fee differs in ${count(f.differing, locale)}` : ''}`, `пакетів: ${count(f.batches, locale)}${f.differing ? `; комісія відрізняється в ${count(f.differing, locale)}` : ''}`) }) },
    { key: 'reported', label: t('Reported fee', 'Комісія за звітами'), align: 'end', cell: (f) => ({ kind: 'money', minor: f.reportedMinor, currency }) },
    { key: 'expected', label: t('By the terms', 'За умовами'), align: 'end', cell: (f) => ({ kind: 'money', minor: f.expectedMinor, currency, muted: true }) },
    { key: 'delta', label: t('Difference', 'Різниця'), align: 'end', cell: (f) => (f.reportedMinor === f.expectedMinor ? { kind: 'empty' } : { kind: 'money', minor: f.reportedMinor - f.expectedMinor, currency, signed: true, muted: Math.abs(f.reportedMinor - f.expectedMinor) <= f.toleranceMinor }) },
  ];
  const rateColumns: Column<RateLine>[] = [
    { key: 'provider', label: t('Provider', 'Провайдер'), cell: (x) => ({ kind: 'text', value: provider(x.provider), sub: pickText(settlementChannelLabels[x.channel], locale) }) },
    { key: 'gross', label: t('Gross', 'Брутто'), align: 'end', cell: (x) => ({ kind: 'money', minor: x.grossMinor, currency }) },
    { key: 'fee', label: t('Fee', 'Комісія'), align: 'end', cell: (x) => ({ kind: 'money', minor: x.feeMinor, currency }) },
    { key: 'rate', label: t('Effective rate', 'Ефективна ставка'), cell: (x) => ({ kind: 'bar', share: x.bps / maxBps, label: percent(x.bps, locale, 2), tone: x.channel === 'in_store' ? 'success' : 'info' }) },
  ];
  const providerLink = (f: FeeLine) => c.link(`/settlements?provider=${encodeURIComponent(f.provider)}&days=30${f.differing ? '&status=fee_difference' : ''}`);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric label={t('Matched, 30 days', 'Звірено, 30 днів')} value={percent(matchedBps, locale)} note={t(`${count(matched, locale)} of ${batchesText(recent.length, locale)}`, `пакетів: ${count(matched, locale)} з ${count(recent.length, locale)}`)} href={c.link('/settlements?days=30')} />
        <Metric label={t('Open differences', 'Відкриті розбіжності')} value={count(open.length, locale)} note={open.length ? t(`${m(openMinor, true)} in question`, `${m(openMinor, true)} під питанням`) : t('nothing waits for a decision', 'нічого не чекає на рішення')} tone={open.length ? 'danger' : 'success'} href={c.link('/settlements')} />
        <Metric label={t('Reported, not yet credited', 'У звітах, ще не зараховано')} value={m(creditsMinor, true)} note={t(`${batchesText(credits.length, locale)} · ${count(overdue, locale)} past the value date`, `пакетів: ${count(credits.length, locale)} · після дати валютування: ${count(overdue, locale)}`)} tone={overdue ? 'warning' : undefined} href="#credits" />
        <Metric label={t('Fees above the terms, 30 days', 'Комісії понад умови, 30 днів')} value={m(overMinor, true)} note={t(`${batchesText(differing, locale)} with a fee difference`, `пакетів із різницею в комісії: ${count(differing, locale)}`)} tone={overMinor > 0 ? 'warning' : 'success'} href={c.link('/settlements?status=fee_difference&days=30')} />
        <Metric label={t('Effective acquiring rate, 30 days', 'Ефективна ставка еквайрингу, 30 днів')} value={grossMinor > 0 ? percent((feeMinor * 10_000) / grossMinor, locale, 2) : '—'} note={t(`${m(feeMinor, true)} in fees on ${m(grossMinor, true)}`, `${m(feeMinor, true)} комісій з ${m(grossMinor, true)}`)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Panel title={t('Open differences by status', 'Відкриті розбіжності за статусом')} flush
          note={t('Differences nobody has decided about yet, of any date, with the amounts they put in question.', 'Розбіжності, щодо яких ще ніхто не ухвалив рішення, за будь-яку дату, із сумами під питанням.')}
          actions={<Link href={c.link('/settlements')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All batches', 'Усі пакети')} →</Link>}>
          <div className="px-1"><DataTable columns={statusColumns} rows={byStatus} locale={locale} query={{}} pageSize={Math.max(1, byStatus.length)} link={(x) => c.link(`/settlements?status=${x.status}`)} empty={t('No open differences. Every batch agrees or has a decision.', 'Відкритих розбіжностей немає. Кожен пакет збігається або має рішення.')} /></div>
        </Panel>
        <Panel title={t('Reconciliation, 30 days', 'Звірка, 30 днів')}
          note={t(`Batches by business day: ${count(matched, locale)} of ${batchesText(recent.length, locale)} matched, ${count(resolved, locale)} resolved by a decision, ${count(awaiting, locale)} still awaiting a report or a credit.`, `Пакети за операційними днями: звірено ${count(matched, locale)} з ${count(recent.length, locale)}, вирішено рішенням — ${count(resolved, locale)}, ще очікують звіту чи зарахування — ${count(awaiting, locale)}.`)}>
          <StackedBars rows={daily} dayLabel={dayLabel} unit={t('batches', 'пакетів')} stacks={[
            { key: 'matched', label: t('matched', 'звірено'), fill: 'var(--color-teal-500)' },
            { key: 'open', label: t('open difference', 'відкрита розбіжність'), fill: 'var(--color-attention-500)' },
            { key: 'resolved', label: t('resolved', 'вирішено'), fill: 'var(--color-river-600)' },
            { key: 'awaiting', label: t('awaiting', 'очікується'), fill: 'var(--color-ink-300)', hatch: true },
          ]} />
        </Panel>
      </div>

      <Panel id="credits" title={t('Credits the reports already owe', 'Зарахування, які вже належать за звітами')} flush
        note={t('Batches a provider has reported and the bank has not yet credited. The amounts are the reports’ own net figures: what is already owed, not a forecast.', 'Пакети, про які провайдер уже звітував, а банк ще не зарахував. Суми — нетто з самих звітів: те, що вже належить, а не прогноз.')}>
        <div className="px-1"><DataTable columns={creditColumns} rows={credits} locale={locale} query={{}} pageSize={Math.max(1, credits.length)} link={(r) => c.link(`/settlements/${r.view.batchId}`)}
          empty={t('Every reported batch is on the bank statement.', 'Кожен пакет зі звіту є у виписці банку.')}
          footer={credits.length > 0 ? <span className="text-[0.82rem] tabular-nums text-ink-700">{t('Total', 'Разом')} {m(creditsMinor)}</span> : undefined} /></div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t('Fee audit by provider, 30 days', 'Перевірка комісій за провайдерами, 30 днів')} flush
          note={t('What each provider charged in its reports, against what the terms give. A store’s batch is priced line by line under the terms; an online batch by the fee each payment carried. A difference within rounding is grey.', 'Що кожен провайдер утримав за звітами, проти того, що дають умови. Пакет магазину оцінюється за рядками згідно з умовами; онлайн-пакет — за комісією кожного платежу. Різниця в межах округлення — сіра.')}>
          <div className="px-1"><DataTable columns={feeColumns} rows={feeLines} locale={locale} query={{}} pageSize={Math.max(1, feeLines.length)} link={providerLink}
            empty={t('No reported batches in the last 30 days.', 'За останні 30 днів звітів про пакети немає.')}
            footer={feeLines.length > 0 ? <span className="text-[0.82rem] tabular-nums text-ink-700">{t('Reported', 'За звітами')} {m(feeLines.reduce((s, f) => s + f.reportedMinor, 0))} · {t('by the terms', 'за умовами')} {m(feeLines.reduce((s, f) => s + f.expectedMinor, 0))} · {t('difference', 'різниця')} {signed(feeLines.reduce((s, f) => s + f.reportedMinor - f.expectedMinor, 0))}</span> : undefined} /></div>
        </Panel>
        <Panel title={t('Effective acquiring rate, 30 days', 'Ефективна ставка еквайрингу, 30 днів')} flush
          note={t('The fee as a share of the gross, by provider and channel, from the providers’ own reports. Bonus points are left out: they carry no fee and move no money.', 'Комісія як частка брутто, за провайдером і каналом, із власних звітів провайдерів. Бонусні бали не враховано: вони не мають комісії й не рухають грошей.')}>
          <div className="px-1"><DataTable columns={rateColumns} rows={rateLines} locale={locale} query={{}} pageSize={Math.max(1, rateLines.length)}
            empty={t('No reported batches in the last 30 days.', 'За останні 30 днів звітів про пакети немає.')} /></div>
        </Panel>
      </div>

      {reconciler}
    </div>
  );
}
