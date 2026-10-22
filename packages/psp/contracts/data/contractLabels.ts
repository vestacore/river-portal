import type { LocalisedText } from '@river/i18n';
import type { ContractKind, ContractStatus } from '../types/Contract.ts';

export const contractStatusLabels: Record<ContractStatus, LocalisedText> = {
  draft: { 'en-GB': 'Draft', uk: 'Чернетка' },
  sent: { 'en-GB': 'Sent for signature', uk: 'Надіслано на підпис' },
  signed: { 'en-GB': 'Signed', uk: 'Підписано' },
  active: { 'en-GB': 'Active', uk: 'Діє' },
  suspended: { 'en-GB': 'Suspended', uk: 'Призупинено' },
  terminated: { 'en-GB': 'Terminated', uk: 'Розірвано' },
  expired: { 'en-GB': 'Expired', uk: 'Строк сплив' },
};

export const contractKindLabels: Record<ContractKind, LocalisedText> = {
  acquiring_agreement: { 'en-GB': 'Acquiring agreement', uk: 'Договір еквайрингу' },
  platform_agreement: { 'en-GB': 'Platform agreement', uk: 'Договір про платформу' },
  merchant_agreement: { 'en-GB': 'Merchant agreement', uk: 'Договір з мерчантом' },
  marketplace_addendum: { 'en-GB': 'Marketplace addendum (split)', uk: 'Додаток для маркетплейсу (розщеплення)' },
  partner_agreement: { 'en-GB': 'Partner agreement', uk: 'Партнерський договір' },
  nonprofit_agreement: { 'en-GB': 'Non-profit agreement', uk: 'Договір з неприбутковою організацією' },
  data_processing: { 'en-GB': 'Data processing agreement', uk: 'Угода про обробку даних' },
};
