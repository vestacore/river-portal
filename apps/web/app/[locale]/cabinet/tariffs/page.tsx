import Link from 'next/link';
import { pickText } from '@river/i18n';
import { contractStatusAt, contractStatusLabels } from '@river/psp-contracts';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { TariffSheet } from '@/components/cabinet/access/TariffSheet';
import { contractTone } from '@/components/cabinet/access/contracts';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

/**
 * Every tariff River Pay offers, read as a sheet — the rate of each instrument, the fixed part and the
 * minimum, the fees of refunds, disputes and payouts, the monthly fee — and the units within reach whose
 * contracts charge by it. Those in use come first.
 */
export default async function Tariffs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'contracts.read');
  const { t } = c;
  const contracts = c.w.contracts.filter((ct) => c.visible.has(ct.unitId));
  const tariffs = c.w.tariffs.map((tariff) => ({ tariff, users: contracts.filter((ct) => ct.tariffId === tariff.id) })).sort((a, b) => Number(b.users.length > 0) - Number(a.users.length > 0));
  return (
    <>
      <CabinetHead kicker={t('Contracts', 'Договори')} title={t('Tariffs', 'Тарифи')}
        lead={t('What River Pay charges is stated before anyone pays: a rate for each instrument, a fixed part and a minimum, and the fees of refunds, disputes and payouts. The fee of one payment is taken at its capture.', 'Що бере River Pay, сказано до того, як хтось платить: ставка за кожен інструмент, фіксована частина й мінімум, а також плата за повернення, спори й виплати. Комісію з платежу беруть під час списання.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-2">
        {tariffs.map(({ tariff, users }) => (
          <Panel key={tariff.id} id={tariff.id} title={`${pickText(tariff.name, locale)} · ${tariff.currency}`} note={<span className="font-mono text-[0.75rem]">{tariff.id}</span>} flush>
            <TariffSheet tariff={tariff} locale={locale} />
            <div className="border-t border-graphite/20 p-4">
              <p className="annot mb-2 text-[0.6rem] text-ink-500">{t('Charged by the contracts of', 'За ним працюють договори')}</p>
              {users.length === 0 ? <p className="text-[0.88rem] text-ink-500">{t('No contract within your reach uses it.', 'Жоден договір у ваших межах ним не користується.')}</p> : (
                <ul className="divide-y divide-graphite/15">
                  {users.map((ct) => {
                    const status = contractStatusAt(ct, c.now);
                    return (
                      <li key={ct.id} className="flex flex-wrap items-center justify-between gap-3 py-1.5 text-[0.88rem]">
                        <span><span className="text-ink-900">{c.unitName(ct.unitId)}</span><Link href={c.link(`/contracts/${ct.id}`)} className="ml-3 font-mono text-[0.78rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{ct.number}</Link></span>
                        <Status label={pickText(contractStatusLabels[status], locale)} tone={contractTone[status]} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
