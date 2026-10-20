import type { RiskReason, RiskSignals } from './types/Risk.ts';

/**
 * The risk score of one attempt, 0–100, with its reasons, and what it means under the unit's thresholds:
 * pass, hold for a compliance officer's review, or block. Deterministic: the same signals always give the
 * same score, so a decision can be replayed and explained.
 */
export function scoreAttempt(signals: RiskSignals, reviewAt: number, blockAt: number): { score: number; level: 'low' | 'medium' | 'high'; reasons: RiskReason[]; decision: 'pass' | 'review' | 'block' } {
  const reasons: RiskReason[] = [];
  let score = 8;
  const add = (points: number, reason: RiskReason) => { score += points; reasons.push(reason); };
  if (signals.blockedCountries.includes(signals.payerCountry) || (signals.issuerCountry && signals.blockedCountries.includes(signals.issuerCountry))) add(90, 'blocked_country');
  if (signals.typicalMinor > 0 && signals.amountMinor > signals.typicalMinor * 6) add(28, 'amount_spike');
  else if (signals.typicalMinor > 0 && signals.amountMinor > signals.typicalMinor * 3) add(14, 'amount_spike');
  if (signals.attempts24h >= 6) add(30, 'velocity');
  else if (signals.attempts24h >= 3) add(12, 'velocity');
  if (signals.issuerCountry && signals.issuerCountry !== signals.payerCountry) add(16, 'country_mismatch');
  if (signals.newPayer) add(6, 'new_payer');
  if (signals.hour >= 1 && signals.hour < 5) add(7, 'night_time');
  if (signals.mccRisk === 'high') add(14, 'high_risk_mcc');
  else if (signals.mccRisk === 'medium') score += 4;
  if (signals.instrument === 'stablecoin') add(12, 'crypto');
  if (signals.reportThresholdMinor !== null) {
    if (signals.amountMinor >= signals.reportThresholdMinor) add(30, 'threshold');
    else if (signals.amount24hMinor + signals.amountMinor >= signals.reportThresholdMinor && signals.amountMinor >= signals.reportThresholdMinor * 0.25) add(26, 'structuring');
  }
  const capped = Math.max(0, Math.min(100, score));
  const level = capped >= 70 ? 'high' : capped >= 40 ? 'medium' : 'low';
  const decision = capped >= blockAt ? 'block' : capped >= reviewAt ? 'review' : 'pass';
  return { score: capped, level, reasons, decision };
}
