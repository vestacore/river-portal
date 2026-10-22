import type { ReactNode } from 'react';
import type { Locale } from '@river/i18n';
import { count, money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { rateBps } from '@/lib/routing/rateBps';

export type CostRow = { key: string; label: ReactNode; sub?: ReactNode; count: number; grossMinor: number; feeMinor: number; currency: string; extra?: ReactNode[] };

/**
 * Payments and what they cost, one line per group: how many, the amount, the fee and the fee divided by
 * the amount — the effective rate — with any further columns a page adds, and the total when every line
 * is in one currency.
 */
export function CostTable({ first, rows, locale, feeLabel, countLabel, grossLabel, extraHead = [], total = false, empty }: { first: string; rows: CostRow[]; locale: Locale; feeLabel: string; countLabel?: string; grossLabel?: string; extraHead?: string[]; total?: boolean; empty?: string }) {
  const t = lt(locale);
  const head = [first, countLabel ?? t('Payments', 'Платежі'), grossLabel ?? t('Captured', 'Списано'), feeLabel, t('Effective rate', 'Ефективна ставка'), ...extraHead];
  const currencies = new Set(rows.map((r) => r.currency));
  const sum = { count: rows.reduce((s, r) => s + r.count, 0), gross: rows.reduce((s, r) => s + r.grossMinor, 0), fee: rows.reduce((s, r) => s + r.feeMinor, 0) };
  const currency = rows[0]?.currency ?? 'UAH';
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[0.86rem]">
        <thead><tr className="border-b border-ink-900/80">{head.map((h, i) => <th key={h} scope="col" className={`annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500 ${i > 0 && i < 5 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={head.length} className="px-3 py-8 text-center text-ink-500">{empty ?? t('Nothing in this period.', 'За цей період нічого.')}</td></tr> : rows.map((r) => (
            <tr key={r.key} className="border-b border-graphite/15 align-top">
              <th scope="row" className="px-3 py-2 text-left font-normal text-ink-900">{r.label}{r.sub ? <span className="block text-[0.76rem] text-ink-500">{r.sub}</span> : null}</th>
              <td className="px-3 py-2 text-right tabular-nums text-ink-900">{count(r.count, locale)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-900">{money(r.grossMinor, r.currency, locale)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-900">{money(r.feeMinor, r.currency, locale)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-900">{percent(rateBps(r.feeMinor, r.grossMinor), locale, 2)}</td>
              {(r.extra ?? []).map((x, i) => <td key={i} className="px-3 py-2 text-ink-700">{x}</td>)}
            </tr>
          ))}
        </tbody>
        {total && rows.length > 1 && currencies.size === 1 ? (
          <tfoot>
            <tr className="border-t border-ink-900/80 font-semibold">
              <th scope="row" className="px-3 py-2 text-left text-ink-900">{t('Total', 'Разом')}</th>
              <td className="px-3 py-2 text-right tabular-nums text-ink-900">{count(sum.count, locale)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-900">{money(sum.gross, currency, locale)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink-900">{money(sum.fee, currency, locale)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-900">{percent(rateBps(sum.fee, sum.gross), locale, 2)}</td>
              {extraHead.map((h) => <td key={h} />)}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
