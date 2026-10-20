import type { BridgeRow } from '@river/psp-views';

/**
 * The river of one session as it ran: every bridge it crossed, in order, grouped by the stage it stands
 * in. Under each bridge, the views it formed (S O I P L); above it, its number and name. The water turns
 * green past the capture, and the drawing ends in a break where the attempt is still waiting.
 */
export function SessionRiver({ bridges, labels, stageLabels, ended, legend }: {
  bridges: BridgeRow[]; labels: Record<string, string>; stageLabels: Record<string, string>; ended: 'succeeded' | 'failed' | 'open';
  legend: { session: string; order: string; invoice: string; payment: string; ledger: string; door: string; figure: string; world: string };
}) {
  const step = 96;
  const left = 70;
  const width = Math.max(left + bridges.length * step + 80, 1180);
  const y = 120;
  const captureAt = bridges.findIndex((b) => b.type === 'capture.Completed');
  const letters: Array<[keyof typeof legend, string, string]> = [['session', 'S', 'session'], ['order', 'O', 'order'], ['invoice', 'I', 'invoice'], ['payment', 'P', 'payment'], ['ledger', 'L', 'ledger']];
  const groups: Array<{ stage: string; from: number; to: number }> = [];
  bridges.forEach((b, i) => {
    const stage = b.stage ?? 'after';
    const last = groups[groups.length - 1];
    if (last && last.stage === stage) last.to = i; else groups.push({ stage, from: i, to: i });
  });
  const speakerFill = { door: 'var(--color-sunrise-500)', figure: 'var(--color-river-600)', world: 'var(--color-teal-600)' } as const;
  const paidX = captureAt >= 0 ? left + captureAt * step + step / 2 : width;
  return (
    <svg viewBox={`0 0 ${width} 250`} className="h-auto" style={{ width: Math.max(width, 720), minWidth: '100%' }} role="img" aria-label={bridges.map((b) => labels[b.type] ?? b.type).join(' → ')}>
      <defs>
        <pattern id="sr-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--color-paper)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.35" /></pattern>
      </defs>
      <rect x="8" y={y - 40} width={width - 30} height="80" fill="url(#sr-hatch)" />
      <rect x="8" y={y - 23.5} width={width - 30} height="47" fill="var(--color-graphite)" />
      <rect x="8" y={y - 22} width={Math.max(0, paidX - 8)} height="44" fill="var(--color-river-100)" />
      {captureAt >= 0 ? <rect x={paidX} y={y - 22} width={width - 30 - paidX + 8} height="44" fill="var(--color-teal-100)" /> : null}
      {ended === 'failed' ? <rect x={left + (bridges.length - 1) * step + step / 2} y={y - 22} width={width - 30 - (left + (bridges.length - 1) * step + step / 2) + 8} height="44" fill="var(--color-attention-100)" /> : null}
      <path d={`M8,${y} L${width - 22},${y}`} stroke="var(--color-river-600)" strokeWidth="0.8" strokeDasharray="12 4 2 4" />
      {ended === 'open' ? <path d={`M${width - 22},${y - 34} L${width - 22},${y - 6} L${width - 28},${y} L${width - 16},${y + 6} L${width - 22},${y + 12} L${width - 22},${y + 34}`} fill="none" stroke="var(--color-graphite)" strokeWidth="1" /> : null}
      {groups.map((g) => {
        const x0 = left + g.from * step + 8;
        const x1 = left + g.to * step + step - 8;
        return (
          <g key={`${g.stage}${g.from}`}>
            <path d={`M${x0},22 L${x0},30 L${x1},30 L${x1},22`} fill="none" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.7" />
            <text x={(x0 + x1) / 2} y="16" textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-sunrise-600)">{stageLabels[g.stage] ?? g.stage}</text>
          </g>
        );
      })}
      {bridges.map((b, i) => {
        const x = left + i * step + step / 2;
        const formed = new Set(b.formed.map((f) => f.projection));
        const name = labels[b.type] ?? b.type;
        const words = name.split(' ');
        const lineA = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        const lineB = words.slice(Math.ceil(words.length / 2)).join(' ');
        return (
          <a key={b.seq} href={`#b-${b.seq}`}>
            <g>
              <text x={x} y="52" textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} fill="var(--color-ink-500)">#{b.seq}</text>
              <text x={x} y="66" textAnchor="middle" style={{ fontSize: 10, fontWeight: 600 }} fill="var(--color-ink-900)">{lineA}</text>
              {lineB ? <text x={x} y="78" textAnchor="middle" style={{ fontSize: 10, fontWeight: 600 }} fill="var(--color-ink-900)">{lineB}</text> : null}
              <path d={`M${x - 5},${y - 32} L${x - 5},${y + 32} M${x + 5},${y - 32} L${x + 5},${y + 32}`} stroke="var(--color-ink-900)" strokeWidth="1.6" />
              <path d={`M${x - 11},${y - 32} L${x + 11},${y - 32} M${x - 11},${y + 32} L${x + 11},${y + 32}`} stroke="var(--color-ink-900)" strokeWidth="2.6" />
              <rect x={x - 5} y={y - 30} width="10" height="60" fill="var(--color-paper)" fillOpacity="0.6" />
              <circle cx={x} cy={y} r="4.5" fill={speakerFill[b.speaker]} stroke="var(--color-ink-900)" strokeWidth="0.8" />
              {letters.map(([key, letter], j) => {
                const on = formed.has(key as never);
                return (
                  <g key={key}>
                    <rect x={x - 27 + j * 11} y={y + 42} width="9" height="9" fill={on ? 'var(--color-ink-900)' : 'var(--color-paper)'} stroke="var(--color-graphite)" strokeWidth="0.8" />
                    <text x={x - 22.5 + j * 11} y={y + 49.4} textAnchor="middle" style={{ fontSize: 6.5, fontFamily: 'var(--font-mono)' }} fill={on ? 'var(--color-paper)' : 'var(--color-ink-300)'}>{letter}</text>
                  </g>
                );
              })}
            </g>
          </a>
        );
      })}
      <g transform={`translate(10 ${y + 92})`} className="annot" style={{ fontSize: 9 }}>
        {(['door', 'figure', 'world'] as const).map((k, i) => (
          <g key={k} transform={`translate(${i * 210} 0)`}><circle cx="5" cy="-3" r="4" fill={speakerFill[k]} stroke="var(--color-ink-900)" strokeWidth="0.6" /><text x="14" y="0" fill="var(--color-ink-700)">{legend[k]}</text></g>
        ))}
        {letters.map(([key, letter], j) => (
          <g key={key} transform={`translate(${650 + j * 104} 0)`}><rect x="0" y="-9" width="10" height="10" fill="var(--color-ink-900)" /><text x="5" y="-1.5" textAnchor="middle" style={{ fontSize: 7, fontFamily: 'var(--font-mono)' }} fill="var(--color-paper)">{letter}</text><text x="15" y="0" fill="var(--color-ink-700)">{legend[key]}</text></g>
        ))}
      </g>
    </svg>
  );
}
