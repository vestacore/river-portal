import type { FieldError } from '@river/kernel';
import type { OrderStatus } from '@river/pay-views';

/**
 * What the door says back. `payKey` is present once, when an order is placed; `redirectUrl` is the
 * provider's page when a session is open for the order, and `standIn` says that page is a stand-in's
 * — this site's own — rather than a provider's.
 */
export type DoorAnswer =
  | { ok: true; orderId: string; status: OrderStatus; payKey: string | null; redirectUrl: string | null; standIn: boolean }
  | { ok: false; errors: FieldError[] };
