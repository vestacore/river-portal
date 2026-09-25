import type { ProfileId } from '@river/settings';
import type { Surface } from './Surface.ts';

/**
 * Configuration read from the environment (set by Pulumi in the cloud). `auth`: how identities are
 * established — 'iap' on the studio service, 'demo' personas locally and in explicit sandboxes,
 * 'none' (anonymous only) on the public service until public accounts exist.
 */
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
  profile: ProfileId;
  auth: 'iap' | 'demo' | 'none';
  sessionSecret: string;
};
