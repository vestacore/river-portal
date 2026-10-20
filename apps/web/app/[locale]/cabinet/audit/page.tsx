import { pickText } from '@river/i18n';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { auditColumns } from '@/components/cabinet/access/columns';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

// The families of actions, by the part of an action before its dot, in the order the filter offers them.
const families: Record<string, [string, string]> = {
  policy: ['Policies', 'Політики'], rule: ['Rules', 'Правила'], unit: ['Units', 'Одиниці'], grant: ['Grants', 'Доступи'], contract: ['Contracts', 'Договори'],
  payment: ['Payments', 'Платежі'], invoice: ['Invoices', 'Інвойси'], dispute: ['Disputes', 'Спори'], review: ['Held attempts', 'Затримані спроби'],
  alert: ['Alerts', 'Сповіщення'], onboarding: ['Onboarding', 'Онбординг'], insight: ['Insights', 'Висновки агентів'], proposal: ['Proposals', 'Пропозиції агентів'],
  key: ['API keys', 'API-ключі'], endpoint: ['Webhooks', 'Вебхуки'],
};
const order = Object.keys(families);
const rank = (family: string) => (order.includes(family) ? order.indexOf(family) : order.length);
const familyOf = (action: string) => action.split('.')[0] ?? action;

/**
 * The cabinets' own audit trail within reach, newest first: who did what to what, in which profile —
 * and what agents and the units' policies carried out on their own. Targets open their pages.
 */
export default async function Audit({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'audit.read');
  const { t } = c;
  const all = c.w.audit.filter((e) => c.visible.has(e.unitId)).sort((a, b) => b.at.localeCompare(a.at));
  const present = [...new Set(all.map((e) => familyOf(e.action)))].sort((a, b) => rank(a) - rank(b));
  const familyText = (f: string) => { const w = families[f]; return w ? t(w[0], w[1]) : f; };
  const rows = all.filter((e) => (!query.family || familyOf(e.action) === query.family)
    && matches(query.q, e.action, e.target, c.personName(e.personId), c.unitName(e.unitId), pickText(e.detail, locale)));
  const columns = auditColumns(c, locale);
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Access', 'Доступ')} title={t('Audit trail', 'Журнал аудиту')}
        lead={t('Everything a person did in a cabinet, in the profile they acted in — and what agents and the units’ policies carried out on their own.', 'Усе, що людина зробила в кабінеті, у профілі, в якому діяла, — і що агенти та політики одиниць виконали самі.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'family', label: t('What was done', 'Що зроблено'), options: present.map((f) => ({ value: f, label: familyText(f), count: all.filter((e) => familyOf(e.action) === f).length })) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('Nothing recorded matches.', 'Жодного запису не знайдено.')} /></div></Panel>
    </>
  );
}
