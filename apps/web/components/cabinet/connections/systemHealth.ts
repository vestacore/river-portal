import type { ApiKey } from '@river/psp-integration';
import type { World } from '@river/psp-runtime';
import type { EndpointRow } from '../integration/columns';

const day = 86_400_000;

/** How a connected system is doing: working, failing on some calls or deliveries, failing outright, quiet, or out of sight. */
export type SystemState = 'working' | 'degraded' | 'failing' | 'quiet' | 'unseen';

export type SystemHealth = { calls: number; refused: number; deliveries: number; failed: number; failingStreak: number; lastSuccessAt: string | null; state: SystemState };

/**
 * The health of one system over the last day, from what the world keeps of the last two: the calls its
 * keys made and how many were refused, the deliveries to its endpoints and how many failed, the longest run
 * of failures in a row on an enabled endpoint, and the last call or delivery that went through.
 */
export function systemHealth(w: World, keys: readonly ApiKey[], endpoints: readonly EndpointRow[], now: string): SystemHealth {
  const since = new Date(Date.parse(now) - day).toISOString();
  const keyIds = new Set(keys.map((k) => k.id));
  const endpointIds = new Set(endpoints.map((e) => e.endpoint.id));
  let calls = 0;
  let refused = 0;
  let deliveries = 0;
  let failed = 0;
  let lastSuccessAt: string | null = null;
  for (const e of w.apiLog) {
    if (!keyIds.has(e.keyId)) continue;
    if (e.at >= since) { calls += 1; if (e.status >= 400) refused += 1; }
    if (e.status < 400 && (!lastSuccessAt || e.at > lastSuccessAt)) lastSuccessAt = e.at;
  }
  for (const d of w.deliveries) {
    if (!endpointIds.has(d.endpointId)) continue;
    if (d.at >= since) { deliveries += 1; if (d.status === 'failed') failed += 1; }
    if (d.status === 'delivered' && (!lastSuccessAt || d.at > lastSuccessAt)) lastSuccessAt = d.at;
  }
  const failingStreak = endpoints.reduce((m, e) => (e.endpoint.status === 'enabled' ? Math.max(m, e.health.failingStreak) : m), 0);
  const state: SystemState = keys.length + endpoints.length === 0 ? 'unseen'
    : failingStreak >= 3 ? 'failing'
    : refused + failed > 0 ? 'degraded'
    : calls + deliveries === 0 ? 'quiet'
    : 'working';
  return { calls, refused, deliveries, failed, failingStreak, lastSuccessAt, state };
}
