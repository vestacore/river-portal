import type { LocalisedText } from '@river/i18n';
import type { PolicyGroup } from '../types/Policy.ts';
import type { UnitKind } from '../types/Unit.ts';

export const unitKindLabels: Record<UnitKind, LocalisedText> = {
  platform: { 'en-GB': 'Platform', uk: 'Платформа' },
  entity: { 'en-GB': 'Licensed entity', uk: 'Ліцензована особа' },
  partner: { 'en-GB': 'Partner', uk: 'Партнер' },
  holding: { 'en-GB': 'Holding', uk: 'Холдинг' },
  merchant: { 'en-GB': 'Merchant', uk: 'Мерчант' },
  store: { 'en-GB': 'Store', uk: 'Точка продажу' },
  seller: { 'en-GB': 'Seller', uk: 'Продавець' },
};

export const policyGroupLabels: Record<PolicyGroup, LocalisedText> = {
  limits: { 'en-GB': 'Limits', uk: 'Ліміти' },
  instruments: { 'en-GB': 'Instruments', uk: 'Інструменти' },
  risk: { 'en-GB': 'Risk and AML', uk: 'Ризики та фінмоніторинг' },
  capture: { 'en-GB': 'Capture and refunds', uk: 'Списання та повернення' },
  settlement: { 'en-GB': 'Settlement', uk: 'Розрахунки' },
  split: { 'en-GB': 'Split', uk: 'Розщеплення' },
  checkout: { 'en-GB': 'Pay page', uk: 'Сторінка оплати' },
  invoices: { 'en-GB': 'Invoices', uk: 'Інвойси' },
  agents: { 'en-GB': 'Agents', uk: 'Агенти' },
};
