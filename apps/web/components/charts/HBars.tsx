/** Horizontal bars for a mix or a ranking: label, bar to scale, figure, and an optional note. */
export function HBars({ rows }: { rows: Array<{ label: string; value: number; display: string; note?: string; tone?: 'river' | 'sunrise' | 'teal' | 'ink' | 'attention' }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fill = { river: 'bg-river-600', sunrise: 'bg-sunrise-500', teal: 'bg-teal-500', ink: 'bg-ink-700', attention: 'bg-attention-500' };
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-3 text-[0.85rem]">
          <span className="truncate text-ink-700" title={r.label}>{r.label}</span>
          <span className="h-2.5 bg-graphite/10"><span className={`block h-full ${fill[r.tone ?? 'river']}`} style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} /></span>
          <span className="text-right tabular-nums text-ink-900">{r.display}{r.note ? <span className="annot ml-2 text-[0.6rem] text-ink-500">{r.note}</span> : null}</span>
        </li>
      ))}
    </ul>
  );
}
