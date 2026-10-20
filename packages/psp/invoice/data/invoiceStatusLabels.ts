import type { LocalisedText } from '@river/i18n';
import type { InvoiceStatus } from '../types/InvoiceStatus.ts';

export const invoiceStatusLabels: Record<InvoiceStatus, LocalisedText> = {
  issued: { 'en-GB': 'Issued', uk: 'Виставлено' },
  viewed: { 'en-GB': 'Viewed', uk: 'Переглянуто' },
  partially_paid: { 'en-GB': 'Partly paid', uk: 'Сплачено частково' },
  paid: { 'en-GB': 'Paid', uk: 'Сплачено' },
  partially_refunded: { 'en-GB': 'Partly refunded', uk: 'Частково повернено' },
  refunded: { 'en-GB': 'Refunded', uk: 'Повернено' },
  overdue: { 'en-GB': 'Overdue', uk: 'Прострочено' },
  void: { 'en-GB': 'Void', uk: 'Анульовано' },
};
