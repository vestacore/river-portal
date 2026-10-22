/**
 * Fig. 1 — one online card payment and its route. The card's first digits name its bank; the routing
 * decision quotes every acquirer the company has an agreement with and applies its strategy and approval
 * threshold. Each route ends at an acquirer with what the payment would cost there, drawn to scale and by
 * part — interchange, the scheme's fee, the markup, or a blended or on-us rate. The chosen route is the
 * card's own bank: on-us, no interchange passes to another bank.
 */
export type RouteOption = {
  id: string;
  name: string;
  terms: string;
  cost: string;
  rate: string;
  approval: string;
  parts: { interchange: number; scheme: number; markup: number; blended: number; onUs: number };
  chosen: boolean;
  eligible: boolean;
  note: string;
};

const fills = { interchange: 'var(--color-river-700)', scheme: 'var(--color-ink-300)', markup: 'var(--color-sunrise-500)', blended: 'var(--color-ink-700)', onUs: 'var(--color-teal-500)' } as const;

function Channel({ d, chosen, eligible }: { d: string; chosen: boolean; eligible: boolean }) {
  return (
    <g fill="none" strokeLinejoin="miter" strokeMiterlimit={4}>
      <path d={d} stroke="url(#ou-hatch)" strokeWidth={34} />
      <path d={d} stroke="var(--color-graphite)" strokeWidth={chosen ? 19 : 17} strokeDasharray={eligible ? undefined : '6 4'} />
      <path d={d} stroke={chosen ? 'var(--color-teal-100)' : eligible ? 'var(--color-river-100)' : 'var(--color-paper)'} strokeWidth={chosen ? 16 : 14} />
      <path d={d} stroke={chosen ? 'var(--color-teal-600)' : 'var(--color-graphite)'} strokeWidth={chosen ? 1.6 : 0.8} strokeDasharray="12 4 2 4" strokeOpacity={eligible ? 1 : 0.4} />
    </g>
  );
}

