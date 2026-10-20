import { payoutsDue } from '@river/psp-payment';
import { nearestOfKind } from '@river/psp-units';
import { counted } from './counted.ts';
import { moneyText } from './moneyText.ts';
import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';

const day = 86_400_000;

/**
 * The Treasurer: what each legal entity will owe in payouts over the next two days, by currency — so the
 * money is on its payout account in time. A forecast is of its day: each round's replaces the last one
 * still open for the same entity and currency.
 */
export function treasurerInsights(input: SwarmInput): InsightDraft[] {
  const horizon = new Date(Date.parse(input.now) + 2 * day).toISOString();
  const root = input.units.find((u) => u.parentId === null)?.id ?? 'root';
  const totals = new Map<string, { entity: string; currency: string; minor: number; recipients: Set<string>; payments: number }>();
  for (const p of input.payments) {
    const due = payoutsDue(p, horizon);
    if (due.length === 0) continue;
    const entity = nearestOfKind(input.units, p.unitId, 'entity')?.id ?? root;
    const key = `${entity}:${p.currency}`;
    const t = totals.get(key) ?? { entity, currency: p.currency, minor: 0, recipients: new Set<string>(), payments: 0 };
    for (const a of due) { t.minor += a.amountMinor; t.recipients.add(a.recipientUnitId); }
    t.payments += 1;
    totals.set(key, t);
  }
  return [...totals.values()].map((t) => {
    const money = moneyText(t.minor, t.currency);
    const name = nameOf(input.units, t.entity);
    const recipients = counted(t.recipients.size, ['recipient', 'recipients'], ['одержувача', 'одержувачів', 'одержувачів']);
    const payments = counted(t.payments, ['payment', 'payments'], ['платежу', 'платежів', 'платежів']);
    return {
      agent: 'treasurer' as const, unitId: t.entity, subject: { kind: 'currency' as const, id: `${t.currency}@${t.entity}:${input.now.slice(0, 10)}` }, series: `treasurer:${t.entity}:${t.currency}`,
      title: { 'en-GB': `${name['en-GB']}: payouts due in ${t.currency} within 48 hours`, uk: `${name.uk}: виплати в ${t.currency} протягом 48 годин` },
      finding: { 'en-GB': `${money['en-GB']} to ${recipients['en-GB']} from ${payments['en-GB']}.`, uk: `${money.uk} для ${recipients.uk} з ${payments.uk}.` },
      evidence: [],
      confidence: 0.92,
      proposal: { kind: 'prefund_payouts' as const, risk: 'high' as const, params: { currency: t.currency, entity: t.entity, amountMinor: t.minor },
        effect: { 'en-GB': `Make sure ${money['en-GB']} is on ${name['en-GB']}’s payout account by tomorrow morning.`, uk: `Забезпечити ${money.uk} на рахунку виплат ${name.uk} до завтрашнього ранку.` } },
      consulted: [],
    };
  });
}
