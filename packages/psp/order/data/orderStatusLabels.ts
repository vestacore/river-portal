import type { LocalisedText } from '@river/i18n';
import type { FulfilmentState, OrderStatus } from '../types/OrderStatus.ts';

export const orderStatusLabels: Record<OrderStatus, LocalisedText> = {
  awaiting_payment: { 'en-GB': 'Awaiting payment', uk: 'Очікує оплати' },
  authorised: { 'en-GB': 'Authorised', uk: 'Авторизовано' },
  partially_paid: { 'en-GB': 'Partly paid', uk: 'Сплачено частково' },
  paid: { 'en-GB': 'Paid', uk: 'Сплачено' },
  partially_refunded: { 'en-GB': 'Partly refunded', uk: 'Частково повернено' },
  refunded: { 'en-GB': 'Refunded', uk: 'Повернено' },
  disputed: { 'en-GB': 'Disputed', uk: 'Спір' },
  cancelled: { 'en-GB': 'Cancelled', uk: 'Скасовано' },
};

export const fulfilmentLabels: Record<FulfilmentState, LocalisedText> = {
  none: { 'en-GB': 'Not started', uk: 'Не розпочато' },
  accepted: { 'en-GB': 'In work', uk: 'У роботі' },
  picked: { 'en-GB': 'Picked', uk: 'Скомплектовано' },
  shipped: { 'en-GB': 'Shipped', uk: 'Відправлено' },
  delivered: { 'en-GB': 'Delivered', uk: 'Доставлено' },
};
