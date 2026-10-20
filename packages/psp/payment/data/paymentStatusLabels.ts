import type { LocalisedText } from '@river/i18n';
import type { PaymentStatus } from '../types/PaymentStatus.ts';

export const paymentStatusLabels: Record<PaymentStatus, LocalisedText> = {
  authorised: { 'en-GB': 'Authorised', uk: 'Авторизовано' },
  received: { 'en-GB': 'Received', uk: 'Надійшло' },
  captured: { 'en-GB': 'Captured', uk: 'Списано' },
  partially_refunded: { 'en-GB': 'Partly refunded', uk: 'Частково повернено' },
  refunded: { 'en-GB': 'Refunded', uk: 'Повернено' },
  disputed: { 'en-GB': 'Disputed', uk: 'Спір' },
  chargeback: { 'en-GB': 'Charged back', uk: 'Чарджбек' },
  voided: { 'en-GB': 'Released', uk: 'Розблоковано' },
  expired: { 'en-GB': 'Hold expired', uk: 'Блокування сплило' },
};
