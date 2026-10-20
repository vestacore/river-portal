import type { TreeNode } from '@/lib/treeLayout';

/**
 * Fig. 3 — the hierarchy as a basin. Units are drawn top-down from the platform; the channels between
 * them are as wide as the money that flows up from each subtree, because a parent sees every payment
 * below it. Policies travel the other way: a lock marks a unit that enforces policies on everything
 * below it, a gate a unit that blocks what was not enforced above.
 */
export type BasinMark = { unitId: string; flow: number; enforced: number; set: number; blocked: boolean; onboarding: boolean; label: string; sub: string };

export function BasinDrawing({ nodes, marks, width, height, legend }: { nodes: TreeNode[]; marks: Record<string, BasinMark>; width: number; height: number; legend: { flows: string; policies: string; enforced: string; blocked: string; onboarding: string } }) {
  const max = Math.max(1, ...Object.values(marks).map((m) => m.flow));
  const w = (id: string) => 3 + Math.sqrt((marks[id]?.flow ?? 0) / max) * 26;
  const byId = new Map(nodes.map((n) => [n.unit.id, n]));
  const channels = nodes.filter((n) => n.parent).map((n) => {
    const p = byId.get(n.parent!)!;
    const mid = p.y + (n.y - p.y) * 0.45;
    return { id: n.unit.id, d: `M${p.x},${p.y + 14} L${p.x},${mid} L${n.x},${mid} L${n.x},${n.y - 16}`, width: w(n.unit.id), blocked: marks[n.unit.id]?.blocked ?? false, gateY: n.y - 26, x: n.x };
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={legend.flows}>
      <defs>
        <pattern id="bd-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--color-paper)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-graphite)" strokeWidth="0.8" strokeOpacity="0.3" />
        </pattern>
      </defs>
      <g fill="none" strokeLinejoin="miter">
        {channels.map((c) => <path key={`h${c.id}`} d={c.d} stroke="url(#bd-hatch)" strokeWidth={c.width + 14} />)}
        {channels.map((c) => <path key={`b${c.id}`} d={c.d} stroke="var(--color-graphite)" strokeWidth={c.width + 2.4} />)}
        {channels.map((c) => <path key={`w${c.id}`} d={c.d} stroke="var(--color-river-100)" strokeWidth={c.width} />)}
        {channels.map((c) => <path key={`f${c.id}`} d={c.d} stroke="var(--color-river-600)" strokeWidth="0.8" strokeDasharray="8 3 2 3" />)}
      </g>
      {channels.filter((c) => c.blocked).map((c) => (
        <g key={`g${c.id}`} aria-label={legend.blocked}>
          <path d={`M${c.x - 14},${c.gateY - 3} L${c.x + 14},${c.gateY - 3} M${c.x - 14},${c.gateY + 3} L${c.x + 14},${c.gateY + 3}`} stroke="var(--color-attention-500)" strokeWidth="2.2" />
        </g>
      ))}
      {nodes.map((n) => {
        const m = marks[n.unit.id];
        const half = Math.max(30, (m?.label.length ?? 8) * 3.05 + 9);
        return (
          <g key={n.unit.id}>
            <polygon points={`${n.x - half + 6},${n.y - 14} ${n.x + half},${n.y - 14} ${n.x + half},${n.y + 8} ${n.x + half - 6},${n.y + 14} ${n.x - half},${n.y + 14} ${n.x - half},${n.y - 8}`}
              fill={n.depth === 0 ? 'var(--color-ink-900)' : 'var(--color-paper)'} stroke="var(--color-ink-900)" strokeWidth="1.2" strokeDasharray={m?.onboarding ? '4 3' : undefined} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600 }} fill={n.depth === 0 ? 'var(--color-paper)' : 'var(--color-ink-900)'}>{m?.label ?? n.unit.code}</text>
            <text className="annot" x={n.x} y={n.y + 28} textAnchor="middle" style={{ fontSize: 8.5 }} fill="var(--color-ink-500)">{m?.sub ?? ''}</text>
            {m && m.enforced > 0 ? (
              <g transform={`translate(${n.x + half - 2} ${n.y - 22})`}>
                <rect x="-1" y="-1" width="22" height="13" fill="var(--color-sunrise-500)" />
                <path d="M3,5 h6 v5 h-6z M4.5,5 v-2 a1.5,1.5 0 0 1 3,0 v2" fill="none" stroke="var(--color-ink-900)" strokeWidth="1" />
                <text x="15" y="9" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} fill="var(--color-ink-900)">{m.enforced}</text>
              </g>
            ) : null}
          </g>
        );
      })}
      <g transform={`translate(8 ${height - 14})`} className="annot" style={{ fontSize: 9.5 }}>
        <text fill="var(--color-river-700)">↑ {legend.flows}</text>
        <text x={width * 0.36} fill="var(--color-ink-700)">↓ {legend.policies}</text>
        <rect x={width * 0.62} y="-9" width="12" height="11" fill="var(--color-sunrise-500)" /><text x={width * 0.62 + 18} fill="var(--color-ink-700)">{legend.enforced}</text>
        <path d={`M${width * 0.78},-6 h16 M${width * 0.78},-1 h16`} stroke="var(--color-attention-500)" strokeWidth="2" /><text x={width * 0.78 + 22} fill="var(--color-ink-700)">{legend.blocked}</text>
      </g>
    </svg>
  );
}
