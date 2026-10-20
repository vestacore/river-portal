import type { Contract, Rate, Tariff } from '@river/psp-contracts';

const rate = (bps: number, fixedMinor = 0, minMinor = 0): Rate => ({ bps, fixedMinor, minMinor });
const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** Tariffs of the demo. The non-profit tariff takes nothing: the toll of a gift is zero. */
export const demoTariffs: readonly Tariff[] = [
  { id: 't-ua-standard', name: t('Standard, Ukraine', 'Стандарт, Україна'), currency: 'UAH', fallback: rate(190),
    rates: { card: rate(190), apple_pay: rate(190), google_pay: rate(190), pay_by_bank: rate(70), bank_transfer: rate(40, 0, 500), qr_nbu: rate(50), installments: rate(290), voucher: rate(150, 500) },
    refundFeeMinor: 0, disputeFeeMinor: 45_000, payoutFeeMinor: 0, monthlyMinor: 0 },
  { id: 't-ua-marketplace', name: t('Marketplace, Ukraine', 'Маркетплейс, Україна'), currency: 'UAH', fallback: rate(175),
    rates: { card: rate(175), apple_pay: rate(175), google_pay: rate(175), pay_by_bank: rate(60), bank_transfer: rate(35, 0, 500), qr_nbu: rate(45), installments: rate(270), voucher: rate(150, 500) },
    refundFeeMinor: 0, disputeFeeMinor: 45_000, payoutFeeMinor: 0, monthlyMinor: 150_000 },
  { id: 't-ua-pos', name: t('Point of sale, Ukraine', 'Торгова точка, Україна'), currency: 'UAH', fallback: rate(160),
    rates: { card: rate(160), apple_pay: rate(160), google_pay: rate(160), qr_nbu: rate(45) },
    refundFeeMinor: 0, disputeFeeMinor: 45_000, payoutFeeMinor: 0, monthlyMinor: 0 },
  { id: 't-nonprofit', name: t('Non-profit: no fee', 'Неприбуткові: без комісії'), currency: 'UAH', fallback: rate(0),
    rates: {}, refundFeeMinor: 0, disputeFeeMinor: 0, payoutFeeMinor: 0, monthlyMinor: 0 },
  { id: 't-eu-standard', name: t('Standard, Europe', 'Стандарт, Європа'), currency: 'EUR', fallback: rate(140, 25),
    rates: { card: rate(140, 25), apple_pay: rate(140, 25), google_pay: rate(140, 25), pay_by_bank: rate(60), bank_transfer: rate(30, 0, 50), bnpl: rate(350), wallet: rate(240, 30), stablecoin: rate(100) },
    refundFeeMinor: 0, disputeFeeMinor: 1_500, payoutFeeMinor: 0, monthlyMinor: 0 },
  { id: 't-eu-saas', name: t('Subscriptions, Europe', 'Підписки, Європа'), currency: 'EUR', fallback: rate(120, 20),
    rates: { card: rate(120, 20), apple_pay: rate(120, 20), google_pay: rate(120, 20), direct_debit: rate(25, 15), bank_transfer: rate(25, 0, 50), wallet: rate(220, 30) },
    refundFeeMinor: 0, disputeFeeMinor: 1_500, payoutFeeMinor: 0, monthlyMinor: 4_900 },
];

const doc = (en: string, uk: string, version: string, at: string) => ({ title: t(en, uk), version, at });
const c = (id: string, number: string, unitId: string, kind: Contract['kind'], status: Contract['status'], tariffId: string | null, validFrom: string, validTo: string | null, signedAt: string | null, renewal: Contract['renewal'], signers: Array<[string, string, string]>, extra: Partial<Contract> = {}): Contract => ({
  id, number, unitId, kind, status, tariffId, validFrom, validTo, signedAt, renewal,
  signatories: signers.map(([name, en, uk]) => ({ name, role: t(en, uk), signedAt: signedAt })),
  documents: [doc('Agreement', 'Договір', '1.0', validFrom), doc('Tariff annex', 'Тарифний додаток', '1.0', validFrom)],
  history: [{ at: validFrom, by: 'p-denys', what: t('Contract created', 'Договір створено') }, ...(signedAt ? [{ at: signedAt, by: 'p-denys', what: t('Signed by both parties', 'Підписано обома сторонами') }] : [])],
  ...extra,
});

