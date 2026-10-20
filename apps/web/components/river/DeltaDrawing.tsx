/**
 * Fig. 2 — the delta of one payment: the captured amount enters as one river and leaves as streams,
 * one per share, each as wide as its part of the money. The widths are drawn to scale; the labels say
 * who receives what and why.
 */
export type DeltaStream = { label: string; role: string; amount: string; share: number; tone: 'seller' | 'platform' | 'charity' | 'fee' | 'merchant' | 'reserve' };

const colours: Record<DeltaStream['tone'], string> = {
  seller: 'var(--color-river-600)', merchant: 'var(--color-river-800)', platform: 'var(--color-ink-700)', charity: 'var(--color-sunrise-600)', fee: 'var(--color-teal-600)', reserve: 'var(--color-ink-300)',
};

export function DeltaDrawing({ total, streams, caption }: { total: [string, string]; streams: DeltaStream[]; caption?: string }) {
  const sum = streams.reduce((s, x) => s + x.share, 0) || 1;
  const height = 70 + streams.length * 62;
  const midY = height / 2;
  const full = 46;
  let offset = midY - full / 2;
  const rows = streams.map((stream, i) => {
    const width = Math.max(3, (stream.share / sum) * full);
    const startY = offset + width / 2;
    offset += (stream.share / sum) * full;
    const y = 40 + i * 62 + 18;
    return { stream, width, startY, y, d: `M250,${startY.toFixed(1)} L290,${startY.toFixed(1)} L${290 + Math.abs(y - startY)},${y} L560,${y}` };
  });
  return (
    <svg viewBox={`0 0 860 ${height}`} className="h-auto w-full" role="img" aria-label={caption ?? total[0]}>
      <defs>
        <pattern id="dd-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--color-paper)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.32" />
        </pattern>
      </defs>
      <g fill="none" strokeLinejoin="miter">
        {rows.map((r) => <path key={`h${r.stream.label}${r.y}`} d={r.d} stroke="url(#dd-hatch)" strokeWidth={r.width + 22} />)}
        <path d={`M20,${midY} L252,${midY}`} stroke="url(#dd-hatch)" strokeWidth={full + 30} />
        {rows.map((r) => <path key={`b${r.stream.label}${r.y}`} d={r.d} stroke="var(--color-graphite)" strokeWidth={r.width + 2.6} />)}
        <path d={`M20,${midY} L252,${midY}`} stroke="var(--color-graphite)" strokeWidth={full + 3} />
        {rows.map((r) => <path key={`w${r.stream.label}${r.y}`} d={r.d} stroke="var(--color-river-100)" strokeWidth={r.width} />)}
        <path d={`M20,${midY} L254,${midY}`} stroke="var(--color-river-100)" strokeWidth={full} />
        {rows.map((r) => <path key={`c${r.stream.label}${r.y}`} d={r.d} stroke={colours[r.stream.tone]} strokeWidth={Math.min(2.4, r.width)} />)}
      </g>
      <path d={`M14,${midY - 34} L14,${midY - 6} L8,${midY} L20,${midY + 6} L14,${midY + 12} L14,${midY + 34}`} fill="none" stroke="var(--color-graphite)" strokeWidth="1" />
      <text className="annot" x="34" y={midY - 40} style={{ fontSize: 12 }} fill="var(--color-ink-900)">{total[0]}</text>
      <text x="34" y={midY + 54} style={{ fontSize: 22, fontWeight: 600 }} fill="var(--color-ink-900)">{total[1]}</text>
      <path d={`M250,${midY - 40} L250,${midY + 40}`} stroke="var(--color-ink-900)" strokeWidth="2.4" />
      <path d={`M243,${midY - 40} L257,${midY - 40} M243,${midY + 40} L257,${midY + 40}`} stroke="var(--color-ink-900)" strokeWidth="2.4" />
      {rows.map((r) => (
        <g key={`t${r.stream.label}${r.y}`}>
          <rect x="566" y={r.y - 5} width="9" height="9" fill={colours[r.stream.tone]} transform={`rotate(45 570.5 ${r.y - 0.5})`} />
          <text x="588" y={r.y - 3} style={{ fontSize: 14, fontWeight: 600 }} fill="var(--color-ink-900)">{r.stream.label}</text>
          <text className="annot" x="588" y={r.y + 14} style={{ fontSize: 10.5 }} fill="var(--color-ink-500)">{r.stream.role}</text>
          <text x="852" y={r.y + 2} textAnchor="end" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }} fill="var(--color-ink-900)">{r.stream.amount}</text>
        </g>
      ))}
    </svg>
  );
}
