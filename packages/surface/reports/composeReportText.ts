import { formatDate, formatMoney, pickText, pluralise, type Locale } from '@river/i18n';
import { findCategory } from '@river/needs';
import { describeRecipientPublicly } from '@river/privacy';
import type { ReportFacts } from './types/ReportFacts.ts';

const costLabels: Record<string, Record<Locale, string>> = {
  fuel: { 'en-GB': 'fuel', uk: 'пальне' }, ferry: { 'en-GB': 'ferry', uk: 'пором' }, tolls: { 'en-GB': 'road tolls', uk: 'платні дороги' },
  postage: { 'en-GB': 'postage', uk: 'пересилання' }, packaging: { 'en-GB': 'packaging', uk: 'пакування' }, customs: { 'en-GB': 'customs', uk: 'митні збори' },
  vehicle: { 'en-GB': 'vehicle', uk: 'транспорт' }, other: { 'en-GB': 'other costs', uk: 'інші витрати' },
};
const carrierLabels: Record<string, Record<Locale, string>> = {
  volunteer: { 'en-GB': 'a volunteer driver', uk: 'водій-волонтер' }, courier: { 'en-GB': 'a courier', uk: "кур'єр" },
  postal: { 'en-GB': 'the postal service', uk: 'пошта' }, company: { 'en-GB': 'a logistics company', uk: 'логістична компанія' },
  partner: { 'en-GB': 'a partner organisation', uk: 'організація-партнер' },
};

/** A first draft of a report in one locale: title and paragraphs, pseudonymised and factual. */
export function composeReportText(facts: ReportFacts, locale: Locale): { title: string; paragraphs: string[] } {
  const who = facts.recipients.map((r) => describeRecipientPublicly(r.kind, facts.oblastId, locale));
  const what = facts.categoryIds.map((id) => pickText(findCategory(id)?.label, locale).toLowerCase()).join(', ');
  const when = facts.arrivedAt ? formatDate(facts.arrivedAt, locale) : '';
  const costs = Object.entries(facts.costBreakdown)
    .map(([kind, minor]) => `${costLabels[kind]?.[locale] ?? kind} ${formatMoney(minor ?? 0, facts.currency, locale)}`)
    .join(', ');
  const carrier = carrierLabels[facts.carrierKind ?? '']?.[locale] ?? '';
  const paragraphs: string[] = [];
  if (locale === 'uk') {
    const title = `Допомога дійшла: ${what}`;
    paragraphs.push(`${when ? `${when} ` : ''}допомога (${what}) дійшла до адресатів: ${who.join('; ')}.`);
    if (carrier) paragraphs.push(`Її привіз ${carrier}${facts.fromLabel ? ` із пункту «${facts.fromLabel}»` : ''}.`);
    const gifts = pluralise(facts.giftsCount, locale, { one: '{n} дар', few: '{n} дари', many: '{n} дарів', other: '{n} дару' });
    paragraphs.push(`У цій доставці — ${gifts}${facts.moneyMinor ? `, з них грошима ${formatMoney(facts.moneyMinor, facts.currency, locale)}` : ''}.`);
    if (costs) paragraphs.push(`Витрати на доставку — ${formatMoney(facts.costsMinor, facts.currency, locale)} (${costs}). Ми показуємо їх відкрито, бо чесні цифри — частина дару.`);
    if (facts.confirmedAt) paragraphs.push(facts.gratitude ? 'Отримувачі підтвердили, що все дійшло, і передали подяку всім, хто допомагав.' : 'Отримувачі підтвердили, що все дійшло.');
    return { title, paragraphs };
  }
  const title = `Help arrived: ${what}`;
  paragraphs.push(`${when ? `On ${when}, ` : ''}help (${what}) reached ${who.join('; ')}.`);
  if (carrier) paragraphs.push(`It was carried by ${carrier}${facts.fromLabel ? ` from ${facts.fromLabel}` : ''}.`);
  paragraphs.push(`${facts.giftsCount} ${facts.giftsCount === 1 ? 'gift' : 'gifts'} flowed into this delivery${facts.moneyMinor ? `, including ${formatMoney(facts.moneyMinor, facts.currency, locale)} in money` : ''}.`);
  if (costs) paragraphs.push(`Delivery costs came to ${formatMoney(facts.costsMinor, facts.currency, locale)} (${costs}). We show them openly, because honest numbers are part of the gift.`);
  if (facts.confirmedAt) paragraphs.push(facts.gratitude ? 'The recipients confirmed that everything arrived, and sent their thanks to everyone who helped.' : 'The recipients confirmed that everything arrived.');
  return { title, paragraphs };
}
