import type { KybCase } from '@river/psp-risk';
import { openAlert } from './openAlert.ts';
import type { World } from './types/World.ts';

const day = 86_400_000;
const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** Onboarding cases of the demo: two newcomers being checked, one periodic review, and two that were approved. */
export function seedOnboarding(world: World, now: string): void {
  const ago = (d: number) => new Date(Date.parse(now) - d * day).toISOString();
  const c = (id: string, unitId: string, stage: KybCase['stage'], status: KybCase['status'], risk: KybCase['risk'], opened: number, checks: KybCase['checks'], owners: KybCase['owners'], documents: KybCase['documents'], decided: number | null): KybCase => ({
    id, unitId, stage, status, risk, openedAt: ago(opened), updatedAt: ago(decided ?? Math.max(0, opened - 2)), checks, owners, documents,
    decidedBy: decided !== null ? 'p-marta' : null, decidedAt: decided !== null ? ago(decided) : null,
  });
  world.onboarding.push(
    c('kyb-vmh', 'ou-vilnius-hall', 'screening', 'open', 'medium', 14, [
      { check: 'registry', result: 'pass', note: t('Registered 2026-08-30, Vilnius', 'Зареєстровано 2026-08-30, Вільнюс') },
      { check: 'sanctions', result: 'review', note: t('An owner’s company resembles a listed name: Severny Bridge Exports', 'Компанія власника схожа на назву зі списку: Severny Bridge Exports') },
      { check: 'pep', result: 'pass', note: t('No politically exposed persons', 'Публічних діячів немає') },
      { check: 'adverse_media', result: 'pending', note: t('Search running', 'Пошук триває') },
      { check: 'ubo', result: 'review', note: t('40 % held through a Cypriot company', '40 % через кіпрську компанію') },
      { check: 'website', result: 'pass', note: t('Food hall, 32 vendors', 'Фуд-хол, 32 продавці') },
      { check: 'mcc', result: 'pass', note: t('5411 Grocery stores', '5411 Продуктові магазини') },
      { check: 'bank_account', result: 'pending', note: t('Statement not yet provided', 'Виписку ще не надано') },
    ], [{ initials: 'R. S.', sharePct: 60, pep: false, country: 'LT' }, { initials: 'G. D.', sharePct: 40, pep: false, country: 'CY' }],
    [{ title: t('Registry extract', 'Витяг з реєстру'), status: 'received' }, { title: t('Articles of association', 'Статут'), status: 'received' }, { title: t('Bank statement', 'Банківська виписка'), status: 'missing' }, { title: t('Ownership chart', 'Схема власності'), status: 'received' }], null),
    c('kyb-lis', 'ou-lis', 'documents', 'more_info', 'low', 7, [
      { check: 'registry', result: 'pass', note: t('EDRPOU 45290018', 'ЄДРПОУ 45290018') }, { check: 'sanctions', result: 'pass', note: t('No match', 'Збігів немає') }, { check: 'pep', result: 'pass', note: t('No match', 'Збігів немає') },
      { check: 'adverse_media', result: 'pass', note: t('Nothing found', 'Нічого не знайдено') }, { check: 'ubo', result: 'pass', note: t('One owner, 100 %', 'Один власник, 100 %') }, { check: 'website', result: 'review', note: t('The shop’s terms of return are missing', 'Немає умов повернення товару') },
      { check: 'mcc', result: 'pass', note: t('5992 Florists', '5992 Флористи') }, { check: 'bank_account', result: 'pending', note: t('IBAN not yet confirmed', 'IBAN ще не підтверджено') },
    ], [{ initials: 'B. M.', sharePct: 100, pep: false, country: 'UA' }], [{ title: t('Extract from the state register', 'Витяг з державного реєстру'), status: 'received' }, { title: t('Terms of return', 'Умови повернення'), status: 'missing' }, { title: t('IBAN confirmation', 'Підтвердження IBAN'), status: 'missing' }], null),
    c('kyb-amb', 'ou-amber', 'assessment', 'open', 'high', 5, [
      { check: 'registry', result: 'pass', note: t('Riga, since 2017', 'Рига, з 2017 року') }, { check: 'sanctions', result: 'pass', note: t('No match', 'Збігів немає') }, { check: 'pep', result: 'pass', note: t('No match', 'Збігів немає') },
      { check: 'adverse_media', result: 'pass', note: t('Nothing found', 'Нічого не знайдено') }, { check: 'ubo', result: 'pass', note: t('One owner', 'Один власник') }, { check: 'website', result: 'pass', note: t('Jewellery shop', 'Ювелірна крамниця') },
      { check: 'mcc', result: 'review', note: t('5944 Jewellery: high-risk for money laundering', '5944 Ювелірні вироби: високий ризик відмивання') }, { check: 'bank_account', result: 'pass', note: t('Confirmed', 'Підтверджено') },
    ], [{ initials: 'E. K.', sharePct: 100, pep: false, country: 'LV' }], [{ title: t('Annual review questionnaire', 'Анкета щорічного перегляду'), status: 'received' }, { title: t('Source of funds, large customers', 'Джерела коштів великих клієнтів'), status: 'missing' }], null),
    c('kyb-krok', 'ou-krok', 'done', 'approved', 'low', 430, [
      { check: 'registry', result: 'pass', note: t('EDRPOU 44812067', 'ЄДРПОУ 44812067') }, { check: 'sanctions', result: 'pass', note: t('No match', 'Збігів немає') }, { check: 'ubo', result: 'pass', note: t('Two founders', 'Двоє засновників') }, { check: 'mcc', result: 'pass', note: t('8299 Schools', '8299 Навчальні заклади') },
    ], [{ initials: 'A. Kh.', sharePct: 50, pep: false, country: 'UA' }, { initials: 'M. Kh.', sharePct: 50, pep: false, country: 'UA' }], [{ title: t('Registry extract', 'Витяг з реєстру'), status: 'received' }], 425),
    c('kyb-zuzh', 'ou-zerno-uzh', 'done', 'approved', 'medium', 450, [
      { check: 'registry', result: 'pass', note: t('FOP since 2023', 'ФОП з 2023 року') }, { check: 'sanctions', result: 'pass', note: t('No match', 'Збігів немає') }, { check: 'website', result: 'pass', note: t('Point of sale only', 'Лише точка продажу') }, { check: 'mcc', result: 'pass', note: t('5814 Cafés', '5814 Кав’ярні') },
    ], [{ initials: 'I. F.', sharePct: 100, pep: false, country: 'UA' }], [{ title: t('Franchise agreement', 'Договір франшизи'), status: 'received' }], 446),
  );
  const id = openAlert(world, { kind: 'sanctions', unitId: 'ou-vilnius-hall', sessionId: null, paymentId: null, amountMinor: 0, currency: 'EUR', score: 64, reasons: ['rule'], at: ago(13) });
  const alert = world.alerts.find((a) => a.id === id);
  if (alert) { alert.status = 'investigating'; alert.assignee = 'p-marta'; alert.notes.push({ at: ago(12), by: 'p-marta', text: t('Asked the merchant for the Cypriot company’s ownership chart', 'Запросила в мерчанта схему власності кіпрської компанії') }); }
}
