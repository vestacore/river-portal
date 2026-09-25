type Labels = { springs: string; rightBank: string; channel: string; mouth: string; leftBank: string; arrives: string; record: string };

// Geometry (viewBox −60…660 × −10…480): channel centreline with 45° bends, banks offset by 34 px with
// mitre joins, hatched earth strips 28 px wide (see meta: Iteration 02 — Drafting Table).
const centre = 'M330,-10 L330,110 L250,190 L250,280 L340,370 L340,470';
const leftEdge = 'M296,20 L296,95.9 L216,175.9 L216,294.1 L306,384.1 L306,440';
const rightEdge = 'M364,20 L364,124.1 L284,204.1 L284,265.9 L374,355.9 L374,440';
const water = '296,20 296,95.9 216,175.9 216,294.1 306,384.1 306,440 374,440 374,355.9 284,265.9 284,204.1 364,124.1 364,20';
const leftStrip = '296,20 296,95.9 216,175.9 216,294.1 306,384.1 306,440 278,440 278,395.7 188,305.7 188,164.3 268,84.3 268,20';
const rightStrip = '364,20 364,124.1 284,204.1 284,265.9 374,355.9 374,440 402,440 402,344.3 312,254.3 312,215.7 392,135.7 392,20';
// Drafting break lines where the drawing is cut off (a straight line with one Z).
const breakTop = 'M256,20 L322,20 L327,13 L333,27 L338,20 L406,20';
const breakBottom = 'M266,440 L332,440 L337,433 L343,447 L348,440 L416,440';

/**
 * Fig. 1 — the river as a technical drawing: needs on the left bank, gifts joining from the right,
 * coordinators in the channel, confirmation at the mouth. Lines draw themselves like a pencil.
 * Callouts are hidden on small screens, where they would be too small to read.
 */
function Callout({ x, y, anchor, text }: { x: number; y: number; anchor: 'start' | 'end'; text: string }) {
  const [term, meaning] = text.split(' · ');
  return (
    <text className="annot max-sm:hidden" x={x} y={y} textAnchor={anchor} style={{ fontSize: 12.5 }}>
      <tspan fill="var(--color-ink-900)">{term}</tspan>
      {meaning ? <tspan x={x} dy={16} fill="var(--color-ink-500)">{meaning}</tspan> : null}
    </text>
  );
}

