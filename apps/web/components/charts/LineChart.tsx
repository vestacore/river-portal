/**
 * A line over days on graph paper: one or two series, the first drawn with a filled band. Axis labels are
 * mono lettering; every point has a native tooltip with its day and value.
 */
export type Series = { label: string; points: Array<{ day: string; value: number }>; tone: 'river' | 'sunrise' | 'teal' | 'ink' };

const stroke: Record<Series['tone'], string> = { river: 'var(--color-river-700)', sunrise: 'var(--color-sunrise-600)', teal: 'var(--color-teal-600)', ink: 'var(--color-ink-700)' };

export function LineChart({ series, format, height = 200, dayLabel }: { series: Series[]; format: (v: number) => string; height?: number; dayLabel: (day: string) => string }) {
  const width = 720;
  const left = 64;
  const bottom = 26;
  const top = 12;
  const all = series.flatMap((s) => s.points.map((p) => p.value));
  const max = Math.max(1, ...all) * 1.08;
  const n = Math.max(1, (series[0]?.points.length ?? 1) - 1);
  const x = (i: number) => left + (i / n) * (width - left - 8);
  const y = (v: number) => top + (1 - v / max) * (height - top - bottom);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const days = series[0]?.points ?? [];
  const every = Math.max(1, Math.ceil(days.length / 7));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={series.map((s) => s.label).join(', ')}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={left} x2={width - 8} y1={y(v)} y2={y(v)} stroke="var(--color-blueline)" strokeOpacity="0.55" strokeWidth="0.8" />
          <text x={left - 8} y={y(v) + 3.5} textAnchor="end" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{format(v)}</text>
        </g>
      ))}
      {days.map((p, i) => (i % every === 0 ? <text key={p.day} x={x(i)} y={height - 8} textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-500)">{dayLabel(p.day)}</text> : null))}
      <line x1={left} x2={left} y1={top} y2={height - bottom} stroke="var(--color-graphite)" strokeWidth="1" />
      <line x1={left} x2={width - 8} y1={height - bottom} y2={height - bottom} stroke="var(--color-graphite)" strokeWidth="1" />
      {series.map((s, si) => {
        const path = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
        return (
          <g key={s.label}>
            {si === 0 ? <path d={`${path} L${x(s.points.length - 1)},${height - bottom} L${left},${height - bottom} Z`} fill="var(--color-river-100)" fillOpacity="0.7" /> : null}
            <path d={path} fill="none" stroke={stroke[s.tone]} strokeWidth={si === 0 ? 1.6 : 1.3} strokeDasharray={si === 0 ? undefined : '5 3'} />
            {s.points.map((p, i) => <circle key={p.day} cx={x(i)} cy={y(p.value)} r="2.2" fill="var(--color-paper)" stroke={stroke[s.tone]} strokeWidth="1"><title>{`${dayLabel(p.day)} · ${s.label}: ${format(p.value)}`}</title></circle>)}
          </g>
        );
      })}
    </svg>
  );
}
