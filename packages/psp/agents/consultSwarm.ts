import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

/**
 * The swarm looks at each other's findings before a person does: the Analyst adds the merchant's
 * onboarding risk to the Sentinel's alerts; the Sentinel says whether a payer behind an overdue invoice
 * shows signs of fraud; the Treasurer says what a reconciliation break holds back. Each note moves the
 * confidence a little — it never decides.
 */
export function consultSwarm(drafts: readonly InsightDraft[], input: SwarmInput): InsightDraft[] {
  return drafts.map((draft) => {
    const consulted = [...draft.consulted];
    let confidence = draft.confidence;
    if (draft.agent === 'sentinel') {
      const kyb = input.onboarding.find((c) => input.units.some((u) => u.id === draft.unitId && (u.id === c.unitId || u.parentId === c.unitId)));
      if (kyb) {
        consulted.push({ agent: 'analyst', note: { 'en-GB': `Merchant onboarding risk: ${kyb.risk}.`, uk: `Ризик мерчанта за онбордингом: ${kyb.risk}.` } });
        confidence += kyb.risk === 'high' ? 0.08 : kyb.risk === 'low' ? -0.05 : 0;
      }
    }
    if (draft.agent === 'collector') {
      const invoice = input.invoices.find((i) => i.invoiceId === draft.subject.id);
      const failed = invoice ? input.sessions.filter((s) => s.invoiceId === invoice.invoiceId && s.outcome === 'failed').length : 0;
      consulted.push({ agent: 'sentinel', note: failed > 2
        ? { 'en-GB': `${counted(failed, ['failed attempt', 'failed attempts'], ['невдала спроба', 'невдалі спроби', 'невдалих спроб'])['en-GB']} on this invoice: check before reminding.`, uk: `${counted(failed, ['failed attempt', 'failed attempts'], ['невдала спроба', 'невдалі спроби', 'невдалих спроб']).uk} за цим інвойсом: перевірте перед нагадуванням.` }
        : { 'en-GB': 'No fraud signals on this invoice.', uk: 'Ознак шахрайства за цим інвойсом немає.' } });
      if (failed > 2) confidence -= 0.2;
    }
    if (draft.agent === 'reconciler' && draft.subject.kind === 'payment') {
      const payment = input.payments.find((p) => p.paymentId === draft.subject.id);
      if (payment) {
        const n = counted(payment.allocations.filter((a) => a.role !== 'psp_fee').length, ['payout', 'payouts'], ['виплату', 'виплати', 'виплат']);
        consulted.push({ agent: 'treasurer', note: { 'en-GB': `This break holds back ${n['en-GB']}.`, uk: `Ця розбіжність затримує ${n.uk}.` } });
      }
    }
    return { ...draft, consulted, confidence: Math.max(0.05, Math.min(0.97, Math.round(confidence * 100) / 100)) };
  });
}
