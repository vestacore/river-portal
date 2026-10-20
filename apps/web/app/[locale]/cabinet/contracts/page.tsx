import { pickText } from '@river/i18n';
import { contractStatusAt, contractStatusLabels, contractStatuses } from '@river/psp-contracts';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { contractColumns } from '@/components/cabinet/access/columns';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/**
 * The contracts of the units within reach: what each signed with River Pay, under which tariff, where it
 * stands today, and which ones end soon with nobody renewing them.
 */
export default async function Contracts({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'contracts.read');
  const { t } = c;
  const all = c.w.contracts.filter((ct) => c.visible.has(ct.unitId)).sort((a, b) => a.number.localeCompare(b.number));
  const tariffName = (id: string | null) => pickText(c.w.tariffs.find((x) => x.id === id)?.name, locale);
  const rows = all.filter((ct) => (!query.status || contractStatusAt(ct, c.now) === query.status) && matches(query.q, ct.number, ct.id, c.unitName(ct.unitId), tariffName(ct.tariffId)));
  const columns = contractColumns(c, locale);
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Contracts', 'Договори')} title={t('Contracts', 'Договори')}
        lead={t('What each unit has signed with River Pay, and the tariff it pays by: the fee of every payment comes from its merchant’s active contract.', 'Що кожна одиниця підписала з River Pay і за яким тарифом платить: комісія кожного платежу береться з чинного договору мерчанта.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status today', 'Статус на сьогодні'), options: contractStatuses.map((s) => ({ value: s, label: pickText(contractStatusLabels[s], locale), count: all.filter((ct) => contractStatusAt(ct, c.now) === s).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(ct) => c.link(`/contracts/${ct.id}`)} empty={t('No contract matches.', 'Жодного договору не знайдено.')} /></div></Panel>
    </>
  );
}
