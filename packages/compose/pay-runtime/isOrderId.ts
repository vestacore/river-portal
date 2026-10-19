/** True for an order id as the door makes them. Checked before an id from outside is used in a document path. */
export function isOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^order_[0-9A-Z]{26}$/.test(value);
}
