import { pickText } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import type { AllocationRole, Currency } from '@river/psp-facts';
import { payoutsDue, type PaymentView } from '@river/psp-payment';
import { payoutBatches, type PayoutBatch } from '@river/psp-views';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { count, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const day = 86_400_000;
type Due = { recipientUnitId: string; currency: Currency; roles: Set<AllocationRole>; nowMinor: number; soonMinor: number; payments: Set<string> };

/**
 * The money leaving the river: payout batches — one recipient, one day, one currency — folded from the
 * payments within reach; what falls due in the next two days; the payouts a person holds; and the
 * reconciliation breaks, with what the Treasurer and the Reconciler made of them.
 */
export default async function Payouts({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'payouts.read');
  const { t } = c;
  const back = c.link(`/payouts${query.unit ? `?unit=${query.unit}` : ''}`);
  const now = Date.parse(c.now);
  const payments = scoped(c.w, c.visible).payments;
  const batches = payoutBatches(payments);
  const currencies = (['UAH', 'EUR', 'USD', 'PLN', 'GBP'] as Currency[]).filter((cur) => payments.some((p) => p.currency === cur));
  const main = currencies[0] ?? 'UAH';
  const others = currencies.slice(1);
  const paidSince = (days: number, cur: Currency) => batches.filter((b) => b.currency === cur && Date.parse(b.at) >= now - days * day).reduce((s, b) => s + b.amountMinor, 0);
  const rest = (sum: (cur: Currency) => number) => (others.length ? others.map((cur) => `+ ${money(sum(cur), cur, locale, true)}`).join(' ') : undefined);

  // What the next payout runs will carry: shares whose hold passes within 48 hours, of payments nobody holds.
  const horizon = new Date(now + 2 * day).toISOString();
  const held = new Set(c.w.heldPayouts);
  const lost = new Set(c.w.lostSettlement);
  const due = new Map<string, Due>();
  for (const p of payments) {
    if (held.has(p.paymentId) || lost.has(p.paymentId)) continue;
    for (const a of payoutsDue(p, horizon)) {
      const key = `${a.recipientUnitId}|${a.currency}`;
      const d = due.get(key) ?? { recipientUnitId: a.recipientUnitId, currency: a.currency, roles: new Set(), nowMinor: 0, soonMinor: 0, payments: new Set() };
      if (a.holdUntil && a.holdUntil > c.now) d.soonMinor += a.amountMinor; else d.nowMinor += a.amountMinor;
      d.roles.add(a.role);
      d.payments.add(p.paymentId);
      due.set(key, d);
    }
  }
  const dueRows = [...due.values()].sort((a, b) => a.currency.localeCompare(b.currency) || (b.nowMinor + b.soonMinor) - (a.nowMinor + a.soonMinor));
  const dueIn = (cur: Currency) => dueRows.filter((d) => d.currency === cur).reduce((s, d) => s + d.nowMinor + d.soonMinor, 0);
  const waiting = (p: PaymentView) => payoutsDue(p, c.now).reduce((s, a) => s + a.amountMinor, 0);
  const heldRows = payments.filter((p) => held.has(p.paymentId));
  const lostRows = payments.filter((p) => lost.has(p.paymentId));
  const roleLabels: Record<AllocationRole, string> = {
    merchant: t('merchant', 'мерчант'), seller: t('seller', 'продавець'), platform: t('platform', 'платформа'), psp_fee: t('PSP fee', 'комісія PSP'),
    charity: t('good cause', 'добра справа'), partner: t('partner', 'партнер'), reserve: t('reserve', 'резерв'),
  };

  const batchColumns: Column<PayoutBatch>[] = [
    { key: 'batch', label: t('Batch', 'Пакет'), cell: (b) => ({ kind: 'mono', value: b.batchId }), sort: (b) => b.batchId },
    { key: 'recipient', label: t('Recipient', 'Одержувач'), cell: (b) => ({ kind: 'unit', name: c.unitName(b.recipientUnitId), sub: b.batchId.endsWith('_r') ? t('reserve released', 'звільнений резерв') : undefined }), sort: (b) => c.unitName(b.recipientUnitId) },
    { key: 'currency', label: t('Currency', 'Валюта'), cell: (b) => ({ kind: 'mono', value: b.currency }), sort: (b) => b.currency },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: (b) => ({ kind: 'money', minor: b.amountMinor, currency: b.currency }), sort: (b) => b.amountMinor },
    { key: 'payments', label: t('Payments', 'Платежі'), align: 'end', cell: (b) => ({ kind: 'count', n: b.payments }), sort: (b) => b.payments },
    { key: 'at', label: t('Sent', 'Надіслано'), cell: (b) => ({ kind: 'datetime', iso: b.at }), sort: (b) => b.at },
  ];
  const rows = batches.filter((b) => (!query.currency || b.currency === query.currency) && matches(query.q, b.batchId, c.unitName(b.recipientUnitId), b.recipientUnitId));
  const page = sortAndPage(rows, batchColumns, query);

  const dueColumns: Column<Due>[] = [
    { key: 'recipient', label: t('Recipient', 'Одержувач'), cell: (d) => ({ kind: 'unit', name: c.unitName(d.recipientUnitId), sub: [...d.roles].map((r) => roleLabels[r]).join(' · ') }) },
    { key: 'currency', label: t('Currency', 'Валюта'), cell: (d) => ({ kind: 'mono', value: d.currency }) },
    { key: 'now', label: t('Due at the next run', 'У найближчий запуск'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.nowMinor, currency: d.currency, muted: d.nowMinor === 0 }) },
    { key: 'soon', label: t('Hold passes within 48 h', 'Утримання спливає за 48 год'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.soonMinor, currency: d.currency, muted: d.soonMinor === 0 }) },
    { key: 'total', label: t('Total', 'Разом'), align: 'end', cell: (d) => ({ kind: 'money', minor: d.nowMinor + d.soonMinor, currency: d.currency }) },
    { key: 'payments', label: t('Payments', 'Платежі'), align: 'end', cell: (d) => ({ kind: 'count', n: d.payments.size }) },
  ];
  const holdBy = (paymentId: string) => c.w.insights.find((i) => i.proposal?.kind === 'hold_payouts' && i.proposal.params.paymentId === paymentId && (i.status === 'applied' || i.status === 'auto_applied'));
  const heldColumns: Column<PaymentView>[] = [
    { key: 'payment', label: t('Payment', 'Платіж'), cell: (p) => ({ kind: 'mono', value: p.paymentId, href: c.link(`/payments/${p.paymentId}`) }) },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (p) => ({ kind: 'unit', name: c.unitName(p.unitId) }) },
    { key: 'captured', label: t('Captured', 'Списано'), align: 'end', cell: (p) => ({ kind: 'money', minor: p.capturedMinor, currency: p.currency }) },
    { key: 'paid', label: t('Paid out before the hold', 'Виплачено до утримання'), align: 'end', cell: (p) => ({ kind: 'money', minor: p.payouts.reduce((s, x) => s + x.amountMinor, 0), currency: p.currency, muted: true }) },
    { key: 'waiting', label: t('Shares waiting', 'Частки чекають'), align: 'end', cell: (p) => ({ kind: 'money', minor: waiting(p), currency: p.currency }) },
    { key: 'why', label: t('Held on', 'Утримано за'), cell: (p) => { const i = holdBy(p.paymentId); return i ? { kind: 'text', value: `${pickText(agentCatalogue.find((a) => a.id === i.agent)?.name, locale)}: ${pickText(i.title, locale)}`, sub: i.decidedBy ? `${t('accepted by', 'прийняв')} ${c.personName(i.decidedBy)}` : undefined } : { kind: 'text', value: t('a person’s decision', 'рішенням людини') }; } },
  ];
  const lostColumns: Column<PaymentView>[] = [
    { key: 'payment', label: t('Payment', 'Платіж'), cell: (p) => ({ kind: 'mono', value: p.paymentId, href: c.link(`/payments/${p.paymentId}`) }) },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (p) => ({ kind: 'unit', name: c.unitName(p.unitId) }) },
    { key: 'acquirer', label: t('Acquirer', 'Еквайр'), cell: (p) => ({ kind: 'mono', value: p.acquirer }) },
    { key: 'captured', label: t('Captured', 'Списано'), align: 'end', cell: (p) => ({ kind: 'money', minor: p.capturedMinor, currency: p.currency }) },
    { key: 'at', label: t('Captured at', 'Час списання'), cell: (p) => ({ kind: 'datetime', iso: p.capturedAt }) },
    { key: 'waiting', label: t('Shares waiting', 'Частки чекають'), align: 'end', cell: (p) => ({ kind: 'money', minor: waiting(p), currency: p.currency }) },
  ];
  const audience = new Set(['treasurer', 'reconciler']);
  const insights = c.w.insights.filter((i) => audience.has(i.agent) && c.visible.has(i.unitId))
    .sort((a, b) => Number(a.status !== 'open') - Number(b.status !== 'open') || b.at.localeCompare(a.at)).slice(0, 6);
  return (
    <>
      <CabinetHead kicker={t('After the mouth', 'Після гирла')} title={t('Payouts', 'Виплати')}
        lead={t('Each recipient’s share leaves the river once its hold has passed and the unit’s schedule allows — gathered into a batch per recipient, day and currency. The PSP’s fee is not paid out: it stays in its revenue account.', 'Частка кожного одержувача виходить із ріки, щойно мине її утримання і дозволить графік одиниці, — у пакеті на одержувача, день і валюту. Комісія PSP не виплачується: вона лишається на рахунку доходу.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric label={t('Paid out, 7 days', 'Виплачено, 7 днів')} value={money(paidSince(7, main), main, locale, true)} note={rest((cur) => paidSince(7, cur)) ?? t(`${count(batches.filter((b) => Date.parse(b.at) >= now - 7 * day).length, locale)} batches`, `пакетів: ${count(batches.filter((b) => Date.parse(b.at) >= now - 7 * day).length, locale)}`)} />
        <Metric label={t('Paid out, 30 days', 'Виплачено, 30 днів')} value={money(paidSince(30, main), main, locale, true)} note={rest((cur) => paidSince(30, cur)) ?? t(`${count(batches.filter((b) => Date.parse(b.at) >= now - 30 * day).length, locale)} batches`, `пакетів: ${count(batches.filter((b) => Date.parse(b.at) >= now - 30 * day).length, locale)}`)} />
        <Metric label={t('Due within 48 hours', 'До виплати за 48 годин')} value={money(dueIn(main), main, locale, true)} note={rest(dueIn) ?? t(`${dueRows.length} recipients`, `одержувачів: ${dueRows.length}`)} />
        <Metric label={t('On hold', 'Утримано')} value={count(heldRows.length, locale)} tone={heldRows.length ? 'warning' : 'success'} note={t('payments a person holds', 'платежі, які утримує людина')} />
        <Metric label={t('Reconciliation breaks', 'Розбіжності звірки')} value={count(lostRows.length, locale)} tone={lostRows.length ? 'danger' : 'success'} note={t('missing from a settlement file', 'немає у файлі розрахунків')} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={t('What falls due in the next 48 hours', 'Що підлягає виплаті в найближчі 48 годин')} flush
          note={t('Shares whose hold has passed or passes within two days, by recipient — without the payments on hold or missing from a settlement file.', 'Частки, утримання яких минуло або мине за два дні, за одержувачами — без утриманих платежів і тих, яких немає у файлі розрахунків.')}>
          <div className="px-1"><DataTable columns={dueColumns} rows={dueRows} locale={locale} query={{}} pageSize={Math.max(1, dueRows.length)} empty={t('Nothing falls due in the next two days.', 'У найближчі два дні нічого не підлягає виплаті.')} /></div>
        </Panel>
        <Panel title={t('What the Treasurer and the Reconciler saw', 'Що побачили Скарбник і Звіряльник')}>
          {insights.length === 0 ? <p className="text-ink-500">{t('Nothing to raise within your reach.', 'У ваших межах нічого нагального.')}</p> : (
            <div className="space-y-3">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
          )}
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t('Payouts on hold', 'Утримані виплати')} flush note={t('A person put these payments’ payouts on hold — usually on an agent’s proposal. The payout run passes them by until the hold is lifted.', 'Людина утримала виплати за цими платежами — зазвичай за пропозицією агента. Запуск виплат обминає їх, доки утримання не знімуть.')}>
          <div className="px-1"><DataTable columns={heldColumns} rows={heldRows} locale={locale} query={{}} pageSize={Math.max(1, heldRows.length)} empty={t('No payouts are held.', 'Утриманих виплат немає.')} /></div>
        </Panel>
        <Panel title={t('Reconciliation breaks', 'Розбіжності звірки')} tone={lostRows.length ? 'attention' : 'plain'} flush note={t('In this demo’s story the acquirer’s settlement file missed these payments: captured, but the money did not arrive, so their shares wait until the line is found.', 'За сюжетом демо цих платежів немає у файлі розрахунків еквайра: списані, але гроші не надійшли, тож їхні частки чекають, доки рядок не знайдеться.')}>
          <div className="px-1"><DataTable columns={lostColumns} rows={lostRows} locale={locale} query={{}} pageSize={Math.max(1, lostRows.length)} empty={t('Every capture is matched in a settlement file.', 'Кожне списання знайдено у файлі розрахунків.')} /></div>
        </Panel>
      </div>
      <Panel title={t('Payout batches', 'Пакети виплат')} className="mt-6" flush note={t('One recipient, one day, one currency: the shares many payments sent together. A batch ending in _r is a reserve released.', 'Один одержувач, один день, одна валюта: частки багатьох платежів, надіслані разом. Пакет із закінченням _r — звільнений резерв.')}>
        <div className="px-4 pt-3">
          <FilterBar locale={locale} query={query} groups={[
            { param: 'currency', label: t('Currency', 'Валюта'), options: currencies.map((cur) => ({ value: cur, label: cur, count: batches.filter((b) => b.currency === cur).length })) },
          ]} />
        </div>
        <div className="px-1"><DataTable columns={batchColumns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('No payouts in this scope yet.', 'У цих межах виплат ще не було.')} /></div>
      </Panel>
    </>
  );
}
