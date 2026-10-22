// THE DOOR — the domain's gestures turned into facts for the machines
// (Vol. 07 §6: ingress; ADR-0025's "act": validate, shape a draft, never
// decide). Four gestures: place an order, open an attempt to pay an
// invoice, answer a challenge, decide a review. Each names the machine
// through the router, writes the facts the gesture means on that machine's
// lane, lets the wave settle, and mirrors what the machine committed into
// the planes. The door holds the assembly's terms and writes them into every
// machine at its birth: a policy is a fact the programme reads, not a
// setting the code remembers. The door is also the clock: every fact it
// writes carries the moment it was given.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { DataFact } from "../../../learning/coagnes/nestvm/lib/application/gate";
import { LAB_ROOT, type Machines } from "./compose";
import { emptyPlanes, mirrorLog, type AttemptRow, type OrderRow, type Planes } from "./planes";
import { routeAttempt, routeAttemptFact, routeOrder } from "./router";
import type { Order, Terms } from "./types";

export type Door = {
  terms: Terms;
  planes: Planes;
  placeOrder(input: { orderId: string; amountMinor: number; currency?: string; payerRef: string; lines?: Order["lines"]; at: string }): Promise<{ order: OrderRow; invoiceId: string | null; upToOffset: number }>;
  openAttempt(input: { attemptId: string; invoiceId: string; bin: string; last4: string; at: string }): Promise<{ attempt: AttemptRow; upToOffset: number }>;
  answerChallenge(input: { attemptId: string; outcome: "passed" | "failed"; at: string }): Promise<{ attempt: AttemptRow; upToOffset: number }>;
  decideReview(input: { attemptId: string; decision: "clear" | "block"; actor: string; at: string }): Promise<{ attempt: AttemptRow; upToOffset: number }>;
  // Mirrors a session's committed log into the planes (idempotent by offset).
  mirror(session: string): Promise<number>;
  mirrorAll(): Promise<void>;
};

export function readTerms(file = path.join(LAB_ROOT, "assembly", "terms.json")): Terms {
  return JSON.parse(readFileSync(file, "utf8")) as Terms;
}

const ID = /^[a-z0-9][a-z0-9-]*$/;

export function createDoor(machines: Machines, terms: Terms, planes: Planes = emptyPlanes()): Door {
  // Annotated explicitly: TypeScript narrows after a call only when a `never`-returning function is declared with a type.
  const refuse: (message: string) => never = (message) => {
    throw new Error(message);
  };
  const mirror = async (session: string): Promise<number> => mirrorLog(planes, session, await machines.log(session));
  const attemptOf = (attemptId: string): AttemptRow => planes.attempts[attemptId] ?? refuse(`the planes know no attempt '${attemptId}'`);
  const termsFact = (at: string): DataFact => ({ factType: "terms.given", data: { ...terms, at } });

  return {
    terms,
    planes,
    mirror,
    async mirrorAll() {
      for (const session of await machines.sessions()) await mirror(session);
    },

    async placeOrder(input) {
      if (!ID.test(input.orderId)) refuse(`'${input.orderId}' is not a plain id`);
      if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) refuse("the amount must be a positive integer of minor units");
      if (!ID.test(input.payerRef)) refuse("the payer is a handle, never a name or an address");
      if (planes.orders[input.orderId]) refuse(`order '${input.orderId}' already exists`);
      const route = routeOrder(input.orderId);
      if (!route.ok) refuse(route.error);
      const order: Order = { orderId: input.orderId, unitId: terms.unitId, merchantId: terms.merchantId, amountMinor: input.amountMinor, currency: input.currency ?? terms.currency, payerRef: input.payerRef, lines: input.lines ?? [], at: input.at };
      await machines.open(route.session, route.programme);
      const receipt = await machines.commit(route.session, [termsFact(input.at), { factType: "order.Created", data: { ...order } }]);
      await mirror(route.session);
      const row = planes.orders[input.orderId] ?? refuse("the order did not reach the planes");
      return { order: row, invoiceId: row.invoiceId, upToOffset: receipt.upToOffset };
    },

    async openAttempt(input) {
      if (!ID.test(input.attemptId)) refuse(`'${input.attemptId}' is not a plain id`);
      if (!/^\d{6}$/.test(input.bin) || !/^\d{4}$/.test(input.last4)) refuse("only the BIN and the last four digits of a card reach the door");
      const route = routeAttempt(planes, input.invoiceId, input.attemptId);
      if (!route.ok) refuse(route.error);
      const invoice = planes.invoices[input.invoiceId]!;
      // The invoice crosses the machine boundary as content, stamped with where it was read from (rail 4).
      const represented: DataFact = {
        factType: "invoice.Issued",
        data: { invoiceId: invoice.invoiceId, orderId: invoice.orderId, unitId: terms.unitId, merchantId: terms.merchantId, amountMinor: invoice.amountMinor, currency: invoice.currency, payerRef: invoice.payerRef, dueAt: invoice.dueAt, represented: route.context!.invoice }
      };
      await machines.open(route.session, route.programme);
      const receipt = await machines.commit(route.session, [
        termsFact(input.at),
        represented,
        { factType: "session.Opened", data: { sessionId: input.attemptId, invoiceId: input.invoiceId, at: input.at } },
        { factType: "instrument.Chosen", data: { sessionId: input.attemptId, instrument: "card", bin: input.bin, last4: input.last4, at: input.at } }
      ]);
      await mirror(route.session);
      return { attempt: attemptOf(input.attemptId), upToOffset: receipt.upToOffset };
    },

    async answerChallenge(input) {
      const route = routeAttemptFact(planes, input.attemptId, "challenge");
      if (!route.ok) refuse(route.error);
      const receipt = await machines.commit(route.session, [{ factType: input.outcome === "passed" ? "authentication.Passed" : "authentication.Failed", data: { sessionId: input.attemptId, method: "3ds", at: input.at } }]);
      await mirror(route.session);
      return { attempt: attemptOf(input.attemptId), upToOffset: receipt.upToOffset };
    },

    async decideReview(input) {
      const route = routeAttemptFact(planes, input.attemptId, "review");
      if (!route.ok) refuse(route.error);
      if (!ID.test(input.actor)) refuse("the actor is a handle");
      const receipt = await machines.commit(route.session, [{ factType: input.decision === "clear" ? "review.Cleared" : "review.Blocked", data: { sessionId: input.attemptId, actor: input.actor, at: input.at } }]);
      await mirror(route.session);
      return { attempt: attemptOf(input.attemptId), upToOffset: receipt.upToOffset };
    }
  };
}
