import { alertKindLabels, riskReasonLabels } from '@river/psp-risk';
import { moneyText } from './moneyText.ts';
import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';

const day = 86_400_000;

/**
 * The Analyst: alerts left without a decision for more than a day, with a drafted narrative. A threshold
 * alert alone is proposed for reporting and closure; structuring, sanctions or velocity for escalation.
 * The officer decides; the narrative is a draft, never a filing.
 */
export function analystInsights(input: SwarmInput): InsightDraft[] {
  const now = Date.parse(input.now);
  return input.alerts.filter((a) => (a.status === 'new' || a.status === 'investigating') && now - Date.parse(a.openedAt) > day).slice(0, 10).map((a) => {
    const serious = a.kind !== 'threshold' || a.reasons.some((r) => r === 'structuring' || r === 'velocity' || r === 'blocked_country');
    const merchant = nameOf(input.units, a.unitId);
    const reasons = (l: 'en-GB' | 'uk') => a.reasons.map((r) => riskReasonLabels[r][l].toLowerCase()).join('; ');
    const kyb = input.onboarding.find((c) => c.unitId === a.unitId);
    return {
      agent: 'analyst' as const, unitId: a.unitId, subject: { kind: 'alert' as const, id: a.id },
      title: { 'en-GB': `${alertKindLabels[a.kind]['en-GB']}: ${serious ? 'escalate' : 'report and close'}`, uk: `${alertKindLabels[a.kind].uk}: ${serious ? 'ескалювати' : 'звітувати й закрити'}` },
      finding: {
        'en-GB': `Draft narrative: ${moneyText(a.amountMinor, a.currency)['en-GB']} at ${merchant['en-GB']}, score ${a.score}; ${reasons('en-GB')}.${kyb ? ` Merchant onboarding risk: ${kyb.risk}.` : ''}`,
        uk: `Чернетка опису: ${moneyText(a.amountMinor, a.currency).uk} у ${merchant.uk}, бал ${a.score}; ${reasons('uk')}.${kyb ? ` Ризик мерчанта за онбордингом: ${kyb.risk}.` : ''}`,
      },
      evidence: [{ kind: 'alert' as const, id: a.id, note: alertKindLabels[a.kind] }, ...(a.paymentId ? [{ kind: 'payment' as const, id: a.paymentId, note: { 'en-GB': 'the payment', uk: 'платіж' } }] : [])],
      confidence: serious ? 0.66 : 0.83,
      proposal: serious
        ? { kind: 'escalate_alert' as const, risk: 'high' as const, params: { alertId: a.id }, effect: { 'en-GB': 'Escalate to the head of financial monitoring with this narrative.', uk: 'Ескалювати керівнику фінмоніторингу з цим описом.' } }
        : { kind: 'close_alert' as const, risk: 'high' as const, params: { alertId: a.id }, effect: { 'en-GB': 'File the threshold report and close the alert.', uk: 'Подати звіт про порогову операцію і закрити сповіщення.' } },
      consulted: [],
    };
  });
}
