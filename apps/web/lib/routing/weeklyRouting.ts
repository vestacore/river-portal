import type { SessionView } from '@river/psp-session';
import { weekOf } from './weekOf';

export type RoutedWeek = { week: string; sessions: number; onUs: number; volumeMinor: number; feeMinor: number; onUsBps: number; rateBps: number };

/**
 * The online card attempts of a history, week by week (weeks start on Monday): how many were routed, the
 * share routed on-us, and the expected acquiring fee of the routing decisions divided by the amount — the
 * effective rate. Attempts routed without a price (no acquiring terms) are left out.
 */
export function weeklyRouting(sessions: Iterable<SessionView>): RoutedWeek[] {
  const weeks = new Map<string, { sessions: number; onUs: number; volumeMinor: number; feeMinor: number }>();
  for (const s of sessions) {
    if (!s.route || s.route.rail !== 'card' || s.route.feeMinor === null) continue;
    const week = weekOf(s.openedAt);
    const e = weeks.get(week) ?? { sessions: 0, onUs: 0, volumeMinor: 0, feeMinor: 0 };
    e.sessions += 1;
    if (s.route.onUs) e.onUs += 1;
    e.volumeMinor += s.amountMinor;
    e.feeMinor += s.route.feeMinor;
    weeks.set(week, e);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, e]) => ({
    week, ...e,
    onUsBps: e.sessions > 0 ? (e.onUs / e.sessions) * 10_000 : 0,
    rateBps: e.volumeMinor > 0 ? (e.feeMinor / e.volumeMinor) * 10_000 : 0,
  }));
}
