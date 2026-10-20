import { pickText } from '@river/i18n';
import { instrumentCatalogue } from '@river/psp-instruments';
import { sessionOutcomeLabels, sessionOutcomes } from '@river/psp-session';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { sessionColumns } from '@/lib/columns';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/** Every attempt to pay within reach: how far each went down the river and how it ended. */
export default async function Sessions({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'flows.read');
  const { t } = c;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const all = scoped(c.w, c.visible).sessions;
  const rows = all.filter((s) => (!query.outcome || s.outcome === query.outcome) && (!query.instrument || s.instrument === query.instrument)
    && matches(query.q, s.sessionId, s.invoiceId, s.orderId, s.paymentId, c.unitName(s.unitId), s.detail?.last4));
  const columns = sessionColumns(ctx);
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('The river', 'Ріка')} title={t('Payment sessions', 'Платіжні сесії')} lead={t('One attempt to pay is one session: its own stream of bridges from the source to the mouth.', 'Одна спроба оплати — одна сесія: власний потік мостів від витоку до гирла.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'outcome', label: t('Outcome', 'Результат'), options: sessionOutcomes.map((o) => ({ value: o, label: pickText(sessionOutcomeLabels[o], locale), count: all.filter((s) => s.outcome === o).length })).filter((o) => o.count > 0) },
        { param: 'instrument', label: t('Instrument', 'Інструмент'), options: instrumentCatalogue.map((i) => ({ value: i.id, label: pickText(i.label, locale), count: all.filter((s) => s.instrument === i.id).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(s) => c.link(`/sessions/${s.sessionId}`)} /></div></Panel>
    </>
  );
}
