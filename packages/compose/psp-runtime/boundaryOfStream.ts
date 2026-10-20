import type { Boundary } from '@river/psp-facts';

const prefixes: ReadonlyArray<[string, Boundary]> = [['ord_', 'order'], ['inv_', 'invoice'], ['ps_', 'session'], ['pay_', 'payment']];

/** The boundary a stream belongs to, by the prefix of its key: an order, an invoice, a session or a payment. */
export function boundaryOfStream(stream: string): Boundary {
  const found = prefixes.find(([prefix]) => stream.startsWith(prefix));
  if (!found) throw new Error(`Stream ${stream} belongs to no boundary`);
  return found[1];
}
