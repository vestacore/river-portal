import type { Surface } from './Surface.ts';

/** Configuration read from the environment (set by Pulumi in the cloud). */
export type RuntimeConfig = {
  surface: Surface;
  orgId: string;
  store: 'memory' | 'firestore';
  projectId: string | null;
  firestoreDatabase: string;
  ai: 'vertex' | 'fallback';
  aiModel: string;
  aiLocation: string;
  seed: 'demo' | 'none';
};
