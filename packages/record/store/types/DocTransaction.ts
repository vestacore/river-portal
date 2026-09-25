import type { Doc } from './Doc.ts';

/**
 * A unit of work. Writes are buffered and applied atomically at the end; reads see the
 * transaction's own buffered writes. `create` fails the transaction if the document exists.
 */
export type DocTransaction = {
  get<T extends Doc>(path: string): Promise<T | null>;
  set(path: string, data: Doc): void;
  create(path: string, data: Doc): void;
  delete(path: string): void;
};
