/**
 * The funnel drawn as the river it is: attempts enter at the source and the channel narrows at every
 * bridge by those that ended there. The width at each stage is to scale; the figure says how many crossed.
 */
export function RiverFunnel({ stages }: { stages: Array<{ label: string; reached: number }> }) {
  const width = 720;
  const height = 150;
  const max = Math.max(1, stages[0]?.reached ?? 1);
  const step = (width - 40) / Math.max(1, stages.length - 1);
  const mid = 66;
  const half = (n: number) => 4 + (n / max) * 40;
  const top = stages.map((s, i) => `${20 + i * step},${(mid - half(s.reached)).toFixed(1)}`).join(' L');
  const bottomPts = [...stages].reverse().map((s, j) => `${20 + (stages.length - 1 - j) * step},${(mid + half(s.reached)).toFixed(1)}`).join(' L');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={stages.map((s) => `${s.label} ${s.reached}`).join(', ')}>
      <defs><pattern id="rf-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--color-paper)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.35" /></pattern></defs>
      <path d={`M${top} L${bottomPts} Z`} fill="var(--color-river-100)" stroke="var(--color-graphite)" strokeWidth="1.2" strokeLinejoin="miter" />
      <path d={`M20,${mid} L${width - 20},${mid}`} stroke="var(--color-river-600)" strokeWidth="0.8" strokeDasharray="12 4 2 4" />
      {stages.map((s, i) => {
        const x = 20 + i * step;
        const h = half(s.reached);
        return (
          <g key={s.label}>
            <path d={`M${x - 3},${mid - h - 6} L${x - 3},${mid + h + 6} M${x + 3},${mid - h - 6} L${x + 3},${mid + h + 6}`} stroke="var(--color-ink-900)" strokeWidth="1.1" />
            <text x={x} y={mid - 52} textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-900)">{s.label}</text>
            <text x={x} y={mid + 62} textAnchor="middle" style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }} fill="var(--color-ink-700)">{s.reached}</text>
            <text x={x} y={mid + 76} textAnchor="middle" className="annot" style={{ fontSize: 8.5 }} fill="var(--color-ink-500)">{Math.round((s.reached / max) * 100)} %</text>
          </g>
        );
      })}
    </svg>
  );
}
