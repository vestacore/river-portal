import type { Doc, StoredDoc } from './types/Doc.ts';
import type { DocStore } from './types/DocStore.ts';
import type { DocTransaction } from './types/DocTransaction.ts';
import type { Query } from './types/Query.ts';

type Write = { kind: 'set' | 'create'; data: Doc } | { kind: 'delete' };

/**
 * Firestore driver (server-side only, via firebase-admin with Application Default Credentials).
 * Buffers writes so that every read in a transaction happens before any write, as Firestore requires.
 */
export async function createFirestoreStore(options: { projectId?: string; databaseId?: string } = {}): Promise<DocStore> {
  const { initializeApp, getApps, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app =
    getApps()[0] ??
    initializeApp({ credential: applicationDefault(), ...(options.projectId ? { projectId: options.projectId } : {}) });
  const db = getFirestore(app, options.databaseId ?? '(default)');
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() may only be called once per instance; a second call during hot reload is harmless.
  }

  return {
    driver: 'firestore',
    async get<T extends Doc>(path: string) {
      const snap = await db.doc(path).get();
      return snap.exists ? (snap.data() as T) : null;
    },
    async query<T extends Doc>(collectionPath: string, query: Query = {}) {
      let ref: FirebaseFirestore.Query = db.collection(collectionPath);
      for (const w of query.where ?? []) ref = ref.where(w.field, w.op, w.value);
      if (query.orderBy) ref = ref.orderBy(query.orderBy.field, query.orderBy.direction);
      if (query.limit !== undefined) ref = ref.limit(query.limit);
      const snap = await ref.get();
      return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }) as StoredDoc<T>);
    },
    transact<R>(work: (tx: DocTransaction) => Promise<R>) {
      return db.runTransaction(async (t) => {
        const writes = new Map<string, Write>();
        const tx: DocTransaction = {
          async get<T extends Doc>(path: string) {
            const pending = writes.get(path);
            if (pending) return pending.kind === 'delete' ? null : (structuredClone(pending.data) as T);
            const snap = await t.get(db.doc(path));
            return snap.exists ? (snap.data() as T) : null;
          },
          set: (path, data) => void writes.set(path, { kind: 'set', data: structuredClone(data) }),
          create: (path, data) => void writes.set(path, { kind: 'create', data: structuredClone(data) }),
          delete: (path) => void writes.set(path, { kind: 'delete' }),
        };
        const result = await work(tx);
        for (const [path, write] of writes) {
          const ref = db.doc(path);
          if (write.kind === 'delete') t.delete(ref);
          else if (write.kind === 'create') t.create(ref, write.data);
          else t.set(ref, write.data);
        }
        return result;
      });
    },
  };
}
