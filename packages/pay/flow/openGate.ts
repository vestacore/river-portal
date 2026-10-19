import { defineJoiner, type JoinerUnit } from '@river/figure';
import { payFacts, providerLabels, type CheckoutRefused, type ProviderRouted, type ProviderSessionRequested } from '@river/pay-facts';
import { chooseProvider } from './chooseProvider.ts';
import type { GateState } from './types/GateState.ts';
import type { OrderNeedState } from './types/OrderNeedState.ts';
import type { PaySettings } from './types/PaySettings.ts';

/**
 * The gate opens: one attempt, one route, one intention to the chosen provider. A new round for
 * every attempt, so a failed crossing can be tried again — by another bank when there is one.
 */
export function openGate(settings: PaySettings): JoinerUnit {
  return defineJoiner<{ order: OrderNeedState; gate: GateState }>({
    id: 'openGate',
    demands: { order: 'orderNeed', gate: 'checkoutGate' },
    round: ({ gate }) => `attempt-${gate.attempt + 1}`,
    emit: ({ order: { order }, gate }) => {
      if (!order || !gate.invoice) return [];
      const attempt = gate.attempt + 1;
      const carriers = order.providers.filter((name) => settings.mounted.includes(name));
      const route = chooseProvider({ ...order, providers: carriers }, settings.routing, gate.failed);
      if (!route) {
        const connected = carriers.map((name) => providerLabels[name]).join(', ') || 'none';
        const refused: CheckoutRefused = { attempt, reason: `no routing rule lets a connected provider (${connected}) carry this order` };
        return [{ type: payFacts.checkoutRefused, payload: refused }];
      }
      const routed: ProviderRouted = { provider: route.provider, reason: route.reason, attempt };
      const requested: ProviderSessionRequested = {
        provider: route.provider,
        attempt,
        orderId: order.orderId,
        invoiceId: gate.invoice.invoiceId,
        merchantId: order.merchantId,
        title: order.title,
        amountMinor: gate.invoice.amountMinor,
        currency: gate.invoice.currency,
        feeMinor: gate.invoice.feeMinor,
      };
      return [{ type: payFacts.providerRouted, payload: routed }, { type: payFacts.providerSessionRequested, payload: requested }];
    },
  });
}