export function OnUsRouting({ card, decision, options, legend }: {
  card: { number: string; bank: string; detail: string; directory: string };
  decision: { title: string; strategy: string; threshold: string };
  options: RouteOption[];
  legend: { interchange: string; scheme: string; markup: string; blended: string; onUs: string; amount: string };
}) {
  const ys = options.length === 1 ? [200] : options.map((_, i) => 80 + i * (240 / Math.max(1, options.length - 1)));
  const max = Math.max(1, ...options.map((o) => o.parts.interchange + o.parts.scheme + o.parts.markup + o.parts.blended + o.parts.onUs));
  const scale = 230 / max;
  const route = (y: number) => (Math.abs(y - 200) < 1 ? 'M342,200 L604,200' : `M342,200 L380,200 L${380 + Math.abs(y - 200)},${y} L604,${y}`);
  const chosenAt = options.findIndex((o) => o.chosen);
  const motion = chosenAt >= 0 ? `M234,200 ${route(ys[chosenAt]!).replace(/^M342,200/, 'L342,200')}` : null;
  return (
    <svg viewBox="0 0 1000 410" className="h-auto w-full" role="img" aria-label={`${card.bank} → ${options.find((o) => o.chosen)?.name ?? ''}`}>
      <defs>
        <pattern id="ou-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--color-paper)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.32" />
        </pattern>
      </defs>

      {/* The card, and what its first digits say */}
      <text className="annot" x="12" y="128" style={{ fontSize: 11 }} fill="var(--color-ink-500)">{card.directory}</text>
      <path d="M12,140 L222,140 L234,152 L234,262 L24,262 L12,250 Z" fill="var(--color-paper)" stroke="var(--color-ink-900)" strokeWidth="1.6" />
      <rect x="28" y="160" width="28" height="20" fill="var(--color-sunrise-300)" stroke="var(--color-graphite)" strokeWidth="0.8" />
      <path d="M28,170 L56,170 M38,160 L38,180 M46,160 L46,180" stroke="var(--color-graphite)" strokeWidth="0.6" />
      <text x="28" y="214" style={{ fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: 1 }} fill="var(--color-ink-900)">{card.number}</text>
      <rect x="26" y="200" width="46" height="18" fill="none" stroke="var(--color-sunrise-600)" strokeWidth="1.2" />
      <text className="annot" x="28" y="240" style={{ fontSize: 11 }} fill="var(--color-ink-900)">{card.bank}</text>
      <text className="annot" x="28" y="253" style={{ fontSize: 10 }} fill="var(--color-ink-500)">{card.detail}</text>
      <path d="M49,218 L49,290 L120,290" fill="none" stroke="var(--color-sunrise-600)" strokeWidth="0.8" strokeDasharray="3 3" />
      <text className="annot" x="124" y="294" style={{ fontSize: 10 }} fill="var(--color-sunrise-600)">BIN</text>

      {/* From the card to the routing decision */}
      <path d="M234,200 L282,200" stroke="var(--color-ink-900)" strokeWidth="1.4" />
      <path d="M274,195 L282,200 L274,205" fill="none" stroke="var(--color-ink-900)" strokeWidth="1.4" />

      {options.map((o, i) => <Channel key={o.id} d={route(ys[i]!)} chosen={o.chosen} eligible={o.eligible} />)}

      {/* The routing decision */}
      <path d="M312,170 L342,200 L312,230 L282,200 Z" fill="var(--color-paper)" stroke="var(--color-ink-900)" strokeWidth="2.2" />
      <path d="M312,184 L328,200 L312,216 L296,200 Z" fill="var(--color-ink-900)" />
      <path d="M312,232 L312,274" stroke="var(--color-graphite)" strokeWidth="0.8" strokeDasharray="3 3" />
      <text className="annot" x="312" y="290" textAnchor="middle" style={{ fontSize: 11 }} fill="var(--color-ink-900)">{decision.title}</text>
      <text className="annot" x="312" y="305" textAnchor="middle" style={{ fontSize: 10.5 }} fill="var(--color-ink-700)">{decision.strategy}</text>
      <text className="annot" x="312" y="320" textAnchor="middle" style={{ fontSize: 10.5 }} fill="var(--color-ink-500)">{decision.threshold}</text>

      {/* Each acquirer: what the payment would cost there, by part, to scale */}
      {options.map((o, i) => {
        const y = ys[i]!;
        let x = 616;
        const parts = (['interchange', 'scheme', 'markup', 'blended', 'onUs'] as const).filter((k) => o.parts[k] > 0).map((k) => {
          const w = Math.max(2, o.parts[k] * scale);
          const at = x;
          x += w;
          return <rect key={k} x={at} y={y + 6} width={w} height="11" fill={fills[k]} />;
        });
        return (
          <g key={o.id} opacity={o.eligible ? 1 : 0.62}>
            <path d={`M604,${y - 30} L604,${y + 30}`} stroke="var(--color-ink-900)" strokeWidth={o.chosen ? 2.6 : 1.4} />
            <text x="616" y={y - 14} style={{ fontSize: 14, fontWeight: 600 }} fill="var(--color-ink-900)">{o.name}</text>
            <text className="annot" x="616" y={y + 1} style={{ fontSize: 10 }} fill="var(--color-ink-500)">{o.terms}</text>
            {parts}
            <rect x="616" y={y + 6} width={Math.max(2, x - 616)} height="11" fill="none" stroke="var(--color-graphite)" strokeWidth="0.6" />
            <text x="992" y={y - 14} textAnchor="end" style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} fill={o.chosen ? 'var(--color-teal-600)' : 'var(--color-ink-900)'}>{o.cost}</text>
            <text className="annot" x="992" y={y + 1} textAnchor="end" style={{ fontSize: 10 }} fill="var(--color-ink-700)">{o.rate}</text>
            <text className="annot" x="992" y={y + 16} textAnchor="end" style={{ fontSize: 10 }} fill="var(--color-ink-500)">{o.approval}</text>
            <text className="annot" x="616" y={y + 32} style={{ fontSize: 10 }} fill={o.chosen ? 'var(--color-teal-600)' : o.eligible ? 'var(--color-ink-500)' : 'var(--color-attention-500)'}>{o.note}</text>
          </g>
        );
      })}

      {/* The payment, on its way to the chosen acquirer (still when motion is reduced) */}
      {motion ? (
        <>
          <g className="motion-only">
            <polygon points="-10,-6 6,-6 10,-2 10,6 -6,6 -10,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8">
              <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path={motion} />
            </polygon>
          </g>
          <polygon className="still-only" points="-10,-6 6,-6 10,-2 10,6 -6,6 -10,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8" transform={`translate(560 ${ys[chosenAt]})`} />
        </>
      ) : null}

      {/* Legend */}
      <g transform="translate(12 396)">
        {([['interchange', legend.interchange], ['scheme', legend.scheme], ['markup', legend.markup], ['blended', legend.blended], ['onUs', legend.onUs]] as const).map(([k, label], i) => (
          <g key={k} transform={`translate(${i * 150} 0)`}>
            <rect x="0" y="-9" width="11" height="11" fill={fills[k]} />
            <text className="annot" x="17" y="1" style={{ fontSize: 10 }} fill="var(--color-ink-700)">{label}</text>
          </g>
        ))}
        <text className="annot" x="976" y="1" textAnchor="end" style={{ fontSize: 10 }} fill="var(--color-ink-500)">{legend.amount}</text>
      </g>
    </svg>
  );
}
