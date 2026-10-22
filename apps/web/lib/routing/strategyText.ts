import type { Locale } from '@river/i18n';
import { lt } from '../lt';

const words: Record<string, { name: [string, string]; line: [string, string] }> = {
  approval_first: {
    name: ['Approval first', 'Спершу схвалення'],
    line: ['Traffic is shared by approval rate: the acquirer that approves most often takes the larger share. Cost is not compared.', 'Трафік ділиться за рівнем схвалення: еквайр, що схвалює найчастіше, отримує більшу частку. Вартість не порівнюється.'],
  },
  least_cost: {
    name: ['Least cost', 'Найменша вартість'],
    line: ['The acquirer with the lowest expected fee under your terms, among those whose approval rate meets the threshold.', 'Еквайр із найменшою очікуваною комісією за вашими умовами — серед тих, чий рівень схвалення не нижчий за поріг.'],
  },
  on_us_first: {
    name: ['On-us first', 'Спершу on-us'],
    line: ['The acquirer of the bank that issued the card, when your terms price it and it meets the threshold; otherwise least cost.', 'Еквайр банку, що випустив картку, якщо ваші умови його передбачають і він проходить поріг; інакше — найменша вартість.'],
  },
};

/** A routing strategy as people read it: its name and what it does, in one line. */
export function strategyText(strategy: string | null | undefined, locale: Locale): { name: string; line: string } {
  const t = lt(locale);
  const w = strategy ? words[strategy] : undefined;
  if (!w) return { name: strategy ?? '—', line: '' };
  return { name: t(...w.name), line: t(...w.line) };
}
