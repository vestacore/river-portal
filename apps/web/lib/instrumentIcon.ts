import type { InstrumentId } from '@river/psp-facts';

const icons: Record<InstrumentId, string> = {
  card: 'card', apple_pay: 'phone', google_pay: 'phone', pay_by_bank: 'bank', bank_transfer: 'invoice', qr_nbu: 'qr',
  installments: 'calendar', bnpl: 'clock', wallet: 'wallet', stablecoin: 'coin', voucher: 'cash', direct_debit: 'refresh', bonus_points: 'sparkle',
};

/** The icon drawn for an instrument. */
export function instrumentIcon(id: InstrumentId): string {
  return icons[id];
}
