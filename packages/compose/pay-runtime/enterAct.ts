import { cancelOrderAs } from './cancelOrderAs.ts';
import { placeOrderAs } from './placeOrderAs.ts';
import { requestCheckoutFor } from './requestCheckoutFor.ts';
import { simulateOutcome } from './simulateOutcome.ts';
import type { DoorAct } from './types/DoorAct.ts';
import type { DoorAnswer } from './types/DoorAnswer.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/** The door itself: one gesture in, one answer out. Everything a person can say to the river passes here. */
export async function enterAct(runtime: PayRuntime, act: DoorAct, at: Date = new Date()): Promise<DoorAnswer> {
  switch (act.act) {
    case 'placeOrder': {
      const placed = await placeOrderAs(runtime, act.merchantId, act.input, at);
      return placed.ok ? { ok: true, orderId: placed.value.orderId, status: 'invoiced', payKey: placed.value.payKey, redirectUrl: null, standIn: false } : placed;
    }
    case 'requestCheckout': {
      const asked = await requestCheckoutFor(runtime, act.by, at);
      return asked.ok ? { ok: true, orderId: asked.value.orderId, status: asked.value.status, payKey: null, redirectUrl: asked.value.redirectUrl, standIn: asked.value.standIn } : asked;
    }
    case 'cancelOrder': {
      const cancelled = await cancelOrderAs(runtime, act.by, act.orderId, act.reason, at);
      return cancelled.ok ? { ok: true, orderId: cancelled.value.orderId, status: cancelled.value.status, payKey: null, redirectUrl: null, standIn: false } : cancelled;
    }
    case 'simulateOutcome': {
      const reported = await simulateOutcome(runtime, act.sessionRef, act.outcome, act.by, at);
      return reported.ok ? { ok: true, orderId: reported.value.orderId, status: reported.value.status, payKey: null, redirectUrl: null, standIn: false } : reported;
    }
  }
}
