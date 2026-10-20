import type { WebhookDelivery } from './types/Integration.ts';

/** How an endpoint is doing over its deliveries: the share delivered, failures in a row, the last error. */
export function endpointHealth(deliveries: readonly WebhookDelivery[]): { total: number; deliveredBps: number; failingStreak: number; lastError: string | null; p95Ms: number } {
  const sorted = [...deliveries].sort((a, b) => a.at.localeCompare(b.at));
  const total = sorted.length;
  const delivered = sorted.filter((d) => d.status === 'delivered').length;
  let failingStreak = 0;
  for (let i = sorted.length - 1; i >= 0 && sorted[i]!.status === 'failed'; i -= 1) failingStreak += 1;
  const lastError = [...sorted].reverse().find((d) => d.error)?.error ?? null;
  const times = sorted.map((d) => d.durationMs).sort((a, b) => a - b);
  const p95Ms = times.length ? times[Math.min(times.length - 1, Math.floor(times.length * 0.95))]! : 0;
  return { total, deliveredBps: total ? Math.round((delivered / total) * 10_000) : 10_000, failingStreak, lastError, p95Ms };
}
