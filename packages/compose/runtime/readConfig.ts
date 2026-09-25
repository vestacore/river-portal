import { findProfile } from '@river/settings';
import { surfaces, type Surface } from './types/Surface.ts';
import type { RuntimeConfig } from './types/RuntimeConfig.ts';

/**
 * Reads and checks runtime configuration. The memory store is refused on Cloud Run (TD-03). Demo
 * sign-in runs locally, or on a public deployment only when it is an explicit sandbox with its own
 * session secret; never on the IAP studio service.
 */
export function readConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  const surface = (surfaces as readonly string[]).includes(env.RIVER_SURFACE ?? '') ? (env.RIVER_SURFACE as Surface) : 'local';
  const store = env.RIVER_STORE === 'firestore' ? 'firestore' : 'memory';
  if (store === 'memory' && env.K_SERVICE && env.RIVER_ALLOW_MEMORY !== '1') {
    throw new Error('RIVER_STORE=memory is not allowed on Cloud Run');
  }
  if (surface === 'local' && env.K_SERVICE) throw new Error('RIVER_SURFACE must be public or studio on Cloud Run');
  const projectId = env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT ?? null;
  const sandbox = env.RIVER_DEMO_SANDBOX === '1';
  const auth = surface === 'studio' ? 'iap' : surface === 'local' || (env.RIVER_AUTH === 'demo' && sandbox) ? 'demo' : 'none';
  if (auth === 'demo' && store === 'firestore' && !sandbox) throw new Error('Demo sign-in with Firestore needs RIVER_DEMO_SANDBOX=1');
  const sessionSecret = env.RIVER_SESSION_SECRET ?? (env.K_SERVICE ? '' : 'river-local-demo-secret');
  if (auth === 'demo' && !sessionSecret) throw new Error('RIVER_SESSION_SECRET is required for demo sign-in in the cloud');
  return {
    surface,
    orgId: env.RIVER_ORG_ID ?? 'open-river-aid',
    store,
    projectId,
    firestoreDatabase: env.RIVER_FIRESTORE_DATABASE ?? '(default)',
    ai: env.RIVER_AI === 'vertex' && projectId ? 'vertex' : 'fallback',
    aiModel: env.RIVER_AI_MODEL ?? 'gemini-2.5-flash',
    aiLocation: env.RIVER_AI_LOCATION ?? 'europe-west4',
    seed: env.RIVER_SEED === 'none' ? 'none' : 'demo',
    profile: findProfile(env.RIVER_PROFILE).id,
    auth,
    sessionSecret,
  };
}
