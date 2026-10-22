import type { LocalisedText } from '@river/i18n';
import type { PspRole } from '../types/Access.ts';

export const roleLabels: Record<PspRole, LocalisedText> = {
  hierarchy_admin: { 'en-GB': 'Hierarchy administrator', uk: 'Адміністратор ієрархії' },
  operator: { 'en-GB': 'Operator', uk: 'Операціоніст' },
  compliance_officer: { 'en-GB': 'AML and compliance officer', uk: 'Фахівець з AML і комплаєнсу' },
  access_manager: { 'en-GB': 'Contracts and access manager', uk: 'Менеджер договорів і доступів' },
  checkout_designer: { 'en-GB': 'Pay page designer', uk: 'Дизайнер сторінки оплати' },
  integrator: { 'en-GB': 'Integrator', uk: 'Інтегратор' },
  payments_manager: { 'en-GB': 'Payments manager: routing and costs', uk: 'Менеджер платежів: маршрутизація і витрати' },
  finance_controller: { 'en-GB': 'Finance controller: reconciliation', uk: 'Фінансовий контролер: звірка' },
  merchant_owner: { 'en-GB': 'Merchant owner', uk: 'Власник мерчанта' },
  auditor: { 'en-GB': 'Auditor', uk: 'Аудитор' },
};
