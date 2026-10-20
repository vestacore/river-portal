import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { activeTariffOf, contractStatusAt, contractStatusLabels } from '@river/psp-contracts';
import { alertKindLabels, alertStatusLabels, kybCheckLabels, type KybCase } from '@river/psp-risk';
import { unitKindLabels } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { contractColumns } from '@/components/cabinet/access/columns';
import { contractTone } from '@/components/cabinet/access/contracts';
import { alertTone, checkResultText, checkResultTone, documentText, documentTone, kybRiskText, kybRiskTone, kybStageText, kybStatusText, kybStatusTone, kybUndecided } from '@/components/cabinet/compliance/tones';
import { DataTable, type Column } from '@/components/panels/DataTable';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { onboardingAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { day, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

type Check = KybCase['checks'][number];
type Owner = KybCase['owners'][number];
type Document = KybCase['documents'][number];

/**
 * One onboarding case — know your business: the unit's datasheet, every check with its result, the
 * beneficial owners, the documents, the unit's contracts — and the officer's decision: approve, ask for
 * more information, or reject.
 */
export default async function OnboardingCase({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'aml.read');
  const { t } = c;
  const k = c.w.onboarding.find((x) => x.id === id);
  if (!k || !c.visible.has(k.unitId)) notFound();
  const unit = c.w.units.find((u) => u.id === k.unitId);
  const profile = c.w.profiles[k.unitId];
  const contracts = c.w.contracts.filter((ct) => ct.unitId === k.unitId);
  const main = contracts.find((ct) => ct.tariffId !== null) ?? contracts[0];
  const tariff = activeTariffOf(c.w.contracts, c.w.tariffs, k.unitId, c.now);
  const alerts = c.w.alerts.filter((a) => a.unitId === k.unitId).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const back = c.link(`/onboarding/${id}`);
  const failed = k.checks.some((x) => x.result === 'fail');
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
  const checkColumns: Column<Check>[] = [
    { key: 'check', label: t('Check', 'Перевірка'), cell: (x) => ({ kind: 'text', value: pickText(kybCheckLabels[x.check], locale) }) },
    { key: 'result', label: t('Result', 'Результат'), cell: (x) => ({ kind: 'status', label: t(checkResultText[x.result][0], checkResultText[x.result][1]), tone: checkResultTone[x.result] }) },
    { key: 'note', label: t('Note', 'Примітка'), cell: (x) => ({ kind: 'text', value: pickText(x.note, locale) }) },
  ];
  const ownerColumns: Column<Owner>[] = [
    { key: 'owner', label: t('Owner', 'Власник'), cell: (o) => ({ kind: 'text', value: o.initials }) },
    { key: 'share', label: t('Share', 'Частка'), align: 'end', cell: (o) => ({ kind: 'text', value: percent(o.sharePct * 100, locale, 0) }) },
    { key: 'pep', label: t('Politically exposed', 'Політично значуща особа'), cell: (o) => (o.pep ? { kind: 'status', label: t('yes', 'так'), tone: 'warning' } : { kind: 'status', label: t('no', 'ні'), tone: 'neutral' }) },
    { key: 'country', label: t('Country', 'Країна'), cell: (o) => ({ kind: 'mono', value: o.country }) },
  ];
  const documentColumns: Column<Document>[] = [
    { key: 'title', label: t('Document', 'Документ'), cell: (d) => ({ kind: 'text', value: pickText(d.title, locale) }) },
    { key: 'status', label: t('Status', 'Статус'), cell: (d) => ({ kind: 'status', label: t(documentText[d.status][0], documentText[d.status][1]), tone: documentTone[d.status] }) },
  ];
  const contractCols = contractColumns(c, locale).filter((col) => ['number', 'kind', 'status', 'tariff', 'validFrom', 'validTo'].includes(col.key));
  return (
    <>
      <CabinetHead kicker={`${t('Onboarding', 'Онбординг')}${unit ? ` · ${pickText(unitKindLabels[unit.kind], locale)}` : ''}`} title={c.unitName(k.unitId)}
        lead={(
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Status label={t(kybStatusText[k.status][0], kybStatusText[k.status][1])} tone={kybStatusTone[k.status]} />
            <Status label={t(kybRiskText[k.risk][0], kybRiskText[k.risk][1])} tone={kybRiskTone[k.risk]} />
            <span className="text-ink-700">{t(kybStageText[k.stage][0], kybStageText[k.stage][1])}</span>
            <span className="font-mono text-[0.8rem] text-ink-500">{k.id}</span>
            {k.decidedBy && k.decidedAt ? <span className="text-[0.85rem] text-ink-500">{t('Decided', 'Рішення')} · {c.personName(k.decidedBy)} · {day(k.decidedAt, locale)}</span> : null}
          </span>
        )}
        actions={kybUndecided(k) && c.may('aml.review', k.unitId) ? (
          <div className="flex flex-wrap gap-2">
            <form action={onboardingAction}>{hidden('caseId', k.id)}{hidden('decision', 'approved')}{hidden('back', back)}<button type="submit" disabled={failed} className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)] disabled:opacity-40">{t('Approve', 'Схвалити')}</button></form>
            <form action={onboardingAction}>{hidden('caseId', k.id)}{hidden('decision', 'more_info')}{hidden('back', back)}<button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-700 hover:border-ink-900">{t('Ask for more information', 'Запитати додаткову інформацію')}</button></form>
            <form action={onboardingAction}>{hidden('caseId', k.id)}{hidden('decision', 'rejected')}{hidden('back', back)}<button type="submit" className="annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100">{t('Reject', 'Відхилити')}</button></form>
          </div>
        ) : undefined}>
        <p className="mt-4 flex max-w-4xl flex-wrap items-center gap-x-2 gap-y-1 text-[0.88rem] text-ink-700">
          <span>{t('Approval makes the merchant able to trade only once its contract is active.', 'Схвалення дає мерчанту змогу приймати платежі лише тоді, коли його договір набуде чинності.')}</span>
          {tariff ? <span>{t(`Its contract is active, on the tariff “${pickText(tariff.name, locale)}”.`, `Його договір чинний, тариф «${pickText(tariff.name, locale)}».`)}</span>
            : main ? <span className="inline-flex flex-wrap items-center gap-x-2">{t('Its contract now:', 'Договір зараз:')} <span className="font-mono text-[0.8rem]">{main.number}</span><Status label={pickText(contractStatusLabels[contractStatusAt(main, c.now)], locale)} tone={contractTone[contractStatusAt(main, c.now)]} /></span>
            : <span>{t('It has no contract yet.', 'Договору ще немає.')}</span>}
          {failed ? <span className="text-attention-500">{t('A check has failed: the case cannot be approved.', 'Одна з перевірок не пройдена: справу не можна схвалити.')}</span> : null}
        </p>
      </CabinetHead>
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Panel title={t('The unit’s datasheet', 'Відомості про одиницю')}>
          {profile ? (
            <FieldGrid locale={locale} columns={2} fields={[
              { label: t('Legal name', 'Повна назва'), cell: { kind: 'text', value: pickText(profile.legalName, locale) }, wide: true },
              { label: t('Registration code', 'Реєстраційний код'), cell: { kind: 'mono', value: profile.registrationCode } },
              { label: t('Registered', 'Зареєстровано'), cell: { kind: 'date', iso: profile.registeredAt } },
              { label: t('Legal address', 'Юридична адреса'), cell: { kind: 'text', value: pickText(profile.legalAddress, locale) }, wide: true },
              { label: t('Website', 'Вебсайт'), cell: profile.website ? { kind: 'mono', value: profile.website } : { kind: 'empty' } },
              { label: t('Kind of business', 'Вид діяльності'), cell: unit ? { kind: 'text', value: pickText(unitKindLabels[unit.kind], locale), sub: `${unit.country}${unit.mcc ? ` · MCC ${unit.mcc}` : ''}` } : { kind: 'empty' } },
              { label: t('Settlement account (IBAN)', 'Розрахунковий рахунок (IBAN)'), cell: profile.iban ? { kind: 'mono', value: profile.iban } : { kind: 'empty' } },
              { label: t('Bank', 'Банк'), cell: profile.bank ? { kind: 'text', value: profile.bank } : { kind: 'empty' } },
              { label: t('Contact', 'Контактна особа'), cell: { kind: 'text', value: profile.contact.initials, sub: pickText(profile.contact.role, locale) } },
              { label: t('Case opened', 'Справу відкрито'), cell: { kind: 'date', iso: k.openedAt } },
            ]} />
          ) : <p className="text-ink-500">{t('No datasheet has been filed for this unit.', 'Відомостей про цю одиницю не подано.')}</p>}
        </Panel>
        <Panel title={t('Checks', 'Перевірки')} note={t(`${k.checks.filter((x) => x.result === 'pass').length} of ${k.checks.length} passed.`, `Пройдено ${k.checks.filter((x) => x.result === 'pass').length} з ${k.checks.length}.`)} flush>
          <div className="px-1"><DataTable columns={checkColumns} rows={k.checks} locale={locale} query={{}} /></div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t('Beneficial owners', 'Кінцеві бенефіціари')} flush>
          <div className="px-1"><DataTable columns={ownerColumns} rows={k.owners} locale={locale} query={{}} empty={t('No owners declared.', 'Власників не задекларовано.')} /></div>
        </Panel>
        <Panel title={t('Documents', 'Документи')} flush>
          <div className="px-1"><DataTable columns={documentColumns} rows={k.documents} locale={locale} query={{}} empty={t('No documents asked for.', 'Документів не запитано.')} /></div>
        </Panel>
      </div>
      <Panel title={t('The unit’s contracts', 'Договори одиниці')} className="mt-6" flush>
        <div className="px-1"><DataTable columns={contractCols} rows={contracts} locale={locale} query={{}} empty={t('No contract yet.', 'Договору ще немає.')} /></div>
      </Panel>
      {alerts.length > 0 ? (
        <Panel title={t('Alerts about this unit', 'Сповіщення щодо цієї одиниці')} className="mt-6">
          <ul className="divide-y divide-graphite/15">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-[0.88rem]">
                <span><Link href={c.link(`/alerts/${a.id}`)} className="font-mono text-[0.8rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{a.id}</Link><span className="ml-3 text-ink-900">{pickText(alertKindLabels[a.kind], locale)}</span><span className="annot ml-3 text-[0.58rem] text-ink-500">{day(a.openedAt, locale)}</span></span>
                <Status label={pickText(alertStatusLabels[a.status], locale)} tone={alertTone[a.status]} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
