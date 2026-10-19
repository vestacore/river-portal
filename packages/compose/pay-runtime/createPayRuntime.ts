import type { FetchLike } from '@river/pay-providers';
import { createFirestoreStore, createMemoryStore, type DocStore } from '@river/store';
import { callFunction } from './callFunction.ts';
import { payAssembly } from './payAssembly.ts';
import type { FunctionCall } from './types/FunctionCall.ts';
import type { PayConfig } from './types/PayConfig.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/** A payment river from its settings. Tests hand in their own store, their own wire to the providers and their own way to call a function. */
export async function createPayRuntime(config: PayConfig, options: { store?: DocStore; fetch?: FetchLike; call?: FunctionCall } = {}): Promise<PayRuntime> {
  const store =
    options.store ??
    (config.store === 'firestore'
      ? await createFirestoreStore({ ...(config.projectId ? { projectId: config.projectId } : {}), databaseId: config.database })
      : createMemoryStore());
  return { config, store, root: config.root, assembly: payAssembly(config, options.fetch), wire: options.fetch ?? null, call: options.call ?? callFunction, demoPayKeys: {} };
}
