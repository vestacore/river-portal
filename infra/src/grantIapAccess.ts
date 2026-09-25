import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

/** Who may pass IAP to the studio (users or groups from config `iapMembers`). */
export function grantIapAccess(settings: Settings, studioBackend: gcp.compute.BackendService): void {
  settings.iapMembers.forEach((member, i) => {
    new gcp.iap.WebBackendServiceIamMember(`iap-studio-${i}`, {
      project: settings.project,
      webBackendService: studioBackend.name,
      role: 'roles/iap.httpsResourceAccessor',
      member,
    });
  });
}
