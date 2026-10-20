import type { SessionView } from '@river/psp-session';

/** For each acquirer that carried attempts: how many secured funds and how many were refused. */
export function approvalByAcquirer(sessions: readonly SessionView[]): Array<{ acquirer: string; rail: string; approved: number; refused: number; approvalBps: number }> {
  const t = new Map<string, { acquirer: string; rail: string; approved: number; refused: number }>();
  for (const s of sessions) {
    if (!s.route) continue;
    const approved = s.paymentId !== null;
    const refused = !approved && s.outcome === 'failed' && s.failure !== null && s.failure.code !== 'authentication_failed' && s.failure.code !== 'blocked';
    if (!approved && !refused) continue;
    const row = t.get(s.route.acquirer) ?? { acquirer: s.route.acquirer, rail: s.route.rail, approved: 0, refused: 0 };
    if (approved) row.approved += 1; else row.refused += 1;
    t.set(s.route.acquirer, row);
  }
  return [...t.values()].map((r) => ({ ...r, approvalBps: Math.round((r.approved / Math.max(1, r.approved + r.refused)) * 10_000) })).sort((a, b) => b.approved + b.refused - (a.approved + a.refused));
}
