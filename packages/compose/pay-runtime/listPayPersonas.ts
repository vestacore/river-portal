import { providerLabels } from '@river/pay-facts';
import { demoPayers } from './data/demoPayers.ts';
import type { PayConfig } from './types/PayConfig.ts';
import type { PayPersona } from './types/PayPersona.ts';

/** Who a tester may act as: every merchant of this deployment, and the demo payers. */
export function listPayPersonas(config: PayConfig): PayPersona[] {
  const merchants = config.merchants.map((m): PayPersona => {
    const connected = m.providers.map((p) => providerLabels[p]).join(', ');
    return {
      id: `merchant:${m.id}`,
      role: 'merchant',
      ref: m.id,
      name: { 'en-GB': m.name, uk: m.name },
      description: { 'en-GB': `Sells and asks to be paid. Connected: ${connected}.`, uk: `Продає і просить оплату. Підключено: ${connected}.` },
    };
  });
  return [...merchants, ...demoPayers];
}
