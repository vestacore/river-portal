import { nowIso } from '@river/kernel';
import type { DocStore, DocTransaction } from '@river/store';
import { readFact, type FactDraft } from '@river/stream';
import { dischargeAttempts } from './data/limits.ts';
import { figurePaths } from './paths.ts';
import { settle } from './settle.ts';
import type { Assembly } from './types/Assembly.ts';
import type { OutboxEntry } from './types/OutboxEntry.ts';
import type { Receipt } from './types/Receipt.ts';

/**
 * Carries one intention across the bank: asks its controller, and lets the answer enter the stream
 * as facts of the world that name the intention they answer.
 *
 * It may be called more than once for the same intention, and by several callers at the same time —
 * a redelivered message, the clock, two instances. That is safe: the controller is given the same
 * idempotency key every time; only the first answer enters the stream; and the outbox entry is
 * only ever read and changed inside a transaction, so a delivery that fails late cannot reopen an
 * intention another delivery has already answered.
 *
 * A thrown error is counted on the entry and thrown again, so the messaging layer retries. After
 * the last attempt the controller says what the silence means: a failure as a fact, or — where the
 * outcome is unknown — nothing, and the intention keeps waiting.
 */
export async function discharge(store: DocStore, root: string, assembly: Assembly, ref: { controller: string; stream: string; seq: number }, at: string = nowIso()): Promise<Receipt | null> {
  const path = figurePaths.intention(root, ref.controller, ref.stream, ref.seq);
  const entry = await store.get<OutboxEntry>(path);
  if (!entry || entry.status === 'done') return null;
  const controller = assembly.controllers.find((c) => c.id === ref.controller);
  if (!controller) throw new Error(`No controller ${ref.controller} is mounted`);
  const intention = await readFact(store, root, ref.stream, ref.seq);
  if (!intention) throw new Error(`Intention ${ref.stream}#${ref.seq} is not in the stream`);

  let drafts: readonly FactDraft[];
  try {
    drafts = await controller.discharge(intention, `${ref.stream}-${ref.seq}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const attempts = await store.transact(async (tx) => {
      const current = await tx.get<OutboxEntry>(path);
      if (!current || current.status === 'done') return null;
      tx.set(path, { ...current, attempts: current.attempts + 1, lastError: reason });
      return current.attempts + 1;
    });
    if (attempts === null) return null;
    const given = attempts >= dischargeAttempts ? controller.exhausted(intention, reason) : null;
    if (!given) throw error;
    drafts = given;
  }

  const close = async (tx: DocTransaction) => {
    const current = await tx.get<OutboxEntry>(path);
    if (current && current.status !== 'done') tx.set(path, { ...current, status: 'done' });
  };
  const receipt = await settle(store, root, assembly, {
    stream: ref.stream,
    at,
    actKey: `answer-${ref.seq}`,
    entering: drafts.map((draft) => ({ draft, origin: { via: 'world' as const, controller: controller.id, answering: ref.seq }, causedBy: ref.seq })),
    also: close,
  });
  // Another delivery's answer entered first: the intention is answered all the same.
  if (receipt.duplicate) await store.transact(close);
  return receipt;
}
