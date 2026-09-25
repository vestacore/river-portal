import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

// All access is server-side through the service accounts (ADR-0011); browsers get nothing.
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

/**
 * The Firestore (native) database with point-in-time recovery and delete protection, and rules that
 * deny all client access. If a (default) database already exists, import it:
 *   pulumi import gcp:firestore/database:Database firestore "projects/<project>/databases/(default)"
 */
export function createFirestore(settings: Settings, dependsOn: gcp.projects.Service[]) {
  const database = new gcp.firestore.Database('firestore', {
    project: settings.project,
    name: '(default)',
    locationId: settings.firestoreLocation,
    type: 'FIRESTORE_NATIVE',
    pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_ENABLED',
    deleteProtectionState: 'DELETE_PROTECTION_ENABLED',
  }, { dependsOn, protect: true });
  const ruleset = new gcp.firebaserules.Ruleset('firestore-rules', {
    project: settings.project,
    source: { files: [{ name: 'firestore.rules', content: rules }] },
  }, { dependsOn: [database] });
  new gcp.firebaserules.Release('firestore-rules-release', {
    project: settings.project,
    name: 'cloud.firestore',
    rulesetName: ruleset.name.apply((n) => `projects/${settings.project}/rulesets/${n.split('/').pop()}`),
  });
  return database;
}
