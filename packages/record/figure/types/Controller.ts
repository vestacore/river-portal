import type { Fact, FactDraft } from '@river/stream';

/**
 * The bank (NestVM: a controller at the membrane): the only kind of function that reaches the
 * world. It claims intentions — facts already written to the stream — and answers them with facts.
 * A refusal by the world is an answer; a thrown error means "try again". `key` is the idempotency
 * key to give the world: the same on every attempt, so the world acts once however often it is asked.
 *
 * After the last attempt `exhausted` decides what an unanswered intention means. Where nothing can
 * have happened — a page that was never opened — it turns the failure into a fact. Where the outcome
 * is unknown — money may have moved — it returns null: the intention stays in the outbox and is
 * tried again for as long as it takes, because saying "it failed" would be a guess.
 */
export type Controller = {
  id: string;
  claims: readonly string[];
  accepts?: (intention: Fact) => boolean;
  discharge: (intention: Fact, key: string) => Promise<readonly FactDraft[]>;
  exhausted: (intention: Fact, reason: string) => readonly FactDraft[] | null;
};
