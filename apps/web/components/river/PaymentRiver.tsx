/**
 * Fig. 1 — one attempt to pay, drawn as a river. It runs from the source (an unpaid invoice in front of a
 * payer) to the mouth (paid), under seven bridges: each is an event where information forms the views of
 * the order, the invoice, the payment and the ledger (the squares under it). At the mouth the river opens
 * into a delta: the streams of the split. The figures are live: how many attempts crossed each bridge in
 * the last thirty days, and how the captured money divided.
 */
export type RiverStage = { label: string; forms: string; count?: string };
export type RiverStream = { label: string; share: number; amount?: string; tone: 'seller' | 'platform' | 'charity' | 'fee' | 'merchant' };

const tones: Record<RiverStream['tone'], string> = {
  seller: 'var(--color-river-600)', merchant: 'var(--color-river-700)', platform: 'var(--color-ink-700)', charity: 'var(--color-sunrise-600)', fee: 'var(--color-teal-600)',
};

// The centreline of the river: straight reaches joined by 45° bends, like a drafted channel.
const main = 'M0,250 L170,250 L220,200 L590,200 L630,240 L860,240';
const bridgesAt: Array<[number, number]> = [[92, 250], [272, 200], [367, 200], [462, 200], [557, 200], [688, 240], [790, 240]];

function Channel({ d, width, still = false }: { d: string; width: number; still?: boolean }) {
  return (
    <g fill="none" strokeLinejoin="miter" strokeMiterlimit={4}>
      <path d={d} stroke="url(#pr-hatch)" strokeWidth={width + 34} className={still ? '' : 'animate-rise'} />
      <path d={d} stroke="var(--color-graphite)" strokeWidth={width + 3} />
      <path d={d} stroke="var(--color-river-100)" strokeWidth={width} />
    </g>
  );
}

