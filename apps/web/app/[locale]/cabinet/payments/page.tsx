import { pickText } from '@river/i18n';
import { instrumentCatalogue } from '@river/psp-instruments';
import { paymentStatusLabels, paymentStatuses } from '@river/psp-payment';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { paymentColumns } from '@/lib/columns';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/** Payments within reach: money secured by an attempt, and its life after the mouth. */
export default async function Payments({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'flows.read');
  const { t } = c;
  const all = scoped(c.w, c.visible).payments;
  const rows = all.filter((p) => (!query.status || p.status === query.status) && (!query.instrument || p.instrument === query.instrument) && matches(query.q, p.paymentId, p.sessionId, p.orderId, p.invoiceId, p.acquirer, c.unitName(p.unitId), p.detail.last4));
  const columns = paymentColumns({ locale, now: c.now, unitName: c.unitName, link: c.link });
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Boundary: payment', 'Межа: платіж')} title={t('Payments', 'Платежі')} lead={t('A payment is born at the event where its session secures the funds, becomes money at the capture, is distributed into its shares, and lives on in its own stream: refunds, disputes, settlement.', 'Платіж народжується в події, де сесія забезпечує кошти, стає грошима при списанні, розподіляється на частки й живе далі у власному потоці: повернення, спори, розрахунок.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status', 'Статус'), options: paymentStatuses.map((s) => ({ value: s, label: pickText(paymentStatusLabels[s], locale), count: all.filter((p) => p.status === s).length })).filter((o) => o.count > 0) },
        { param: 'instrument', label: t('Instrument', 'Інструмент'), options: instrumentCatalogue.map((i) => ({ value: i.id, label: pickText(i.label, locale), count: all.filter((p) => p.instrument === i.id).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(p) => c.link(`/payments/${p.paymentId}`)} /></div></Panel>
    </>
  );
}
