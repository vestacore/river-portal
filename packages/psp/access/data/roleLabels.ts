import type { LocalisedText } from '@river/i18n';
import type { PspRole } from '../types/Access.ts';

export const roleLabels: Record<PspRole, LocalisedText> = {
  hierarchy_admin: { 'en-GB': 'Hierarchy administrator', uk: 'Адміністратор ієрархії' },
  operator: { 'en-GB': 'Operator', uk: 'Операціоніст' },
  compliance_officer: { 'en-GB': 'AML and compliance officer', uk: 'Фахівець з AML і комплаєнсу' },
  access_manager: { 'en-GB': 'Contracts and access manager', uk: 'Менеджер договорів і доступів' },
  checkout_designer: { 'en-GB': 'Pay page designer', uk: 'Дизайнер сторінки оплати' },
  integrator: { 'en-GB': 'Integrator', uk: 'Інтегратор' },
  merchant_owner: { 'en-GB': 'Merchant owner', uk: 'Власник мерчанта' },
  auditor: { 'en-GB': 'Auditor', uk: 'Аудитор' },
};
