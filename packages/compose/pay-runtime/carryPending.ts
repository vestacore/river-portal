import { dischargeAttempts, discharge, readOutbox } from '@river/figure';
import { payDefaults } from './data/payDefaults.ts';
import { holdsCredentials } from './holdsCredentials.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * Carries waiting intentions across the bank, in this process, until nothing waits — an answer may
 * itself raise the next intention (an approval asks for a capture). With `stream`, only that
 * order's intentions are carried: a payer's request does the work of that payer's order and of no
 * other. A controller that throws is tried again, a few times at most in one call; an intention it
 * may give up then becomes a failure as a fact, and one it may not — a capture — stays in the
 * outbox for the next call. Used where one process is the whole river: local runs, tests, a
 * single-service deployment.
 */
export async function carryPending(runtime: PayRuntime, at: Date = new Date(), stream?: string): Promise<{ carried: number; left: number }> {
  const { store, root, assembly, config } = runtime;
  const mine = async () => (await readOutbox(store, root, assembly)).filter((entry) => holdsCredentials(config, entry.controller) && (stream === undefined || entry.stream === stream));
  const tries = new Map<string, number>();
  let carried = 0;
  for (let round = 0; round < payDefaults.carryRounds; round += 1) {
    const waiting = (await mine()).filter((entry) => (tries.get(`${entry.stream}-${entry.seq}`) ?? 0) < dischargeAttempts);
    if (waiting.length === 0) break;
    for (const entry of waiting) {
      const key = `${entry.stream}-${entry.seq}`;
      tries.set(key, (tries.get(key) ?? 0) + 1);
      try {
        if (await discharge(store, root, assembly, { controller: entry.controller, stream: entry.stream, seq: entry.seq }, at.toISOString())) carried += 1;
      } catch {
        // The attempt is counted on the outbox entry; the next round, or the next call, tries again.
      }
    }
  }
  return { carried, left: (await mine()).length };
}
