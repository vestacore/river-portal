import type { TestCard } from '../types/Checkout.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/**
 * The demo's test cards. The stand-in issuer recognises only these; any other number, real or not, is
 * refused in the browser and never sent. The server receives the brand, the first six and the last four.
 */
export const testCards: readonly TestCard[] = [
  { number: '4242424242424242', brand: 'visa', outcome: 'approve', issuerCountry: 'UA', label: t('Approved without a challenge', 'Схвалено без підтвердження') },
  { number: '4000000000003220', brand: 'visa', outcome: 'challenge', issuerCountry: 'UA', label: t('3-D Secure challenge, then approved', 'Запит 3-D Secure, потім схвалено') },
  { number: '5555555555554444', brand: 'mastercard', outcome: 'approve', issuerCountry: 'UA', label: t('Mastercard, approved', 'Mastercard, схвалено') },
  { number: '9804000000000009', brand: 'prostir', outcome: 'approve', issuerCountry: 'UA', label: t('ПРОСТІР, approved', 'ПРОСТІР, схвалено') },
  { number: '4000004000000004', brand: 'visa', outcome: 'challenge', issuerCountry: 'DE', label: t('Issued abroad: a higher risk score', 'Видано за кордоном: вищий бал ризику') },
  { number: '4000000000000002', brand: 'visa', outcome: 'decline', issuerCountry: 'UA', label: t('Declined by the issuer', 'Відхилено емітентом') },
  { number: '4000000000009995', brand: 'visa', outcome: 'insufficient_funds', issuerCountry: 'UA', label: t('Declined: insufficient funds', 'Відхилено: недостатньо коштів') },
];
