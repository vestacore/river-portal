import type { Currency } from '@river/psp-facts';
import type { PaymentView } from '@river/psp-payment';
import type { SessionView } from '@river/psp-session';
import type { Kpis } from './types/Views.ts';

/** The headline figures of a set of sessions and payments in one currency, since `from`. */
export function kpisOf(sessions: readonly SessionView[], payments: readonly PaymentView[], currency: Currency, from: string): Kpis {
  const s = sessions.filter((x) => x.currency === currency && x.openedAt >= from);
  const p = payments.filter((x) => x.currency === currency && x.capturedAt !== null && x.capturedAt >= from);
  const grossMinor = p.reduce((sum, x) => sum + x.capturedMinor, 0);
  const refundedMinor = p.reduce((sum, x) => sum + x.refundedMinor, 0);
  const succeeded = s.filter((x) => x.outcome === 'succeeded').length;
  const secured = s.filter((x) => x.paymentId !== null).length;
  const refused = s.filter((x) => x.paymentId === null && x.outcome === 'failed').length;
  return {
    currency, grossMinor, payments: p.length, averageMinor: p.length ? Math.round(grossMinor / p.length) : 0,
    sessions: s.length, succeeded, conversionBps: s.length ? Math.round((succeeded / s.length) * 10_000) : 0,
    approvalBps: secured + refused ? Math.round((secured / (secured + refused)) * 10_000) : 0,
    refundedMinor, refundBps: grossMinor ? Math.round((refundedMinor / grossMinor) * 10_000) : 0,
    disputes: p.reduce((n, x) => n + x.disputes.length, 0), feeMinor: p.reduce((sum, x) => sum + x.feeMinor, 0),
  };
}
