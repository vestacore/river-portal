import type { PayPersona } from '../types/PayPersona.ts';

const t = (en: string, uk: string) => ({ 'en-GB': en, uk });

/** Two fictional payers. Only the handle (`ref`) ever enters a stream. */
export const demoPayers: readonly PayPersona[] = [
  { id: 'payer:anna.k', role: 'payer', ref: 'anna.k', name: t('Anna', 'Анна'),
    description: t('A regular customer: pays small invoices from her phone.', 'Постійна покупчиня: оплачує невеликі рахунки з телефона.') },
  { id: 'payer:corner-cafe', role: 'payer', ref: 'corner-cafe', name: t('Corner Café', 'Кав\'ярня на розі'),
    description: t('A café that buys wholesale and pays larger invoices.', 'Кав\'ярня, що купує гуртом і оплачує більші рахунки.') },
];
