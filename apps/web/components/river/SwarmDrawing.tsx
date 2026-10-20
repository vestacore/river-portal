/**
 * Fig. 5 — the swarm along the river. The agents stand on the banks, each looking at the stretch it
 * reads: the Collector at the source, the Sentinel and the Analyst at the screening, the Navigator at the
 * routing, the Reconciler and the Treasurer at the mouth and past it, the Clerk at the disputes, the
 * Copilot at every bridge where a webhook leaves. None of them stands in the water: they read the
 * projections, and a person on the bank decides what they propose.
 */
export type SwarmAgent = { id: string; name: string; open: number; at: number; bank: 'top' | 'bottom'; dx: number };

export function SwarmDrawing({ agents, stages, person }: { agents: SwarmAgent[]; stages: string[]; person: string }) {
  const width = 1000;
  const y = 170;
  const x = (i: number) => 60 + i * ((width - 120) / Math.max(1, stages.length - 1));
  return (
    <svg viewBox={`0 0 ${width} 340`} className="h-auto w-full" role="img" aria-label={agents.map((a) => a.name).join(', ')}>
      <defs><pattern id="sw-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--color-paper)" /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.35" /></pattern></defs>
      <rect x="10" y={y - 38} width={width - 20} height="76" fill="url(#sw-hatch)" />
      <rect x="10" y={y - 22.5} width={width - 20} height="45" fill="var(--color-graphite)" />
      <rect x="10" y={y - 21} width={width - 20} height="42" fill="var(--color-river-100)" />
      <path d={`M10,${y} L${width - 10},${y}`} stroke="var(--color-river-600)" strokeWidth="0.8" strokeDasharray="12 4 2 4" />
      {stages.map((s, i) => (
        <g key={s}>
          <path d={`M${x(i) - 4},${y - 26} L${x(i) - 4},${y + 26} M${x(i) + 4},${y - 26} L${x(i) + 4},${y + 26}`} stroke="var(--color-ink-900)" strokeWidth="1.4" />
          <text x={x(i)} y={y + 52} textAnchor="middle" className="annot" style={{ fontSize: 8 }} fill="var(--color-ink-500)">{s}</text>
        </g>
      ))}
      {agents.map((a) => {
        const ax = x(a.at) + a.dx;
        const ay = a.bank === 'top' ? 52 : 288;
        return (
          <g key={a.id}>
            <path d={`M${ax},${a.bank === 'top' ? ay + 16 : ay - 16} L${x(a.at)},${a.bank === 'top' ? y - 30 : y + 30}`} stroke="var(--color-sunrise-600)" strokeWidth="1" strokeDasharray="4 3" />
            <polygon points={`${ax},${ay - 15} ${ax + 13},${ay} ${ax},${ay + 15} ${ax - 13},${ay}`} fill={a.open > 0 ? 'var(--color-sunrise-500)' : 'var(--color-paper)'} stroke="var(--color-ink-900)" strokeWidth="1.2" />
            <text x={ax} y={ay + 4} textAnchor="middle" style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} fill="var(--color-ink-900)">{a.open}</text>
            <text x={ax} y={a.bank === 'top' ? ay - 22 : ay + 30} textAnchor="middle" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-900)">{a.name}</text>
          </g>
        );
      })}
      <g transform={`translate(${x(4) - 40} 292)`}>
        <circle cx="0" cy="-6" r="6" fill="var(--color-paper)" stroke="var(--color-ink-900)" strokeWidth="1.2" />
        <path d="M-9,12 Q0,-2 9,12" fill="none" stroke="var(--color-ink-900)" strokeWidth="1.2" />
        <text x="16" y="4" className="annot" style={{ fontSize: 9 }} fill="var(--color-ink-700)">{person}</text>
      </g>
    </svg>
  );
}
