import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import type { SettlementLine } from '@river/psp-facts';
import type { PaymentView } from '@river/psp-payment';
import { reconcileSettlements } from '@river/psp-runtime';
import { differenceLabels, reconciliationStatusLabels, resolutionLabels, settlementChannelLabels, type BatchDifference, type SettlementView } from '@river/psp-settlement';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ReconcilerFinding, findingConcerns } from '@/components/cabinet/settlements/ReconcilerFinding';
import {
  businessDayIso, isAcquirer, isCardLine, issuerOfLine, mainDifference, openStatuses, productWords, providerName, salesSourceWords, schemeOfLine, statusTone, termsFeeOf, termsOfBatch, unitOfBatch,
} from '@/components/cabinet/settlements/reading';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FieldGrid, type Field } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status, type Tone } from '@/components/panels/Value';
import { resolveSettlementAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { instrumentCell } from '@/lib/columns';
import { count, day, money, percent, when } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

type Resolution = SettlementView['resolutions'][number]['resolution'];
type Line = SettlementLine & { termsMinor: number | null; deltaMinor: number | null };
type Carried = { p: PaymentView; grossMinor: number; feeMinor: number };

const resolutionTone: Record<Resolution, Tone> = { accepted: 'info', claim_raised: 'warning', written_off: 'neutral', corrected: 'success' };
const resolutionKinds = Object.keys(resolutionLabels) as Resolution[];

/**
 * One settlement batch, three ways: what the merchant's own records say should be in it, what the provider
 * reports it settled and what the bank credited, side by side; the differences between them; the
 * provider's breakdown line by line beside what the terms give for each line; for an online batch, the
 * payments it carried; the decisions people recorded, the form to record one, and what the Reconciler
 * found. A batch outside the reader's reach does not exist for them.
 */
export default async function SettlementBatch({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'payouts.read');
  const { t } = c;
  const row = reconcileSettlements(c.w, c.now).find((x) => x.view.batchId === id);
  if (!row || !c.visible.has(unitOfBatch(row.view))) notFound();
  const { view: b, reconciliation: r } = row;
  const unitId = unitOfBatch(b);
  const cur = b.currency;
  const m = (minor: number) => money(minor, cur, locale);
  const signed = (minor: number) => `${minor > 0 ? '+' : ''}${m(minor)}`;
  const date = (ymd: string) => day(businessDayIso(ymd), locale);
  const back = c.link(`/settlements/${id}`);
  const provider = providerName(b.provider, locale);
  const tolerance = Math.max(100, b.reported?.count ?? 0);
  const terms = termsOfBatch(c.w, b);
  const contract = terms?.contractId ? c.w.contracts.find((x) => x.id === terms.contractId) : undefined;
  const open = openStatuses.has(r.status);
  const region = b.storeId ? c.w.units.find((u) => u.id === b.storeId)?.parentId : null;

  // The payments the platform carried in this batch: their shares the provider settled under this batch's id.
  const carried: Carried[] = [...c.w.views.payments.values()].flatMap((p) => {
    const own = p.payouts.filter((x) => x.batchId === id);
    if (own.length === 0) return [];
    return [{ p, grossMinor: own.reduce((s, x) => s + x.amountMinor, 0), feeMinor: own.filter((x) => x.recipientUnitId.startsWith('acq:')).reduce((s, x) => s + x.amountMinor, 0) }];
  }).sort((x, y) => (x.p.capturedAt ?? '').localeCompare(y.p.capturedAt ?? ''));

  // The three sides.
  const salesSide: { title: string; note: string; fields: Field[] | null; empty?: string } = b.sales
    ? { title: t('Sales record', 'Дані продажів'), note: t(...salesSourceWords[b.sales.source]), fields: [
        { label: t('Payments', 'Платежі'), cell: { kind: 'count', n: b.sales.count } },
        { label: t('Gross', 'Брутто'), cell: { kind: 'money', minor: b.sales.grossMinor, currency: cur } },
        { label: t('Received', 'Отримано'), cell: { kind: 'datetime', iso: b.sales.at } },
      ] }
    : r.expected?.source === 'payments'
      ? { title: t('The platform’s payments', 'Платежі платформи'), note: t('No separate sales record: what the batch should hold comes from the payments the platform carried.', 'Окремих даних продажів немає: що має бути в пакеті, видно з платежів, які провела платформа.'), fields: [
          { label: t('Payments', 'Платежі'), cell: { kind: 'count', n: carried.length } },
          { label: t('Gross', 'Брутто'), cell: r.expected.grossMinor === null ? { kind: 'empty' } : { kind: 'money', minor: r.expected.grossMinor, currency: cur } },
          { label: t('Fee by the terms', 'Комісія за умовами'), cell: r.expected.feeMinor === null ? { kind: 'empty' } : { kind: 'money', minor: r.expected.feeMinor, currency: cur } },
        ] }
      : { title: t('Sales record', 'Дані продажів'), note: '', fields: null, empty: t('No sales record for this batch.', 'Даних продажів за цей пакет немає.') };
  const report = b.reported;
  const reportFields: Field[] | null = report ? [
    { label: t('Value date', 'Дата валютування'), cell: { kind: 'date', iso: businessDayIso(report.valueDate) } },
    { label: t('Payments', 'Платежі'), cell: { kind: 'count', n: report.count } },
    { label: t('Gross', 'Брутто'), cell: { kind: 'money', minor: report.grossMinor, currency: cur } },
    { label: t('Fee', 'Комісія'), cell: { kind: 'money', minor: report.feeMinor, currency: cur } },
    { label: t('Refunds netted', 'Утримано повернень'), cell: { kind: 'money', minor: report.refundsMinor, currency: cur, muted: report.refundsMinor === 0 } },
    { label: t('Chargebacks netted', 'Утримано чарджбеків'), cell: { kind: 'money', minor: report.chargebacksMinor, currency: cur, muted: report.chargebacksMinor === 0 } },
    { label: t('Net', 'Нетто'), cell: { kind: 'money', minor: report.netMinor, currency: cur } },
    { label: t('Received', 'Отримано'), cell: { kind: 'datetime', iso: report.at } },
  ] : null;
  // A report is awaited until two days after the business day, as the reconciliation reads it.
  const reportLate = Date.parse(c.now) > Date.parse(`${b.businessDate}T00:00:00.000Z`) + 3 * 86_400_000;
  const reportEmpty = reportLate
    ? t('No report has arrived, though two days have passed since the business day.', 'Звіт не надійшов, хоча від операційного дня минуло два дні.')
    : t('No report yet. A report is awaited for two days after the business day.', 'Звіту ще немає. Його очікують протягом двох днів після операційного дня.');
  const credit = b.credited;
  const creditFields: Field[] | null = credit ? [
    { label: t('Account', 'Рахунок'), cell: { kind: 'mono', value: credit.account }, wide: true },
    { label: t('Value date', 'Дата валютування'), cell: { kind: 'date', iso: businessDayIso(credit.valueDate) } },
    { label: t('Amount', 'Сума'), cell: { kind: 'money', minor: credit.amountMinor, currency: cur } },
    { label: t('Reference', 'Призначення'), cell: { kind: 'mono', value: credit.reference }, wide: true },
    { label: t('On the statement', 'У виписці'), cell: { kind: 'datetime', iso: credit.at } },
  ] : null;
  const creditEmpty = b.channel === 'loyalty'
    ? t('Bonus points move no money: nothing is credited for this batch.', 'Бонусні бали не рухають грошей: за цей пакет нічого не зараховується.')
    : !report || report.netMinor <= 0 ? t('Nothing to credit yet.', 'Поки нічого зараховувати.')
    : r.status === 'not_credited' || r.differences.some((d) => d.kind === 'credit')
      ? t(`Not on the bank statement two days after the value date. The report gives ${m(report.netMinor)} net, value date ${date(report.valueDate)}.`, `У виписці банку немає й через два дні після дати валютування. За звітом — ${m(report.netMinor)} нетто, дата валютування ${date(report.valueDate)}.`)
      : t(`Not on the statement yet. The report gives ${m(report.netMinor)} net, value date ${date(report.valueDate)}.`, `У виписці ще немає. За звітом — ${m(report.netMinor)} нетто, дата валютування ${date(report.valueDate)}.`);

  // The differences, each with what it compares.
  const compares = (d: BatchDifference): string => {
    if (d.kind === 'report') return t('the sales record; no report', 'дані продажів; звіту немає');
    if (d.kind === 'gross') return r.expected?.source === 'payments' ? t('the platform’s payments and the report', 'платежі платформи і звіт') : t('the sales record and the report', 'дані продажів і звіт');
    if (d.kind === 'fee') return t('the terms and the report', 'умови і звіт');
    return t('the report’s net and the bank’s credit', 'нетто звіту і зарахування банку');
  };
  const differenceColumns: Column<BatchDifference>[] = [
    { key: 'what', label: t('Difference', 'Розбіжність'), cell: (d) => ({ kind: 'text', value: pickText(differenceLabels[d.kind], locale), sub: compares(d) }) },
    { key: 'expected', label: t('Expected', 'Очікувано'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.expectedMinor, currency: cur }) },
    { key: 'actual', label: t('Actual', 'Фактично'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.actualMinor, currency: cur }) },
    { key: 'delta', label: t('Difference', 'Різниця'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.deltaMinor, currency: cur, signed: true }) },
  ];
  const agree = r.status === 'awaiting_credit'
    ? t('Nothing differs so far; the bank’s credit is still expected.', 'Поки нічого не відрізняється; зарахування банку ще очікується.')
    : t(`The three sides agree; a difference of up to ${m(tolerance)} is rounding.`, `Три сторони збігаються; різниця до ${m(tolerance)} — це округлення.`);

  // The provider's breakdown, beside what the terms give for each line.
  const lines: Line[] = (report?.lines ?? []).map((l) => { const fee = termsFeeOf(c.w, b, l); return { ...l, termsMinor: fee, deltaMinor: fee === null ? null : l.feeMinor - fee }; });
  const lineTolerance = (l: Line) => Math.max(100, l.count);
  const rate = (fee: number, gross: number) => (gross > 0 ? percent((fee * 10_000) / gross, locale, 2) : '—');
  const lineColumns: Column<Line>[] = [
    { key: 'issuer', label: t('Issuing bank', 'Банк-емітент'), cell: (l) => ({ kind: 'text', value: issuerOfLine(l, locale) }) },
    { key: 'scheme', label: t('Scheme', 'Платіжна система'), cell: (l) => (schemeOfLine(l) ? { kind: 'text', value: schemeOfLine(l) } : { kind: 'empty' }) },
    { key: 'product', label: t('Card', 'Картка'), cell: (l) => (isCardLine(l) ? { kind: 'text', value: t(...productWords[l.product]) } : { kind: 'empty' }) },
    { key: 'onus', label: 'On-us', cell: (l) => (l.onUs ? { kind: 'status', label: 'on-us', tone: 'success' } : { kind: 'empty' }) },
    { key: 'count', label: t('Payments', 'Платежі'), align: 'end', cell: (l) => ({ kind: 'count', n: l.count }) },
    { key: 'gross', label: t('Gross', 'Брутто'), align: 'end', cell: (l) => ({ kind: 'money', minor: l.grossMinor, currency: cur }) },
    { key: 'fee', label: t('Fee reported', 'Комісія за звітом'), align: 'end', cell: (l) => ({ kind: 'money', minor: l.feeMinor, currency: cur }) },
    { key: 'rate', label: t('Rate', 'Ставка'), align: 'end', cell: (l) => ({ kind: 'text', value: rate(l.feeMinor, l.grossMinor) }) },
    { key: 'terms', label: t('By the terms', 'За умовами'), align: 'end', cell: (l) => (l.termsMinor === null ? { kind: 'empty' } : { kind: 'money', minor: l.termsMinor, currency: cur }) },
    { key: 'delta', label: t('Difference', 'Різниця'), align: 'end', cell: (l) => (l.deltaMinor === null || Math.abs(l.deltaMinor) <= lineTolerance(l) ? { kind: 'empty' } : { kind: 'money', minor: l.deltaMinor, currency: cur, signed: true }) },
  ];
  const termsTotal = lines.every((l) => l.termsMinor !== null) ? lines.reduce((s, l) => s + (l.termsMinor ?? 0), 0) : null;
  const rates = terms ? [
    terms.model === 'blended' ? `${t('rate', 'ставка')} ${percent(terms.blendedBps ?? 0, locale, 2)}` : `${t('markup', 'націнка')} ${percent(terms.markupBps ?? 0, locale, 2)}`,
    terms.onUsBps !== null ? `on-us ${percent(terms.onUsBps, locale, 2)}` : null,
    terms.fixedMinor > 0 ? `${m(terms.fixedMinor)} ${t('a payment', 'за платіж')}` : null,
  ].filter(Boolean).join(' · ') : '';

  // The payments carried, for a batch of the platform's own payments.
  const paymentColumns: Column<Carried>[] = [
    { key: 'payment', label: t('Payment', 'Платіж'), cell: ({ p }) => ({ kind: 'mono', value: p.paymentId, href: c.may('flows.read', p.unitId) ? c.link(`/payments/${p.paymentId}`) : undefined }) },
    { key: 'unit', label: t('Channel', 'Канал'), cell: ({ p }) => ({ kind: 'unit', name: c.unitName(p.unitId) }) },
    { key: 'instrument', label: t('Instrument', 'Інструмент'), cell: ({ p }) => instrumentCell({ locale, now: c.now, unitName: c.unitName, link: c.link }, p.instrument, p.detail) },
    { key: 'captured', label: t('Captured', 'Списано'), cell: ({ p }) => ({ kind: 'datetime', iso: p.capturedAt }) },
    { key: 'gross', label: t('In the batch', 'У пакеті'), align: 'end', cell: (x) => ({ kind: 'money', minor: x.grossMinor, currency: cur }) },
    { key: 'fee', label: t('Provider’s fee', 'Комісія провайдера'), align: 'end', cell: (x) => ({ kind: 'money', minor: x.feeMinor, currency: cur, muted: x.feeMinor === 0 }) },
  ];

  const mayResolve = c.may('reconciliation.write', unitId) && r.differences.length > 0;
  const main = mainDifference(r);
  const insights = c.w.insights.filter((i) => findingConcerns(i, id)).sort((x, y) => Number(y.status === 'open') - Number(x.status === 'open') || y.at.localeCompare(x.at));
  const field = 'mt-1 block w-full border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const side = (title: string, note: string, fields: Field[] | null, empty: string, tone: 'plain' | 'attention' = 'plain') => (
    <Panel title={title} note={note || undefined} tone={tone}>
      {fields ? <FieldGrid locale={locale} columns={2} fields={fields} /> : <p className="text-[0.9rem] text-ink-500">{empty}</p>}
    </Panel>
  );
  return (
    <>
      <CabinetHead kicker={`${t('Settlement batch', 'Пакет розрахунку')} · ${c.unitName(unitId)}${region ? ` · ${c.unitName(region)}` : ''}`}
        title={<span className="break-all font-mono text-[1.15rem] sm:text-[1.4rem]">{id}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="text-ink-900">{provider}</span><span>{pickText(settlementChannelLabels[b.channel], locale)}</span><span className="tabular-nums">{date(b.businessDate)}</span><Status label={pickText(reconciliationStatusLabels[r.status], locale)} tone={statusTone[r.status]} /></span>}
        actions={<Link href={c.link('/settlements')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">← {t('All batches', 'Усі пакети')}</Link>} />
      <Flash query={query} locale={locale} />

      <div className="grid gap-6 lg:grid-cols-3">
        {side(salesSide.title, salesSide.note, salesSide.fields, salesSide.empty ?? '', r.status === 'not_reported' ? 'attention' : 'plain')}
        {side(isAcquirer(b.provider) ? t('Acquirer’s report', 'Звіт еквайра') : t('Provider’s report', 'Звіт провайдера'), provider, reportFields, reportEmpty, r.status === 'not_reported' || r.status === 'fee_difference' || r.status === 'gross_difference' ? 'attention' : 'plain')}
        {side(t('Bank credit', 'Зарахування на рахунок'), credit ? '' : t('The bank statement of the merchant’s account', 'Виписка банку за рахунком мерчанта'), creditFields, creditEmpty, r.status === 'not_credited' || r.status === 'short_credit' ? 'attention' : 'plain')}
      </div>

      <div className={`mt-6 grid gap-6 ${mayResolve || insights.length > 0 ? 'xl:grid-cols-[1.3fr_1fr]' : ''}`}>
        <div className="min-w-0 space-y-6">
          <Panel title={t('Differences', 'Розбіжності')} tone={open ? 'attention' : 'plain'} flush={r.differences.length > 0}
            note={r.differences.length > 0 ? t(`Where one side does not agree with another. A difference of up to ${m(tolerance)} is rounding and is not one.`, `У чому одна сторона не збігається з іншою. Різниця до ${m(tolerance)} — це округлення, а не розбіжність.`) : undefined}>
            {r.differences.length === 0 ? <p className="text-[0.9rem] text-ink-700">{agree}</p> : (
              <div className="px-1"><DataTable columns={differenceColumns} rows={r.differences} locale={locale} query={{}} pageSize={Math.max(1, r.differences.length)} /></div>
            )}
          </Panel>
          <Panel title={t('Decisions recorded', 'Записані рішення')}
            note={b.resolutions.length === 0 ? undefined : t('Once a person records a decision, the batch counts as resolved, whatever its differences.', 'Щойно людина записала рішення, пакет вважається вирішеним, хоч би які в нього були розбіжності.')}>
            {b.resolutions.length === 0 ? (
              <p className="text-[0.9rem] text-ink-500">{r.differences.length > 0 && !mayResolve ? t('No decision yet. A profile with the right to reconcile at this unit records it.', 'Рішення ще немає. Його записує профіль із правом звірки в цій одиниці.') : t('No decision recorded.', 'Рішень не записано.')}</p>
            ) : (
              <ul className="divide-y divide-graphite/15">
                {b.resolutions.map((x, i) => (
                  <li key={`${x.at}${i}`} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <Status label={pickText(resolutionLabels[x.resolution], locale)} tone={resolutionTone[x.resolution]} />
                      <span className="tabular-nums text-ink-900">{m(x.amountMinor)}</span>
                    </p>
                    {x.note ? <p className="mt-1 break-words text-[0.88rem] text-ink-700">{x.note}</p> : null}
                    <p className="annot mt-1 text-[0.58rem] text-ink-500">{c.personName(x.by)} · {when(x.at, locale)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        {mayResolve || insights.length > 0 ? (
          <div className="min-w-0 space-y-6">
            {mayResolve ? (
              <Panel title={t('Record a decision', 'Записати рішення')} note={t('The decision becomes a fact of the batch and a line of the audit trail.', 'Рішення стає фактом пакета й рядком журналу аудиту.')}>
                <form action={resolveSettlementAction} className="space-y-3">
                  <input type="hidden" name="batchId" value={id} /><input type="hidden" name="back" value={back} />
                  <label className="block text-[0.8rem] text-ink-700">{t('Decision', 'Рішення')}
                    <select name="resolution" required defaultValue="" className={field}>
                      <option value="" disabled>{t('Choose what was decided', 'Оберіть, що вирішено')}</option>
                      {resolutionKinds.map((k) => <option key={k} value={k}>{pickText(resolutionLabels[k], locale)}</option>)}
                    </select>
                  </label>
                  <label className="block text-[0.8rem] text-ink-700">{t(`Amount it concerns, ${cur}`, `Сума, якої воно стосується, ${cur}`)}
                    <input name="amount" inputMode="decimal" defaultValue={main ? (Math.abs(main.deltaMinor) / 100).toFixed(2) : '0.00'} className={`${field} font-mono sm:w-48`} />
                  </label>
                  <label className="block text-[0.8rem] text-ink-700">{t('Note', 'Примітка')}
                    <textarea name="note" rows={3} maxLength={400} placeholder={t('Whom you asked, what they answered, the claim’s number', 'Кого запитали, що відповіли, номер претензії')} className={field} />
                  </label>
                  <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Record the decision', 'Записати рішення')}</button>
                </form>
                <dl className="mt-4 space-y-1.5 border-t border-graphite/15 pt-3 text-[0.82rem]">
                  {([
                    ['accepted', 'The difference is explained and stands as it is.', 'Розбіжність пояснено, і вона лишається як є.'],
                    ['claim_raised', 'You asked the provider or the bank to return or correct the amount.', 'Ви попросили провайдера чи банк повернути або виправити суму.'],
                    ['written_off', 'The merchant bears the difference.', 'Розбіжність лягає на мерчанта.'],
                    ['corrected', 'The provider or the bank corrected it; the amount is what was corrected.', 'Провайдер чи банк її виправив; сума — те, що виправлено.'],
                  ] as const).map(([k, en, uk]) => (
                    <div key={k} className="grid gap-x-2 sm:grid-cols-[9.5rem_1fr]"><dt className="text-ink-900">{pickText(resolutionLabels[k], locale)}</dt><dd className="text-ink-500">{t(en, uk)}</dd></div>
                  ))}
                </dl>
              </Panel>
            ) : null}
            {insights.length > 0 ? (
              <Panel title={t('What the Reconciler found', 'Що знайшов Звіряльник')}>
                <div className="space-y-3">{insights.map((i) => <ReconcilerFinding key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} here={`/settlements/${id}`} />)}</div>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </div>

      {lines.length > 0 ? (
        <Panel title={t('The report, line by line', 'Звіт за рядками')} className="mt-6" flush
          note={`${t('The provider’s breakdown by issuing bank and card, beside the fee the merchant’s terms give for each line. On-us: the card was issued by the acquirer’s own bank, so no interchange (the fee between banks) passes to another bank. A difference within rounding — ₴1, or a kopeck a payment — is not shown.', 'Розбивка провайдера за банками-емітентами й картками, поруч із комісією, яку для кожного рядка дають умови мерчанта. On-us: картку випустив той самий банк, що її приймає, тож interchange (міжбанківська комісія) іншому банку не сплачується. Різниця в межах округлення — 1 ₴ або копійка на платіж — не показується.')}${terms ? ` ${t('Terms', 'Умови')}: ${pickText(terms.note, locale)}${rates ? ` (${rates})` : ''}.` : ` ${t('The merchant has no terms with this provider for this channel.', 'Мерчант не має умов із цим провайдером для цього каналу.')}`}`}
          actions={contract && c.may('contracts.read', contract.unitId) && c.visible.has(contract.unitId) ? <Link href={c.link(`/contracts/${contract.id}`)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('The agreement', 'Договір')} {contract.number} →</Link> : undefined}>
          <div className="px-1">
            <DataTable columns={lineColumns} rows={lines} locale={locale} query={{}} pageSize={Math.max(1, lines.length)}
              footer={(
                <span className="flex flex-wrap gap-x-5 gap-y-1 text-[0.82rem] tabular-nums text-ink-700">
                  <span>{t('Payments', 'Платежі')} {count(report?.count ?? 0, locale)}</span>
                  <span>{t('Gross', 'Брутто')} {m(report?.grossMinor ?? 0)}</span>
                  <span>{t('Fee reported', 'Комісія за звітом')} {m(report?.feeMinor ?? 0)} · {rate(report?.feeMinor ?? 0, report?.grossMinor ?? 0)}</span>
                  {termsTotal !== null ? <span>{t('By the terms', 'За умовами')} {m(termsTotal)}</span> : null}
                  {termsTotal !== null ? <span className={Math.abs((report?.feeMinor ?? 0) - termsTotal) > tolerance ? 'text-attention-500' : ''}>{t('Difference', 'Різниця')} {signed((report?.feeMinor ?? 0) - termsTotal)}</span> : null}
                </span>
              )} />
          </div>
        </Panel>
      ) : null}

      {carried.length > 0 ? (
        <Panel title={t('Payments in this batch', 'Платежі в цьому пакеті')} className="mt-6" flush
          note={t('The payments the platform carried whose money the provider settled in this batch: the merchant’s share and the provider’s fee, which it keeps. Refunds and lost disputes come off a later batch.', 'Платежі, які провела платформа і гроші за якими провайдер розрахував у цьому пакеті: частка мерчанта й комісія провайдера, яку він утримує. Повернення й програні спори віднімаються в одному з наступних пакетів.')}>
          <div className="px-1">
            <DataTable columns={paymentColumns} rows={carried} locale={locale} query={{}} pageSize={Math.max(1, carried.length)}
              footer={(
                <span className="flex flex-wrap gap-x-5 gap-y-1 text-[0.82rem] tabular-nums text-ink-700">
                  <span>{t('Payments', 'Платежі')} {count(carried.length, locale)}</span>
                  <span>{t('In the batch', 'У пакеті')} {m(carried.reduce((s, x) => s + x.grossMinor, 0))}</span>
                  <span>{t('Provider’s fee', 'Комісія провайдера')} {m(carried.reduce((s, x) => s + x.feeMinor, 0))}</span>
                </span>
              )} />
          </div>
        </Panel>
      ) : null}
    </>
  );
}

