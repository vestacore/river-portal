import { pickText } from '@river/i18n';
import { invoiceDueMinor, invoiceStatusAt, invoiceStatusLabels, invoiceStatuses } from '@river/psp-invoice';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { invoiceColumns } from '@/lib/columns';
import { count, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/** Invoices within reach: the payable claims, what is still due, how many attempts, how many reminders. */
export default async function Invoices({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'flows.read');
  const { t } = c;
  const all = scoped(c.w, c.visible).invoices;
  const status = (i: (typeof all)[number]) => invoiceStatusAt(i, c.now);
  const rows = all.filter((i) => (!query.status || status(i) === query.status) && matches(query.q, i.invoiceId, i.number, i.orderId, c.unitName(i.unitId)));
  const columns = invoiceColumns({ locale, now: c.now, unitName: c.unitName, link: c.link });
  const page = sortAndPage(rows, columns, query);
  const open = all.filter((i) => ['issued', 'viewed', 'partially_paid', 'overdue'].includes(status(i)));
  const overdue = all.filter((i) => status(i) === 'overdue');
  const currency = all[0]?.currency ?? 'UAH';
  return (
    <>
      <CabinetHead kicker={t('Boundary: invoice', 'Межа: інвойс')} title={t('Invoices', 'Інвойси')} lead={t('A claim with a due date and a pay link. Attempts, receipts, reminders and refunds form it; overdue is read from the clock, never stored.', 'Вимога зі строком і платіжним посиланням. Її формують спроби, квитанції, нагадування й повернення; «прострочено» читається з годинника, а не зберігається.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label={t('Open', 'Відкриті')} value={count(open.length, locale)} note={money(open.filter((i) => i.currency === currency).reduce((s, i) => s + invoiceDueMinor(i), 0), currency, locale)} />
        <Metric label={t('Overdue', 'Прострочені')} value={count(overdue.length, locale)} tone={overdue.length ? 'danger' : undefined} note={money(overdue.filter((i) => i.currency === currency).reduce((s, i) => s + invoiceDueMinor(i), 0), currency, locale)} href="?status=overdue" />
        <Metric label={t('Reminders sent', 'Нагадувань надіслано')} value={count(all.reduce((s, i) => s + i.reminders.length, 0), locale)} note={t('by people and by policy', 'людьми та за політикою')} />
      </div>
      <FilterBar locale={locale} query={query} groups={[{ param: 'status', label: t('Status', 'Статус'), options: invoiceStatuses.map((s) => ({ value: s, label: pickText(invoiceStatusLabels[s], locale), count: all.filter((i) => status(i) === s).length })).filter((o) => o.count > 0) }]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(i) => c.link(`/invoices/${i.invoiceId}`)} /></div></Panel>
    </>
  );
}
