import * as gcp from '@pulumi/gcp';
import type { Settings } from './types/Settings';

/** Docker repository for web images; keeps the ten most recent. */
export function createRegistry(settings: Settings, dependsOn: gcp.projects.Service[]) {
  return new gcp.artifactregistry.Repository('registry', {
    project: settings.project,
    location: settings.region,
    repositoryId: 'river',
    format: 'DOCKER',
    description: 'River Portal images',
    cleanupPolicies: [{ id: 'keep-recent', action: 'KEEP', mostRecentVersions: { keepCount: 10 } }],
    cleanupPolicyDryRun: false,
  }, { dependsOn });
}