export function PaymentRiver({ stages, streams, source, mouth, legend }: {
  stages: RiverStage[]; streams: RiverStream[]; source: [string, string]; mouth: [string, string]; legend: { session: string; order: string; invoice: string; payment: string; ledger: string; crossed: string };
}) {
  const total = streams.reduce((s, x) => s + x.share, 0) || 1;
  const ys = streams.map((_, i) => 96 + i * (300 / Math.max(1, streams.length - 1)));
  const deltas = streams.map((stream, i) => {
    const y = ys[i]!;
    const rise = y - 240;
    return { stream, y, width: Math.max(5, (stream.share / total) * 44), d: `M860,240 L890,240 L${890 + Math.abs(rise)},${y} L1070,${y}` };
  });
  const motion = `${main} L890,240 L${890 + Math.abs((ys[0] ?? 240) - 240)},${ys[0] ?? 240} L1070,${ys[0] ?? 240}`;
  const letters: Array<[Exclude<keyof typeof legend, 'crossed'>, string]> = [['session', 'S'], ['order', 'O'], ['invoice', 'I'], ['payment', 'P'], ['ledger', 'L']];
  return (
    <svg viewBox="-20 40 1260 400" className="h-auto w-full" role="img" aria-label={`${source[0]} → ${mouth[0]}`}>
      <defs>
        <pattern id="pr-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--color-paper)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.35" />
        </pattern>
      </defs>

      {deltas.map((x) => <Channel key={x.stream.label} d={x.d} width={x.width} />)}
      <Channel d={main} width={44} />
      {deltas.map((x) => <path key={`c${x.stream.label}`} d={x.d} fill="none" stroke={tones[x.stream.tone]} strokeWidth={1} strokeDasharray="10 4 2 4" />)}
      <path d={main} fill="none" stroke="var(--color-river-600)" strokeWidth={1} strokeDasharray="14 4 2 4" />

      {/* The source: a break line where the drawing begins, and what is there */}
      <path d="M-6,214 L-6,244 L-12,250 L0,256 L-6,262 L-6,288" fill="none" stroke="var(--color-graphite)" strokeWidth="1" />
      <text className="annot" x="-4" y="342" style={{ fontSize: 12 }}><tspan fill="var(--color-ink-900)">{source[0]}</tspan><tspan x="-4" dy="15" fill="var(--color-ink-500)">{source[1]}</tspan></text>

      {/* Bridges: an event on the way, where the views form */}
      {bridgesAt.map(([x, y], i) => {
        const stage = stages[i];
        if (!stage) return null;
        const above = y - 44;
        return (
          <g key={x}>
            <path d={`M${x - 5},${y - 32} L${x - 5},${y + 32} M${x + 5},${y - 32} L${x + 5},${y + 32}`} stroke="var(--color-ink-900)" strokeWidth="1.6" />
            <path d={`M${x - 11},${y - 32} L${x + 11},${y - 32} M${x - 11},${y + 32} L${x + 11},${y + 32}`} stroke="var(--color-ink-900)" strokeWidth="2.6" />
            <rect x={x - 5} y={y - 30} width="10" height="60" fill="var(--color-paper)" fillOpacity="0.55" />
            <text className="annot" x={x} y={above - 18} textAnchor="middle" style={{ fontSize: 11 }} fill="var(--color-sunrise-600)">{String(i + 2).padStart(2, '0')}</text>
            <text className="annot" x={x} y={above - 4} textAnchor="middle" style={{ fontSize: 11 }} fill="var(--color-ink-900)">{stage.label}</text>
            {letters.map(([key, letter], j) => {
              const on = stage.forms.includes(letter);
              return (
                <g key={key}>
                  <rect x={x - 27 + j * 11} y={y + 40} width="9" height="9" fill={on ? 'var(--color-ink-900)' : 'var(--color-paper)'} stroke="var(--color-graphite)" strokeWidth="0.8" />
                  <text x={x - 22.5 + j * 11} y={y + 47.4} textAnchor="middle" style={{ fontSize: 6.5, fontFamily: 'var(--font-mono)' }} fill={on ? 'var(--color-paper)' : 'var(--color-ink-300)'}>{letter}</text>
                </g>
              );
            })}
            {stage.count ? <text className="annot" x={x} y={y + 66} textAnchor="middle" style={{ fontSize: 10.5 }} fill="var(--color-ink-500)">{stage.count}</text> : null}
          </g>
        );
      })}

      {/* The mouth and the delta: the streams of the split */}
      <path d="M860,198 L860,282" stroke="var(--color-graphite)" strokeWidth="0.8" strokeDasharray="3 3" />
      <text className="annot" x="864" y="186" style={{ fontSize: 12 }}><tspan fill="var(--color-teal-600)">{mouth[0]}</tspan></text>
      <text className="annot" x="864" y="300" style={{ fontSize: 10.5 }} fill="var(--color-ink-500)">{mouth[1]}</text>
      {deltas.map((x) => (
        <text key={`l${x.stream.label}`} className="annot" x="1078" y={x.y + 4} style={{ fontSize: 11 }}>
          <tspan fill="var(--color-ink-900)">{x.stream.label}</tspan>
          {x.stream.amount ? <tspan x="1078" dy="14" fill="var(--color-ink-500)">{x.stream.amount}</tspan> : null}
        </text>
      ))}

      {/* A payment on its way down the river and into one stream (still when motion is reduced) */}
      <g className="motion-only">
        <polygon points="-10,-6 6,-6 10,-2 10,6 -6,6 -10,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8">
          <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path={motion} />
        </polygon>
      </g>
      <polygon className="still-only" points="-10,-6 6,-6 10,-2 10,6 -6,6 -10,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8" transform="translate(410 200)" />

      {/* Legend: the four squares under every bridge */}
      <g transform="translate(0 404)">
        {letters.map(([key, letter], j) => (
          <g key={key} transform={`translate(${j * 122} 0)`}>
            <rect x="0" y="-8" width="10" height="10" fill="var(--color-ink-900)" />
            <text x="5" y="0" textAnchor="middle" style={{ fontSize: 7, fontFamily: 'var(--font-mono)' }} fill="var(--color-paper)">{letter}</text>
            <text className="annot" x="16" y="1" style={{ fontSize: 10.5 }} fill="var(--color-ink-700)">{legend[key]}</text>
          </g>
        ))}
        <text className="annot" x="640" y="1" style={{ fontSize: 10.5 }} fill="var(--color-ink-500)">{legend.crossed}</text>
      </g>
    </svg>
  );
}
