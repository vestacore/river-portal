// @river/stream — append-only streams of facts: one stream per key, one fragment per wave (ADR-0025).
export type { Origin } from './types/Origin.ts';
export type { Fact } from './types/Fact.ts';
export type { FactDraft } from './types/FactDraft.ts';
export type { StreamHead } from './types/StreamHead.ts';
export { streamPaths } from './paths.ts';
export { readHead } from './readHead.ts';
export { commitFacts } from './commitFacts.ts';
export { readStream } from './readStream.ts';
export { readFact } from './readFact.ts';
