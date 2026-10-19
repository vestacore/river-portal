/**
 * Where one order stands, as its cabinets show it:
 * placed → invoiced → routing (a provider is being asked for a page) → open (the page waits for the
 * payer) → approved (the capture is being asked for) → paid. Beside that line: retry (the last
 * attempt failed; the payer may ask again), refused (no connected provider carries the order),
 * flagged (money arrived that the invoice does not explain) and cancelled.
 */
export const orderStatuses = ['placed', 'invoiced', 'routing', 'open', 'approved', 'paid', 'retry', 'refused', 'flagged', 'cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];
