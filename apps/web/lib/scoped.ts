import type { InvoiceView } from '@river/psp-invoice';
import type { OrderView } from '@river/psp-order';
import type { PaymentView } from '@river/psp-payment';
import type { World } from '@river/psp-runtime';
import type { SessionView } from '@river/psp-session';

/** The views of the four boundaries within a set of units — what one profile may see — newest first. */
export function scoped(w: World, visible: ReadonlySet<string>) {
  const newest = <T>(items: Iterable<T>, at: (x: T) => string) => [...items].sort((a, b) => at(b).localeCompare(at(a)));
  const sessions: SessionView[] = newest([...w.views.sessions.values()].filter((s) => visible.has(s.unitId)), (s) => s.openedAt);
  const payments: PaymentView[] = newest([...w.views.payments.values()].filter((p) => visible.has(p.unitId)), (p) => p.createdAt);
  const orders: OrderView[] = newest([...w.views.orders.values()].filter((o) => visible.has(o.unitId)), (o) => o.createdAt);
  const invoices: InvoiceView[] = newest([...w.views.invoices.values()].filter((i) => visible.has(i.unitId)), (i) => i.issuedAt);
  return { sessions, payments, orders, invoices };
}
