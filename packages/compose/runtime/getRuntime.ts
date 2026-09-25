import { createFirestoreStore, createMemoryStore } from '@river/store';
import { allProjectors } from './allProjectors.ts';
import { createAssistant } from './createAssistant.ts';
import { readConfig } from './readConfig.ts';
import { seedDemo } from './seedDemo.ts';
import type { Runtime } from './types/Runtime.ts';

const key = Symbol.for('river.runtime');
type Holder = { [key]?: Promise<Runtime> };

async function create(): Promise<Runtime> {
  const config = readConfig();
  const store =
    config.store === 'firestore'
      ? await createFirestoreStore({ ...(config.projectId ? { projectId: config.projectId } : {}), databaseId: config.firestoreDatabase })
      : createMemoryStore();
  const runtime: Runtime = { config, store, projectors: allProjectors(), assistant: createAssistant(config), demoTrackingLinks: {} };
  if (config.seed === 'demo') await seedDemo(runtime, config.profile);
  return runtime;
}

/** The process-wide runtime (kept on globalThis so development hot reloads reuse it). */
export function getRuntime(): Promise<Runtime> {
  const holder = globalThis as Holder;
  holder[key] ??= create().catch((error: unknown) => {
    delete holder[key];
    throw error;
  });
  return holder[key];
}
