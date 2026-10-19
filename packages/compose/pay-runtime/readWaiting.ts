import { readOutbox } from '@river/figure';
import { payDefaults } from './data/payDefaults.ts';
import type { PayRuntime } from './types/PayRuntime.ts';
import type { WaitingIntention } from './types/WaitingIntention.ts';

/** What waits in the outbox, oldest first, with those that have waited too long marked. */
export async function readWaiting(runtime: PayRuntime, at: Date = new Date()): Promise<WaitingIntention[]> {
  const before = new Date(at.getTime() - payDefaults.staleMinutes * 60_000).toISOString();
  return (await readOutbox(runtime.store, runtime.root, runtime.assembly)).map((entry) => ({
    controller: entry.controller, stream: entry.stream, seq: entry.seq, type: entry.type, attempts: entry.attempts, lastError: entry.lastError, at: entry.at, stale: entry.at < before,
  }));
}
