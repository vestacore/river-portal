import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import type { PosOutlook } from '@river/psp-agents';
import type { cabinet } from '@/lib/cabinet';
import { day, money, percent } from '@/lib/format';
import { acquirerName } from '@/lib/routing/acquirerName';
import { countText } from '@/lib/routing/countText';
import { rateBps } from '@/lib/routing/rateBps';
import { RoutingPolicyForm } from './RoutingPolicyForm';

/**
 * The stores' terminals region by region: whose terminals stand at the tills, what the region's card
 * turnover cost there, how much of it is that bank's own cards, what the other banks' store terms would
 * have charged for the same cards, and what an on-us clause would save — with a form to change the
 * region's terminal bank for a person who may change routing there.
 */
export function PosTable({ rows, c, locale, back, options }: { rows: PosOutlook[]; c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; back: string; options: readonly string[] }) {
  const { t } = c;
  const editable = rows.some((r) => c.may('routing.write', r.regionId));
  const head = [t('Region', 'Регіон'), t('Terminal bank', 'Банк терміналів'), t('Card turnover', 'Картковий оборот'), t('Fee · effective rate', 'Комісія · ефективна ставка'), t('The bank’s own cards', 'Власні картки банку'), t('At the other banks', 'В інших банках'), t('With an on-us clause', 'З умовою on-us'), ...(editable ? [t('Change the bank', 'Змінити банк')] : [])];
  const field = 'border border-graphite/30 bg-paper px-2 py-1 text-[0.8rem]';
  const currency = c.w.units.find((u) => u.id === rows[0]?.regionId)?.currency ?? 'UAH';
  const volumeMinor = rows.reduce((s, r) => s + r.volumeMinor, 0);
  const feeMinor = rows.reduce((s, r) => s + r.feeMinor, 0);
  const volume = money(volumeMinor, currency, locale);
  const fees = money(feeMinor, currency, locale);
  const rate = percent(rateBps(feeMinor, volumeMinor), locale, 2);
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[0.86rem]">
        <thead><tr className="border-b border-ink-900/80">{head.map((h) => <th key={h} scope="col" className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => {
            const stores = c.w.units.filter((u) => u.parentId === r.regionId && u.kind === 'store').length;
            const setting = c.w.settings.find((s) => s.unitId === r.regionId && s.key === 'pos.acquirer');
            const others = r.alternatives.filter((a) => a.acquirer !== r.acquirer).sort((a, b) => a.feeMinor - b.feeMinor);
            return (
              <tr key={r.regionId} className="border-b border-graphite/15 align-top">
                <td className="px-3 py-2.5"><Link href={c.link(`/units/${r.regionId}`)} className="text-ink-900 underline decoration-graphite/30 underline-offset-2 hover:decoration-sunrise-500">{c.unitName(r.regionId)}</Link><span className="annot mt-0.5 block text-[0.58rem] text-ink-500">{countText(stores, locale, ['store', 'stores'], ['магазин', 'магазини', 'магазинів'])}</span></td>
                <td className="min-w-[11rem] px-3 py-2.5"><span className="text-ink-900">{pickText(r.acquirerName, locale)}</span><span className="block text-[0.78rem] text-ink-500">{pickText(r.bankName, locale)}</span>{setting ? <span className="annot mt-0.5 block text-[0.56rem] text-ink-500">{t('since', 'з')} {day(setting.setAt, locale)} · {c.personName(setting.setBy)}</span> : null}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-ink-900">{money(r.volumeMinor, currency, locale)}<span className="annot mt-0.5 block text-[0.56rem] text-ink-500">{countText(r.days, locale, ['day', 'days'], ['день', 'дні', 'днів'])}</span></td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-ink-900">{money(r.feeMinor, currency, locale)}<span className="mt-0.5 block text-[0.8rem] text-ink-500">{percent(rateBps(r.feeMinor, r.volumeMinor), locale, 2)}</span></td>
                <td className="px-3 py-2.5 tabular-nums text-ink-900">{percent(r.ownBankShareBps, locale)}<span className="annot mt-0.5 block text-[0.56rem] text-ink-500">{r.onUsClause ? t('priced on-us', 'за ставкою on-us') : t('priced as any card', 'як будь-яка картка')}</span></td>
                <td className="min-w-[14rem] px-3 py-2.5">
                  <ul className="space-y-1">
                    {others.map((a) => {
                      const d = a.feeMinor - r.feeMinor;
                      return (
                        <li key={a.acquirer} className="text-[0.8rem]">
                          <span className="text-ink-700">{acquirerName(a.acquirer, locale)}</span>
                          <span className="block whitespace-nowrap tabular-nums"><span className="text-ink-900">{money(a.feeMinor, currency, locale)}</span> <span className="text-ink-500">· {percent(rateBps(a.feeMinor, r.volumeMinor), locale, 2)}</span> <span className={d < 0 ? 'text-teal-600' : 'text-ink-500'}>{d < 0 ? '−' : '+'}{money(Math.abs(d), currency, locale)}</span></span>
                        </li>
                      );
                    })}
                  </ul>
                </td>
                <td className="px-3 py-2.5">
                  {r.onUsClause ? <span className="text-ink-500">{t('already in the terms', 'вже є в умовах')}</span> : r.ifOnUsClauseFeeMinor !== null ? (
                    <span className="whitespace-nowrap tabular-nums"><span className="text-ink-900">{money(r.ifOnUsClauseFeeMinor, currency, locale)}</span><span className="block text-[0.8rem] text-teal-600">−{money(r.feeMinor - r.ifOnUsClauseFeeMinor, currency, locale)}</span>{r.onUsRateBps !== null ? <span className="annot block text-[0.56rem] text-ink-500">{t('at the on-us rate of', 'за ставкою on-us')} {percent(r.onUsRateBps, locale, 2)}</span> : null}</span>
                  ) : <span className="text-ink-300">—</span>}
                </td>
                {editable ? (
                  <td className="px-3 py-2.5">
                    {c.may('routing.write', r.regionId) ? (
                      <RoutingPolicyForm unitId={r.regionId} policyKey="pos.acquirer" kind="enum" back={back} mode={setting?.mode ?? 'default'} submit={t('Set', 'Задати')} className="flex flex-wrap items-center gap-1.5">
                        <select name="value" defaultValue={r.acquirer} className={field} aria-label={t('Terminal bank', 'Банк терміналів')}>{options.map((o) => <option key={o} value={o}>{acquirerName(o, locale)}</option>)}</select>
                      </RoutingPolicyForm>
                    ) : <span className="text-ink-300">—</span>}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        {rows.length > 1 ? (
          <tfoot>
            <tr className="border-t border-ink-900/80">
              <td colSpan={head.length} className="px-3 py-2.5 text-[0.8rem] text-ink-500">
                {t(`Together: ${volume} by card, ${fees} in fees, an effective rate of ${rate}.`, `Разом: ${volume} карткою, ${fees} комісій, ефективна ставка ${rate}.`)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
