// @river/psp-instruments — payment instruments as first-class citizens (adr/records/ADR-0026): every
// instrument has its own course of bridges inside the same river, and the same projections at the end.
export type { InstrumentDefinition, InstrumentFamily, InstrumentCapabilities, Acquirer } from './types/Instrument.ts';
export { instrumentCatalogue } from './data/instrumentCatalogue.ts';
export { acquirers } from './data/acquirers.ts';
export { findInstrument } from './findInstrument.ts';
export { instrumentsFor } from './instrumentsFor.ts';
export { acquirersFor } from './acquirersFor.ts';
