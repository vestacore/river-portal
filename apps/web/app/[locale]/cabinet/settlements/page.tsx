import { pickText } from '@river/i18n';
import { reconcileSettlements } from '@river/psp-runtime';
import { reconciliationStatusLabels, reconciliationStatuses, settlementChannelLabels, settlementChannels, type ReconciliationStatus } from '@river/psp-settlement';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { PeriodFilter, periodOf } from '@/components/cabinet/settlements/PeriodFilter';
import { ReconcilerFinding } from '@/components/cabinet/settlements/ReconcilerFinding';
import { amountOf, batchesText, businessDayIso, openStatuses, providerName, statusTone, unitOfBatch, type BatchRow } from '@/components/cabinet/settlements/reading';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import type { Cell } from '@/components/panels/Value';
import { cabinet } from '@/lib/cabinet';
import { count, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage, type Query } from '@/lib/table';

const day = 86_400_000;

/**
 * The settlement batches within reach, reconciled three ways — the merchant's own sales record, the
 * provider's report, the bank's credit — most urgent first: how many batches stand where and what they put
 * in question, filters by status, channel, provider and period, the batches themselves (each opens its own
 * page), and what the Reconciler found among them.
 */
export default async function Settlements({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'payouts.read');
  const { t } = c;
  const days = periodOf(query);
  const from = days < 75 ? new Date(Date.parse(c.now) - days * day).toISOString().slice(0, 10) : '';
  const provider = (id: string) => providerName(id, locale);
  const rank = (s: ReconciliationStatus) => reconciliationStatuses.indexOf(s);
  const search = (patch: Query) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, done: undefined, error: undefined, ...patch })) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `?${s}` : '';
  };
  const back = c.link(`/settlements${search({})}`);

  const inReach = reconcileSettlements(c.w, c.now).filter((r) => c.visible.has(unitOfBatch(r.view)));
  const inPeriod = inReach.filter((r) => r.view.businessDate >= from);
  const scoped = inPeriod.filter((r) => (!query.channel || r.view.channel === query.channel) && (!query.provider || r.view.provider === query.provider)
    && matches(query.q, r.view.batchId, c.unitName(unitOfBatch(r.view)), provider(r.view.provider)));
  const rows = scoped.filter((r) => !query.status || r.reconciliation.status === query.status)
    .sort((a, b) => rank(a.reconciliation.status) - rank(b.reconciliation.status) || b.view.businessDate.localeCompare(a.view.businessDate) || a.view.batchId.localeCompare(b.view.batchId));

  // The strip: where the batches of this selection stand, and what each status puts in question.
  const currency = scoped[0]?.view.currency ?? inReach[0]?.view.currency ?? 'UAH';
  const strip = reconciliationStatuses.map((s) => ({ s, list: scoped.filter((r) => r.reconciliation.status === s) })).filter((x) => x.list.length > 0);
  const caption = (s: ReconciliationStatus, minor: number) => {
    const m = money(minor, currency, locale, true);
    if (s === 'matched') return t(`${m} gross`, `${m} брутто`);
    if (s === 'resolved') return t(`${m} decided`, `${m} вирішено`);
    if (s === 'awaiting_report') return t(`${m} of sales`, `${m} продажів`);
    if (s === 'awaiting_credit') return t(`${m} to be credited`, `${m} до зарахування`);
    return t(`${m} in question`, `${m} під питанням`);
  };

  const parentName = (unitId: string) => { const parent = c.w.units.find((u) => u.id === unitId)?.parentId; return parent ? c.unitName(parent) : undefined; };
  const grossCell = (r: BatchRow): Cell => {
    const cur = r.view.currency;
    const reported = r.view.reported?.grossMinor;
    const expected = r.reconciliation.expected?.grossMinor ?? r.view.sales?.grossMinor ?? null;
    const by = expected === null ? '' : `${r.reconciliation.expected?.source === 'payments' ? t('payments', 'платежі') : t('sales', 'продажі')} ${money(expected, cur, locale)}`;
    if (reported === undefined) return expected === null ? { kind: 'empty' } : { kind: 'text', value: '—', sub: by };
    return by && r.reconciliation.differences.some((d) => d.kind === 'gross') ? { kind: 'text', value: money(reported, cur, locale), sub: by } : { kind: 'money', minor: reported, currency: cur };
  };
  const feeCell = (r: BatchRow): Cell => {
    const reported = r.view.reported?.feeMinor;
    if (reported === undefined) return { kind: 'empty' };
    const fee = r.reconciliation.differences.find((d) => d.kind === 'fee');
    return fee ? { kind: 'text', value: money(reported, r.view.currency, locale), sub: `${t('by the terms', 'за умовами')} ${money(fee.expectedMinor, r.view.currency, locale)}` } : { kind: 'money', minor: reported, currency: r.view.currency };
  };
  const creditCell = (r: BatchRow): Cell => {
    if (!r.view.credited) return { kind: 'empty' };
    const off = r.reconciliation.differences.find((d) => d.kind === 'credit');
    return off ? { kind: 'text', value: money(r.view.credited.amountMinor, r.view.currency, locale), sub: `${off.deltaMinor > 0 ? '+' : ''}${money(off.deltaMinor, r.view.currency, locale)}` } : { kind: 'money', minor: r.view.credited.amountMinor, currency: r.view.currency };
  };
  const columns: Column<BatchRow>[] = [
    { key: 'date', label: t('Business day', 'Операційний день'), cell: (r) => ({ kind: 'date', iso: businessDayIso(r.view.businessDate) }), sort: (r) => r.view.businessDate },
    { key: 'unit', label: t('Store or merchant', 'Магазин чи мерчант'), cell: (r) => ({ kind: 'unit', name: c.unitName(unitOfBatch(r.view)), sub: r.view.storeId ? parentName(r.view.storeId) : undefined }), sort: (r) => c.unitName(unitOfBatch(r.view)) },
    { key: 'provider', label: t('Provider', 'Провайдер'), cell: (r) => ({ kind: 'text', value: provider(r.view.provider) }), sort: (r) => provider(r.view.provider) },
    { key: 'channel', label: t('Channel', 'Канал'), cell: (r) => ({ kind: 'text', value: pickText(settlementChannelLabels[r.view.channel], locale) }), sort: (r) => r.view.channel },
    { key: 'count', label: t('Payments', 'Платежі'), align: 'end', cell: (r) => ({ kind: 'count', n: r.view.reported?.count ?? r.view.sales?.count ?? 0 }), sort: (r) => r.view.reported?.count ?? r.view.sales?.count ?? 0 },
    { key: 'gross', label: t('Gross', 'Брутто'), align: 'end', cell: grossCell, sort: (r) => r.view.reported?.grossMinor ?? r.reconciliation.expected?.grossMinor ?? r.view.sales?.grossMinor ?? 0 },
    { key: 'fee', label: t('Fee', 'Комісія'), align: 'end', cell: feeCell, sort: (r) => r.view.reported?.feeMinor ?? 0 },
    { key: 'net', label: t('Net', 'Нетто'), align: 'end', cell: (r) => (r.view.reported ? { kind: 'money', minor: r.view.reported.netMinor, currency: r.view.currency } : { kind: 'empty' }), sort: (r) => r.view.reported?.netMinor ?? 0 },
    { key: 'credited', label: t('Credited', 'Зараховано'), align: 'end', cell: creditCell, sort: (r) => r.view.credited?.amountMinor ?? 0 },
    { key: 'status', label: t('Status', 'Статус'), cell: (r) => ({ kind: 'status', label: pickText(reconciliationStatusLabels[r.reconciliation.status], locale), tone: statusTone[r.reconciliation.status] }), sort: (r) => rank(r.reconciliation.status) },
  ];
  const page = sortAndPage(rows, columns, query);
  const tally = (list: BatchRow[], test: (r: BatchRow) => boolean) => list.filter(test).length;
  const providers = [...new Set(inPeriod.map((r) => r.view.provider))].sort((a, b) => provider(a).localeCompare(provider(b)));

  const insights = c.w.insights.filter((i) => i.agent === 'reconciler' && i.status === 'open' && c.visible.has(i.unitId)).sort((a, b) => b.at.localeCompare(a.at));
  const open = scoped.filter((r) => openStatuses.has(r.reconciliation.status)).length;
  return (
    <>
      <CabinetHead kicker={t('Reconciliation', 'Звірка')} title={t('Settlements and reconciliation', 'Розрахунки і звірка')}
        lead={t('Three-way reconciliation compares, for every settlement batch, what the merchant’s own sales record says was sold, what the acquirer’s report says it settled, and what the bank credited to the account. Where the three do not agree, the batch shows a difference for a person to look into and decide.', 'Трибічна звірка порівнює для кожного пакета розрахунку три речі: що продано за даними продажів мерчанта, що розраховано за звітом еквайра і що банк зарахував на рахунок. Де вони не збігаються, пакет показує розбіжність, яку людина має перевірити й вирішити.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />

      {strip.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {strip.map(({ s, list }) => {
            const tone = statusTone[s];
            const sum = list.filter((r) => r.view.currency === currency).reduce((acc, r) => acc + amountOf(r), 0);
            return <Metric key={s} label={pickText(reconciliationStatusLabels[s], locale)} value={count(list.length, locale)} note={caption(s, sum)} tone={tone === 'danger' || tone === 'warning' || tone === 'success' ? tone : undefined} href={search({ status: s, page: undefined })} />;
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start gap-x-6">
        <PeriodFilter locale={locale} query={query} />
        <div className="w-full min-w-0 lg:w-auto lg:flex-1">
          <FilterBar locale={locale} query={query} groups={[
            { param: 'status', label: t('Status', 'Статус'), options: reconciliationStatuses.map((s) => ({ value: s, label: pickText(reconciliationStatusLabels[s], locale), count: tally(inPeriod, (r) => r.reconciliation.status === s) })).filter((o) => o.count > 0 || o.value === query.status) },
            { param: 'channel', label: t('Channel', 'Канал'), options: settlementChannels.map((ch) => ({ value: ch, label: pickText(settlementChannelLabels[ch], locale), count: tally(inPeriod, (r) => r.view.channel === ch) })).filter((o) => o.count > 0 || o.value === query.channel) },
            { param: 'provider', label: t('Provider', 'Провайдер'), options: providers.map((p) => ({ value: p, label: provider(p), count: tally(inPeriod, (r) => r.view.provider === p) })) },
          ]} />
        </div>
      </div>

      <Panel title={t('Settlement batches', 'Пакети розрахунку')} flush
        note={`${t('One batch per provider, store or merchant, and business day; the most urgent first, and any column sorts.', 'Один пакет — це провайдер, магазин чи мерчант і операційний день; спершу найтерміновіші, сортувати можна за будь-яким стовпчиком.')}${c.stand === 'retail' ? ` ${t('The stores take cards on the banks’ own terminals: the platform does not process those payments, it reads the tills’ records and the banks’ reports to reconcile them.', 'Магазини приймають картки на власних терміналах банків: ці платежі платформа не обробляє, а лише читає дані кас і звіти банків, щоб їх звірити.')}` : ''}`}>
        <div className="px-1">
          <DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(r) => c.link(`/settlements/${r.view.batchId}`)}
            empty={inReach.length > 0 ? t('No batch matches.', 'Жоден пакет не підходить.') : c.stand === 'retail'
              ? t('No settlement batches within this scope. A batch belongs to its store, or to the merchant for online payments and bonus points.', 'У цих межах немає пакетів розрахунку. Пакет належить своєму магазину, а пакет онлайн-платежів чи бонусних балів — мерчанту.')
              : t('No settlement batches within your reach. Where the platform holds the money and pays it out itself, see the payouts.', 'У ваших межах немає пакетів розрахунку. Там, де платформа тримає гроші й сама їх виплачує, дивіться виплати.')} />
        </div>
      </Panel>

      <Panel title={t('What the Reconciler found', 'Що знайшов Звіряльник')} className="mt-6"
        note={open > 0
          ? t(`${batchesText(open, locale)} of this selection ${open === 1 ? 'has' : 'have'} a difference nobody has decided about yet. The Reconciler proposes; a person decides.`, `Пакетів із розбіжністю без рішення в цій вибірці: ${count(open, locale)}. Звіряльник пропонує — вирішує людина.`)
          : t('Open findings within your reach. The Reconciler proposes; a person decides.', 'Відкриті знахідки у ваших межах. Звіряльник пропонує — вирішує людина.')}>
        {insights.length === 0 ? <p className="text-ink-500">{t('Nothing waits for a decision.', 'Нічого не чекає на рішення.')}</p> : (
          <div className="grid gap-3 xl:grid-cols-2">{insights.map((i) => <ReconcilerFinding key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        )}
      </Panel>
    </>
  );
}
