/** A small line of the last days, without axes: the shape of a figure, not its scale. */
export function Sparkline({ values, height = 28 }: { values: number[]; height?: number }) {
  const max = Math.max(1, ...values);
  const step = 100 / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(height - 2 - (v / max) * (height - 4)).toFixed(2)}`).join(' ');
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline points={`0,${height} ${points} 100,${height}`} fill="var(--color-river-100)" stroke="none" />
      <polyline points={points} fill="none" stroke="var(--color-river-700)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
