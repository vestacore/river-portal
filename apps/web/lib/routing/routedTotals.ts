import type { SessionView } from '@river/psp-session';

/**
 * The priced online card attempts opened within `[from, to)`, together: how many, the share routed on-us,
 * the card volume and the expected acquiring fee of their routing decisions — the effective rate.
 */
export function routedTotals(sessions: Iterable<SessionView>, from = '', to = '￿'): { sessions: number; onUsBps: number; volumeMinor: number; feeMinor: number; rateBps: number } {
  let n = 0;
  let onUs = 0;
  let volumeMinor = 0;
  let feeMinor = 0;
  for (const s of sessions) {
    if (!s.route || s.route.rail !== 'card' || s.route.feeMinor === null || s.openedAt < from || s.openedAt >= to) continue;
    n += 1;
    if (s.route.onUs) onUs += 1;
    volumeMinor += s.amountMinor;
    feeMinor += s.route.feeMinor;
  }
  return { sessions: n, onUsBps: n > 0 ? (onUs / n) * 10_000 : 0, volumeMinor, feeMinor, rateBps: volumeMinor > 0 ? (feeMinor / volumeMinor) * 10_000 : 0 };
}
