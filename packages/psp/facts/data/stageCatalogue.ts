import type { LocalisedText } from '@river/i18n';
import type { Stage } from '../types/Stage.ts';

/** The sections of the river, with their names and what happens in each. */
export const stageCatalogue: ReadonlyArray<{ stage: Stage; label: LocalisedText; meaning: LocalisedText }> = [
  { stage: 'source', label: { 'en-GB': 'Source', uk: 'Витік' }, meaning: { 'en-GB': 'An invoice is in front of a payer.', uk: 'Інвойс перед платником.' } },
  { stage: 'choice', label: { 'en-GB': 'Choice', uk: 'Вибір' }, meaning: { 'en-GB': 'The payer chooses an instrument.', uk: 'Платник обирає інструмент.' } },
  { stage: 'screening', label: { 'en-GB': 'Screening', uk: 'Перевірка' }, meaning: { 'en-GB': 'Risk and AML rules look at the attempt.', uk: 'Правила ризиків і фінмоніторингу оцінюють спробу.' } },
  { stage: 'routing', label: { 'en-GB': 'Routing', uk: 'Маршрут' }, meaning: { 'en-GB': 'A rule chooses the rail and the acquirer.', uk: 'Правило обирає рейку та еквайра.' } },
  { stage: 'consent', label: { 'en-GB': 'Consent', uk: 'Згода' }, meaning: { 'en-GB': 'The payer gives their word: 3-D Secure, a bank app, a scan, a mandate.', uk: 'Платник дає згоду: 3-D Secure, банківський застосунок, сканування, мандат.' } },
  { stage: 'secured', label: { 'en-GB': 'Secured', uk: 'Забезпечено' }, meaning: { 'en-GB': 'The funds are held or have arrived.', uk: 'Кошти заблоковано або вони надійшли.' } },
  { stage: 'capture', label: { 'en-GB': 'Capture', uk: 'Списання' }, meaning: { 'en-GB': 'The money is taken: unpaid becomes paid.', uk: 'Гроші списано: несплачене стає сплаченим.' } },
  { stage: 'distribution', label: { 'en-GB': 'Distribution', uk: 'Розподіл' }, meaning: { 'en-GB': 'The split: every share to its recipient, balanced in the ledger.', uk: 'Розщеплення: кожна частка — своєму одержувачу, збалансовано в обліку.' } },
  { stage: 'mouth', label: { 'en-GB': 'Mouth', uk: 'Гирло' }, meaning: { 'en-GB': 'Paid: a receipt for the payer, the attempt closed.', uk: 'Сплачено: квитанція платнику, спробу завершено.' } },
];
