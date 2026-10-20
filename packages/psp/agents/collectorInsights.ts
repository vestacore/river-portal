import { invoiceDueMinor, invoiceStatusAt } from '@river/psp-invoice';
import { moneyText } from './moneyText.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

const day = 86_400_000;

/**
 * The Collector: unpaid invoices due within three days or overdue, with no reminder in the last three
 * days. A reminder is low-risk: where a unit lets agents act alone, the policy may send it without a person.
 */
export function collectorInsights(input: SwarmInput): InsightDraft[] {
  const now = Date.parse(input.now);
  return input.invoices
    .filter((inv) => {
      const status = invoiceStatusAt(inv, input.now);
      if (status === 'paid' || status === 'void' || status === 'refunded' || status === 'partially_refunded') return false;
      const dueIn = Date.parse(inv.dueAt) - now;
      const lastReminder = inv.reminders.at(-1);
      return dueIn < 3 * day && dueIn > -30 * day && (!lastReminder || now - Date.parse(lastReminder.at) > 3 * day);
    })
    .sort((a, b) => invoiceDueMinor(b) - invoiceDueMinor(a))
    .slice(0, 14)
    .map((inv) => {
      const overdueDays = Math.floor((now - Date.parse(inv.dueAt)) / day);
      const due = moneyText(invoiceDueMinor(inv), inv.currency);
      const when = overdueDays > 0 ? { 'en-GB': `${counted(overdueDays, ['day', 'days'], ['день', 'дні', 'днів'])['en-GB']} overdue`, uk: `прострочено на ${counted(overdueDays, ['day', 'days'], ['день', 'дні', 'днів']).uk}` } : { 'en-GB': 'due within three days', uk: 'строк — до трьох днів' };
      return {
        agent: 'collector' as const, unitId: inv.unitId, subject: { kind: 'invoice' as const, id: inv.invoiceId },
        title: { 'en-GB': `Invoice ${inv.number}: ${when['en-GB']}`, uk: `Інвойс ${inv.number}: ${when.uk}` },
        finding: { 'en-GB': `${due['en-GB']} still due; viewed ${counted(inv.views, ['time', 'times'], ['раз', 'рази', 'разів'])['en-GB']}, ${counted(inv.attempts.opened, ['attempt', 'attempts'], ['спроба', 'спроби', 'спроб'])['en-GB']}, ${counted(inv.reminders.length, ['reminder', 'reminders'], ['нагадування', 'нагадування', 'нагадувань'])['en-GB']} so far.`, uk: `До сплати ще ${due.uk}; досі переглядів — ${inv.views}, спроб — ${inv.attempts.opened}, нагадувань — ${inv.reminders.length}.` },
        evidence: [{ kind: 'invoice' as const, id: inv.invoiceId, note: { 'en-GB': `due ${inv.dueAt.slice(0, 10)}`, uk: `строк ${inv.dueAt.slice(0, 10)}` } }],
        confidence: inv.views > 0 ? 0.74 : 0.61,
        proposal: { kind: 'send_reminder' as const, risk: 'low' as const, params: { invoiceId: inv.invoiceId, step: inv.reminders.length, channel: inv.views > 0 ? 'messenger' : 'email' },
          effect: { 'en-GB': `Send reminder ${inv.reminders.length + 1} by ${inv.views > 0 ? 'messenger' : 'e-mail'} with the pay link.`, uk: `Надіслати нагадування ${inv.reminders.length + 1} ${inv.views > 0 ? 'у месенджер' : 'на e-mail'} з посиланням на оплату.` } },
        consulted: [],
      };
    });
}
