import type { UnitProfile } from '@river/psp-units';

const p = (unitId: string, en: string, uk: string, code: string, at: string, site: string | null, iban: string | null, initials: string, roleEn: string, roleUk: string): UnitProfile => ({
  unitId, legalName: { 'en-GB': en, uk }, registrationCode: code, registeredAt: at, legalAddress: { 'en-GB': 'Kyiv, Sadova St 12 (demo)', uk: 'Київ, вул. Садова, 12 (демо)' }, website: site,
  supportEmail: `support@${site ?? 'yarmarok.example'}`, supportPhone: '+380 44 300 12 34', iban, bank: iban ? 'Bank Dnipro (demo)' : null, contact: { initials, role: { 'en-GB': roleEn, uk: roleUk } },
});

/** Datasheets of the retail stand's legal entities. Every name, code and account is invented. */
export const retailProfiles: readonly UnitProfile[] = [
  p('rt-group', 'Yarmarok Group LLC', 'ТОВ «Група Ярмарок»', '41990012', '2019-03-01', 'yarmarok.example', null, 'O. V.', 'Head of payments', 'Керівниця платіжного напряму'),
  p('rt-retail', 'Yarmarok Retail LLC', 'ТОВ «Ярмарок Рітейл»', '41990013', '2019-03-01', 'yarmarok.example', 'UA813005280000026007300101001', 'N. K.', 'Finance controller', 'Фінансова контролерка'),
  p('rt-online', 'Yarmarok Online LLC', 'ТОВ «Ярмарок Онлайн»', '43550277', '2021-05-01', 'yarmarok.example', 'UA813005280000026007300101002', 'S. M.', 'E-commerce operations', 'Операції інтернет-магазину'),
];
