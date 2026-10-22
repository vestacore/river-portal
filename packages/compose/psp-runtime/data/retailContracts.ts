import type { AcquiringTerms, Contract } from '@river/psp-contracts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });
const c = (id: string, number: string, unitId: string, kind: Contract['kind'], validFrom: string, validTo: string | null, renewal: Contract['renewal'], counterparty: [string, string]): Contract => ({
  id, number, unitId, kind, status: 'active', tariffId: null, validFrom, validTo, signedAt: validFrom, renewal,
  signatories: [{ name: 'N. K.', role: t('Yarmarok', 'Ярмарок'), signedAt: validFrom }, { name: counterparty[0], role: t(counterparty[1], counterparty[1]), signedAt: validFrom }],
  documents: [{ title: t('Agreement', 'Договір'), version: '1.0', at: validFrom }, { title: t('Pricing annex', 'Додаток з цінами'), version: '1.2', at: validFrom }],
  history: [{ at: validFrom, by: 'r-ivan', what: t('Signed by both parties', 'Підписано обома сторонами') }],
});

/**
 * The group's agreements: the platform itself, and acquiring with three banks for the stores and the
 * online trade, an account-to-account hub, a lender for instalments. The Karpaty agreement for the stores
 * ends soon and does not renew itself.
 */
export const retailContracts: readonly Contract[] = [
  c('ct-r-platform', 'YRG-PLT-2025-01', 'rt-group', 'platform_agreement', '2025-01-10T00:00:00.000Z', null, 'auto', ['R. P.', 'River (platform)']),
  c('ct-r-dnipro-pos', 'BD-ACQ-2024-0381', 'rt-retail', 'acquiring_agreement', '2024-02-01T00:00:00.000Z', null, 'auto', ['V. D.', 'Bank Dnipro']),
  c('ct-r-karpaty-pos', 'KB-ACQ-2023-1177', 'rt-retail', 'acquiring_agreement', '2023-12-01T00:00:00.000Z', '2026-11-29T21:59:59.000Z', 'manual', ['O. K.', 'Karpaty Bank']),
  c('ct-r-stepove-pos', 'SB-ACQ-2024-0045', 'rt-retail', 'acquiring_agreement', '2024-03-15T00:00:00.000Z', null, 'auto', ['A. S.', 'Stepove Bank']),
  c('ct-r-dnipro-ecom', 'BD-ECM-2025-0112', 'rt-online', 'acquiring_agreement', '2025-01-20T00:00:00.000Z', null, 'auto', ['V. D.', 'Bank Dnipro']),
  c('ct-r-stepove-ecom', 'SB-ECM-2025-0019', 'rt-online', 'acquiring_agreement', '2025-02-01T00:00:00.000Z', null, 'auto', ['A. S.', 'Stepove Bank']),
  c('ct-r-karpaty-ecom', 'KB-ECM-2025-0402', 'rt-online', 'acquiring_agreement', '2025-02-10T00:00:00.000Z', null, 'auto', ['O. K.', 'Karpaty Bank']),
  c('ct-r-a2a', 'OBH-2025-0077', 'rt-online', 'acquiring_agreement', '2025-04-01T00:00:00.000Z', null, 'auto', ['M. H.', 'UA Open Banking Hub']),
  c('ct-r-chastyny', 'CC-2025-0310', 'rt-online', 'acquiring_agreement', '2025-04-01T00:00:00.000Z', null, 'auto', ['L. C.', 'Chastyny Credit']),
];

const terms = (id: string, acquirerId: string, merchantId: string, channel: AcquiringTerms['channel'], model: AcquiringTerms['model'], rate: { blendedBps?: number; markupBps?: number; fixedMinor?: number; onUsBps?: number }, contractId: string, note: [string, string]): AcquiringTerms => ({
  id, acquirerId, merchantId, channel, model, blendedBps: rate.blendedBps ?? null, markupBps: rate.markupBps ?? null, fixedMinor: rate.fixedMinor ?? 0, onUsBps: rate.onUsBps ?? null, contractId, note: t(note[0], note[1]),
});

/**
 * What each bank charges the group, per legal entity and channel. These are the demo's assumptions, not
 * any bank's prices. The online terms of Bank Dnipro, Stepove Bank and Karpaty Bank price their own cards
 * on-us; of the store terms only Stepove Bank's do.
 */
export const retailAcquiring: readonly AcquiringTerms[] = [
  terms('at-dnipro-ecom', 'acq-dnipro', 'rt-online', 'online', 'ic_plus_plus', { markupBps: 25, onUsBps: 55 }, 'ct-r-dnipro-ecom', ['Interchange++ with an on-us rate', 'Interchange++ зі ставкою on-us']),
  terms('at-stepove-ecom', 'acq-stepove', 'rt-online', 'online', 'blended', { blendedBps: 105, onUsBps: 60 }, 'ct-r-stepove-ecom', ['One rate, with an on-us rate', 'Єдина ставка, зі ставкою on-us']),
  terms('at-karpaty-ecom', 'acq-karpaty', 'rt-online', 'online', 'ic_plus_plus', { markupBps: 30, onUsBps: 60 }, 'ct-r-karpaty-ecom', ['Interchange++ with an on-us rate', 'Interchange++ зі ставкою on-us']),
  terms('at-a2a', 'hub-ua-a2a', 'rt-online', 'online', 'blended', { blendedBps: 0, fixedMinor: 200 }, 'ct-r-a2a', ['UAH 2 per instant transfer', '2 ₴ за миттєвий переказ']),
  terms('at-sep', 'bank-ua-sep', 'rt-online', 'online', 'blended', { blendedBps: 0, fixedMinor: 500 }, 'ct-r-a2a', ['UAH 5 per bank transfer', '5 ₴ за банківський переказ']),
  terms('at-chastyny', 'lend-chastyny', 'rt-online', 'online', 'blended', { blendedBps: 290 }, 'ct-r-chastyny', ['The lender’s merchant fee for instalments', 'Комісія кредитора для мерчанта за оплату частинами']),
  terms('at-bonus', 'bonus-system', 'rt-online', 'online', 'blended', { blendedBps: 0 }, 'ct-r-platform', ['The group’s own bonus system: no fee', 'Власна бонусна система групи: без комісії']),
  terms('at-dnipro-pos', 'acq-dnipro', 'rt-retail', 'in_store', 'blended', { blendedBps: 115 }, 'ct-r-dnipro-pos', ['One rate, no on-us clause', 'Єдина ставка, без умови on-us']),
  terms('at-karpaty-pos', 'acq-karpaty', 'rt-retail', 'in_store', 'blended', { blendedBps: 125 }, 'ct-r-karpaty-pos', ['One rate, no on-us clause', 'Єдина ставка, без умови on-us']),
  terms('at-stepove-pos', 'acq-stepove', 'rt-retail', 'in_store', 'ic_plus_plus', { markupBps: 20, onUsBps: 50 }, 'ct-r-stepove-pos', ['Interchange++ with an on-us rate', 'Interchange++ зі ставкою on-us']),
];
