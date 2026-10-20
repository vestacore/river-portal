import { pickText } from '@river/i18n';
import { alertKindLabels, alertKinds, alertStatusLabels, alertStatuses, riskReasonLabels, type AmlAlert } from '@river/psp-risk';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { alertTone, scoreTone } from '@/components/cabinet/compliance/tones';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

/**
 * Every monitoring alert within reach, newest first: what was seen, at which unit, how much and how
 * serious, and where its handling stands — new, investigating, escalated, reported to the regulator, closed.
 */
export default async function Alerts({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'aml.read');
  const { t } = c;
  const all = c.w.alerts.filter((a) => c.visible.has(a.unitId)).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const rows = all.filter((a) => (!query.status || a.status === query.status) && (!query.kind || a.kind === query.kind)
    && matches(query.q, a.id, a.sessionId, a.paymentId, c.unitName(a.unitId), a.assignee ? c.personName(a.assignee) : null));
  const columns: Column<AmlAlert>[] = [
    { key: 'id', label: t('Alert', 'Сповіщення'), cell: (a) => ({ kind: 'mono', value: a.id, href: c.link(`/alerts/${a.id}`) }), sort: (a) => a.id },
    { key: 'opened', label: t('Opened', 'Відкрито'), cell: (a) => ({ kind: 'datetime', iso: a.openedAt }), sort: (a) => a.openedAt },
    { key: 'kind', label: t('Kind', 'Вид'), cell: (a) => ({ kind: 'text', value: pickText(alertKindLabels[a.kind], locale) }), sort: (a) => alertKinds.indexOf(a.kind) },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (a) => ({ kind: 'unit', name: c.unitName(a.unitId) }), sort: (a) => c.unitName(a.unitId) },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: (a) => (a.amountMinor > 0 ? { kind: 'money', minor: a.amountMinor, currency: a.currency } : { kind: 'empty' }), sort: (a) => a.amountMinor },
    { key: 'score', label: t('Score', 'Бал'), align: 'end', cell: (a) => ({ kind: 'bar', share: a.score / 100, label: String(a.score), tone: scoreTone(a.score) }), sort: (a) => a.score },
    { key: 'reasons', label: t('Reasons', 'Причини'), cell: (a) => (a.reasons.length === 0 ? { kind: 'empty' } : { kind: 'tags', items: [...a.reasons.slice(0, 2).map((r) => ({ label: pickText(riskReasonLabels[r], locale) })), ...(a.reasons.length > 2 ? [{ label: `+${a.reasons.length - 2}` }] : [])] }) },
    { key: 'status', label: t('Status', 'Статус'), cell: (a) => ({ kind: 'status', label: pickText(alertStatusLabels[a.status], locale), tone: alertTone[a.status] }), sort: (a) => alertStatuses.indexOf(a.status) },
    { key: 'assignee', label: t('Assignee', 'Виконавець'), cell: (a) => (a.assignee ? { kind: 'text', value: c.personName(a.assignee) } : { kind: 'empty' }), sort: (a) => (a.assignee ? c.personName(a.assignee) : '') },
  ];
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Financial monitoring', 'Фінмоніторинг')} title={t('Alerts', 'Сповіщення')}
        lead={t('What the monitoring saw: threshold transactions, possible structuring, velocity, sanctions, geography. Each one is investigated, escalated, reported or closed — and every move is recorded.', 'Що помітив моніторинг: порогові операції, можливе дроблення, частота операцій, санкції, географія. Кожне сповіщення розслідують, ескалюють, повідомляють регулятору або закривають — і кожен крок записано.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status', 'Статус'), options: alertStatuses.map((s) => ({ value: s, label: pickText(alertStatusLabels[s], locale), count: all.filter((a) => a.status === s).length })).filter((o) => o.count > 0) },
        { param: 'kind', label: t('Kind', 'Вид'), options: alertKinds.map((k) => ({ value: k, label: pickText(alertKindLabels[k], locale), count: all.filter((a) => a.kind === k).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(a) => c.link(`/alerts/${a.id}`)} empty={t('No alert matches.', 'Жодного сповіщення не знайдено.')} /></div></Panel>
    </>
  );
}
