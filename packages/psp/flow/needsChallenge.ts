import type { InstrumentId } from '@river/psp-facts';
import { policyValue, type EffectivePolicy } from '@river/psp-units';

/**
 * Whether a card attempt must be challenged (strong customer authentication), or passes frictionless
 * under an exemption: always when the unit says `always` or the issuer insists; under `risk_based`, a
 * low-risk attempt up to the low-value ceiling passes as `low_value`, and a very low score as `low_risk`.
 */
export function needsChallenge(input: { instrument: InstrumentId; amountMinor: number; score: number; level: 'low' | 'medium' | 'high'; issuerWants: boolean; effective: readonly EffectivePolicy[] }): { challenge: boolean; exemption: 'low_value' | 'low_risk' | null } {
  if (input.instrument !== 'card') return { challenge: false, exemption: null };
  if (input.issuerWants || policyValue(input.effective, 'sca.mode') === 'always') return { challenge: true, exemption: null };
  const ceiling = Number(policyValue(input.effective, 'sca.exemption.max') ?? 0);
  if (input.level === 'low' && input.amountMinor <= ceiling) return { challenge: false, exemption: 'low_value' };
  if (input.score < 15) return { challenge: false, exemption: 'low_risk' };
  return { challenge: true, exemption: null };
}
