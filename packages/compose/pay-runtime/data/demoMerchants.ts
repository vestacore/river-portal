import type { Merchant } from '../types/Merchant.ts';

/**
 * Two fictional sellers, so that routing can be seen to differ: the bakery has connected both
 * providers; the ceramics studio only PayPal — its orders in UAH cannot be carried at all.
 */
export const demoMerchants: readonly Merchant[] = [
  { id: 'm-bakery', name: 'Riverside Bakery', providers: ['stripe', 'paypal'], stripeAccount: null, paypalMerchantId: null },
  { id: 'm-ceramics', name: 'Harbour Ceramics', providers: ['paypal'], stripeAccount: null, paypalMerchantId: null },
];