/** Contracts of the demo units. One is about to expire; two newcomers are still being signed. */
export const demoContracts: readonly Contract[] = [
  c('ct-kvm', 'RP-UA-2025-0012', 'ou-kvitka-market', 'merchant_agreement', 'active', 't-ua-marketplace', '2025-04-01T00:00:00.000Z', null, '2025-03-27T10:00:00.000Z', 'auto', [['S. B.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-kvm-split', 'RP-UA-2025-0012/A1', 'ou-kvitka-market', 'marketplace_addendum', 'active', null, '2025-04-01T00:00:00.000Z', null, '2025-03-27T10:00:00.000Z', 'auto', [['S. B.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-kvp', 'RP-UA-2025-0019', 'ou-kvitka-pharmacy', 'merchant_agreement', 'active', 't-ua-pos', '2025-05-12T00:00:00.000Z', null, '2025-05-08T12:30:00.000Z', 'auto', [['N. V.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-dtr', 'RP-UA-2025-0031', 'ou-dnipro-travel', 'merchant_agreement', 'active', 't-ua-standard', '2025-06-01T00:00:00.000Z', null, '2025-05-29T09:15:00.000Z', 'auto', [['V. Sh.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-dtr-split', 'RP-UA-2025-0031/A1', 'ou-dnipro-travel', 'marketplace_addendum', 'active', null, '2025-06-01T00:00:00.000Z', null, '2025-05-29T09:15:00.000Z', 'auto', [['V. Sh.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-ora', 'RP-UA-2025-0040', 'ou-open-river', 'nonprofit_agreement', 'active', 't-nonprofit', '2025-07-01T00:00:00.000Z', null, '2025-06-24T14:00:00.000Z', 'auto', [['H. R.', 'Foundation', 'Фонд'], ['A. M.', 'River Pay', 'River Pay']]),
  c('ct-krp', 'RP-UA-2025-0044', 'ou-karpaty', 'partner_agreement', 'active', null, '2025-07-15T00:00:00.000Z', '2027-07-14T20:59:59.000Z', '2025-07-10T11:00:00.000Z', 'manual', [['T. H.', 'Partner', 'Партнер'], ['A. M.', 'River Pay', 'River Pay']]),
  c('ct-zif', 'RP-UA-2025-0051', 'ou-zerno-if', 'merchant_agreement', 'active', 't-ua-pos', '2025-08-01T00:00:00.000Z', null, '2025-07-28T10:00:00.000Z', 'auto', [['L. O.', 'Merchant', 'Мерчант'], ['T. H.', 'Karpaty Pay', 'Карпати Пей']]),
  c('ct-zuz', 'RP-UA-2025-0052', 'ou-zerno-uzh', 'merchant_agreement', 'active', 't-ua-pos', '2025-08-01T00:00:00.000Z', null, '2025-07-29T10:00:00.000Z', 'auto', [['I. F.', 'Merchant', 'Мерчант'], ['T. H.', 'Karpaty Pay', 'Карпати Пей']]),
  c('ct-krk', 'RP-UA-2025-0058', 'ou-krok', 'merchant_agreement', 'active', 't-ua-standard', '2025-08-20T00:00:00.000Z', null, '2025-08-18T16:00:00.000Z', 'auto', [['A. Kh.', 'Merchant', 'Мерчант'], ['T. H.', 'Karpaty Pay', 'Карпати Пей']]),
  c('ct-lis', 'RP-UA-2026-0102', 'ou-lis', 'merchant_agreement', 'draft', 't-ua-standard', '2026-10-12T00:00:00.000Z', null, null, 'auto', [['B. M.', 'Merchant', 'Мерчант'], ['D. T.', 'River Pay', 'River Pay']]),
  c('ct-bbk', 'RP-EU-2025-0007', 'ou-baltic-bikes', 'merchant_agreement', 'active', 't-eu-standard', '2025-04-15T00:00:00.000Z', null, '2025-04-10T10:00:00.000Z', 'auto', [['M. J.', 'Merchant', 'Мерчант'], ['L. P.', 'River Pay Europe', 'River Pay Європа']]),
  c('ct-nls', 'RP-EU-2025-0011', 'ou-nordlicht', 'merchant_agreement', 'active', 't-eu-saas', '2025-05-01T00:00:00.000Z', null, '2025-04-28T13:00:00.000Z', 'auto', [['J. W.', 'Merchant', 'Мерчант'], ['L. P.', 'River Pay Europe', 'River Pay Європа']]),
  c('ct-nls-dpa', 'RP-EU-2025-0011/DPA', 'ou-nordlicht', 'data_processing', 'active', null, '2025-05-01T00:00:00.000Z', null, '2025-04-28T13:00:00.000Z', 'auto', [['J. W.', 'Controller', 'Контролер'], ['L. P.', 'Processor', 'Обробник']]),
  c('ct-amb', 'RP-EU-2025-0015', 'ou-amber', 'merchant_agreement', 'active', 't-eu-standard', '2025-11-08T00:00:00.000Z', '2026-11-07T21:59:59.000Z', '2025-11-03T09:00:00.000Z', 'manual', [['E. K.', 'Merchant', 'Мерчант'], ['L. P.', 'River Pay Europe', 'River Pay Європа']]),
  c('ct-vmh', 'RP-EU-2026-0040', 'ou-vilnius-hall', 'merchant_agreement', 'sent', 't-eu-standard', '2026-10-08T00:00:00.000Z', null, null, 'auto', [['R. S.', 'Merchant', 'Мерчант'], ['L. P.', 'River Pay Europe', 'River Pay Європа']]),
];
