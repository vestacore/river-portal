import type { KybCase } from '@river/psp-risk';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { kybRiskText, kybRiskTone, kybStageText, kybStatusText, kybStatusTone } from '@/components/cabinet/compliance/tones';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { day } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { matches, readQuery, sortAndPage } from '@/lib/table';

const statusOrder: KybCase['status'][] = ['open', 'more_info', 'approved', 'rejected'];
const riskOrder: KybCase['risk'][] = ['low', 'medium', 'high'];

/**
 * Onboarding of merchants within reach — know your business: the cases still being checked first, each
 * with its stage, its risk, the checks not yet passed and the documents still missing.
 */
export default async function Onboarding({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'aml.read');
  const { t } = c;
  const all = c.w.onboarding.filter((k) => c.visible.has(k.unitId))
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || b.openedAt.localeCompare(a.openedAt));
  const rows = all.filter((k) => (!query.status || k.status === query.status) && matches(query.q, k.id, c.unitName(k.unitId), c.w.profiles[k.unitId]?.registrationCode));
  const openChecks = (k: KybCase) => k.checks.filter((x) => x.result !== 'pass').length;
  const missing = (k: KybCase) => k.documents.filter((d) => d.status !== 'received').length;
  const columns: Column<KybCase>[] = [
    { key: 'case', label: t('Case', 'Справа'), cell: (k) => ({ kind: 'mono', value: k.id, href: c.link(`/onboarding/${k.id}`) }), sort: (k) => k.id },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: (k) => ({ kind: 'unit', name: c.unitName(k.unitId), sub: c.w.profiles[k.unitId]?.registrationCode }), sort: (k) => c.unitName(k.unitId) },
    { key: 'stage', label: t('Stage', 'Етап'), cell: (k) => ({ kind: 'text', value: t(kybStageText[k.stage][0], kybStageText[k.stage][1]) }), sort: (k) => k.stage },
    { key: 'status', label: t('Status', 'Статус'), cell: (k) => ({ kind: 'status', label: t(kybStatusText[k.status][0], kybStatusText[k.status][1]), tone: kybStatusTone[k.status] }), sort: (k) => statusOrder.indexOf(k.status) },
    { key: 'risk', label: t('Risk', 'Ризик'), cell: (k) => ({ kind: 'status', label: t(kybRiskText[k.risk][0], kybRiskText[k.risk][1]), tone: kybRiskTone[k.risk] }), sort: (k) => riskOrder.indexOf(k.risk) },
    { key: 'opened', label: t('Opened', 'Відкрито'), cell: (k) => ({ kind: 'date', iso: k.openedAt }), sort: (k) => k.openedAt },
    { key: 'checks', label: t('Checks open', 'Відкриті перевірки'), align: 'end', cell: (k) => ({ kind: 'text', value: `${openChecks(k)} / ${k.checks.length}`, sub: k.checks.some((x) => x.result === 'fail') ? t('a check failed', 'є непройдена') : undefined }), sort: (k) => openChecks(k) },
    { key: 'documents', label: t('Documents missing', 'Бракує документів'), align: 'end', cell: (k) => ({ kind: 'count', n: missing(k) }), sort: (k) => missing(k) },
    { key: 'decided', label: t('Decided', 'Рішення'), cell: (k) => (k.decidedBy && k.decidedAt ? { kind: 'text', value: c.personName(k.decidedBy), sub: day(k.decidedAt, locale) } : { kind: 'empty' }), sort: (k) => k.decidedAt ?? '' },
  ];
  const page = sortAndPage(rows, columns, query);
  return (
    <>
      <CabinetHead kicker={t('Financial monitoring', 'Фінмоніторинг')} title={t('Onboarding', 'Онбординг')}
        lead={t('Know your business: every merchant is checked before it trades — the registry, sanctions lists, politically exposed persons, beneficial owners, its website, its kind of business and its settlement account.', 'Перевірка бізнес-клієнта (KYB): кожного мерчанта перевіряють до початку роботи — реєстр, санкційні списки, політично значущі особи, кінцеві бенефіціари, вебсайт, вид діяльності й розрахунковий рахунок.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <FilterBar locale={locale} query={query} groups={[
        { param: 'status', label: t('Status', 'Статус'), options: statusOrder.map((s) => ({ value: s, label: t(kybStatusText[s][0], kybStatusText[s][1]), count: all.filter((k) => k.status === s).length })).filter((o) => o.count > 0) },
      ]} />
      <Panel flush><div className="px-1"><DataTable columns={columns} rows={page.rows} total={page.total} page={page.page} locale={locale} query={query} link={(k) => c.link(`/onboarding/${k.id}`)} empty={t('No onboarding case within reach.', 'У ваших межах немає справ онбордингу.')} /></div></Panel>
    </>
  );
}
