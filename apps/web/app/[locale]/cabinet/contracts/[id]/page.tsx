import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { contractKindLabels, contractStatusAt, contractStatusLabels, type ContractStatus } from '@river/psp-contracts';
import { unitKindLabels } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { TariffSheet } from '@/components/cabinet/access/TariffSheet';
import { validTo } from '@/components/cabinet/access/columns';
import { contractSteps, contractTone } from '@/components/cabinet/access/contracts';
import { NoteTimeline } from '@/components/cabinet/compliance/NoteTimeline';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { contractAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { day } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

/**
 * One contract: its terms and where it stands today, the tariff it charges by (with what one payment of
 * 1 000.00 costs), the signatories, the documents, its history — and the steps it may take next.
 */
export default async function ContractPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'contracts.read');
  const { t } = c;
  const ct = c.w.contracts.find((x) => x.id === id);
  if (!ct || !c.visible.has(ct.unitId)) notFound();
  const status = contractStatusAt(ct, c.now);
  const tariff = ct.tariffId ? c.w.tariffs.find((x) => x.id === ct.tariffId) : undefined;
  const unit = c.w.units.find((u) => u.id === ct.unitId);
  const back = c.link(`/contracts/${id}`);
  const steps = c.may('contracts.write', ct.unitId) ? contractSteps[ct.status] ?? [] : [];
  const stepLabel = (to: ContractStatus): string => {
    switch (to) {
      case 'sent': return t('Send for signature', 'Надіслати на підпис');
      case 'draft': return t('Back to draft', 'Повернути в чернетку');
      case 'signed': return t('Mark as signed', 'Позначити підписаним');
      case 'active': return ct.status === 'suspended' ? t('Resume', 'Відновити') : ct.status === 'expired' ? t('Renew', 'Поновити') : t('Activate', 'Активувати');
      case 'suspended': return t('Suspend', 'Призупинити');
      case 'terminated': return t('Terminate', 'Розірвати');
      default: return pickText(contractStatusLabels[to], locale);
    }
  };
  const stepClass = (to: ContractStatus) => (to === 'terminated' ? 'annot border border-attention-500 px-3 py-2 text-attention-500 hover:bg-attention-100'
    : to === 'suspended' || to === 'draft' ? 'annot border border-graphite/40 px-3 py-2 text-ink-700 hover:border-ink-900'
    : 'chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]');
  return (
    <>
      <CabinetHead kicker={`${t('Contract', 'Договір')} · ${c.unitName(ct.unitId)}`} title={<span className="font-mono text-[1.4rem]">{ct.number}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="text-ink-900">{pickText(contractKindLabels[ct.kind], locale)}</span><Status label={pickText(contractStatusLabels[status], locale)} tone={contractTone[status]} /><span className="font-mono text-[0.8rem] text-ink-500">{ct.id}</span></span>}
        actions={steps.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {steps.map((to) => (
              <form key={to} action={contractAction}>
                <input type="hidden" name="contractId" value={ct.id} /><input type="hidden" name="status" value={to} /><input type="hidden" name="back" value={back} />
                <button type="submit" className={stepClass(to)}>{stepLabel(to)}</button>
              </form>
            ))}
          </div>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t('The terms', 'Умови')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Unit', 'Одиниця'), cell: { kind: 'unit', name: c.unitName(ct.unitId), href: c.link(`/units/${ct.unitId}`), sub: unit ? pickText(unitKindLabels[unit.kind], locale) : undefined } },
            { label: t('Kind', 'Вид'), cell: { kind: 'text', value: pickText(contractKindLabels[ct.kind], locale) } },
            { label: t('Status today', 'Статус на сьогодні'), cell: { kind: 'status', label: pickText(contractStatusLabels[status], locale), tone: contractTone[status] } },
            ...(status !== ct.status ? [{ label: t('As recorded', 'Як записано'), cell: { kind: 'status' as const, label: pickText(contractStatusLabels[ct.status], locale), tone: contractTone[ct.status] } }] : []),
            { label: t('Tariff', 'Тариф'), cell: tariff ? { kind: 'link', label: pickText(tariff.name, locale), href: c.link(`/tariffs#${tariff.id}`), sub: tariff.currency } : { kind: 'text', value: t('none: this contract sets no fees', 'немає: цей договір не встановлює комісій') } },
            { label: t('Valid from', 'Діє з'), cell: { kind: 'date', iso: ct.validFrom } },
            { label: t('Valid to', 'Діє до'), cell: validTo(c, ct, locale) },
            { label: t('Renewal', 'Подовження'), cell: { kind: 'text', value: ct.renewal === 'auto' ? t('renews itself', 'подовжується сам') : t('by hand', 'вручну') } },
            { label: t('Signed', 'Підписано'), cell: { kind: 'date', iso: ct.signedAt } },
          ]} />
          {steps.length > 0 && status !== ct.status ? <p className="mt-4 border-t border-graphite/20 pt-3 text-[0.85rem] text-ink-500">{t('The steps offered follow the status as recorded; today’s status is read from the dates.', 'Доступні кроки залежать від записаного статусу; статус на сьогодні визначається за датами.')}</p> : null}
        </Panel>
        <div className="space-y-6">
          <Panel title={t('Signatories', 'Підписанти')}>
            <ul className="divide-y divide-graphite/15">
              {ct.signatories.map((s) => (
                <li key={`${s.name}${pickText(s.role, locale)}`} className="flex flex-wrap items-center justify-between gap-3 py-2 text-[0.88rem]">
                  <span><span className="font-semibold text-ink-900">{s.name}</span><span className="annot ml-2 text-[0.6rem] text-ink-500">{pickText(s.role, locale)}</span></span>
                  {s.signedAt ? <Status label={`${t('signed', 'підписано')} ${day(s.signedAt, locale)}`} tone="success" /> : <Status label={t('not yet signed', 'ще не підписано')} tone="neutral" />}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={t('Documents', 'Документи')}>
            <ul className="divide-y divide-graphite/15">
              {ct.documents.map((d) => (
                <li key={`${pickText(d.title, locale)}${d.version}`} className="flex flex-wrap items-center justify-between gap-3 py-2 text-[0.88rem]">
                  <span className="text-ink-900">{pickText(d.title, locale)}<span className="ml-2 font-mono text-[0.72rem] text-ink-500">v{d.version}</span></span>
                  <span className="tabular-nums text-ink-500">{day(d.at, locale)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      {tariff ? (
        <Panel title={`${t('Its tariff', 'Його тариф')}: ${pickText(tariff.name, locale)} · ${tariff.currency}`} className="mt-6" flush
          actions={<Link href={c.link(`/tariffs#${tariff.id}`)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All tariffs', 'Усі тарифи')} →</Link>}>
          <TariffSheet tariff={tariff} locale={locale} />
        </Panel>
      ) : null}
      <Panel title={t('History', 'Історія')} className="mt-6">
        <NoteTimeline locale={locale} entries={ct.history.map((h) => ({ at: h.at, by: c.personName(h.by), text: pickText(h.what, locale) }))} empty={t('Nothing recorded yet.', 'Ще нічого не записано.')} />
      </Panel>
    </>
  );
}
