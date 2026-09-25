import type { Doc, StoredDoc } from './Doc.ts';
import type { DocTransaction } from './DocTransaction.ts';
import type { Query } from './Query.ts';

/** Storage used by every package. Paths alternate collection/document like Firestore. */
export type DocStore = {
  driver: 'memory' | 'firestore';
  get<T extends Doc>(path: string): Promise<T | null>;
  query<T extends Doc>(collectionPath: string, query?: Query): Promise<Array<StoredDoc<T>>>;
  transact<R>(work: (tx: DocTransaction) => Promise<R>): Promise<R>;
};
