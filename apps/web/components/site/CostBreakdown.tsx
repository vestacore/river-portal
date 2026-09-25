import { formatMoney, type Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';

/** Honest numbers: every approved cost by kind, as proportional bars. */
export function CostBreakdown({ breakdown, locale, dict }: { breakdown: Partial<Record<string, number>>; locale: Locale; dict: Dictionary }) {
  const rows = Object.entries(breakdown).filter(([, v]) => (v ?? 0) > 0).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const max = Math.max(1, ...rows.map(([, v]) => v ?? 0));
  if (rows.length === 0) return <p className="text-ink-500">{dict.campaign.costsEmpty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map(([kind, minor]) => (
        <li key={kind}>
          <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink-900">{(dict.costKinds as Record<string, string>)[kind] ?? kind}</span><span className="tabular-nums text-ink-700">{formatMoney(minor ?? 0, 'GBP', locale)}</span></div>
          <div className="h-2 border-b border-graphite/25"><div className="h-2 bg-sunrise-500" style={{ width: `${((minor ?? 0) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
