/**
 * Columns per day, each stacked by kind — sessions by how they ended, for instance — with a legend.
 * Hatching marks the kinds that are not (yet) money.
 */
export type Stack = { key: string; label: string; fill: string; hatch?: boolean };

export function StackedBars({ rows, stacks, height = 180, dayLabel, unit }: { rows: Array<{ day: string; values: Record<string, number> }>; stacks: Stack[]; height?: number; dayLabel: (day: string) => string; unit: string }) {
  const width = 720;
  const left = 40;
  const bottom = 26;
  const top = 8;
  const totals = rows.map((r) => stacks.reduce((s, k) => s + (r.values[k.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const slot = (width - left - 8) / Math.max(1, rows.length);
  const bar = Math.max(2, slot * 0.68);
  const every = Math.max(1, Math.ceil(rows.length / 7));
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={stacks.map((s) => s.label).join(', ')}>
        <defs>
          <pattern id="sb-hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><rect width="4" height="4" fill="var(--color-paper)" /><line x1="0" y1="0" x2="0" y2="4" stroke="var(--color-graphite)" strokeWidth="1" strokeOpacity="0.5" /></pattern>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={left} x2={width - 8} y1={top + (1 - f) * (height - top - bottom)} y2={top + (1 - f) * (height - top - bottom)} stroke="var(--color-blueline)" strokeOpacity="0.55" strokeWidth="0.8" />
            <text x={left - 6} y={top + (1 - f) * (height - top - bottom) + 3} textAnchor="end" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{Math.round(f * max)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          let acc = 0;
          return (
            <g key={r.day}>
              {stacks.map((k) => {
                const v = r.values[k.key] ?? 0;
                if (v === 0) return null;
                const h = (v / max) * (height - top - bottom);
                acc += h;
                return <rect key={k.key} x={left + i * slot + (slot - bar) / 2} y={height - bottom - acc} width={bar} height={h} fill={k.hatch ? 'url(#sb-hatch)' : k.fill} stroke={k.hatch ? k.fill : 'none'} strokeWidth="0.6"><title>{`${dayLabel(r.day)} · ${k.label}: ${v} ${unit}`}</title></rect>;
              })}
              {i % every === 0 ? <text x={left + i * slot + slot / 2} y={height - 8} textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{dayLabel(r.day)}</text> : null}
            </g>
          );
        })}
        <line x1={left} x2={width - 8} y1={height - bottom} y2={height - bottom} stroke="var(--color-graphite)" strokeWidth="1" />
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {stacks.map((k) => <li key={k.key} className="annot flex items-center gap-1.5 text-[0.6rem] text-ink-500"><span className="inline-block size-2.5" style={{ background: k.hatch ? 'repeating-linear-gradient(45deg, var(--color-graphite) 0 1px, transparent 1px 3px)' : k.fill }} />{k.label}</li>)}
      </ul>
    </div>
  );
}
