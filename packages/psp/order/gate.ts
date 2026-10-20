// @river/psp-order — boundary: the order (adr/records/ADR-0026). It owns `order.*` and `fulfilment.*`
// facts and forms the order's view from everything that names it. It knows the other boundaries only
// through the shared vocabulary, @river/psp-facts.
export { orderStatuses, fulfilmentStates } from './types/OrderStatus.ts';
export type { OrderStatus, FulfilmentState } from './types/OrderStatus.ts';
export type { OrderView } from './types/OrderView.ts';
export { orderStatusLabels, fulfilmentLabels } from './data/orderStatusLabels.ts';
export { orderProjector } from './orderProjector.ts';
export { orderTotal } from './orderTotal.ts';
export { validateOrderLines } from './validateOrderLines.ts';
