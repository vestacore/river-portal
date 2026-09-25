import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

/**
 * Least-privilege identities: `web` and `studio` read and write Firestore (all writes are server-side
 * commands); only `studio` may call Vertex AI; `build` pushes images.
 */
export function createServiceAccounts(settings: Settings, dependsOn: gcp.projects.Service[]) {
  const account = (id: string, displayName: string) =>
    new gcp.serviceaccount.Account(`sa-${id}`, { project: settings.project, accountId: `river-${id}`, displayName }, { dependsOn });
  const web = account('web', 'River Portal — public web');
  const studio = account('studio', 'River Portal — studio (IAP)');
  const build = account('build', 'River Portal — image builds');
  const grant = (name: string, role: string, sa: gcp.serviceaccount.Account) =>
    new gcp.projects.IAMMember(name, { project: settings.project, role, member: sa.member });
  grant('web-datastore', 'roles/datastore.user', web);
  grant('studio-datastore', 'roles/datastore.user', studio);
  grant('studio-vertex', 'roles/aiplatform.user', studio);
  grant('build-artifacts', 'roles/artifactregistry.writer', build);
  grant('build-logs', 'roles/logging.logWriter', build);
  grant('build-source', 'roles/storage.objectViewer', build);
  return { web, studio, build };
}
