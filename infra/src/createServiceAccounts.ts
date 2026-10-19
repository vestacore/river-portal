import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

/**
 * Least-privilege identities: `web` and `studio` read and write Firestore (all writes are server-side
 * commands); only `studio` may call Vertex AI; `build` pushes images. When the payment river has its
 * own database (`exceptDatabase`, ADR-0025), their write access stops short of it: only the river's
 * own functions write there.
 */
export function createServiceAccounts(settings: Settings, dependsOn: gcp.projects.Service[], exceptDatabase?: string) {
  const account = (id: string, displayName: string) =>
    new gcp.serviceaccount.Account(`sa-${id}`, { project: settings.project, accountId: `river-${id}`, displayName }, { dependsOn });
  const web = account('web', 'River Portal — public web');
  const studio = account('studio', 'River Portal — studio (IAP)');
  const build = account('build', 'River Portal — image builds');
  const grant = (name: string, role: string, sa: gcp.serviceaccount.Account, condition?: { title: string; description: string; expression: string }) =>
    new gcp.projects.IAMMember(name, { project: settings.project, role, member: sa.member, ...(condition ? { condition } : {}) });
  const portalOnly = exceptDatabase
    ? { title: 'not-the-pay-database', description: 'Every database but the payment river\'s', expression: `resource.name != "projects/${settings.project}/databases/${exceptDatabase}"` }
    : undefined;
  grant('web-datastore', 'roles/datastore.user', web, portalOnly);
  grant('studio-datastore', 'roles/datastore.user', studio, portalOnly);
  grant('studio-vertex', 'roles/aiplatform.user', studio);
  grant('build-artifacts', 'roles/artifactregistry.writer', build);
  grant('build-logs', 'roles/logging.logWriter', build);
  grant('build-source', 'roles/storage.objectViewer', build);
  return { web, studio, build };
}
