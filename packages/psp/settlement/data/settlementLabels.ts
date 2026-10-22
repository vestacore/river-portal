import type { LocalisedText } from '@river/i18n';
import type { BatchDifference, ReconciliationStatus } from '../types/Reconciliation.ts';
import type { SettlementChannel, SettlementView } from '../types/SettlementView.ts';

const t = (en: string, uk: string): LocalisedText => ({ 'en-GB': en, uk });

export const reconciliationStatusLabels: Record<ReconciliationStatus, LocalisedText> = {
  not_reported: t('Not reported', 'Немає звіту'),
  not_credited: t('Not credited', 'Не зараховано'),
  short_credit: t('Credit differs', 'Зарахування відрізняється'),
  fee_difference: t('Fee differs', 'Комісія відрізняється'),
  gross_difference: t('Amount differs', 'Сума відрізняється'),
  resolved: t('Resolved', 'Вирішено'),
  awaiting_report: t('Report expected', 'Очікується звіт'),
  awaiting_credit: t('Credit expected', 'Очікується зарахування'),
  matched: t('Matched', 'Звірено'),
};

export const settlementChannelLabels: Record<SettlementChannel, LocalisedText> = {
  online: t('Online', 'Онлайн'),
  in_store: t('In store', 'У магазині'),
  loyalty: t('Bonus points', 'Бонусні бали'),
};

export const differenceLabels: Record<BatchDifference['kind'], LocalisedText> = {
  report: t('No report from the provider', 'Немає звіту провайдера'),
  gross: t('Gross amount', 'Сума брутто'),
  fee: t('Provider’s fee', 'Комісія провайдера'),
  credit: t('Bank credit', 'Зарахування банком'),
};

export const resolutionLabels: Record<SettlementView['resolutions'][number]['resolution'], LocalisedText> = {
  accepted: t('Accepted', 'Прийнято'),
  claim_raised: t('Claim raised with the provider', 'Подано претензію провайдеру'),
  written_off: t('Written off', 'Списано'),
  corrected: t('Corrected', 'Виправлено'),
};
