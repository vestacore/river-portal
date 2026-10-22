import type { Issuer } from '../types/Issuer.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/**
 * The issuing banks of the demo, with invented names and invented BIN ranges. Three of the Ukrainian
 * banks also acquire, so a card of theirs can be routed on-us. The test cards of the pay page fall in
 * these ranges: 4242… is Bank Dnipro's, 5555… Stepove Bank's, 9804 00… Karpaty Bank's ПРОСТІР, 4000…
 * Polissia Bank's (which does not acquire).
 */
export const issuers: readonly Issuer[] = [
  { id: 'bank-dnipro', name: t('Bank Dnipro', 'Банк Дніпро'), country: 'UA', acquirerIds: ['acq-dnipro'], bins: [
    { prefix: '4242', scheme: 'visa', product: 'debit' }, { prefix: '4243', scheme: 'visa', product: 'credit' }, { prefix: '42449', scheme: 'visa', product: 'premium' },
    { prefix: '5167', scheme: 'mastercard', product: 'debit' }, { prefix: '5168', scheme: 'mastercard', product: 'credit' }, { prefix: '5579', scheme: 'mastercard', product: 'commercial' },
    { prefix: '980401', scheme: 'prostir', product: 'debit' },
  ] },
  { id: 'bank-stepove', name: t('Stepove Bank', 'Степовий банк'), country: 'UA', acquirerIds: ['acq-stepove'], bins: [
    { prefix: '5555', scheme: 'mastercard', product: 'debit' }, { prefix: '5556', scheme: 'mastercard', product: 'credit' },
    { prefix: '4351', scheme: 'visa', product: 'debit' }, { prefix: '43529', scheme: 'visa', product: 'premium' }, { prefix: '4485', scheme: 'visa', product: 'commercial' },
    { prefix: '980402', scheme: 'prostir', product: 'debit' },
  ] },
  { id: 'bank-karpaty', name: t('Karpaty Bank', 'Карпати Банк'), country: 'UA', acquirerIds: ['acq-karpaty'], bins: [
    { prefix: '4400', scheme: 'visa', product: 'debit' }, { prefix: '4401', scheme: 'visa', product: 'credit' },
    { prefix: '5375', scheme: 'mastercard', product: 'debit' }, { prefix: '980400', scheme: 'prostir', product: 'debit' },
  ] },
  { id: 'bank-polissia', name: t('Polissia Bank', 'Поліський банк'), country: 'UA', acquirerIds: [], bins: [
    { prefix: '4000', scheme: 'visa', product: 'debit' }, { prefix: '4001', scheme: 'visa', product: 'credit' }, { prefix: '5200', scheme: 'mastercard', product: 'debit' },
  ] },
  { id: 'bank-misto', name: t('Misto Bank', 'Місто Банк'), country: 'UA', acquirerIds: [], bins: [
    { prefix: '5390', scheme: 'mastercard', product: 'debit' }, { prefix: '4890', scheme: 'visa', product: 'debit' }, { prefix: '4891', scheme: 'visa', product: 'credit' },
  ] },
  { id: 'bank-baltic', name: t('Baltic Bank', 'Балтійський банк'), country: 'LT', acquirerIds: ['acq-baltic'], bins: [
    { prefix: '4571', scheme: 'visa', product: 'debit' }, { prefix: '5413', scheme: 'mastercard', product: 'debit' },
  ] },
  { id: 'bank-hansa', name: t('Hansa Savings', 'Ганза Савінгс'), country: 'DE', acquirerIds: [], bins: [
    { prefix: '4917', scheme: 'visa', product: 'debit' }, { prefix: '4918', scheme: 'visa', product: 'credit' },
  ] },
];
