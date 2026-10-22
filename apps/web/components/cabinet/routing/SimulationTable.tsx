import type { Locale } from '@river/i18n';
import { money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { pointsText } from '@/lib/routing/pointsText';
import { rateBps } from '@/lib/routing/rateBps';
import type { simulateVisible } from '@/lib/routing/simulateVisible';
import { strategyText } from '@/lib/routing/strategyText';

/**
 * The routing replay as a table: the attempts as they were routed, and each strategy on the same attempts
 * and quotes — what it would have cost, its effective rate and on-us share, the expected change in
 * approvals, and the difference against what was actually expected.
 */
export function SimulationTable({ sim, strategy, locale }: { sim: ReturnType<typeof simulateVisible>; strategy: string; locale: Locale }) {
  const t = lt(locale);
  const cheapest = Math.min(...sim.simulated.map((s) => s.feeMinor));
  const tag = (label: string, tone: string) => <span className={`annot ml-2 inline-block border px-1.5 py-0.5 text-[0.52rem] ${tone}`}>{label}</span>;
  const diff = (fee: number) => {
    const d = fee - sim.actualFeeMinor;
    if (d === 0) return <span className="text-ink-500">{t('the same', 'так само')}</span>;
    return <span className={`whitespace-nowrap tabular-nums ${d < 0 ? 'text-teal-600' : 'text-attention-500'}`}>{d < 0 ? '−' : '+'}{money(Math.abs(d), sim.currency, locale)}</span>;
  };
  const rows = [
    { key: 'actual', name: t('As routed', 'Як маршрутизовано'), sub: t('the decisions recorded at the time', 'рішення, записані тоді'), fee: sim.actualFeeMinor, onUs: sim.actualOnUsShareBps, approval: null as number | null, inForce: false, actual: true },
    ...sim.simulated.map((s) => ({ key: s.strategy, name: strategyText(s.strategy, locale).name, sub: '', fee: s.feeMinor, onUs: s.onUsShareBps, approval: s.approvalDeltaBps, inForce: s.strategy === strategy, actual: false })),
  ];
  const head = [t('Strategy', 'Стратегія'), t('Cost of the attempts', 'Вартість спроб'), t('Effective rate', 'Ефективна ставка'), t('On-us share', 'Частка on-us'), t('Approval rate, expected change', 'Рівень схвалення, очікувана зміна'), t('Against actual', 'Порівняно з фактом')];
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[0.88rem]">
        <thead><tr className="border-b border-ink-900/80">{head.map((h, i) => <th key={h} scope="col" className={`annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500 ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={`border-b border-graphite/15 ${r.actual ? 'bg-paper-deep' : ''}`}>
              <th scope="row" className="px-3 py-2.5 text-left font-normal">
                <span className="font-semibold text-ink-900">{r.name}</span>
                {r.inForce ? tag(t('in force', 'чинна'), 'border-ink-900 text-ink-900') : null}
                {!r.actual && r.fee === cheapest ? tag(t('lowest cost', 'найдешевша'), 'border-teal-600 text-teal-600') : null}
                {r.sub ? <span className="annot mt-0.5 block text-[0.58rem] text-ink-500">{r.sub}</span> : null}
              </th>
              <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-ink-900">{money(r.fee, sim.currency, locale)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">{percent(rateBps(r.fee, sim.volumeMinor), locale, 2)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">{percent(r.onUs, locale)}</td>
              <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${r.approval === null ? 'text-ink-300' : r.approval < 0 ? 'text-attention-500' : 'text-ink-900'}`}>{r.approval === null ? '—' : pointsText(r.approval, locale)}</td>
              <td className="px-3 py-2.5 text-right">{r.actual ? <span className="text-ink-300">—</span> : diff(r.fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
