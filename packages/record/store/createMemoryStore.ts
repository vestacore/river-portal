import { readField } from './readField.ts';
import type { Doc, StoredDoc } from './types/Doc.ts';
import type { DocStore } from './types/DocStore.ts';
import type { DocTransaction } from './types/DocTransaction.ts';
import type { Query, QueryFilter } from './types/Query.ts';

type Write = { kind: 'set' | 'create'; data: Doc } | { kind: 'delete' };

function matches(data: Doc, filter: QueryFilter): boolean {
  const value = readField(data, filter.field);
  if (filter.op === '==') return value === filter.value;
  if (filter.op === 'in') return Array.isArray(filter.value) && filter.value.includes(value);
  return Array.isArray(value) && value.includes(filter.value);
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return (a as string | number) < (b as string | number) ? -1 : 1;
}

/**
 * In-process store for local development and demos (TD-03: never used in the cloud).
 * Transactions are serialised, so projections are consistent.
 */
export function createMemoryStore(): DocStore {
  const docs = new Map<string, Doc>();
  let queue: Promise<unknown> = Promise.resolve();

  return {
    driver: 'memory',
    async get<T extends Doc>(path: string) {
      const found = docs.get(path);
      return found ? (structuredClone(found) as T) : null;
    },
    async query<T extends Doc>(collectionPath: string, query: Query = {}) {
      const prefix = `${collectionPath}/`;
      let rows: Array<StoredDoc<T>> = [];
      for (const [path, data] of docs) {
        if (!path.startsWith(prefix) || path.slice(prefix.length).includes('/')) continue;
        if (query.where && !query.where.every((w) => matches(data, w))) continue;
        rows.push({ ...(structuredClone(data) as T), id: path.slice(prefix.length) });
      }
      if (query.orderBy) {
        const { field, direction } = query.orderBy;
        rows.sort((a, b) => compare(readField(a, field), readField(b, field)) * (direction === 'desc' ? -1 : 1));
      }
      if (query.limit !== undefined) rows = rows.slice(0, query.limit);
      return rows;
    },
    transact<R>(work: (tx: DocTransaction) => Promise<R>) {
      const run = async () => {
        const writes = new Map<string, Write>();
        const tx: DocTransaction = {
          async get<T extends Doc>(path: string) {
            const pending = writes.get(path);
            if (pending) return pending.kind === 'delete' ? null : (structuredClone(pending.data) as T);
            const found = docs.get(path);
            return found ? (structuredClone(found) as T) : null;
          },
          set: (path, data) => void writes.set(path, { kind: 'set', data: structuredClone(data) }),
          create: (path, data) => void writes.set(path, { kind: 'create', data: structuredClone(data) }),
          delete: (path) => void writes.set(path, { kind: 'delete' }),
        };
        const result = await work(tx);
        for (const [path, write] of writes) {
          if (write.kind === 'create' && docs.has(path)) throw new Error(`Document already exists: ${path}`);
        }
        for (const [path, write] of writes) {
          if (write.kind === 'delete') docs.delete(path);
          else docs.set(path, write.data);
        }
        return result;
      };
      const next = queue.then(run, run);
      queue = next.catch(() => undefined);
      return next;
    },
  };
}
