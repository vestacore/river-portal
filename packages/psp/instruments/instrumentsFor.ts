import type { Currency, InstrumentId } from '@river/psp-facts';
import { instrumentCatalogue } from './data/instrumentCatalogue.ts';
import type { InstrumentDefinition } from './types/Instrument.ts';

/**
 * The instruments a pay page may offer for one invoice: allowed by the unit's effective policy, carried
 * in the invoice's currency and region, in the unit's preferred order (the rest after, as catalogued).
 */
export function instrumentsFor(allowed: readonly string[], order: readonly string[], currency: Currency, region: 'UA' | 'EU'): InstrumentDefinition[] {
  const rank = (id: InstrumentId) => { const i = order.indexOf(id); return i === -1 ? order.length + instrumentCatalogue.findIndex((d) => d.id === id) : i; };
  return instrumentCatalogue
    .filter((d) => allowed.includes(d.id) && d.currencies.includes(currency) && d.regions.includes(region))
    .sort((a, b) => rank(a.id) - rank(b.id));
}
