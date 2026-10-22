import type { LocalisedText } from '@river/i18n';
import type { DisputeOpened } from '@river/psp-facts';
import type { RefundReason } from '../types/Reasons.ts';

export const refundReasonLabels: Record<RefundReason, LocalisedText> = {
  requested_by_customer: { 'en-GB': 'Asked for by the customer', uk: 'На прохання покупця' },
  returned: { 'en-GB': 'Returned by the customer', uk: 'Покупець повернув товар' },
  damaged: { 'en-GB': 'Damaged in transit', uk: 'Пошкоджено під час доставки' },
  not_delivered: { 'en-GB': 'Not delivered', uk: 'Не доставлено' },
  picked_less: { 'en-GB': 'Picked for less than was paid', uk: 'Скомплектовано на меншу суму, ніж сплачено' },
  duplicate: { 'en-GB': 'Duplicate order', uk: 'Дубль замовлення' },
  cancelled: { 'en-GB': 'Cancelled by the customer', uk: 'Скасовано покупцем' },
  other: { 'en-GB': 'Other', uk: 'Інше' },
};

export const disputeReasonLabels: Record<DisputeOpened['reason'], LocalisedText> = {
  fraud: { 'en-GB': 'Fraud: the cardholder did not pay', uk: 'Шахрайство: власник картки не платив' },
  not_received: { 'en-GB': 'Goods not received', uk: 'Товар не отримано' },
  not_as_described: { 'en-GB': 'Not as described', uk: 'Не відповідає опису' },
  duplicate: { 'en-GB': 'Charged twice', uk: 'Подвійне списання' },
  cancelled_subscription: { 'en-GB': 'Subscription cancelled', uk: 'Підписку скасовано' },
};
