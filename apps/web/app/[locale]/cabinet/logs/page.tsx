import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { apiLogColumns } from '@/components/cabinet/integration/columns';
import { DataTable } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const classOf = (status: number) => `${Math.floor(status / 100)}xx`;

/**
 * Every call to the API made with the keys of a reach, newest first. Bodies are not kept — a call is its
 * method, path, answer, time, key and idempotency key, and a summary of what it did or why it was refused.
 */
export default async function Logs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'logs.read');
  const { t } = c;
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const all = c.w.apiLog.filter((e) => c.visible.has(e.unitId)).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  const keyLabel = (id: string) => c.w.keys.find((k) => k.id === id)?.label;
  const rows = all.filter((e) => (!query.class || classOf(e.status) === query.class) && (!query.method || e.method === query.method)
    && matches(query.q, e.id, e.path, e.summary, e.idempotencyKey, e.keyId, keyLabel(e.keyId), c.unitName(e.unitId)));
  const columns = apiLogColumns(ctx, c.w.keys);
  const page = sortAndPage(rows, columns, query);
  const classes = [...new Set(all.map((e) => classOf(e.status)))].sort();
  const methods = (['GET', 'POST', 'PATCH', 'DELETE'] as const).filter((m) => all.some((e) => e.method === m));
  const classLabel: Record<string, string> = { '2xx': t('2xx · done', '2xx · виконано'), '4xx': t('4xx · refused', '4xx · відхилено'), '5xx': t('5xx · failed', '5xx · збій') };
  return (
    <>
      <CabinetHead kicker={t('Integration', 'Інтеграція')} title={t('API log', 'Журнал API')}
        lead={t('Every call made with the keys of your units. Bodies are not kept: a call is its path, its answer, its key and its idempotency key, and a summary — enough to find why something was refused.', 'Кожен виклик із ключами ваших одиниць. Тіла запитів не зберігаємо: виклик — це шлях, відповідь, ключ і ключ ідемпотентності та короткий підсумок — досить, щоб знайти, чому щось відхилено.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'class', label: t('Answer', 'Відповідь'), options: classes.map((x) => ({ value: x, label: classLabel[x] ?? x, count: all.filter((e) => classOf(e.status) === x).length })) },
        { param: 'method', label: t('Method', 'Метод'), options: methods.map((m) => ({ value: m, label: m, count: all.filter((e) => e.method === m).length })) },
      ]} />
      <Panel flush title={t('Calls, newest first', 'Виклики, найновіші вгорі')} note={t('The log keeps the last two days.', 'Журнал зберігає останні два дні.')}>
        <div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} empty={t('No calls in this scope.', 'У цих межах викликів немає.')} /></div>
      </Panel>
    </>
  );
}
