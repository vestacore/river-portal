import type { SessionView } from '@river/psp-session';
import { daysBack } from './daysBack.ts';
import type { StackPoint } from './types/Views.ts';

/** Sessions per day by how they ended (open ones count as `open`), over the last `days` days. */
export function outcomesByDay(sessions: readonly SessionView[], days: number, now: string): StackPoint[] {
  const rows = new Map(daysBack(days, now).map((d) => [d, {} as Record<string, number>]));
  for (const s of sessions) {
    const row = rows.get(s.openedAt.slice(0, 10));
    if (!row) continue;
    const key = s.outcome === 'succeeded' || s.outcome === 'failed' || s.outcome === 'abandoned' || s.outcome === 'expired' ? s.outcome : 'open';
    row[key] = (row[key] ?? 0) + 1;
  }
  return [...rows.entries()].map(([day, values]) => ({ day, values }));
}
