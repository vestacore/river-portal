import { defineJoiner, type JoinerUnit } from '@river/figure';
import { addHours } from '@river/kernel';
import { payFacts, type InvoiceIssued } from '@river/pay-facts';
import { feeMinor } from '@river/pay-ledger';
import type { OrderNeedState } from './types/OrderNeedState.ts';
import type { PaySettings } from './types/PaySettings.ts';

/** The first bridge: an order becomes a payable claim, with the commission stated before anyone pays. */
export function issueInvoice(settings: PaySettings): JoinerUnit {
  return defineJoiner<{ order: OrderNeedState }>({
    id: 'issueInvoice',
    demands: { order: 'orderNeed' },
    emit: ({ order: { order, placedAt } }) => {
      if (!order || !placedAt) return [];
      const fee = feeMinor(order.amountMinor, settings.feeBps);
      const invoice: InvoiceIssued = {
        invoiceId: `inv-${order.orderId}`,
        amountMinor: order.amountMinor,
        currency: order.currency,
        feeBps: settings.feeBps,
        feeMinor: fee,
        netMinor: order.amountMinor - fee,
        expiresAt: addHours(placedAt, settings.invoiceTtlHours),
      };
      return [{ type: payFacts.invoiceIssued, payload: invoice }];
    },
  });
}
