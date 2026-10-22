import { pickText } from '@river/i18n';
import { orderStatusLabels, orderStatuses } from '@river/psp-order';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { orderColumns } from '@/lib/columns';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/** Orders within reach: what was bought, from whom, how its money was distributed and where its goods are. */
export default async function Orders({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'flows.read');
  const { t } = c;
  const all = scoped(c.w, c.visible).orders;
  const rows = all.filter((o) => (!query.status || o.status === query.status) && (!query.channel || o.channel === query.channel) && matches(query.q, o.orderId, o.reference, o.payerRef, c.unitName(o.unitId), ...o.lines.map((l) => pickText(l.title as never, locale))));
  const columns = orderColumns({ locale, now: c.now, unitName: c.unitName, link: c.link });
  const page = sortAndPage(rows, columns, query);
  const channels = [...new Set(all.map((o) => o.channel))];
  return (
    <>
      <CabinetHead kicker={t('Boundary: order', 'Межа: замовлення')} title={t('Orders', 'Замовлення')} lead={t('The order is its own boundary: lines, the distribution plan its unit gave it, picking and fulfilment — and its view formed from every event that names it.', 'Замовлення — окрема межа: позиції, план розподілу від одиниці, комплектація й виконання — і проєкція з кожної події, що його згадує.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status', 'Статус'), options: orderStatuses.map((s) => ({ value: s, label: pickText(orderStatusLabels[s], locale), count: all.filter((o) => o.status === s).length })).filter((o) => o.count > 0) },
        { param: 'channel', label: t('Channel', 'Канал'), options: channels.map((ch) => ({ value: ch, label: ch, count: all.filter((o) => o.channel === ch).length })) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(o) => c.link(`/orders/${o.orderId}`)} /></div></Panel>
    </>
  );
}