export function RiverDrawing({ labels }: { labels: Labels }) {
  const line = { fill: 'none', stroke: 'var(--color-graphite)' };
  const lbl = { className: 'annot max-sm:hidden', fill: 'var(--color-ink-700)', style: { fontSize: 12.5 } };
  const leader = { ...line, strokeWidth: 0.8, strokeOpacity: 0.55, className: 'max-sm:hidden' };
  const dot = { r: 2, fill: 'var(--color-graphite)', className: 'max-sm:hidden' };
  const delay = (s: number) => ({ animationDelay: `${s}s` });
  return (
    <svg viewBox="-48 -4 668 478" className="h-auto w-full" aria-hidden="true">
      <defs>
        <pattern id="rd-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.4" />
        </pattern>
        <clipPath id="rd-channel"><rect x="100" y="20" width="420" height="420" /></clipPath>
      </defs>

      <polygon points={water} fill="var(--color-river-100)" className="animate-rise" style={delay(0.6)} />
      <polygon points={leftStrip} fill="url(#rd-hatch)" className="animate-rise" style={delay(0.9)} />
      <polygon points={rightStrip} fill="url(#rd-hatch)" className="animate-rise" style={delay(0.9)} />
      <path d={leftEdge} {...line} strokeWidth={1.4} pathLength={1} className="draw" />
      <path d={rightEdge} {...line} strokeWidth={1.4} pathLength={1} className="draw" style={delay(0.2)} />
      <path d={breakTop} {...line} strokeWidth={0.9} className="animate-rise" style={delay(1.1)} />
      <path d={breakBottom} {...line} strokeWidth={0.9} className="animate-rise" style={delay(1.1)} />
      <g clipPath="url(#rd-channel)">
        <path d={centre} fill="none" stroke="var(--color-river-600)" strokeWidth={1} strokeDasharray="14 4 2 4" className="animate-rise" style={delay(1.2)} />
      </g>
      {['M324,58 L330,66 L336,58', 'M244,229 L250,237 L256,229', 'M334,404 L340,412 L346,404'].map((d) => (
        <path key={d} d={d} fill="none" stroke="var(--color-river-700)" strokeWidth={1.4} className="animate-rise" style={delay(1.4)} />
      ))}

      {/* Gifts join from the right bank */}
      <path d="M440,30 L364,106" {...line} strokeWidth={1.1} pathLength={1} className="draw" style={delay(0.8)} />
      <path d="M480,270 L374,376" {...line} strokeWidth={1.1} pathLength={1} className="draw" style={delay(1)} />
      <path d="M389.2,87.9 L380,90 L382.1,80.8" fill="none" stroke="var(--color-sunrise-600)" strokeWidth={1.4} />
      <path d="M409.2,347.9 L400,350 L402.1,340.8" fill="none" stroke="var(--color-sunrise-600)" strokeWidth={1.4} />
      <rect x="436" y="26" width="8" height="8" fill="var(--color-sunrise-500)" transform="rotate(45 440 30)" />
      <rect x="476" y="266" width="8" height="8" fill="var(--color-sunrise-500)" transform="rotate(45 480 270)" />

      {/* Help leaves the channel to the left bank */}
      <path d="M216,262 L150,328" {...line} strokeWidth={1.1} pathLength={1} className="draw" style={delay(1.2)} />
      <path d="M171.2,313.9 L162,316 L164.1,306.8" fill="none" stroke="var(--color-teal-600)" strokeWidth={1.4} />
      <rect x="146" y="324" width="8" height="8" fill="var(--color-teal-500)" transform="rotate(45 150 328)" />

      {/* A consignment travelling downstream (static when motion is reduced) */}
      <g className="motion-only" clipPath="url(#rd-channel)">
        <polygon points="-11,-6 7,-6 11,-2 11,6 -7,6 -11,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8">
          <animateMotion dur="16s" repeatCount="indefinite" rotate="auto" path={centre} />
        </polygon>
      </g>
      <polygon className="still-only" points="-11,-6 7,-6 11,-2 11,6 -7,6 -11,2" fill="var(--color-sunrise-500)" stroke="var(--color-graphite)" strokeWidth="0.8" transform="translate(250 236) rotate(90)" />

      {/* Dimension line along the river: every step on record */}
      <g stroke="var(--color-graphite)" strokeOpacity="0.7" strokeWidth="0.8" fill="none">
        <path d="M-34,20 L-34,150 M-34,310 L-34,440 M-42,20 L-26,20 M-42,440 L-26,440 M-39,25 L-29,15 M-39,445 L-29,435" />
      </g>
      <text {...lbl} x="-34" y="230" textAnchor="middle" transform="rotate(-90 -34 230)">{labels.record}</text>

      {/* Callouts: term over meaning, like a drafting legend */}
      <path d="M232.3,120 L182,120" {...leader} />
      <circle cx="232.3" cy="120" {...dot} />
      <Callout x={176} y={124} anchor="end" text={labels.leftBank} />

      <path d="M228,238 L182,238" {...leader} />
      <circle cx="228" cy="238" {...dot} />
      <Callout x={176} y={242} anchor="end" text={labels.channel} />

      <Callout x={138} y={332} anchor="end" text={labels.arrives} />
      <Callout x={452} y={34} anchor="start" text={labels.springs} />

      <path d="M352.7,175 L446,175" {...leader} />
      <circle cx="352.7" cy="175" {...dot} />
      <Callout x={452} y={179} anchor="start" text={labels.rightBank} />

      <path d="M340,405 L446,405" {...leader} />
      <circle cx="340" cy="405" {...dot} />
      <Callout x={452} y={409} anchor="start" text={labels.mouth} />
    </svg>
  );
}
