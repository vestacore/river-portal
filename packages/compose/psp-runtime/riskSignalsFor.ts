import type { InstrumentDetail, InstrumentId } from '@river/psp-facts';
import type { RiskSignals } from '@river/psp-risk';
import type { SessionView } from '@river/psp-session';
import { policyValue } from '@river/psp-units';
import { effectiveFor } from './effectiveFor.ts';
import type { World } from './types/World.ts';

const day = 86_400_000;
const highRisk = new Set(['5944', '4722', '5993', '7995']);
const mediumRisk = new Set(['5912', '8299', '5734']);

/** What the screening of an attempt looks at, read from the world as it is at that moment. */
export function riskSignalsFor(world: World, session: SessionView, instrument: InstrumentId, detail: InstrumentDetail, at: string): RiskSignals {
  const order = world.views.orders.get(session.orderId);
  const payer = order ? world.caches.payer.get(order.payerRef) ?? [] : [];
  const now = Date.parse(at);
  const recent = payer.filter((x) => now - x.at < day);
  const amounts = world.caches.merchantAmounts.get(session.merchantId) ?? [];
  const sorted = [...amounts].sort((a, b) => a - b);
  const effective = effectiveFor(world, session.unitId);
  const mcc = world.units.find((u) => u.id === session.merchantId)?.mcc ?? '';
  const threshold = policyValue(effective, 'aml.threshold.report');
  return {
    amountMinor: session.amountMinor, currency: session.currency, typicalMinor: sorted[Math.floor(sorted.length / 2)] ?? session.amountMinor,
    instrument, payerCountry: session.country, issuerCountry: detail.issuerCountry ?? null,
    blockedCountries: (policyValue(effective, 'risk.countries.blocked') as string[] | null) ?? [],
    attempts24h: recent.length, amount24hMinor: recent.reduce((s, x) => s + x.amountMinor, 0), newPayer: payer.length === 0,
    hour: (new Date(at).getUTCHours() + 3) % 24, mccRisk: highRisk.has(mcc) ? 'high' : mediumRisk.has(mcc) ? 'medium' : 'low',
    reportThresholdMinor: typeof threshold === 'number' ? threshold : null,
  };
}
